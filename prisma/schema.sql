-- RYmos E-Commerce Platform - Database Schema
-- Execute this in Supabase SQL Editor: https://imcsesyqurkpvguwpmem.supabase.co/project/default/sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  shop_name TEXT,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  customer_type TEXT DEFAULT 'online' CHECK (customer_type IN ('online', 'walk_in', 'both')),
  created_via TEXT DEFAULT 'online' CHECK (created_via IN ('online_signup', 'pos'))
);

-- ============================================
-- 2. ADMIN USERS
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'staff')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- 3. CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0
);

-- ============================================
-- 4. PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT,
  variant JSONB DEFAULT '{}',
  price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  stock INT DEFAULT 0,
  specs JSONB DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- 5. ORDERS
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'packing', 'shipping', 'delivered', 'cancelled', 'return')),
  order_type TEXT NOT NULL CHECK (order_type IN ('cod', 'shop_pickup', 'credit', 'bulk')),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cod', 'cash', 'bkash', 'credit')),
  shipping_address JSONB,
  pickup_note TEXT,
  credit_app_id UUID,
  down_payment DECIMAL(12,2),
  remaining_balance DECIMAL(12,2),
  tracking_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- 6. ORDER STATUS HISTORY
-- ============================================
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. CREDIT APPLICATIONS
-- ============================================
CREATE TABLE credit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  requested_amount DECIMAL(12,2) NOT NULL,
  proposed_down_payment DECIMAL(12,2),
  proposed_installments INT,
  documents JSONB DEFAULT '{}',
  video_statement_url TEXT,
  guarantor_info JSONB DEFAULT '{}',
  review_notes TEXT,
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  decision TEXT CHECK (decision IN ('approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. CREDIT PLANS
-- ============================================
CREATE TABLE credit_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES credit_applications(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  total_amount DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2) NOT NULL,
  installment_count INT NOT NULL,
  installment_amount DECIMAL(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. INSTALLMENTS (কিস্তি)
-- ============================================
CREATE TABLE installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES credit_plans(id),
  installment_number INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date TIMESTAMPTZ,
  paid_amount DECIMAL(12,2),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bkash', 'nagad', 'bank')),
  reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. RETURNS
-- ============================================
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  reason TEXT NOT NULL CHECK (reason IN ('defective', 'exchange', 'other')),
  product_details JSONB DEFAULT '{}',
  quantity INT DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  resolution TEXT CHECK (resolution IN ('refund', 'exchange', 'credit_adjustment')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES admin_users(id),
  processed_at TIMESTAMPTZ,
  notes TEXT
);

-- ============================================
-- 11. REFUNDS
-- ============================================
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID REFERENCES returns(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount DECIMAL(12,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'bkash', 'nagad', 'bank', 'credit_adjustment')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reference TEXT,
  processed_by UUID REFERENCES admin_users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sender TEXT NOT NULL CHECK (sender IN ('customer', 'admin')),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. DAILY SALES
-- ============================================
CREATE TABLE daily_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_sales DECIMAL(12,2) DEFAULT 0,
  cod_sales DECIMAL(12,2) DEFAULT 0,
  pickup_sales DECIMAL(12,2) DEFAULT 0,
  credit_down_payments DECIMAL(12,2) DEFAULT 0,
  credit_installments DECIMAL(12,2) DEFAULT 0,
  returns DECIMAL(12,2) DEFAULT 0,
  net_cash DECIMAL(12,2) DEFAULT 0,
  recorded_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. CART ITEMS
-- ============================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  variant JSONB DEFAULT '{}',
  quantity INT DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. WISHLIST
-- ============================================
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- ============================================
-- 16. INVENTORY MOVEMENTS
-- ============================================
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'return', 'adjustment', 'damage', 'pos_sale')),
  quantity INT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('order', 'return', 'manual', 'pos_order')),
  reference_id UUID,
  note TEXT,
  performed_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. COUPONS
-- ============================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(12,2) NOT NULL,
  min_order_amount DECIMAL(12,2) DEFAULT 0,
  max_discount DECIMAL(12,2),
  usage_limit INT,
  usage_count INT DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. PRODUCT REVIEWS
-- ============================================
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 19. ADMIN AUDIT LOG
-- ============================================
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'export')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 20. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  type TEXT NOT NULL CHECK (type IN ('order_status', 'installment_reminder', 'deal', 'message')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp', 'in_app')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_username ON customers(username);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_is_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = TRUE;
CREATE INDEX idx_credit_applications_customer_id ON credit_applications(customer_id);
CREATE INDEX idx_credit_plans_customer_id ON credit_plans(customer_id);
CREATE INDEX idx_installments_plan_id ON installments(plan_id);
CREATE INDEX idx_installments_status ON installments(status);
CREATE INDEX idx_messages_customer_id ON messages(customer_id);
CREATE INDEX idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SEED DATA
-- ============================================

-- Categories
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Smartphones', 'smartphones', 'smartphone', 1),
  ('Audio', 'audio', 'headphones', 2),
  ('Chargers', 'chargers', 'battery-charging', 3),
  ('Cases & Protection', 'cases', 'shield', 4),
  ('Wearables', 'wearables', 'watch', 5),
  ('Power Banks', 'power-banks', 'battery-full', 6);

-- Sample Products
INSERT INTO products (name, brand, price, original_price, stock, specs, images, category, is_featured, is_new_arrival) VALUES
  ('Samsung Galaxy S24 Ultra', 'Samsung', 129999, 149999, 50, '{"camera": "200MP", "processor": "Snapdragon 8 Gen 3", "battery": "5000mAh", "display": "6.8-inch Dynamic AMOLED 120Hz"}', '{}', 'smartphones', TRUE, FALSE),
  ('iPhone 15 Pro Max', 'Apple', 164999, 179999, 30, '{"camera": "48MP", "processor": "A17 Pro", "battery": "4422mAh", "display": "6.7-inch Super Retina XDR 120Hz"}', '{}', 'smartphones', TRUE, FALSE),
  ('OnePlus 12', 'OnePlus', 79999, 89999, 40, '{"camera": "50MP", "processor": "Snapdragon 8 Gen 3", "battery": "5400mAh", "display": "6.82-inch LTPO AMOLED 120Hz"}', '{}', 'smartphones', TRUE, FALSE),
  ('Xiaomi 14 Ultra', 'Xiaomi', 54999, 64999, 25, '{"camera": "50MP", "processor": "Snapdragon 8 Gen 3", "battery": "5000mAh", "display": "6.73-inch LTPO AMOLED 120Hz"}', '{}', 'smartphones', TRUE, FALSE),
  ('AirPods Pro 2nd Gen', 'Apple', 24999, 29999, 100, '{"type": "In-ear", "anc": true, "battery": "6h (30h with case)"}', '{}', 'audio', FALSE, FALSE),
  ('Anker 20W Charger', 'Anker', 1399, 1999, 200, '{"output": "20W", "port": "USB-C", "technology": "Power Delivery"}', '{}', 'chargers', FALSE, FALSE),
  ('iPhone 15 128GB', 'Apple', 69999, 79999, 35, '{"camera": "48MP", "processor": "A16 Bionic", "battery": "3349mAh", "display": "6.1-inch Super Retina XDR"}', '{}', 'smartphones', FALSE, FALSE),
  ('Samsung Galaxy S23 FE 5G', 'Samsung', 54999, 64999, 45, '{"camera": "50MP", "processor": "Exynos 2200", "battery": "4500mAh", "display": "6.4-inch Dynamic AMOLED 120Hz"}', '{}', 'smartphones', FALSE, FALSE),
  ('Apple Watch SE 2nd Gen', 'Apple', 29999, 34999, 60, '{"display": "44mm Retina", "sensors": "Heart rate, GPS", "battery": "18h"}', '{}', 'wearables', FALSE, FALSE),
  ('Vivo V20 5G', 'Vivo', 19999, 24999, 30, '{"camera": "64MP", "processor": "Snapdragon 765G", "battery": "4000mAh", "display": "6.44-inch AMOLED"}', '{}', 'smartphones', FALSE, TRUE),
  ('Realme 12 Pro+ 5G', 'Realme', 25999, 29999, 40, '{"camera": "50MP", "processor": "Snapdragon 7s Gen 2", "battery": "5000mAh", "display": "6.7-inch curved AMOLED 120Hz"}', '{}', 'smartphones', FALSE, TRUE),
  ('Nothing Phone (2a)', 'Nothing', 39999, 44999, 35, '{"camera": "50MP", "processor": "MediaTek Dimensity 7200 Pro", "battery": "5000mAh", "display": "6.7-inch AMOLED 120Hz"}', '{}', 'smartphones', FALSE, TRUE),
  ('POCO X6 Pro 5G', 'POCO', 24999, 29999, 50, '{"camera": "64MP", "processor": "MediaTek Dimensity 8300 Ultra", "battery": "5000mAh", "display": "6.67-inch AMOLED 120Hz"}', '{}', 'smartphones', FALSE, TRUE);

-- Admin user (password: admin123 — change in production!)
INSERT INTO admin_users (email, password_hash, name, role) VALUES
  ('admin@rymos.com', crypt('admin123', gen_salt('bf')), 'Super Admin', 'superadmin');
