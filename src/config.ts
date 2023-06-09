
import { Scope } from "forge-apis";

const callbackURL: string =
  process.env.APS_AUTH_CALLBACK_URL || "http://localhost:1234/token/forgeoauth";
const credentials = {
  client_id: process.env.APS_CLIENT_ID || "<your client_id>",
  client_secret: process.env.APS_CLIENT_SECRET || "<your client_secret>",
};

const scopes: Scope[] = [
  "data:read",
  "data:write",
  "data:create",
  "data:search",
];

export { callbackURL, credentials, scopes as scope };