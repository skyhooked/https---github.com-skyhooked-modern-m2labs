-- Add enhanced product fields inspired by JHS Pedals layout
-- These fields will improve the product page presentation

-- Add new columns to products table
ALTER TABLE products ADD COLUMN youtubeVideoId TEXT;
ALTER TABLE products ADD COLUMN features TEXT; -- JSON array of feature strings
ALTER TABLE products ADD COLUMN toggleOptions TEXT; -- JSON object for switch/setting explanations
ALTER TABLE products ADD COLUMN powerConsumption TEXT; -- Power consumption (e.g., "64mA")
ALTER TABLE products ADD COLUMN relatedProducts TEXT; -- JSON array of related product IDs

-- Note: dimensions and weight already exist in the schema
-- powerRequirements already exists for power info
