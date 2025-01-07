import * as env from "@/env"
import SearchService from "@services/search";
import TransformationService from "@services/transformation";

export default async function search(query: string, options: { keywords: string; board: string; limit: string; }) {
    const search = new SearchService(env.GOOGLE_CUSTOM_SEARCH_API_KEY, env.GOOGLE_CUSTOM_SEARCH_CX);
    const transform = new TransformationService();

    const searchResults = await search.query(query, options);
    const transformedResults = await transform.searchResults(searchResults || []);

    console.log(transformedResults); 
}