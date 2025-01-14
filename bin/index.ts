#!/usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import { program } from "commander";
import container from "@/index";
import SearchController from "@/controllers/search.controller";
import PrepareController from "@/controllers/prepare.controller";
import ScrapeController from "@/controllers/scrape.controller";
import { SearchOptions } from "@/models/Search";
import ReviewController from "@/controllers/review.controller";
import ApplyController from "@/controllers/apply.controller";
import LiveController from "@/controllers/live.controller";

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
    scrapeController.init().then(() =>
      scrapeController.handle()
    );
  });

program
  .command("prepare")
  .description("Prepare job applications")
  .action(() => {
    console.log("Preparing job applications");
    const prepareController = container.get(PrepareController);
    prepareController.init().then(() =>
      prepareController.handle()
    );
  });

program
  .command("review")
  .description("Review all jobs available")
  .action(() => {
    console.log("Reviewing all jobs available");
    const reviewController = container.get(ReviewController);
    reviewController.init().then(() =>
      reviewController.handle()
    );
  });

program
  .command("apply")
  .description("Apply to all jobs available")
  .action(() => {
    console.log("Applying to all jobs available");
    const applyController = container.get(ApplyController);
    applyController.init().then(() =>
      applyController.handle()
    );
  });

program
  .command("live")
  .description("Apply to all jobs available")
  .action(() => {
    console.log("Applying to all jobs available");
    const liveController = container.get(LiveController);
    liveController.init().then(() =>
      liveController.handle()
    );
  });

program.parse(process.argv);