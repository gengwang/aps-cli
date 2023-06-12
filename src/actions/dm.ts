// Data Management APIs
import { table } from "console";
import 'dotenv/config';
import * as fs from 'fs';
import forgeSDK, { AuthToken } from "forge-apis";
import forgeAuthThreeLeggedClient from "./auth-client";

async function getAccessToken() {
  const tokenfilePath = process.env.TOKEN_PATH;
  // TODO: Read from config.
  const token = await fs.promises.readFile('./jobs/token', 'utf8');
  const authToken: AuthToken = JSON.parse(token);
  return authToken;
}

// TODO: https://github.com/autodesk-platform-services/aps-hubs-browser-nodejs/blob/develop/services/aps.js
async function getHubs() {
  const resp = await new forgeSDK.HubsApi().getHubs({}, forgeAuthThreeLeggedClient, await getAccessToken());
  const _hubs = resp.body?.data?.map(
    (d: { attributes: { name: any; region: any }; id: any }) => ({
      hub_name: d.attributes?.name,
      hub_id: d.id,
      region: d.attributes?.region,
    })
  );
  return _hubs;
}

// list all the hubs for the user
async function listHubs() {
    try {
      // const tableContent = [
      //   {
      //     hub_name: "AEC Private Beta",
      //     owner: "Bot1",
      //     created_at: "2020-01-01",
      //     hub_id: "1123",
      //   },
      //   {
      //     hub_name: "P+W Accelerator Chicago",
      //     owner: "P+W",
      //     created_at: "2023-05-21",
      //     hub_id: "abcd",
      //   },
      // ];
      // console.table(tableContent);
      const hubs = await getHubs();
      // console.log("\n");
      console.table(hubs);
    } catch (e) {
      console.error("Error occurred while reading hubs:", e);
    }
  }

  export {
    listHubs,
  };

  