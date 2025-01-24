#!/usr/bin/env node

import chalk from "chalk";
import figlet from "figlet";
import { program } from "commander";
import SearchController from "@/controllers/search.controller";
import PrepareController from "@/controllers/prepare.controller";
import ScrapeController from "@/controllers/scrape.controller";
import { SearchOptions } from "@/models/Search";
import ReviewController from "@/controllers/review.controller";
import ApplyController from "@/controllers/apply.controller";
import LiveController from "@/controllers/live.controller";
import isInitialized from "@/utils/isInitialized";
import inquirer from "inquirer";
import createStructure from "@/utils/createStructure";
import structure from "@/configs/structure";
import { run } from "@/index";

program
  .command("init")
  .description("Initialize a workspace")
  .action(() => {
    if (isInitialized()) {
      console.log(chalk.red("Project already initialized"));
      return;
    } else {
      createStructure('./', structure);
      console.log(chalk.green("Project initialized successfully"));
    }
  });

program
  .command("search")
  .argument("<query>", "Search query")
  .option("-k, --keywords <keywords>", "Keywords to search for")
  .option("-b, --board <board>", "Board to search for", "lever")
  .option("-c, --country <country>", "Country to search for")
  .description("Search for jobs on a specific board, fetches the job description and custom fields")
  .action((query, options: SearchOptions) => {
    run(async (container) => {
      const searchController = container.get(SearchController);
      await searchController.init()
      searchController.handle(query, options)
    });
  });

program
  .command("scrape")
  .description("Scrape job applications")
  .option("-l, --limit <limit>", "Limit the number of jobs to scrape")
  .action((options) => {
    run(async (container) => {
      console.log("Scraping job applications");
      const scrapeController = container.get(ScrapeController);
      scrapeController.init().then(() =>
        scrapeController.handleBulk(options)
      );
    })
  });

program
  .command("review")
  .description("Review all jobs available")
  .option("-l, --limit <limit>", "Limit the number of jobs to review")
  .action((options) => {
    run(async (container) => {
      console.log("Reviewing all jobs available");
      const reviewController = container.get(ReviewController);
      await reviewController.init()
      reviewController.handleBulk(options)

    });
  });

program
  .command("prepare")
  .description("Prepare job applications")
  .option("-l, --limit <limit>", "Limit the number of jobs to prepare")
  .action((options) => {
    run(async (container) => {
      console.log("Preparing job applications");
      const prepareController = container.get(PrepareController);
      await prepareController.init()
      prepareController.handleBulk(options)
    })
  });

program
  .command("apply")
  .description("Apply to all jobs available")
  .option("-l, --limit <limit>", "Limit the number of jobs to apply")
  .action((options) => {
    run(async (container) => {
      console.log("Applying to all jobs available");
      const applyController = container.get(ApplyController);
      await applyController.init()
      applyController.handleBulk(options)

    })
  });

program
  .command("live")
  .description("Apply to all jobs available")
  .action(() => {
    run(async (container) => {
      console.log("Applying to all jobs available");
      const liveController = container.get(LiveController);
      await liveController.init()
      liveController.handle()
    })
  });

program.parse(process.argv);
process.removeAllListeners('warning');