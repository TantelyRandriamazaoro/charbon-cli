import { customsearch_v1 } from "googleapis";
import Boards from "./boards";

type SearchResults = {
    id: number;
    board: Boards;
    items: customsearch_v1.Schema$Result[];
}

export default SearchResults;