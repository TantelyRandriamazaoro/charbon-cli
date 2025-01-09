import Status from "./Status";

type Job = {
    id?: number;
    search_id: number;
    title: string;
    link: string;
    company?: string;
    location?: string;
    description?: string;
    salary?: string;
    timestamp?: string;
    board?: string;
    custom_fields?: string;
    resume?: string;
    status?: Status;
}

export default Job;