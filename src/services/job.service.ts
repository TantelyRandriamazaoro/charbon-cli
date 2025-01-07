import { inject, injectable } from "inversify";
import DatabaseService from "./database.service";
import Boards from "@/models/boards";
import Job from "@/models/Job";

@injectable()
export default class JobService {
    constructor(
        @inject(DatabaseService) private databaseService: DatabaseService
    ) { }

    async storeDiscovered(data: Job[]) {
        this.databaseService.storeDiscoveredJobs(data);
        console.log('Discovered jobs stored');
        return data;
    }
}