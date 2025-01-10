import Status from "./Status";

export type Job = {
    id?: number;
    search_id: number;
    title: string;
    link: string;
    description?: string;
    details?: JobDetails;
    timestamp?: string;
    board?: string;
    custom_fields?: string;
    resume?: string;
    status?: Status;
}

export type JobDetails = {
    technical_skills: string[];
    soft_skills: string[];
    isAiFriendly: boolean;
    company_name: string;
    company_field: string;
    company_mission: string;
    company_values: string;
    location: string;
    remote: boolean;
    job_type: string;
    seniority: string;
    experience: string;
    salary: string;
    summary: string;
}

export interface ScrapedJobDetails {
    job_id?: number;
    description: string;
    details?: JobDetails;
    custom_fields: Array<{
        name: string;
        fields: any;
    }>;
}

export default Job;