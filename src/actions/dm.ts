// Data Management APIs

import 'dotenv/config';
// import * as fs from 'fs';
import { FoldersApi, HubsApi, ProjectsApi, UserProfileApi } from "forge-apis";
import forgeAuthThreeLeggedClient from "./auth-client";
import { getAccessToken } from "../util/util";
import { getExchangeInfoFromUrn } from '../util/dm-service';
// import inquirer, { Answers } from 'inquirer';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import Table from 'cli-table3';

////////////////////////////////////////////////////////////////////////
// Register the autocomplete prompt
inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
// TODO: validate each output is correct
////////////////////////////////////////////////////////////////////////
// TODO: Be able to run the command from anywhere, not just from aps-cli directory
// TODO: Rename id to urn
// TODO: Get id from urn
// TODO: Allow escape/return so that one can get to a folder or a project
// TODO: Display path in breadcrumbs style: "Project Files > Geng > FDX >"
// TODO: Where should one store their client id? Or is it a one time deal?

// A "Content" can be any of the following: hubs/projects/folders/items (file, etc.)
export interface Content {
  urn: string,
  name?: string,
  type?: string, // e.g., "projects", etc., directly coming from the DM API
  url?: string,
  route?: Route,
}
/// Defines the route for an item: starting from a hub, then a project, then folders, till one can access the parent of a item
export type Route = Content[];

export interface Hub extends Content{
  region?: string,
}
export interface Project extends Content {
}

////////////////////////////////////////////////////////////////////////

async function getUserProfile() {
  try {
    const resp = await new UserProfileApi().getUserProfile(
      forgeAuthThreeLeggedClient,
      await getAccessToken()
    );
    const user = resp.body;
    return {
      firstName: user?.firstName,
      lastName: user?.lastName,
      userName: user?.userName,
      profileImages: user?.profileImages,
    }
    // return resp.body;
  } catch (e) {
    console.error(e);
  }
}

// This function strips off the "{x}." in the hubId and returns a link to ACC
// account admin page. It's unclear what a non-admin user would see.
function _hubUrlFromId(id: string) {
  const ACC_HUBS_URL =
    "https://acc.autodesk.com/account-admin/projects/accounts/";
  const result = id.match(/\.(.*)/);
  if (result && result.length > 1) {
    var hubParam = result[1];
    return ACC_HUBS_URL + hubParam;
  } else {
    return "https://acc.autodesk.com/";
  }
}

// TODO: https://github.com/autodesk-platform-services/aps-hubs-browser-nodejs/blob/develop/services/aps.js
async function getHubs():  Promise<Hub[] | undefined>{
  try {

    const resp = await new HubsApi().getHubs({}, forgeAuthThreeLeggedClient, await getAccessToken());
    
    return resp.body?.data?.map(
      (d: {
        id: any;
        type: any;
        links: any; urn: any; attributes: { name: any; region: any } 
}) => {
        const urn = d.id;
        const name = d.attributes?.name;
        const url = _hubUrlFromId(urn);
        
        const newRoute: Route = [{ urn: urn, name: name, url: url }];
        return {
          urn: urn,
          name: name,
          type: d.type,
          region: d.attributes?.region,
          route: newRoute,
        };
      }
    );
  } catch(e) {
    console.error(e);
  }
}

// TODO: flag hubs and projects that you don't have "access": e.g., It seems
// I don't have access to Forge Data, and I don't get the normal folders
async function getProjectsByHub(route: Route): Promise<Project[] | undefined> {
  try {
    const { urn: hubId } = route[0];
    const resp = await new ProjectsApi().getHubProjects(
      hubId,
      {filterId: undefined, filterExtensionType: undefined},
      forgeAuthThreeLeggedClient,
      await getAccessToken()
    );

    return resp.body?.data?.map(
      (d: {
        type: any; links: any; id: any; attributes: { name: any } 
}) => {
        const urn = d.id;
        const name = d.attributes?.name;
        const url = d.links?.webView?.href;
        const newRoute = [...route, { urn: urn, name: name, url: url }];
        return {
          urn: urn,
          type: d.type,
          name: name,
          url: url,
          route: newRoute,
        };
      }
    );``
  } catch (e) {
    console.error(e);
  }
}

///
/// Get folders or items in a project. It doesn't return versions of an item.
///
async function getProjectContents (route: Route): Promise<Content[] | undefined> {
  // console.log("route", route);
  
  const hubId = route[0].urn;
  const projectId = route[1].urn;
  // const { id: folderId } = route[2] || {id: undefined};
  const folderId = route.length >= 3 ? route[route.length - 1].urn : undefined;
  const token = await getAccessToken();
  var resp;
  if (folderId === undefined) { // template literals will convert undefined to 'undefined'
      resp = await new ProjectsApi().getProjectTopFolders(hubId, projectId, forgeAuthThreeLeggedClient,
        token);
  } else {
      resp = await new FoldersApi().getFolderContents(projectId, folderId, {}, forgeAuthThreeLeggedClient, token);
  }

  const _items = resp.body?.data?.map((d: {
    id: any;
    type: any; urn: any; attributes: {
      lastModifiedUserName: any;
      hidden: any;
      createTime: any;
      lastModifiedTime: any;
      extension: any; displayName: any; name: any; 
}; links: { webView: { href: any; }; }; 
})=>{
    const urn = d.id;
    const name = d.attributes?.displayName? d.attributes?.displayName : d.attributes?.name;
    const url = d.links?.webView?.href;
    const newRoute = [...route, {urn: urn, name: name, url: url}];
    return {
      urn: urn,
      // parent: parentId,
      name: name,
      url: url,
      type: d.type,
      route: newRoute,
      extensionType: d.attributes?.extension?.type, // 'items:autodesk.bim360:File', 'items:autodesk.bim360:FDX', 'items:autodesk.bim360:C4RModel
      sourceFileName: d.attributes?.extension?.data?.sourceFileName,
      lastModified: d.attributes?.lastModifiedTime,
      lastModifiedBy: d.attributes?.lastModifiedUserName,
      createTime: d.attributes?.createTime,
      hidden: d.attributes?.hidden,
    }
  });

  return _items;
};

