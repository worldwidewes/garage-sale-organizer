-- Garage Sale Organizer Database Schema

-- Items table to store garage sale items
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Images table to store item photos and AI analysis
CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    ai_analysis TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
);

-- Settings table for app configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_price ON items(price);
CREATE INDEX IF NOT EXISTS idx_images_item_id ON images(item_id);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('garage_sale_title', 'My Garage Sale'),
    ('garage_sale_date', ''),
    ('garage_sale_address', ''),
    ('contact_info', ''),
    ('openai_model', 'gpt-4-vision-preview');

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_items_timestamp 
    AFTER UPDATE ON items
BEGIN
    UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;