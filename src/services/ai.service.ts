import { inject, injectable } from "inversify";
import OpenAI from "openai";
import IDatabaseService from "@/models/IDatabaseService";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// const Step = z.object({
//     explanation: z.string(),
//     output: z.string(),
// });

// const MathResponse = z.object({
//     steps: z.array(Step),
//     final_answer: z.string(),
// });

const JobDetails = z.object({
    technical_skills: z.array(z.string()),
    soft_skills: z.array(z.string()),
    company_field: z.string(),
    company_mission: z.string(),
    company_values: z.string(),
    compensation: z.string(),
});

const description = "Senior Fullstack EngineerLos AngelesSalt AI – Engineering - Salt AI /Full Time /RemoteApply for this jobHelp Us Transform the Future of AI DevelopmentOur MissionSalt is building the future of AI development with our revolutionary full-stack platform. We combine powerful node-based workflow orchestration with robust full-code capabilities, enabling teams to build and scale sophisticated AI solutions with unprecedented ease and flexibility.Backed by elite investors including Andreessen Horowitz, we've secured funding to pursue our vision of transforming how teams develop and deploy AI. Our platform seamlessly integrates with external tools and leverages large language models (LLMs) to unlock new possibilities in AI development.Core Skills (Must Haves)5+ years of professional experience with JavaScript, React, and TypeScriptDeep expertise in modern web standards, tools, and best practicesProven experience with microservices design patterns (Saga, Sidecar, Circuit Breaker)Strong background in REST API design and implementation for distributed systemsProven ability to develop beautiful, functional experiences that delight usersProficiency with both SQL and NoSQL databases, including architecture and optimizationExperience with cloud platforms (AWS/GCP/Azure) and containerization (Docker, Kubernetes)Startup experience demonstrating ability to thrive in fast-paced environmentsBonus Skills (Nice to Have)Experience with Python or Golang for scalable service developmentExpertise in Next.js and Vite frameworksKnowledge of Dapr for microservices and event-driven applicationsExperience with Yjs and CRDT for real-time collaborative featuresBackground in OAuth2/OIDC implementationExperience with ML/LLM projects, particularly RAG systemsFamiliarity with ML infrastructure on NVIDIA hardwareWhat you'll doDesign and implement robust, scalable frontend interfaces using NextJS, React, Redux, and TypeScriptArchitect and deploy backend services and APIs using TypeScript and PythonCollaborate with product, design, and research teams to push the boundaries of AI-powered developmentBuild and optimize distributed systems that power our AI workflow orchestrationShape the technical direction of a rapidly growing platformWhat Makes You a Great FitYou're a product-minded engineer who cares deeply about developer experienceYou're self-driven and comfortable setting and meeting ambitious timelinesYou communicate effectively and collaborate well with cross-functional teamsYou bring a low-ego approach and high degree of patience to your workYou're passionate about building tools that revolutionize how teams work with AIYou thrive in dynamic, fast-paced environments where you can make significant impact$140,000 - $185,000 a yearThe RoleAs a Senior Full-Stack Engineer, you'll be at the forefront of revolutionizing AI development tools. You'll work with cutting-edge technologies to build and scale the services that power our platform, directly impacting how teams across the industry build and deploy their solutions.Our LeadershipAber Whitcomb - CEOAs MySpace's co-founder and CTO, Aber Whitcomb scaled one of the world's first social networks to over 125 million users. His technical leadership drove MySpace's $580M acquisition by News Corporation. A successful tech investor and entrepreneur, Aber holds multiple patents in distributed systems. At Salt, he combines deep technical expertise with proven business acumen to revolutionize AI development tools.Jim Benedetto - Chief ArchitectJim Benedetto brings decades of AI and machine learning leadership experience. As Gravity's co-founder and CTO (acquired by AOL), he pioneered personalization systems processing 50 billion monthly events. Previously as MySpace's EVP of Technology, he built systems handling 1 billion daily events and drove $900M in annual revenue. At Salt, Jim architects our AI infrastructure and shapes our platform's technical vision.At Salt, we're building more than just a product – we're creating the future of AI development. If you're excited about working at the intersection of developer tools and artificial intelligence, and want to be part of a team that's fundamentally changing how AI solutions are built, we want to hear from you.Salt is committed to building a diverse and inclusive team. We encourage applications from candidates of all backgrounds and experiences.Apply for this job";

@injectable()
export default class AiService {
    private openai: OpenAI;

    constructor(
        options: { apiKey: string; }
    ) {
        this.openai = new OpenAI({ apiKey: options.apiKey });
    }

    async calculate() {
        try {
            const completion = await this.openai.beta.chat.completions.parse({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            "You extract technical and soft skills from the job description. Also assess how friendly to the usage of AI the company is. Also extract the company's field. A summary of the company's mission and values. Extract compensation if available.",
                    },
                    { role: "user", content: description },
                ],
                response_format: zodResponseFormat(JobDetails, "details_response")
            });

            const details_response = completion.choices[0].message;
            console.log(details_response);
            if (details_response.parsed) {
                console.log(details_response.parsed);
            } else if (details_response.refusal) {
                // handle refusal
                console.log(details_response.refusal);
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

}