import * as config from "../config";
import forgeSDK, { AuthToken, Scope } from "forge-apis";

class ForgeAuthClientThreeLegged {
  clientId: string;
  clientSecret: string;
  authCallbackUrl: string;
  scopes: forgeSDK.Scope[];
  static instance: any;
  constructor(
    clientId: string,
    clientSecret: string,
    authCallbackUrl: string,
    scopes: Scope[],
    autoRefresh: true
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.authCallbackUrl = authCallbackUrl;
    this.scopes = scopes;
  }

  static getInstance(
    clientId: string,
    clientSecret: string,
    authCallbackUrl: string,
    scopes: Scope[],
    autoRefresh: true
  ): forgeSDK.AuthClientThreeLegged {
    if (!this.instance) {
      this.instance = new forgeSDK.AuthClientThreeLegged(
        clientId,
        clientSecret,
        authCallbackUrl,
        scopes,
        autoRefresh
      );
    }

    return this.instance;
  }
}

const clientId = config.credentials.client_id;
const clientSecret = config.credentials.client_secret;
const authCallbackUrl = config.callbackURL;
const scopes = config.scope;
const autoRefresh = true;

const forgeAuthThreeLeggedClient = ForgeAuthClientThreeLegged.getInstance(
  clientId,
  clientSecret,
  authCallbackUrl,
  scopes,
  autoRefresh
);

export default forgeAuthThreeLeggedClient;