import Job, { JobDetails, LeverCustomFieldCard, NormalizedCustomField, RawCustomField, ScrapedJobDetails } from "@/models/Job";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import ora, { Ora } from "ora";
import puppeteer, { Browser, Cookie, Page, Puppeteer } from "puppeteer";
import AiService from "./ai.service";
import LeverService from "../boards/lever.service";
import Boards from "@/models/boards";
import { EventEmitter } from "events";
import InquirerService from "./inquirer.service";
import { exec } from "child_process";
import axios from "axios";

@injectable()
export default class BrowserService {
    private browser: Browser | null = null;
    private boardService: LeverService | null = null;

    constructor(
        @inject(AiService) private aiService: AiService,
        @inject(LeverService) private leverService: LeverService,
        @inject(InquirerService) private inquirerService: InquirerService
    ) { }

    public async init(options: { headless: boolean }): Promise<void> {
        if (options.headless) {
            this.browser = await puppeteer.launch({
                headless: true
            });
        } else {
            // Using a custom Chrome instance to resolve hCaptcha cookie issues and keep the browser open.

            // Check current OS
            const os = process.platform;
            let command = '';

            if (os === 'darwin') {
                command = `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')`;
            } else if (os === 'win32') {
                command = `start chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')`;
            } else {
                console.error(chalk.red('Unsupported OS:', os));
                return;
            }

            try {
                // Start Chrome process
                this.runCommand(command);

                // Wait for a short duration to allow Chrome to initialize
                await new Promise((resolve) => setTimeout(resolve, 3000));

                // Fetch the browser ID from the debugging endpoint
                const browserId = await this.getBrowserIdFromEndpoint();
                console.log(chalk.green(`Browser ID: ${browserId}`));

                this.browser = await puppeteer.connect({
                    browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/' + browserId
                });
            } catch (error) {
                console.error(chalk.red('Failed to initialize the browser:'), error);
            }
        }
    }

    private runCommand(command: string) {
        const child = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(chalk.red(error.message));
            }
            if (stderr) {
                console.error(chalk.red(stderr));
            }
        });

        child.stdout?.on('data', (data) => {
            console.log(chalk.blue(data.toString()));
        });
    }

    private async getBrowserIdFromEndpoint(): Promise<string> {
        try {
            const response = await axios.get('http://127.0.0.1:9222/json/version');
            const wsEndpoint = response.data.webSocketDebuggerUrl;
            const match = wsEndpoint.match(/devtools\/browser\/([\w-]+)/);

            if (match && match[1]) {
                return match[1];
            } else {
                throw new Error('Browser ID not found in WebSocket URL.');
            }
        } catch (error: any) {
            throw new Error(`Failed to fetch browser ID from endpoint: ${error.message}`);
        }
    }



    public async setCookie(cookie: Cookie) {
        await this.browser?.setCookie(cookie);
    }

    public async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }

    newPage(): Promise<Page> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        return this.browser.newPage();
    }

    setBoard(board: Boards | undefined) {
        switch (board) {
            case 'lever':
                this.boardService = this.leverService;
                break;
            default:
                console.error('Unsupported board:', board);
        }
    }

    async batchScrape(jobs: Job[]): Promise<{ data: ScrapedJobDetails<LeverCustomFieldCard>[], failed: Job[] }> {
        const data: ScrapedJobDetails<LeverCustomFieldCard>[] = [];
        const failed: Job[] = [];
        const spinner = ora('Starting...');

        await this.init({ headless: true });

        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        for (const job of jobs) {
            try {
                if (!job.board) {
                    throw new Error('Job board not set');
                }

                this.setBoard(job.board);

                if (!this.boardService) {
                    throw new Error('Board service not initialized');
                }

                console.log('-------------------------');
                console.log(chalk.blue('Scraping', job.title));
                console.log(chalk.green(job.link));

                spinner.start();

                const page = await this.newPage();

                await page.setViewport({
                    width: 1280,  // Width of the viewport
                    height: 720,  // Height of the viewport
                    deviceScaleFactor: 1, // Device scale factor
                });

                // Navigate to the job URL
                spinner.text = 'Navigating to job URL...';
                await page.goto(job.link, { waitUntil: 'networkidle2' });

                // Scrape the job description
                spinner.text = 'Scraping job description...';
                const description = await this.boardService.scrapeJobDescription(page);

                await page.goto(job.link + '/apply', { waitUntil: 'networkidle2' });
                // Scrape custom fields
                spinner.text = 'Scraping custom fields...';
                const fields = await this.boardService.scrapeCustomFields(page);

                spinner.text = 'Extracting job details...';
                const details = await this.aiService.getJobDetails(description);

                spinner.succeed('Job details extracted');
                spinner.stop();

                data.push({ job_id: job.id, details, custom_fields: fields, description, board: job.board });
            } catch (error) {
                spinner.fail('Failed to scrape job');
                console.error('An error occurred while scraping job:', error);
                failed.push(job);
            }
        }


        await this.closeBrowser();

        return { data, failed };
    }

    async batchApply(jobs: Job[]): Promise<void> {
        await this.init({ headless: true });

        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        for (const job of jobs) {
            try {
                this.setBoard(job.board);

                if (!this.boardService) {
                    throw new Error('Board service not initialized');
                }

                console.log('-------------------------');
                console.log(chalk.blue('Applying to', job.title));
                console.log(chalk.green(job.link));

                const page = await this.newPage();

                await page.setViewport({
                    width: 1280,  // Width of the viewport
                    height: 1024,  // Height of the viewport
                    deviceScaleFactor: 1, // Device scale factor
                });

                await this.boardService.apply(job, page);
            } catch (error) {
                console.error('An error occurred while applying to job:', error);
            }
        }

        // await this.closeBrowser();
    }


}