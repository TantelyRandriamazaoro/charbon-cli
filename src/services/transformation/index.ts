import { customsearch_v1 } from "googleapis";

export default class TransformationService {
    constructor() { }

    async searchResults(data: customsearch_v1.Schema$Result[]) {
        return data.map((item) => {
            return {
                title: item.title,
                link: item.link,
            }
        })
    }
}