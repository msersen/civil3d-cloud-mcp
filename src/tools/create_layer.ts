import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

/**
 * Create Layer Tool
 * 
 * Creates a new layer in the Civil 3D drawing with specified properties.
 * Used by CAD Manager to set up layers for Field-to-Finish workflows.
 */

// Define the input schema for creating a layer
const CreateLayerInputSchema = z.object({
  name: z.string().describe("The layer name (e.g., 'V-TOPO-STRM', 'V-PROP-FNCE')."),
  color: z.number().min(1).max(255).optional().describe("AutoCAD color index (1-255). Default: 7 (white)."),
  lineType: z.string().optional().describe("Line type name (e.g., 'Continuous', 'Dashed', 'Center'). Default: 'Continuous'."),
  lineWeight: z.number().optional().describe("Line weight in hundredths of mm (e.g., 25 = 0.25mm). Default: -3 (ByLayer default)."),
  description: z.string().optional().describe("Layer description for documentation."),
  isPlottable: z.boolean().optional().describe("Whether the layer is plottable. Default: true."),
  isFrozen: z.boolean().optional().describe("Whether the layer is frozen. Default: false."),
  isOff: z.boolean().optional().describe("Whether the layer is off. Default: false."),
});

// Define the expected response shape
const LayerCreationResponseSchema = z.object({
  layerName: z.string().describe("The name of the created layer."),
  created: z.boolean().describe("True if created, false if already existed."),
  color: z.number().optional(),
  lineType: z.string().optional(),
});

export function registerCreateLayerTool(server: McpServer) {
  server.tool(
    "create_layer",
    "Creates a new layer in the Civil 3D drawing with specified properties (color, linetype, lineweight). If layer already exists, updates its properties.",
    CreateLayerInputSchema,
    async (args, extra) => {
      try {
        const params = {
          name: args.name,
          color: args.color ?? 7,
          lineType: args.lineType ?? "Continuous",
          lineWeight: args.lineWeight ?? -3,
          description: args.description,
          isPlottable: args.isPlottable ?? true,
          isFrozen: args.isFrozen ?? false,
          isOff: args.isOff ?? false,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("createLayer", params);
        });

        const validatedResponse = LayerCreationResponseSchema.parse(response);

        const statusText = validatedResponse.created 
          ? `Layer '${validatedResponse.layerName}' created successfully`
          : `Layer '${validatedResponse.layerName}' already exists (properties updated)`;

        return {
          content: [
            {
              type: "text",
              text: `${statusText}: ${JSON.stringify(validatedResponse, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to create layer";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in create_layer tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
