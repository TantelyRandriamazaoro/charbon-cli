#!/usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import { program } from "commander";

program
  .version("1.0.0")
  .description("My Node CLI")
  .option("-n, --name <type>", "Add your name")
  .action((options) => {
    console.log(chalk.yellow(figlet.textSync(options.name, { horizontalLayout: "full" })))
  });

program.parse(process.argv);