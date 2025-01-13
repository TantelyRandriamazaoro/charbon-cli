import { inject, injectable } from "inversify";
import OpenAI from "openai";
import IDatabaseService from "@/models/IDatabaseService";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { CustomFieldsAnswers, JobDetails, NormalizedCustomField } from "@/models/Job";
import FileSystemService from "./filesystem.service";

const JobDetails = z.object({
    technical_skills: z.array(z.string()),
    soft_skills: z.array(z.string()),
    isAiFriendly: z.boolean(),
    company_name: z.string(),
    company_field: z.string(),
    company_mission: z.string(),
    company_values: z.string(),
    location: z.string(),
    remote: z.boolean(),
    job_type: z.string(),
    seniority: z.string(),
    experience: z.string(),
    salary: z.string(),
    summary: z.string()
});

const CustomAnswers = z.object({
    answers: z.array(z.object({
        key: z.string(),
        question: z.string(),
        answer: z.string()
    }))
});

@injectable()
export default class AiService {
    private openai: OpenAI;

    constructor(
        options: { apiKey: string; }
    ) {
        this.openai = new OpenAI({ apiKey: options.apiKey });
    }

    async getJobDetails(description: string) {
        try {
            const completion = await this.openai.beta.chat.completions.parse({
                model: "gpt-4o-mini", // Using this model because it's cheaper and the data is not too complex
                messages: [
                    {
                        role: "system",
                        content:
                            "Extract structured data from the job description based on this schema.",
                    },
                    { role: "user", content: description },
                ],
                response_format: zodResponseFormat(JobDetails, "details_response")
            });

            const details_response = completion.choices[0].message;
            if (details_response.parsed) {
                return details_response.parsed as JobDetails;
            } else if (details_response.refusal) {
                // handle refusal
                console.error(details_response.refusal);
                throw new Error("Refusal from OpenAI");
            }
        } catch (e: any) {
            // Handle edge cases
            if (e.constructor.name == "LengthFinishReasonError") {
                // Retry with a higher max tokens
                console.log("Too many tokens: ", e.message);
            } else {
                // Handle other exceptions
                console.log("An error occurred: ", e.message);
            }
        }
    }

    async getCustomAnswers(fields: NormalizedCustomField[], knowledgeBase: string) {
        try {

            if (!knowledgeBase) {
                throw new Error("Knowledge base not found");
            }

            const completion = await this.openai.beta.chat.completions.parse({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "Reply to the custom questions based on the following knowledge base, using third person like 'The candidate is...' for 'textarea' questions. Be short and concise for 'text' questions. Map the `name` field to the `key` field in the response. When there are multiple possible values, choose the most relevant one.",
                    },
                    {
                        role: "system",
                        content: `Knowledge base: ` + knowledgeBase,
                    },
                    {
                        role: "user",
                        content: `Custom questions: ` + JSON.stringify(fields)
                    }
                ],
                response_format: zodResponseFormat(CustomAnswers, "answers_response")
            });

            const answers_response = completion.choices[0].message;

            return answers_response.parsed as { answers: CustomFieldsAnswers[]}

        } catch (e: any) {
            // Handle edge cases
            if (e.constructor.name == "LengthFinishReasonError") {
                // Retry with a higher max tokens
                console.log("Too many tokens: ", e.message);
            } else {
                // Handle other exceptions
                console.log("An error occurred: ", e.message);
            }
        }

    }
}