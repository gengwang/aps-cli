const dotenv = require("dotenv");
dotenv.config();

var express = require("express");
var app = express();
var server = require("http").Server(app);
// var router = express.Router();
var fs = require("fs");
var colors = require("colors");
const { table } = require("console");
var opn = require("opn");
// 👇 NOTE: using open will cause ES6 errors; so stick with opn 🧐
// const { default: open } = await import('open');
// import open, {openApp, apps} from 'open';
var cliProgress = require("cli-progress");

import * as config from "../config";
import forgeSDK, { AuthToken } from "forge-apis";
import forgeAuthThreeLeggedClient from "./auth-client";

const tokenfilePath = process.env.TOKEN_PATH ||  "./job/token";

function writeTokenFile(
  tokenInfo: AuthToken,
  tokenfilePath: string,
  refreshInterval = 30
) {
  var refresh_token = tokenInfo.refresh_token;
  var access_token = tokenInfo.access_token;
  // console.log("\na new access token: ".green);
  console.log("\na \u001b[32m new access token: ");
  console.log("\n" + access_token);
  // console.error("\na new refresh token: ".cyan);
  console.error("\na \u001b[36m new refresh token: ");
  console.log("\n" + refresh_token);

  //you would probably need to notify other route with the update token.
  //..... do your job....

  fs.writeFile(
    tokenfilePath,
    JSON.stringify({
      refresh_token: refresh_token,
      access_token: access_token,
    }),
    (err: any) => {
      if (err) throw err;
      //refresh token in 30 minutes
      //setTimeout( refreshToken,30*60*1000);

      var progressIndex = 0;
      var progressInterval: NodeJS.Timer;

      var progressbar = new cliProgress.Bar(
        {},
        cliProgress.Presets.shades_classic
      );
      progressbar.start(100, 0);
      progressIndex = 1;
      //timer for progress bar
      progressInterval = setInterval(function () {
        progressbar.update(10 * progressIndex);
        progressIndex += 1;
        if (progressIndex > 10) {
          clearInterval(progressInterval);
          if (progressbar) {
            progressbar.stop();
            progressbar = null;
            // delete progressbar;
          }
        }
      }, (refreshInterval * 60 * 1000) / 10.0);

      //timer for get new token
      setTimeout(
        refreshToken.bind(null, tokenfilePath),
        refreshInterval * 60 * 1000
      );
    }
  );
}
function refreshToken(tokenfilePath: string) {
  fs.readFile(tokenfilePath, (err: any, data: any) => {
    if (err) throw err;

    var thisCredentials = JSON.parse(data);

    forgeAuthThreeLeggedClient
      .refreshToken(thisCredentials)
      .then(function (tokenInfo) {
        //write token and refresh token to a file
        writeTokenFile(tokenInfo, tokenfilePath);
      })
      .catch(function (err) {
        console.log(err);
      });
  });
}

function startOAuth() {
  var autoRefresh = true;

  try {
    const url = forgeAuthThreeLeggedClient.generateAuthUrl("");
    opn(url, function (err: any) {
      if (err) throw err;
      console.log("The user closed the browser");
    });
  } catch (e) {
    console.log(e);
  }
}
// Define route for auth callbacks
function authCallbackRouter() {
  var router = express.Router();
  router.get("/granted", (req: any, res: any) => {
    res.send("✭ Access has been granted ✭");
    process.exit(0);
  });

  router.get("/", (req: any, res: any) => {
    //Authorization Code
    var code = req.query.code;
    var autoRefresh = true;
    const baseUrl = req.baseUrl;

    forgeAuthThreeLeggedClient
      .getToken(code)
      .then(async function (tokenInfo) {
        // write token and refresh token to a file
        writeTokenFile(tokenInfo, tokenfilePath);
        // show the success screen in the browser
        res.redirect(baseUrl + "/granted");
      })
      .catch(function (err: any) {
        console.log(err);
        res.redirect("/");
      });
  });
  return router;
}

export function auth() {
  var router = authCallbackRouter();

  app.set("port", process.env.APS_AUTH_CALLBACK_PORT || 3000);
  app.use(process.env.APS_AUTH_CALLBACK_PATH, router);

  server.listen(app.get("port"), function () {
    console.log("Server listening on port " + server.address().port);
  });

  fs.mkdir("jobs", function () {});

  startOAuth();
}

module.exports = {
  auth: auth,
};
