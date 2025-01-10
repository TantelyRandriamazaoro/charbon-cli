import { customsearch_v1 } from "googleapis";
import Boards from "./boards";

export type SearchResults = {
    id: number;
    board: Boards;
    resume?: string;
    items: customsearch_v1.Schema$Result[];
}

export type SearchEntry = {
    id?: number;
    query: string;
    keywords: string;
    starts_at: number;
    board: Boards;
    timestamp?: string;
}

export type SearchOptions = {
    query: string;
    keywords: string;
    board: Boards;
    starts_at?: number;
    resume?: string;
}
