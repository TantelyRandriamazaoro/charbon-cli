#!/usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import { program } from "commander";
import search from "@commands/search";

program
  .version("1.0.0")
  .description("My Node CLI")
  .option("-n, --name <type>", "Add your name")
  .action((options) => {
    if (!options.name) {
      console.log(chalk.red("Please provide your name"));
      return;
    }
    console.log(chalk.red(figlet.textSync(options.name, { horizontalLayout: "full" })))
  });


program
  .command("search")
  .argument("<query>", "Search query")
  .option("-k, --keywords <keywords>", "Keywords to search for")
  .option("-b, --board <board>", "Board to search for", "lever")
  .option("-l, --limit <limit>", "Limit the number of results", "10")
  .description("Search for jobs on a specific board, fetches the job description and custom fields")
  .action((query, options) => {
    search(query, options);
  });

program
  .command("list")
  .description("List all jobs available")
  .option("-l, --limit <limit>", "Limit the number of results", "10")
  .option("-b, --board <board>", "Board to search for", "lever")
  .option("-o, --order <order>", "Order to display results", "desc")
  .action(() => {
    console.log("Listing all items");
  });

program
  .command("prepare")
  .description("Prepare job applications")

program.parse(process.argv);