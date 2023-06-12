#! /usr/bin/env node

import { Command } from "commander";
import { displaySplashScreen } from "./actions/splash-screen";
import { listHubs } from "./actions/dm";
import { auth as authenticate } from "./actions/auth";

const program = new Command();

program
  .version("0.0.1")
  .description("an APS cli utility")
  .action(() => {
    displaySplashScreen();
    program.outputHelp();
  });

// Authentication. You don't normally need to run it manually because aps will run it when necessary.
const auth = program
  .command("auth")
  .description("Three-legged OAuth")
  .action(() => {
    authenticate();
  });

// Data Management
const dm = program
  .command("dm")
  .description("List the items in your ACC Docs")
  .option("-h, --hubs  [value]", "List all hubs")
  .action(() => {
    const options = dm.opts();
    if (options.hubs) {
      listHubs();
    }
  });
// dm
//   .command('hubs')
//   .action(() => console.log('list all hubs'))
// dm
//   .command('projects')
//   .action(() => console.log('list all projects'))

program.parse(process.argv);
