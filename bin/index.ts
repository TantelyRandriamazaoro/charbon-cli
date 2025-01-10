#!/usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import { program } from "commander";
import container from "@/index";
import SearchController from "@/controllers/search.controller";
import PrepareController from "@/controllers/prepare.controller";
import ScrapeController from "@/controllers/scrape.controller";
import { SearchOptions } from "@/models/Search";

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
  .option("-b, --board <board>", "Board to search for")
  .option("-l, --limit <limit>", "Limit the number of results", "10")
  .description("Search for jobs on a specific board, fetches the job description and custom fields")
  .action((query, options: SearchOptions) => {
    const searchController = container.get(SearchController);
    searchController.init().then(() => {
      searchController.handle(query, options)
    });
  });

program
  .command("scrape")
  .description("Scrape job applications")
  .action(() => {
    console.log("Scraping job applications");
    const scrapeController = container.get(ScrapeController);
    scrapeController.handle();
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
  .action(() => {
    console.log("Preparing job applications");
    const prepareController = container.get(PrepareController);
    prepareController.handle();
  });

program.parse(process.argv);