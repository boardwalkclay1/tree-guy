-- ================================
-- REAL TREE GUY OS — SCHEMA
-- ================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tree', 'client')),
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

-- TREE PROFILE
CREATE TABLE IF NOT EXISTS tree_profile (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  company_name TEXT,
  roles TEXT NOT NULL, -- JSON array: ["sales","groundy","climber"]
  bio TEXT,
  service_area TEXT,
  experience_years INTEGER,
  insurance_proof_url TEXT,
  avatar_url TEXT
);

-- CLIENT PROFILE
CREATE TABLE IF NOT EXISTS client_profile (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT
);

-- JOBS
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('open','reserved','assigned','completed','closed')),
  location_city TEXT,
  location_state TEXT,
  location_zip TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- JOB PHOTOS
CREATE TABLE IF NOT EXISTS job_photos (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tree_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('viewed','purchased','expired')),
  price_cents INTEGER NOT NULL,
  paypal_order_id TEXT,
  created_at TEXT NOT NULL
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- COMMENTS (TREE SIDE)
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
