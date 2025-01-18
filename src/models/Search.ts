import { customsearch_v1 } from "googleapis";
import Boards from "./boards";

export type SearchResults = {
    id: number;
    board: Boards;
    resume?: string;
    items: customsearch_v1.Schema$Result[];
}


export type SearchOptions = {
    query: string;
    keywords: string;
    board: Boards;
    starts_at: number;
    resume?: string;
    country: string;
    country_name?: string;
    location_type: LocationType;
}

export type SearchEntry = SearchOptions &{
    id?: number;
    timestamp?: string;
}

export type LocationType = 'remote' | 'on-site' | 'hybrid';
