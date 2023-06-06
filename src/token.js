var express = require("express");
var router = express.Router();
var fs = require("fs");
var colors = require("colors");
const { table } = require("console");

//for pop out oAuth log in dialog
var opn = require("opn");
var cliProgress = require("cli-progress");
var progressbar = null;
var progressIndex = 0;
var progressInterval = 0;

var config = require("./config");
var forgeSDK = require("forge-apis");

fs.mkdir("jobs", function () {});

//write the token to the file
const tokenfile = "./jobs/token";

const refreshInterval = 30; // 30 minutes
// const refreshInterval = 0.3; // 18 seconds, just for demo

function writeTokenFile(tokenInfo) {
  var refresh_token = tokenInfo.refresh_token;
  var access_token = tokenInfo.access_token;
  console.log("\na new access token: ".green);
  console.log("\n" + access_token);
  console.error("\na new refresh token: ".cyan);
  console.log("\n" + refresh_token);

  //you would probably need to notify other route with the update token.
  //..... do your job....

  fs.writeFile(
    tokenfile,
    JSON.stringify({
      refresh_token: refresh_token,
      access_token: access_token,
    }),
    (err) => {
      if (err) throw err;
      //refresh token in 30 minutes
      //setTimeout( refreshToken,30*60*1000);

      progressbar = new cliProgress.Bar({}, cliProgress.Presets.shades_classic);
      progressbar.start(100, 0);
      progressIndex = 1;
      //timer for progress bar
      progressInterval = setInterval(function () {
        progressbar.update(10 * progressIndex);
        progressIndex += 1;
        if (progressIndex > 10) {
          clearInterval(progressInterval);
          if (progressbar) {
            progressbar = null;
            delete progressbar;
          }
        }
      }, (refreshInterval * 60 * 1000) / 10.0);

      //timer for get new token
      setTimeout(refreshToken, refreshInterval * 60 * 1000);
    }
  );
}
function refreshToken() {
  fs.readFile(tokenfile, (err, data) => {
    if (err) throw err;

    var thisCredentials = JSON.parse(data);

    var forge3legged = new forgeSDK.AuthClientThreeLeggedV2(
      config.credentials.client_id,
      config.credentials.client_secret,
      config.callbackURL,
      config.scope,
      true
    );

    forge3legged
      .refreshToken(thisCredentials)
      .then(function (tokenInfo) {
        //write token and refresh token to a file
        writeTokenFile(tokenInfo);
      })
      .catch(function (err) {
        console.log(err);
      });
  });
}

router.get("/", function (req, res) {
  //Authorization Code
  var code = req.query.code;
  var autoRefresh = true;
  var forge3legged = new forgeSDK.AuthClientThreeLeggedV2(
    config.credentials.client_id,
    config.credentials.client_secret,
    config.callbackURL,
    config.scope,
    autoRefresh
  );

  forge3legged
    .getToken(code)
    .then(function (tokenInfo) {
      //write token and refresh token to a file
      writeTokenFile(tokenInfo);
      res.redirect("/");

      // test
      // TODO: https://github.com/autodesk-platform-services/aps-hubs-browser-nodejs/blob/develop/services/aps.js

      (async () => {
        var hubsApi = new forgeSDK.HubsApi();
        const resp = await hubsApi.getHubs({}, forge3legged, tokenInfo);
        // console.log("hubs", resp.body.data);
        const hubs = resp.body?.data?.map((d) => ({
          hub_name: d.attributes?.name,
          hub_id: d.id,
          region: d.attributes?.region,
        }));
        console.log("\n");
        console.table(hubs);
      })();
    })
    .catch(function (err) {
      console.log(err);
      res.redirect("/");
    });
});

function startoAuth() {
  var autoRefresh = true;
  var forge3legged = new forgeSDK.AuthClientThreeLeggedV2(
    config.credentials.client_id,
    config.credentials.client_secret,
    config.callbackURL,
    config.scope,
    autoRefresh
  );

  try {
    const url = forge3legged.generateAuthUrl();
    opn(url, function (err) {
      if (err) throw err;
      console.log("The user closed the browser");
    });
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  router: router,
  startoAuth: startoAuth,
};
