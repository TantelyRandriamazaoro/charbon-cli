import { injectable } from "inversify";
import ora from "ora";

@injectable()
export default class FeedbackService {
    private spinner = ora();

    constructor() {}

    start(message: string) {
        this.spinner.start(message);
    }

    succeed(message: string) {
        this.spinner.succeed(message);
    }

    fail(message: string) {
        this.spinner.fail(message);
    }

    warn(message: string) {
        this.spinner.warn(message);
    }

    stop() {
        this.spinner.stop();
    }
}