CREATE TABLE IF NOT EXISTS portal_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tree', 'client')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portal_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_sessions_user ON portal_sessions(user_id);

CREATE TABLE IF NOT EXISTS portal_contacts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_contacts_owner ON portal_contacts(owner_id, created_at);

CREATE TABLE IF NOT EXISTS portal_leads (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_leads_created ON portal_leads(created_at);
CREATE INDEX IF NOT EXISTS portal_leads_client ON portal_leads(client_id, created_at);

CREATE TABLE IF NOT EXISTS portal_threads (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES portal_leads(id) ON DELETE CASCADE,
  tree_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE (lead_id, tree_id)
);
CREATE INDEX IF NOT EXISTS portal_threads_tree ON portal_threads(tree_id);

CREATE TABLE IF NOT EXISTS portal_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES portal_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_messages_thread ON portal_messages(thread_id, created_at);

CREATE TABLE IF NOT EXISTS portal_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
