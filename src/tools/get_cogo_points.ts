import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

// Define the input schema for getting COGO points
const GetCogoPointsInputSchema = z.object({
  pointNumbers: z.array(z.number()).optional().describe("Optional array of specific point numbers to retrieve. If not provided, returns all points."),
  minPointNumber: z.number().optional().describe("Minimum point number to filter by."),
  maxPointNumber: z.number().optional().describe("Maximum point number to filter by."),
});

// Define the shape of a single point in the response
const CogoPointSchema = z.object({
  pointNumber: z.number(),
  easting: z.number(),
  northing: z.number(),
  elevation: z.number(),
  rawDescription: z.string().optional(),
  fullDescription: z.string().optional(),
});

// Define the expected response shape
const GetCogoPointsResponseSchema = z.object({
  points: z.array(CogoPointSchema),
  totalCount: z.number(),
});

export function registerGetCogoPointsTool(server: McpServer) {
  server.tool(
    "get_cogo_points",
    "Retrieves COGO points from the Civil 3D drawing. Can retrieve all points or filter by point numbers.",
    GetCogoPointsInputSchema,
    async (args, extra) => {
      try {
        const params = {
          pointNumbers: args.pointNumbers,
          minPointNumber: args.minPointNumber,
          maxPointNumber: args.maxPointNumber,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("getCogoPoints", params);
        });

        // Validate the response
        const validatedResponse = GetCogoPointsResponseSchema.parse(response);

        return {
          content: [
            {
              type: "text",
              text: `Retrieved ${validatedResponse.totalCount} COGO points:\n${JSON.stringify(validatedResponse.points, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to get COGO points";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in get_cogo_points tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
