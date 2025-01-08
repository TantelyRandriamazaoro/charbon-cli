import AiService from "@/services/ai.service";
import { inject, injectable } from "inversify";

@injectable()
export default class PrepareController {
    constructor(
        @inject(AiService) private aiService: AiService
    ) { }

    async handle() {
        await this.aiService.calculate();
    }
}