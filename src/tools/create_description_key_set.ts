import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

/**
 * Create Description Key Set Tool
 * 
 * Creates or updates a Civil 3D Description Key Set for Field-to-Finish.
 * This is the core of F2F - maps raw descriptions to layers, symbols, and linework.
 */

// Schema for a single description key
const DescriptionKeySchema = z.object({
  code: z.string().describe("The description key code pattern (e.g., 'EP*', 'TREE', 'LP')."),
  format: z.string().optional().describe("Full description format (e.g., '$* Edge Pavement')."),
  pointLayer: z.string().describe("Layer for point insertion."),
  pointStyle: z.string().optional().describe("Point style name to use."),
  pointLabelStyle: z.string().optional().describe("Point label style name."),
  lineLayer: z.string().optional().describe("Layer for F2F linework. Omit if code doesn't draw lines."),
  lineworkCodeMatch: z.string().optional().describe("Linework code to match (for 3D polylines)."),
  applyTo: z.enum(["POINTS", "FIGURES", "BOTH"]).optional().describe("Apply to points, figures, or both. Default: BOTH."),
});

// Define the input schema for creating a description key set
const CreateDescriptionKeySetInputSchema = z.object({
  name: z.string().describe("Name of the Description Key Set."),
  description: z.string().optional().describe("Description of the key set."),
  keys: z.array(DescriptionKeySchema).describe("Array of description keys to add."),
  overwrite: z.boolean().optional().describe("If true, replace existing key set. Default: false (merge)."),
});

// Define the expected response shape
const CreateDescriptionKeySetResponseSchema = z.object({
  keySetName: z.string(),
  created: z.boolean().describe("True if created new, false if updated existing."),
  keysAdded: z.number(),
  keysUpdated: z.number(),
  totalKeys: z.number(),
});

export function registerCreateDescriptionKeySetTool(server: McpServer) {
  server.tool(
    "create_description_key_set",
    "Creates or updates a Civil 3D Description Key Set for Field-to-Finish. Maps description codes to layers, point styles, and linework settings.",
    CreateDescriptionKeySetInputSchema,
    async (args, extra) => {
      try {
        const params = {
          name: args.name,
          description: args.description,
          keys: args.keys,
          overwrite: args.overwrite ?? false,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("createDescriptionKeySet", params);
        });

        const validatedResponse = CreateDescriptionKeySetResponseSchema.parse(response);

        const statusText = validatedResponse.created
          ? `Description Key Set '${validatedResponse.keySetName}' created`
          : `Description Key Set '${validatedResponse.keySetName}' updated`;

        return {
          content: [
            {
              type: "text",
              text: `${statusText}:\n- Keys added: ${validatedResponse.keysAdded}\n- Keys updated: ${validatedResponse.keysUpdated}\n- Total keys: ${validatedResponse.totalKeys}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to create description key set";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in create_description_key_set tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
