-- Update product images with relevant photos from Unsplash
-- Run this in Supabase SQL Editor

UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80'] WHERE name ILIKE '%Samsung Galaxy S24 Ultra%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80'] WHERE name ILIKE '%iPhone 15 Pro Max%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1636841669596-d0d5c3a5b6a9?w=800&q=80'] WHERE name ILIKE '%OnePlus 12%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1606646734014-91c2c66d138d?w=800&q=80'] WHERE name ILIKE '%Xiaomi 14 Ultra%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80'] WHERE name ILIKE '%AirPods Pro%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80'] WHERE name ILIKE '%Anker%Charger%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80'] WHERE name ILIKE '%iPhone 15 128GB%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80'] WHERE name ILIKE '%Samsung Galaxy S23 FE%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80'] WHERE name ILIKE '%Apple Watch SE%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'] WHERE name ILIKE '%Vivo V20%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80'] WHERE name ILIKE '%Realme 12 Pro%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&q=80'] WHERE name ILIKE '%Nothing Phone%';
UPDATE products SET images = ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'] WHERE name ILIKE '%POCO X6%';
