CREATE TABLE search (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  keywords TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  page_number INTEGER NOT NULL DEFAULT 1, -- Tracks the page of the search
  board TEXT
);

CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_id INTEGER NOT NULL REFERENCES search(id),
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description TEXT,
  salary TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  board TEXT
  custom_fields TEXT
  status TEXT NOT NULL DEFAULT 'Discovered'
);

CREATE TABLE ai_execution_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  completion_tokens_details TEXT
);