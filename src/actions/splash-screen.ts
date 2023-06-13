import figlet from 'figlet';
import chalk from "chalk";
import boxen, { BorderStyle } from "boxen";
import { getUserProfile } from './dm';

export function displaySplashScreen() {
  const greeting =
    // chalk.white(`🚀 Explore & 🔬 discover with`) +
    chalk.white(`🔨 Make anything 🗿`) +
    "\n" +
    figlet.textSync("APS", "Rectangles");

  const boxenOptions = {
    padding: 1,
    margin: 1,
    borderStyle: BorderStyle.Classic,
    borderColor: "#5D3FD3",
    backgroundColor: "#5D3FD3",
  };

  const msgBox = boxen(greeting, boxenOptions);

  console.log(msgBox);
}

 