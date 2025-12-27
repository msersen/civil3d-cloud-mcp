import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

/**
 * List Description Key Sets Tool
 * 
 * Lists all Description Key Sets in the current Civil 3D drawing.
 * Useful for CAD Manager to check existing F2F configurations.
 */

// Define the input schema (optional filter)
const ListDescriptionKeySetsInputSchema = z.object({
  includeKeys: z.boolean().optional().describe("Include the individual keys in each set. Default: false (just names)."),
});

// Schema for individual key info
const DescriptionKeyInfoSchema = z.object({
  code: z.string(),
  format: z.string().optional(),
  pointLayer: z.string().optional(),
  lineLayer: z.string().optional(),
  pointStyle: z.string().optional(),
});

// Schema for key set info
const DescriptionKeySetInfoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  keyCount: z.number(),
  keys: z.array(DescriptionKeyInfoSchema).optional(),
});

// Define the expected response shape
const ListDescriptionKeySetsResponseSchema = z.object({
  keySets: z.array(DescriptionKeySetInfoSchema),
  count: z.number(),
});

export function registerListDescriptionKeySetsTool(server: McpServer) {
  server.tool(
    "list_description_key_sets",
    "Lists all Description Key Sets in the current Civil 3D drawing.",
    ListDescriptionKeySetsInputSchema,
    async (args, extra) => {
      try {
        const params = {
          includeKeys: args.includeKeys ?? false,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("listDescriptionKeySets", params);
        });

        const validatedResponse = ListDescriptionKeySetsResponseSchema.parse(response);

        let resultText = `Found ${validatedResponse.count} Description Key Set(s):\n\n`;
        
        validatedResponse.keySets.forEach((ks, idx) => {
          resultText += `${idx + 1}. ${ks.name}\n`;
          if (ks.description) {
            resultText += `   Description: ${ks.description}\n`;
          }
          resultText += `   Keys: ${ks.keyCount}\n`;
          
          if (ks.keys && ks.keys.length > 0) {
            resultText += `   Key details:\n`;
            ks.keys.forEach(k => {
              resultText += `     - ${k.code}: Point→${k.pointLayer || 'N/A'}`;
              if (k.lineLayer) {
                resultText += `, Line→${k.lineLayer}`;
              }
              resultText += `\n`;
            });
          }
          resultText += `\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to list description key sets";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in list_description_key_sets tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
