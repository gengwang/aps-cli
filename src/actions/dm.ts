// Data Management APIs
import { table } from "console";

// list all the hubs for the user
function listAllHubs() {
    try {
      const tableContent = [
        {
          hub_name: "AEC Private Beta",
          owner: "Bot1",
          created_at: "2020-01-01",
          hub_id: "1123",
        },
        {
          hub_name: "P+W Accelerator Chicago",
          owner: "P+W",
          created_at: "2023-05-21",
          hub_id: "abcd",
        },
      ];
      console.table(tableContent);
    } catch (e) {
      console.error("Error occurred while reading hubs:", e);
    }
  }

  export default listAllHubs;

  