# 🚀 Charbon CLI 🔍

Charbon CLI is your ultimate Command Line Interface to streamline the job search and application process! 🎯 It provides powerful tools to automate and optimize your job-hunting workflow, so you can focus on landing your dream job! 💼✨

## 🎨 Features

Charbon CLI supports a 10-batch stage FIFO queue style and a live one-to-one feature with the following commands:

### 🔎 `charbon search <query>`
- **Description**: Uses Google Custom Search JSON API to search for jobs on job boards.
- **Current Support**: Supports "Lever.co" (with plans to support other boards).
- **Functionality**:
  - Associates search results with a tagged resume for use in the `charbon apply` command.
  - Allows specific keywords with the `--keywords` option and filters by job boards using the `--board` option (default: "lever").
  - Enables location-based filtering with the `--country` option (default: "us").
  - Stores jobs in a database and marks them with a status of "Discovered."
- **Database Support**: Supports multiple paradigms; currently uses an SQLite adapter (MVP).

### 🕵️ `charbon scrape`
- **Description**: Uses Puppeteer to scrape job descriptions and custom questions.
- **Functionality**:
  - Processes job descriptions using OpenAI's GPT-4o API to extract structured JSON data.
  - Stores extracted data in the database with a status of "Scraped."

### 🧐 `charbon review`
- **Description**: Fetches all "Scraped" jobs for manual review.
- **Functionality**:
  - Allows users to flag jobs as "Not Interested" or "Not Qualified."
  - Marks suitable jobs as "Reviewed" to prepare for the next stage.

### 🛠️ `charbon prepare`
- **Description**: Fetches all "Reviewed" jobs and processes custom questions.
- **Functionality**:
  - Uses OpenAI's GPT-4o API and a user-provided knowledge base to generate answers to custom questions.
  - Stores these answers and updates the job status to "Prepared."

### 🤖 `charbon apply`
- **Description**: Automates the application process.
- **Functionality**:
  - Uses Puppeteer to open a Chrome browser and auto-apply using the tagged resume and custom answers.
  - Allows manual user review of answers with the option to regenerate responses.
  - Marks jobs as "Applied" upon completion.

### ⚡ `charbon live`
- **Description**: Consolidates all processes except `charbon search`.
- **Functionality**:
  - Processes jobs one by one for fine-grained control.

## 🛠️ Installation

This project is not yet published on npm and requires cloning or forking the repository to use. Users must manually set up the environment.

### Prerequisites
- A "data" folder containing:
  - `db.sqlite` (SQLite database file).
  - `knowledge.txt` (knowledge base file).
- Google Custom Search JSON API key.
- OpenAI account with available credits.

### Steps:
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/charbon-cli.git
   ```
2. Navigate to the project directory:
   ```bash
   cd charbon-cli
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## 🔧 Usage

Run the following command for help:

```bash
charbon --help
```

### 🗂️ Example Workflow

1. Search for jobs:
   ```bash
   charbon search "Software Engineer" --keywords "remote, full-time" --board "lever" --country "us"
   ```
2. Scrape job details:
   ```bash
   charbon scrape
   ```
3. Review scraped jobs:
   ```bash
   charbon review
   ```
4. Prepare applications:
   ```bash
   charbon prepare
   ```
5. Apply to jobs:
   ```bash
   charbon apply
   ```
6. Use live mode for manual control:
   ```bash
   charbon live
   ```

## 🤝 Contributing

We welcome contributions! Please fork the repository and create a pull request. See the original README for detailed contribution steps.

## 📜 License

Charbon CLI is licensed under the [MIT License](LICENSE).

## 🙋 Support

For demos or inquiries, contact me by email. Additional support can be obtained by opening an issue on GitHub.

## 💡 Acknowledgments

Thanks to the open-source community and contributors for inspiration and support in building Charbon CLI.
