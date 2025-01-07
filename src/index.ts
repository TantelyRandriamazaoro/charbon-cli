import { Container } from "inversify";
import DatabaseService from "./services/database.service";
import SQLiteAdapter from "./services/adapters/sqlite.adapter";
import SearchService from "./services/search.service";
import LogService from "./services/log.service";

import * as env from "./env";
import AiService from "./services/ai.service";
import TransformationService from "./services/transformation.service";
import SearchController from "./controllers/search.controller";
import ScrapeController from "./controllers/scrape.controller";
import ListController from "./controllers/list.controller";
import PrepareController from "./controllers/prepare.controller";
import ApplyController from "./controllers/apply.controller";
import JobService from "./services/job.service";


const container = new Container();

// Services
container.bind(JobService).toSelf();
container.bind(TransformationService).toSelf();
container.bind(DatabaseService).toDynamicValue(() => {
    return new DatabaseService({
        adapter: new SQLiteAdapter()
    });
}).inSingletonScope();
container.bind(LogService).toSelf();
container.bind(SearchService).toDynamicValue(() => {
    return new SearchService(
        container.get(LogService),
        container.get(DatabaseService),
        {
            apiKey: env.GOOGLE_CUSTOM_SEARCH_API_KEY,
            id: env.GOOGLE_CUSTOM_SEARCH_CX
        });
});
container.bind(AiService).toDynamicValue(() => {
    return new AiService(
        container.get(DatabaseService),
        {
            apiKey: env.GPT4_API_KEY
        });
})

// Controllers
container.bind(SearchController).toSelf();
container.bind(ScrapeController).toSelf();
container.bind(ListController).toSelf();
container.bind(PrepareController).toSelf();
container.bind(ApplyController).toSelf();

export default container;