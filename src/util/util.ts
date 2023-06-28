import "dotenv/config";
import * as fs from "fs";
import { AuthToken } from "forge-apis";

async function getAccessToken() {
  const tokenfilePath = process.env.TOKEN_PATH;
  // TODO: Read from config.
  // TODO: auto refresh token: @See:
  // https://github.com/gengwang/aps-bootcamp-2023/blob/dashboard2/services/aps.js
  const token = await fs.promises.readFile("./jobs/token", "utf8");
  const authToken: AuthToken = JSON.parse(token);
  return authToken;
}

export {
    getAccessToken,
}