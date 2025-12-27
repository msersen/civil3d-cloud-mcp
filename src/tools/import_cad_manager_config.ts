import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

/**
 * Import CAD Manager Configuration Tool
 * 
 * Imports a complete CAD Manager configuration into Civil 3D:
 * - Creates all required layers
 * - Sets up Description Key Set for F2F
 * - Applies code aliases
 * 
 * This is the main integration point between CAD Manager and Civil 3D.
 */

// Schema for code definitions from CAD Manager
const CodeDefinitionSchema = z.object({
  code: z.string().describe("Master description key code."),
  description: z.string().describe("Human-readable description."),
  pointLayer: z.string().describe("CAD layer for point insertion."),
  lineLayer: z.string().optional().describe("CAD layer for linework. Null = no linework."),
  symbol: z.string().optional().describe("Point style/block name."),
  category: z.string().optional().describe("Code category."),
  aliases: z.array(z.string()).optional().describe("Field code aliases that map to this master code."),
});

// Schema for layer definitions
const LayerDefinitionSchema = z.object({
  name: z.string(),
  color: z.number().optional(),
  lineType: z.string().optional(),
  lineWeight: z.number().optional(),
  description: z.string().optional(),
});

// Define the input schema
const ImportCadManagerConfigInputSchema = z.object({
  standardName: z.string().describe("Name of the CAD standard being imported."),
  codes: z.array(CodeDefinitionSchema).describe("Array of code definitions from CAD Manager."),
  layers: z.array(LayerDefinitionSchema).optional().describe("Optional explicit layer definitions with colors."),
  descriptionKeySetName: z.string().optional().describe("Name for the Description Key Set. Default: 'CAD Manager - {standardName}'."),
  createLayers: z.boolean().optional().describe("Create layers if they don't exist. Default: true."),
  updateExisting: z.boolean().optional().describe("Update existing description keys. Default: true."),
});

// Define the expected response shape
const ImportCadManagerConfigResponseSchema = z.object({
  success: z.boolean(),
  standardName: z.string(),
  layersCreated: z.number(),
  layersExisted: z.number(),
  descriptionKeySetName: z.string(),
  keysCreated: z.number(),
  aliasesConfigured: z.number(),
  warnings: z.array(z.string()).optional(),
});

export function registerImportCadManagerConfigTool(server: McpServer) {
  server.tool(
    "import_cad_manager_config",
    "Imports a complete CAD Manager configuration into Civil 3D. Creates layers and sets up Description Key Set for Field-to-Finish based on the standards defined in CAD Manager.",
    ImportCadManagerConfigInputSchema,
    async (args, extra) => {
      try {
        const params = {
          standardName: args.standardName,
          codes: args.codes,
          layers: args.layers,
          descriptionKeySetName: args.descriptionKeySetName ?? `CAD Manager - ${args.standardName}`,
          createLayers: args.createLayers ?? true,
          updateExisting: args.updateExisting ?? true,
        };

        const response = await withApplicationConnection(async (appClient) => {
          return await appClient.sendCommand("importCadManagerConfig", params);
        });

        const validatedResponse = ImportCadManagerConfigResponseSchema.parse(response);

        let resultText = `CAD Manager configuration '${validatedResponse.standardName}' imported successfully!\n`;
        resultText += `\nLayers:\n`;
        resultText += `  - Created: ${validatedResponse.layersCreated}\n`;
        resultText += `  - Already existed: ${validatedResponse.layersExisted}\n`;
        resultText += `\nDescription Key Set: '${validatedResponse.descriptionKeySetName}'\n`;
        resultText += `  - Keys created: ${validatedResponse.keysCreated}\n`;
        resultText += `  - Aliases configured: ${validatedResponse.aliasesConfigured}\n`;

        if (validatedResponse.warnings && validatedResponse.warnings.length > 0) {
          resultText += `\nWarnings:\n`;
          validatedResponse.warnings.forEach(w => {
            resultText += `  ⚠ ${w}\n`;
          });
        }

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to import CAD Manager configuration";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        console.error("Error in import_cad_manager_config tool:", error);
        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }
    }
  );
}
