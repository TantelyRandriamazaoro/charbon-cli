import { inject, injectable } from "inversify";
import OpenAI from "openai";
import IDatabaseService from "@/models/IDatabaseService";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { JobDetails } from "@/models/Job";

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

    async getCustomAnswers(fields: any) {
        
    }
}