import IDatabaseService from "@/models/IDatabaseService";
import BrowserService from "@/services/core/browser.service";
import { inject, injectable } from "inversify";

@injectable()
export default class ApplyController {
    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(BrowserService) private browserService: BrowserService
    ) { }

    async init() {
        await this.databaseService.init();
    }

    async handle() { }
}