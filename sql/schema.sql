CREATE TABLE search (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  keywords TEXT,
  starts_at INTEGER NOT NULL DEFAULT 1, -- Tracks the page of the search
  board TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_id INTEGER NOT NULL REFERENCES search(id),
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  details TEXT,
  custom_fields TEXT,
  board TEXT,
  resume TEXT,
  status TEXT NOT NULL DEFAULT 'Discovered',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_execution_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  completion_tokens_details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);