import Status from "./Status";
import Boards from "./boards";

export type Job = {
    id?: number;
    search_id: number;
    title: string;
    link: string;
    description?: string;
    details?: JobDetails;
    timestamp?: string;
    board?: Boards;
    custom_fields?: NormalizedCustomField[];
    custom_fields_answers?: CustomFieldsAnswers[];
    resume?: string;
    status?: Status;
}

export type JobDetails = {
    technical_skills: string[];
    location: string;
    location_type: string;
    job_type: string;
    experience: string;
    salary: string;
    summary: string;
}

export interface ScrapedJobDetails<T> {
    job_id?: number;
    description: string;
    details?: JobDetails;
    custom_fields: Array<T>;
    board: Boards;
}



export interface LeverCustomFieldCard {
    name: string;
    fields: Array<LeverCustomField>;
}



export interface LeverCustomField {
    type: 'multiple-choice' | 'multiple-select' | 'textarea' | 'dropdown' | 'text'
    text: string;
    description: string;
    required?: boolean;
    id: string;
    options: Array<{ text: string; optionId: string }>;
    value?: string;
}

export interface NormalizedCustomField {
    type: 'radio' | 'checkbox' | 'textarea' | 'select' | 'text';
    name: string;
    label: string;
    possible_values?: Array<string>;
    required?: boolean;
    value?: string;
}

export interface CustomFieldsAnswers {
    key: string;
    question: string;
    answer: string;
}

export type RawCustomField = LeverCustomFieldCard;

export default Job;