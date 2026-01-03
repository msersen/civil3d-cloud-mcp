import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetDrawingInfoTool } from "./get_drawing_info.js";
import { registerListCivilObjectTypesTool } from "./list_civil_object_types.js";
import { registerGetSelectedCivilObjectsInfoTool } from "./get_selected_civil_objects_info.js";
import { registerCreateCogoPointTool } from "./create_cogo_point.js";
import { registerCreateLineSegmentTool } from "./create_line_segment.js";

// Point Management Tools (Point Editor Integration)
import { registerGetCogoPointsTool } from "./get_cogo_points.js";
import { registerSyncPointsBatchTool } from "./sync_points_batch.js";
import { registerDeleteCogoPointsTool } from "./delete_cogo_points.js";

// Layer Management Tools (CAD Manager Integration)
import { registerCreateLayerTool } from "./create_layer.js";
import { registerListLayersTool } from "./list_layers.js";
import { registerSetLayerPropertiesTool } from "./set_layer_properties.js";

// Field-to-Finish / Description Key Tools (CAD Manager Integration)
import { registerCreateDescriptionKeySetTool } from "./create_description_key_set.js";
import { registerListDescriptionKeySetsTool } from "./list_description_key_sets.js";
import { registerImportCadManagerConfigTool } from "./import_cad_manager_config.js";

export async function registerTools(server: McpServer) {
  // Core Civil 3D Tools
  registerGetDrawingInfoTool(server);
  registerListCivilObjectTypesTool(server);
  registerGetSelectedCivilObjectsInfoTool(server);
  registerCreateCogoPointTool(server);
  registerCreateLineSegmentTool(server);
  
  // Point Management Tools (Point Editor Integration)
  registerGetCogoPointsTool(server);
  registerSyncPointsBatchTool(server);
  registerDeleteCogoPointsTool(server);
  
  // Layer Management Tools
  registerCreateLayerTool(server);
  registerListLayersTool(server);
  registerSetLayerPropertiesTool(server);
  
  // Field-to-Finish / Description Key Tools
  registerCreateDescriptionKeySetTool(server);
  registerListDescriptionKeySetsTool(server);
  registerImportCadManagerConfigTool(server);
}
