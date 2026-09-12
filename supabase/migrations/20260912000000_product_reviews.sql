-- Run this in Supabase SQL Editor: https://imcsesyqurkpvguwpmem.supabase.co/project/default/sql/new

-- YouTube reviews: admin-managed video embeds per product
CREATE TABLE IF NOT EXISTS youtube_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  creator_name TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_youtube_reviews_product ON youtube_reviews(product_id);

-- Customer reviews: verified purchases + admin seed
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  admin_seed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

-- Enable RLS
ALTER TABLE youtube_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read for YouTube reviews
CREATE POLICY "Public read youtube_reviews" ON youtube_reviews FOR SELECT USING (true);

-- Public read for approved reviews
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (is_approved = true);

-- Seed some demo YouTube reviews for existing products
INSERT INTO youtube_reviews (product_id, title, youtube_url, creator_name, sort_order) 
SELECT 
  p.id,
  'iPhone 15 Pro Max Review - ' || p.name,
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Tech Reviewer',
  1
FROM products p WHERE p.name ILIKE '%iPhone 15 Pro Max%' LIMIT 1;

INSERT INTO youtube_reviews (product_id, title, youtube_url, creator_name, sort_order)
SELECT 
  p.id,
  'Samsung Galaxy S24 Ultra Review',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'Samsung Expert',
  1
FROM products p WHERE p.name ILIKE '%Samsung Galaxy S24 Ultra%' LIMIT 1;
