import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import cors from "cors";
import { VertexAI } from "@google-cloud/vertexai";
import dotenv from "dotenv";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Initialize WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Initialize Vertex AI
const projectId = process.env.GCP_PROJECT_ID || "your-project-id";
const location = process.env.GCP_LOCATION || "us-central1";
let vertexAI: any;

try {
  vertexAI = new VertexAI({
    project: projectId,
    location,
  });
} catch (error: any) {
  console.warn("⚠️  Vertex AI initialization warning:", error.message);
  console.log("Server will start in demo mode without GCP credentials");
  vertexAI = null;
}

// Session management
interface ClientSession {
  id: string;
  ws: WebSocket;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  pendingResults: Map<string, { resolve: (value: any) => void; timeout: NodeJS.Timeout }>;
}

const activeSessions = new Map<string, ClientSession>();

// Tool definitions extracted from the schema files
const toolDefinitions = [
  {
    name: "create_cogo_point",
    description: "Creates a new COGO (Coordinate Geometry) point in the Civil 3D drawing.",
    inputSchema: {
      type: "object",
      properties: {
        easting: { type: "number", description: "The Easting coordinate of the point." },
        northing: { type: "number", description: "The Northing coordinate of the point." },
        elevation: { type: "number", description: "The elevation of the point." },
        rawDescription: { type: "string", description: "The raw description for the point." },
      },
      required: ["easting", "northing"],
    },
  },
  {
    name: "create_line_segment",
    description: "Creates a simple line segment in the Civil 3D drawing.",
    inputSchema: {
      type: "object",
      properties: {
        startX: { type: "number", description: "Start X coordinate." },
        startY: { type: "number", description: "Start Y coordinate." },
        endX: { type: "number", description: "End X coordinate." },
        endY: { type: "number", description: "End Y coordinate." },
      },
      required: ["startX", "startY", "endX", "endY"],
    },
  },
  {
    name: "get_drawing_info",
    description: "Retrieves basic information about the active Civil 3D drawing.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_civil_object_types",
    description: "Lists major Civil 3D object types available or present in the current drawing.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_selected_civil_objects_info",
    description: "Gets basic properties of currently selected Civil 3D objects.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Limit the number of returned objects." },
      },
    },
  },
];

// Handle WebSocket connections
wss.on("connection", (ws: WebSocket) => {
  const sessionId = uuidv4();
  const session: ClientSession = {
    id: sessionId,
    ws,
    conversationHistory: [],
    pendingResults: new Map(),
  };

  activeSessions.set(sessionId, session);
  console.log(`[Session ${sessionId}] Client connected`);

  ws.on("message", async (message: string) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "prompt") {
        // User sends a prompt
        const userPrompt = data.prompt;
        console.log(`[Session ${sessionId}] Received prompt: ${userPrompt}`);

        // Add to conversation history
        session.conversationHistory.push({
          role: "user",
          content: userPrompt,
        });

        // Call Gemini
        await callGeminiWithToolSupport(session, userPrompt);
      } else if (data.type === "result") {
        // Client responds with tool execution result
        const toolResult = data.data;
        const requestId = data.requestId;
        console.log(`[Session ${sessionId}] Received tool result for request ${requestId}`);

        // Check if we have a pending result handler
        if (requestId && session.pendingResults.has(requestId)) {
          const pending = session.pendingResults.get(requestId)!;
          clearTimeout(pending.timeout);
          session.pendingResults.delete(requestId);
          pending.resolve(toolResult);
        }
      }
    } catch (error) {
      console.error(`[Session ${sessionId}] Error processing message:`, error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        })
      );
    }
  });

  ws.on("close", () => {
    activeSessions.delete(sessionId);
    console.log(`[Session ${sessionId}] Client disconnected`);
  });

  ws.on("error", (error) => {
    console.error(`[Session ${sessionId}] WebSocket error:`, error);
  });

  // Send session info to client
  ws.send(
    JSON.stringify({
      type: "session_info",
      sessionId,
      message: "Connected to Civil 3D Cloud MCP Server",
    })
  );
});

