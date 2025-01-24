import { inject, injectable } from "inversify";
import FileSystemService from "./filesystem.service";
import { AppConfig, Config, InputConfig } from "@/models/Config";

@injectable()
export default class ConfigService {
    private config: Config | undefined;

    constructor(
        @inject(FileSystemService) private fileSystemService: FileSystemService
    ) {
    }

    async init() {
        this.config = await this.fileSystemService.getConfigs();
    }

    getInputConfig(): InputConfig {
        if (!this.config) {
            throw new Error('Config has not been initialized');
        }

        return this.config.input;
    }

    getAppConfig(): AppConfig {
        if (!this.config) {
            throw new Error('Config has not been initialized');
        }

        return this.config.app;
    }

    get<T extends keyof AppConfig>(key: T): AppConfig[T] {
        if (!this.config?.app) {
            throw new Error('Config has not been initialized');
        }

        return this.config.app[key];
    }
}