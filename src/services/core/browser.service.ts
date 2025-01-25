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
    private page: Page | undefined = undefined;

    constructor(
        @inject(AiService) private aiService: AiService,
        @inject(LeverService) private leverService: LeverService,
        @inject(InquirerService) private inquirerService: InquirerService
    ) { }

    public async init(options: { headless: boolean }): Promise<void> {
        const endpointUrl = 'http://127.0.0.1:9222/json/version';
    
        if (options.headless) {
            this.browser = await puppeteer.launch({ headless: true });
            return;
        }
    
        // Check for existing browser
        let browserId = await this.checkForExistingBrowser(endpointUrl);
        if (browserId) {
            console.log(chalk.green(`Connected to existing browser. Browser ID: ${browserId}`));
        } else {
            // Launch a new browser if no existing one is found
            const command = this.getBrowserLaunchCommand();
            if (!command) {
                console.error(chalk.red('Unsupported OS:', process.platform));
                return;
            }
    
            this.runCommand(command);
    
            // Wait for the new browser to initialize
            browserId = await this.waitForBrowserId(endpointUrl, 10000); // 10-second timeout
            if (!browserId) {
                console.error(chalk.red('Failed to initialize the browser within the timeout.'));
                return;
            }
        }
    
        console.log(chalk.green(`Browser ID: ${browserId}`));
        try {
            this.browser = await puppeteer.connect({
                browserWSEndpoint: `ws://127.0.0.1:9222/devtools/browser/${browserId}`,
            });
        } catch (error) {
            console.error(chalk.red('Failed to connect to the browser:'), error);
        }
    }
    
    private getBrowserLaunchCommand(): string | null {
        const os = process.platform;
    
        if (os === 'darwin') {
            return `/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')`;
        } else if (os === 'win32') {
            return `start chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')`;
        } else {
            return null; // Unsupported OS
        }
    }
    
    private async checkForExistingBrowser(endpointUrl: string): Promise<string | null> {
        try {
            const response = await axios.get(endpointUrl);
            return this.extractBrowserId(response.data.webSocketDebuggerUrl);
        } catch {
            return null; // Endpoint is not active
        }
    }
    
    private async waitForBrowserId(endpointUrl: string, timeout: number): Promise<string | null> {
        console.time('waitForBrowserId');
        const interval = 1000; // Check every second
        const maxAttempts = timeout / interval;
    
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const browserId = await this.checkForExistingBrowser(endpointUrl);
            if (browserId) {
                return browserId;
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    
        console.timeEnd('waitForBrowserId');
        return null; // Timed out
    }
    
    private extractBrowserId(wsEndpoint: string): string | null {
        const match = wsEndpoint.match(/devtools\/browser\/([\w-]+)/);
        return match && match[1] ? match[1] : null;
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

    public async setCookie(cookie: Cookie) {
        await this.browser?.setCookie(cookie);
    }

    public async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }

    async newPage() {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        this.page = await this.browser.newPage();
    }

    getPage() {
        if (!this.page) {
            throw new Error('Page not initialized');
        }

        return this.page;
    }
}