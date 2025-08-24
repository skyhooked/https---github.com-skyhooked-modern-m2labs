-- Add news_posts table and custom sections support
-- This migration adds the news functionality with custom sections

-- Create news_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS news_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  fullContent TEXT NOT NULL,
  coverImage TEXT,
  author TEXT NOT NULL,
  publishDate TEXT NOT NULL,
  readTime TEXT,
  category TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Add custom sections columns
ALTER TABLE news_posts ADD COLUMN customSections TEXT DEFAULT '[]';
ALTER TABLE news_posts ADD COLUMN useCustomTemplate BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_posts_publishDate ON news_posts (publishDate);
CREATE INDEX IF NOT EXISTS idx_news_posts_category ON news_posts (category);
CREATE INDEX IF NOT EXISTS idx_news_posts_author ON news_posts (author);
