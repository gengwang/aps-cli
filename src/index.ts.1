#! /usr/bin/env node

// const figlet = require("figlet");

import { table } from "console";
import { errorMonitor } from "stream";

// console.log(figlet.textSync("APS"));

const figlet = require("figlet");
const chalk = require("chalk");
const boxen = require("boxen");
const { Command } = require("commander");

const greeting =
  chalk.white(`🚀 Explore & 🔬 discover with`) +
  "\n" +
  figlet.textSync("APS", "graffiti");

const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "classic",
  borderColor: "#5D3FD3",
  backgroundColor: "#5D3FD3",
};

const msgBox = boxen(greeting, boxenOptions);
console.log(msgBox);

// console.log(figlet.textSync("APS"));

const program = new Command();
program
  .version("1.0.0")
  .description("APS (Autodesk Platform Service) utility")
  .option("-l, --ls  [value]", "List directory contents")
//   .option("-m, --mkdir <value>", "Create a directory")
//   .option("-t, --touch <value>", "Create a file")
  .parse(process.argv);

const options = program.opts();

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

// check if the option has been used the user
if (options.ls) {
  // const filepath = typeof options.ls === "string" ? options.ls : __dirname;
  listAllHubs();
}
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
