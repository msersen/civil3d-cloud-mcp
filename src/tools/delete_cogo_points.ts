import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

// Define the input schema for deleting COGO points
const DeleteCogoPointsInputSchema = z.object({
  pointNumbers: z.array(z.number()).describe("Array of point numbers to delete from the drawing."),
});

// Define the response shape
const DeleteCogoPointsResponseSchema = z.object({
  deleted: z.number().describe("Number of points successfully deleted."),
  notFound: z.number().describe("Number of points not found."),
  failed: z.number().describe("Number of points that failed to delete."),
  results: z.array(z.object({
    pointNumber: z.number(),
    status: z.enum(["deleted", "not_found", "failed"]),
    message: z.string().optional(),
  })),
});

export function registerDeleteCogoPointsTool(server: McpServer) {
  server.tool(
    "delete_cogo_points",
    "Deletes COGO points from the Civil 3D drawing by their point numbers.",
    DeleteCogoPointsInputSchema,
    async (args, extra) => {
      try {
        const params = {
          pointNumbers: args.pointNumbers,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("deleteCogoPoints", params);
        });

        // Validate the response
        const validatedResponse = DeleteCogoPointsResponseSchema.parse(response);

        const summary = `Delete completed: ${validatedResponse.deleted} deleted, ${validatedResponse.notFound} not found, ${validatedResponse.failed} failed`;

        return {
          content: [
            {
              type: "text",
              text: `${summary}\n\nDetails:\n${JSON.stringify(validatedResponse.results, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to delete COGO points";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in delete_cogo_points tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
