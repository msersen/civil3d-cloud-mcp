import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

/**
 * List Layers Tool
 * 
 * Retrieves all layers from the current Civil 3D drawing.
 * Useful for CAD Manager to verify layer setup and detect missing layers.
 */

// Define the input schema (optional filter)
const ListLayersInputSchema = z.object({
  filter: z.string().optional().describe("Optional wildcard filter for layer names (e.g., 'V-*' for all V- layers)."),
  includeOff: z.boolean().optional().describe("Include layers that are turned off. Default: true."),
  includeFrozen: z.boolean().optional().describe("Include frozen layers. Default: true."),
});

// Define the expected response shape
const LayerInfoSchema = z.object({
  name: z.string(),
  color: z.number(),
  lineType: z.string(),
  lineWeight: z.number(),
  isOn: z.boolean(),
  isFrozen: z.boolean(),
  isLocked: z.boolean(),
  isPlottable: z.boolean(),
  description: z.string().optional(),
});

const ListLayersResponseSchema = z.object({
  layers: z.array(LayerInfoSchema),
  count: z.number(),
});

export function registerListLayersTool(server: McpServer) {
  server.tool(
    "list_layers",
    "Lists all layers in the current Civil 3D drawing with their properties.",
    ListLayersInputSchema,
    async (args, extra) => {
      try {
        const params = {
          filter: args.filter,
          includeOff: args.includeOff ?? true,
          includeFrozen: args.includeFrozen ?? true,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("listLayers", params);
        });

        const validatedResponse = ListLayersResponseSchema.parse(response);

        return {
          content: [
            {
              type: "text",
              text: `Found ${validatedResponse.count} layers:\n${JSON.stringify(validatedResponse.layers, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to list layers";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in list_layers tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
