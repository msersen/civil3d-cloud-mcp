import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

/**
 * Set Layer Properties Tool
 * 
 * Modifies properties of an existing layer in Civil 3D.
 * Only specified properties will be changed.
 */

// Define the input schema
const SetLayerPropertiesInputSchema = z.object({
  name: z.string().describe("The layer name to modify."),
  newName: z.string().optional().describe("Rename the layer to this name."),
  color: z.number().min(1).max(255).optional().describe("Set AutoCAD color index (1-255)."),
  lineType: z.string().optional().describe("Set line type name."),
  lineWeight: z.number().optional().describe("Set line weight in hundredths of mm."),
  description: z.string().optional().describe("Set layer description."),
  isPlottable: z.boolean().optional().describe("Set whether layer is plottable."),
  isFrozen: z.boolean().optional().describe("Freeze or thaw the layer."),
  isOff: z.boolean().optional().describe("Turn layer on or off."),
  isLocked: z.boolean().optional().describe("Lock or unlock the layer."),
});

// Define the expected response shape
const SetLayerPropertiesResponseSchema = z.object({
  layerName: z.string(),
  success: z.boolean(),
  propertiesChanged: z.array(z.string()),
});

export function registerSetLayerPropertiesTool(server: McpServer) {
  server.tool(
    "set_layer_properties",
    "Modifies properties of an existing layer in Civil 3D (color, linetype, lineweight, visibility, etc.).",
    SetLayerPropertiesInputSchema,
    async (args, extra) => {
      try {
        const params = {
          name: args.name,
          newName: args.newName,
          color: args.color,
          lineType: args.lineType,
          lineWeight: args.lineWeight,
          description: args.description,
          isPlottable: args.isPlottable,
          isFrozen: args.isFrozen,
          isOff: args.isOff,
          isLocked: args.isLocked,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("setLayerProperties", params);
        });

        const validatedResponse = SetLayerPropertiesResponseSchema.parse(response);

        return {
          content: [
            {
              type: "text",
              text: `Layer '${validatedResponse.layerName}' updated. Properties changed: ${validatedResponse.propertiesChanged.join(", ")}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to set layer properties";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in set_layer_properties tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
