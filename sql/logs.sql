CREATE TABLE search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  keywords TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  page_number INTEGER NOT NULL DEFAULT 1, -- Tracks the page of the search
  board TEXT
);
