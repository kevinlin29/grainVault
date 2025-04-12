-- schema.sql

-- Roll table to store collections of images
CREATE TABLE rolls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  film_stock TEXT,
  camera TEXT,
  lens TEXT,
  iso INTEGER,
  date_taken TEXT,
  date_imported TEXT NOT NULL,
  notes TEXT,
  thumbnail_path TEXT,
  image_count INTEGER NOT NULL
);

-- Images table to store individual image metadata
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  roll_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  index_in_roll INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  format TEXT,
  file_size INTEGER,
  date_modified TEXT,
  FOREIGN KEY (roll_id) REFERENCES rolls (id) ON DELETE CASCADE
);

-- Tags table for roll categorization
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Junction table for roll-tag relationship
CREATE TABLE roll_tags (
  roll_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (roll_id, tag_id),
  FOREIGN KEY (roll_id) REFERENCES rolls (id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

-- Film stocks table for dropdown selection
CREATE TABLE film_stocks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_color BOOLEAN NOT NULL DEFAULT 1,
  iso INTEGER
);

-- Cameras table for dropdown selection
CREATE TABLE cameras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Lenses table for dropdown selection
CREATE TABLE lenses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Settings table for app configuration
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'app_settings',
  theme TEXT DEFAULT 'light',
  default_view TEXT DEFAULT 'grid',
  thumbnails_size INTEGER DEFAULT 200,
  cache_limit_mb INTEGER DEFAULT 500
); 