// Interactive mode
async function promptContents(route: Route = []) {
  // const types = ["hub", "project", "folder", "item"];
  const itemTypes = [
    { name: "hub", icon: "🌎" },
    { name: "project", icon: "🏙 " },
    { name: "folder", icon: "📂" },
    { name: "item", icon: "🗒 " },
  ];
  const index = Math.min(route.length, 2);
  const typeToQuery = itemTypes[index].name;
  function iconFromResp (typeInPlural: string = "") {
    if(typeInPlural === undefined || typeInPlural.length === 0) return "";
    const type = typeInPlural.slice(0, -1);
    const icon = itemTypes.filter(d=>d.name === type)?.at(0)?.icon || "";
    return icon;
  };
  var contents: Hub[] | Project[] | Content[] | undefined;
  switch(typeToQuery) {
    case "hub":
      contents = await getHubs();
      break;
    case "project":
      contents = await getProjectsByHub(route);
      break;
    case "folder":
      contents = await getProjectContents(route);
      break;
    default:
      break;
  }

  const terminalHeight = process.stdout.rows - 2; // Adjust for header/footer

  const contentList: any[] = [
    {
      type: "autocomplete",
      name: "content",
      message: `Select ${typeToQuery}:`,
      pageSize: terminalHeight,
      source: (answersSoFar: any, input: string | undefined) => {
        input = input || '';
        return new Promise((resolve) => {
          const filteredContents = contents?.filter(d => `${iconFromResp(d.type)} ${d.name}`.toLowerCase().includes(input!.toLowerCase()))
            .map(d => ({ name: `${iconFromResp(d.type)} ${d.name}`, value: d }));
          resolve(filteredContents);
        });
      }
    }
  ];

  const selected: any = await inquirer.prompt(contentList);
  const selectedContent = selected.content;
  const selectedType: string = selectedContent?.type;
  const routeToContent: Route = selectedContent?.route;

  // DEBUG:
  // console.log('Selected content:', selected.content);

  if(selectedType === "items") {
    // Get the id from the urn
    const urn = selectedContent?.urn;
    if(selectedContent.extensionType === "items:autodesk.bim360:FDX") {
      const exchangeInfo = await getExchangeInfoFromUrn(urn);
      // console.log("id::::", exchangeInfo.id);
      selectedContent.id = exchangeInfo.exchangeId;
      selectedContent.version = exchangeInfo.versionNumber;
      selectedContent.collectionId = exchangeInfo.collectionId;
    }

    listContents(selectedContent);
  } else {
    promptContents(routeToContent);
  }
}

function listContents(content: any) {
  // for an item
  var table = new Table({
    colAligns: ["right", "left"],
    chars: { // remove inner borders
      'top': '-', 'top-mid': '', 'top-left': '', 'top-right': '',
      'bottom': '-', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
      'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
      'right': '', 'right-mid': '',
      // 'middle': ' ' // Use a space character for the horizontal lines
    },
  });

table.push(
  {['\x1b[32m' + 'Name' + '\x1b[0m']: content.name}
, {['\x1b[32m' + 'Type' + '\x1b[0m']: content.extensionType}
, {['\x1b[32m' + 'Link' + '\x1b[0m']: content.url}
, {['\x1b[32m' + 'Hub' + '\x1b[0m']: content.route[0].name}
, {['\x1b[32m' + 'Project' + '\x1b[0m']: content.route[1].name}
, {['\x1b[32m' + 'Hub urn' + '\x1b[0m']: content.route[0].urn}
, {['\x1b[32m' + 'Project urn' + '\x1b[0m']: content.route[1].urn}
, {['\x1b[32m' + 'Item urn' + '\x1b[0m']: content.urn}
);

if(content.route.length >= 3) {
  table.push(
    {['\x1b[32m' + 'Root folder urn' + '\x1b[0m']: content.route[2].urn}
  )
}

if(content.route.length >= 5) {
  let pr = content.route.length - 2;
  table.push(
    {['\x1b[32m' + 'Parent folder' + 'urn\x1b[0m']: content.route[pr].urn}
  )
}

if(content.extensionType === "items:autodesk.bim360:FDX") {
  table.push(
      {['\x1b[32m' + 'Item Id' + '\x1b[0m']: content.id}
    , {['\x1b[32m' + 'Latest Version' + '\x1b[0m']: content.version}
    , {['\x1b[32m' + 'Collection Id' + '\x1b[0m']: content.collectionId}
  )
}
  // DO NOT remove: print out contents
  console.log(table.toString());
}

// list all the hubs for the user
async function listHubs() {
    try {
      const hubs = await getHubs();
      console.table(hubs, ["name", "urn", "region"]);

    } catch (e) {
      console.error("Error occurred while reading hubs:", e);
    }
  }

  export {
    listHubs,
    promptContents as listItemsWithPrompt,
    getUserProfile, // test
    getProjectsByHub, // test
  };

  