import * as https from "https";
import { getAccessToken } from "../util/util";

// TODO: Move to a config file and .env file
const FORGE_API_URL = "developer.api.autodesk.com";
const EXCHANGE_API_PATH = "/exchange/v1/exchanges";

async function getExchangeInfoFromUrn(exchangeUrn: string): Promise<any> {
  const parameters = {
    filters: `attribute.exchangeFileUrn==${exchangeUrn}`,
  };

  const queryString = new URLSearchParams(parameters).toString();

  // TODO: try/catch
  const authToken = (await getAccessToken()).access_token;

  const options = {
    hostname: FORGE_API_URL,
    path: `${EXCHANGE_API_PATH}?${queryString}`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };

  let promise = new Promise((resolve, reject) => {
    var data = "";
    https
      .get(options, (res: any) => {
        res.on("data", (chunk: string) => {
          data += chunk;
        });
        res.on("end", () => {
          const info = exchangeInfoFromResponse(data);
          resolve(info);
          // DEBUG:
          // resolve(data);
        });
      })
      .on("error", (e: any) => {
        //console.error(e);
        reject(e);
      });
  });

  let result = await promise;
  return result;
}

function exchangeInfoFromResponse(data: any) {
  const parsedData = JSON.parse(data);
  const results = parsedData?.results;

  if (results && results.length > 0) {
    const result = results.at(0);
    const exchangeId = result.id;
    // console.log(parsedData);
    // console.log(`exchange id: ${exchangeId}`);
    const collectionId = result.collection?.id;
    // console.log(`collectionId: ${collectionId}`);
    const exchangeFileVersionUrn = result.attributes?.data
      .filter((d: any) => d?.name === "exchangeFileVersionUrn")
      .at(0)?.value;

    const versionNumberFromVersionUrn = (
      versionUrn: any
    ) => {
      const regex = /=(.*)/;
      const match = regex.exec(versionUrn);
      if (match) {
        return match[1];
      } else {
        return null;
      }
    };
    const versionNumber =
      versionNumberFromVersionUrn(exchangeFileVersionUrn);
    // console.log(`versionNumber: ${versionNumber}`);

    const exchangeInfo = {
      exchangeId: exchangeId,
      collectionId: collectionId,
      // baseSourceVersionUrn: baseSourceVersionUrn,
      versionNumber: versionNumber,
    };

    return exchangeInfo;
  } else {
    return null;
  }
}

export { getExchangeInfoFromUrn };