// Gemini tool-calling loop
async function callGeminiWithToolSupport(session: ClientSession, userPrompt: string) {
  try {
    // Check if Vertex AI is available
    if (!vertexAI) {
      // Demo mode - provide a mock response
      console.log(`[Session ${session.id}] Running in DEMO MODE (no GCP credentials)`);
      const demoResponse = `Demo Mode: I received your message: "${userPrompt}". In production mode with GCP credentials, I would use AI to analyze this request and execute Civil 3D tools.`;
      session.ws.send(
        JSON.stringify({
          type: "response",
          message: demoResponse,
        })
      );
      return;
    }

    const model = vertexAI.getGenerativeModel({
      model: "gemini-1.5-pro",
    });

    // Build system instruction
    const systemInstruction = `You are an AI assistant that helps users interact with Autodesk Civil 3D.
You have access to tools that can query and modify Civil 3D drawings.
When the user asks you to do something in Civil 3D, use the available tools to accomplish their goals.
Always explain what you're doing in plain language.`;

    // Prepare messages for Gemini
    const messages = session.conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      parts: [{ text: msg.content }],
    }));

    let continueLoop = true;

    while (continueLoop) {
      const response = await model.generateContent({
        systemInstruction,
        contents: messages,
        tools: [
          {
            functionDeclarations: toolDefinitions as any,
          },
        ],
      } as any);

      const result = response.response as any;
      
      // Check if there are function calls
      const hasFunctionCalls = result.functionCalls && result.functionCalls.length > 0;

      if (hasFunctionCalls) {
        console.log(`[Session ${session.id}] Gemini wants to call tools:`, result.functionCalls);

        // Process each function call
        for (const funcCall of result.functionCalls!) {
          const commandData = {
            type: "command",
            tool: funcCall.name,
            args: funcCall.args,
            requestId: uuidv4(),
          };

          console.log(`[Session ${session.id}] Sending command to client:`, commandData);
          session.ws.send(JSON.stringify(commandData));

          // Wait for client response (with timeout)
          const toolResult = await waitForToolResult(session, commandData.requestId);

          // Add to conversation
          messages.push({
            role: "user" as const,
            parts: [
              {
                functionResponse: {
                  name: funcCall.name,
                  response: toolResult,
                } as any,
              } as any,
            ],
          } as any);
        }

        // Continue the loop to get next response
        continueLoop = true;
      } else {
        // No more function calls, get the final text response
        continueLoop = false;
        
        const textContent = result.candidates?.[0]?.content?.parts?.[0];
        const textResponse = textContent && 'text' in textContent ? (textContent.text || "No response generated") : "No response generated";
        console.log(`[Session ${session.id}] Gemini response:`, textResponse);

        // Add to conversation history
        session.conversationHistory.push({
          role: "assistant",
          content: textResponse,
        });

        // Send response to client
        session.ws.send(
          JSON.stringify({
            type: "response",
            message: textResponse,
          })
        );
      }
    }
  } catch (error) {
    console.error(`[Session ${session.id}] Error in Gemini call:`, error);
    session.ws.send(
      JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to process request",
      })
    );
  }
}

// Wait for tool result from client
function waitForToolResult(session: ClientSession, requestId: string): Promise<any> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn(`[Session ${session.id}] Tool result timeout for request ${requestId}`);
      session.pendingResults.delete(requestId);
      resolve({ error: "Tool execution timeout" });
    }, 30000); // 30 second timeout

    // Register this request ID in pending results
    session.pendingResults.set(requestId, {
      resolve,
      timeout,
    });
  });
}

// HTTP endpoint for health checks
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Upgrade HTTP connections to WebSocket
const server = app.listen(PORT, () => {
  console.log(`Civil 3D Cloud MCP Server listening on port ${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  if (request.url === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});
