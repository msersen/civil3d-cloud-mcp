import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

// Define the input schema for syncing points in batch
const SyncPointsBatchInputSchema = z.object({
  points: z.array(z.object({
    pointNumber: z.number().describe("The point number/ID to use in Civil 3D."),
    easting: z.number().describe("The Easting (X) coordinate."),
    northing: z.number().describe("The Northing (Y) coordinate."),
    elevation: z.number().optional().describe("The elevation (Z) coordinate."),
    rawDescription: z.string().optional().describe("The raw description for the point."),
  })).describe("Array of points to sync to Civil 3D."),
  createIfNotExists: z.boolean().optional().default(true).describe("If true, creates points that don't exist. If false, only updates existing points."),
  updateExisting: z.boolean().optional().default(true).describe("If true, updates existing points. If false, skips existing points."),
});

// Define the response shape
const SyncPointsBatchResponseSchema = z.object({
  created: z.number().describe("Number of points created."),
  updated: z.number().describe("Number of points updated."),
  skipped: z.number().describe("Number of points skipped."),
  failed: z.number().describe("Number of points that failed."),
  results: z.array(z.object({
    pointNumber: z.number(),
    status: z.enum(["created", "updated", "skipped", "failed"]),
    message: z.string().optional(),
  })),
});

export function registerSyncPointsBatchTool(server: McpServer) {
  server.tool(
    "sync_points_batch",
    "Syncs multiple points to Civil 3D in a single operation. Creates new points and/or updates existing ones based on point numbers.",
    SyncPointsBatchInputSchema,
    async (args, extra) => {
      try {
        const params = {
          points: args.points,
          createIfNotExists: args.createIfNotExists ?? true,
          updateExisting: args.updateExisting ?? true,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("syncPointsBatch", params);
        });

        // Validate the response
        const validatedResponse = SyncPointsBatchResponseSchema.parse(response);

        const summary = `Sync completed: ${validatedResponse.created} created, ${validatedResponse.updated} updated, ${validatedResponse.skipped} skipped, ${validatedResponse.failed} failed`;

        return {
          content: [
            {
              type: "text",
              text: `${summary}\n\nDetails:\n${JSON.stringify(validatedResponse.results, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to sync points batch";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in sync_points_batch tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
