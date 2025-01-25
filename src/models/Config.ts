export type InputConfig = {
    personal_info: {
        first_name: string;
        last_name: string;
        location: string;
        email: string;
        linkedin: string;
        github: string;
        website: string;
        address: string;
        phone: string;
        current_company: string;
        lever: {
            location: {
                name: string;
                id: string;
            }
        }
    },
    default_cover: string;
    lever: {
        location: {
            name: string;
            id: string;
        }
    }
}

export type PreferencesConfig = {
    location_type: string;
    voice: string;
    bulkSize: number;
}

export type AppConfig = {
    googleCustomSearch: {
        apiKey: string;
        id: string;
    },
    openai: {
        apiKey: string;
    },
    database: {
        type: string;
    }
}

export type Config = {
    app: AppConfig;
    preferences: PreferencesConfig;
    input: InputConfig;
}