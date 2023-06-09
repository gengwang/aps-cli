import { table } from "console";
import { errorMonitor } from "stream";

// console.log(figlet.textSync("APS"));

const figlet = require("figlet");
const chalk = require("chalk");
const boxen = require("boxen");

export function displaySplashScreen() {
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
}

// module.exports = {
//   displaySplashScreen: displaySplashScreen,
// };
  