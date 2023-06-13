// Data Management APIs
import { Console, error, table } from "console";
import 'dotenv/config';
import * as fs from 'fs';
import { AuthToken, FoldersApi, HubsApi, ProjectsApi, UserProfileApi } from "forge-apis";
import forgeAuthThreeLeggedClient from "./auth-client";
import inquirer, { Answers } from 'inquirer';
// var Table = require('cli-table');
import Table from 'cli-table';

import exp from "constants";
// const inquirer = require('inquirer');

////////////////////////////////////////////////////////////////////////
// A "Content" can be any of the following: hubs/projects/folders/items (file, etc.)
export interface Content {
  id: string,
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


async function getAccessToken() {
  const tokenfilePath = process.env.TOKEN_PATH;
  // TODO: Read from config.
  // TODO: auto refresh token: @See:
  // https://github.com/gengwang/aps-bootcamp-2023/blob/dashboard2/services/aps.js
  const token = await fs.promises.readFile('./jobs/token', 'utf8');
  const authToken: AuthToken = JSON.parse(token);
  return authToken;
}

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
    return resp.body;
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
        type: any;
        links: any; id: any; attributes: { name: any; region: any } 
}) => {
        const id = d.id;
        const name = d.attributes?.name;
        const url = _hubUrlFromId(id);
        
        const newRoute: Route = [{ id: id, name: name, url: url }];
        return {
          id: id,
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
    const { id: hubId } = route[0];
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
        const id = d.id;
        const name = d.attributes?.name;
        const url = d.links?.webView?.href;
        const newRoute = [...route, { id: id, name: name, url: url }];
        return {
          id: id,
          type: d.type,
          name: name,
          url: url,
          route: newRoute,
        };
      }
    );
  } catch (e) {
    console.error(e);
  }
}

///
/// Get folders or items in a project. It doesn't return versions of an item.
///
async function getProjectContents (route: Route): Promise<Content[] | undefined> {
  // console.log("route", route);
  
  const hubId = route[0].id;
  const projectId = route[1].id;
  // const { id: folderId } = route[2] || {id: undefined};
  const folderId = route.length >= 3 ? route[route.length - 1].id : undefined;
  const token = await getAccessToken();
  var resp;
  // if (folderId === undefined || folderId === 'undefined') { // template literals will convert undefined to 'undefined'
  if (folderId === undefined) { // template literals will convert undefined to 'undefined'
      resp = await new ProjectsApi().getProjectTopFolders(hubId, projectId, forgeAuthThreeLeggedClient,
        token);
  } else {
      resp = await new FoldersApi().getFolderContents(projectId, folderId, {}, forgeAuthThreeLeggedClient, token);
  }

  const _items = resp.body?.data?.map((d: {
    type: any; id: any; attributes: {
      lastModifiedUserName: any;
      hidden: any;
      createTime: any;
      lastModifiedTime: any;
      extension: any; displayName: any; name: any; 
}; links: { webView: { href: any; }; }; 
})=>{
    const id = d.id;
    const name = d.attributes?.displayName? d.attributes?.displayName : d.attributes?.name;
    const url = d.links?.webView?.href;
    const newRoute = [...route, {id: id, name: name, url: url}];
    return {
      id: id,
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
  const types = ["hub", "project", "folder", "item"];
  const index = Math.min(route.length, 2);
  const typeToQuery = types[index];
  var contents;
  switch(typeToQuery) {
    case "hub":
      contents = await getHubs();
      break;
    case "project":
      contents = await getProjectsByHub(route);
      break;
    case "folder":
      // console.log("You've got a folder"); //TODO
      contents = await getProjectContents(route);
      break;
    // case "item":
    //   console.log("You've got a item"); //TODO
    //   contents = await getProjectContents(route);
    //   break;
    default:
      break;
  }

  const contentList: Answers = [
    {
      type: "list",
      name: "content",
      message: `Select ${typeToQuery}:`, // BUG: an item
      choices: contents?.map(d => ({ name: d.name, value: d })),
    }
  ];

  const selected: Answers = await inquirer.prompt(contentList);
  const selectedContent = selected.content;
  const selectedType: string = selectedContent?.type;
  const routeToContent: Route = selectedContent?.route;

  // console.log("you selected:", selected);

  if(selectedType === "items") {
    listContents(selectedContent);
  } else {
    promptContents(routeToContent);
  }
}

function listContents(content: any) {
  // for an item
  var table = new Table({
    // head: ['Property', 'Value']
  // , colWidths: [100, 200]
});

// table is an Array, so you can `push`, `unshift`, `splice` and friends
table.push(
  {'Name': content.name}
, {'Type': content.extensionType}
, {'Link': content.url}
, {'Hub': content.route[0].name}
, {'Project': content.route[1].name}
, {'Hub Id': content.route[0].id}
, {'Project Id': content.route[1].id}
, {'Id': content.id}
);
  // const contentForPrint = {
  //   Name: content.name,
  //   Type: content.extensionType,
  // }
  // console.log();
  // console.log('-------------------------------------------------------');
  // console.log(`Name: ${content.name}`);
  // console.log(`Type: ${content.extensionType}`);
  // console.log(`ID: ${content.id}`);
  // console.log(`Link: ${content.url}`);
  // console.log('-------------------------------------------------------');
  // console.log(`Hub: ${content.route[0].name}`);
  // console.log(`Hub ID: ${content.route[0].id}`);
  // console.log(`Project: ${content.route[1].name}`);
  // console.log(`Project ID: ${content.route[1].id}`);
  // TODO: Add folders or breadcrumbs

  // console.table(contentForPrint);
  console.log(table.toString());
}

// list all the hubs for the user
async function listHubs() {
    try {
      const hubs = await getHubs();
      console.table(hubs, ["name", "id", "region"]);

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

  