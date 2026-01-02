-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║   PADOCA - DATABASE INTEGRITY CONSTRAINTS (DIC)                           ║
-- ║   Critical Data Integrity Failure Response Protocol                       ║
-- ╠═══════════════════════════════════════════════════════════════════════════╣
-- ║   Author: DBRE Team                                                        ║
-- ║   Database: PostgreSQL (Firebase Data Connect)                            ║
-- ║   Date: 2026-01-01                                                         ║
-- ║   Purpose: Enforce strict uniqueness at engine level - NO application     ║
-- ║            logic is trusted.                                               ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- EXECUTION ORDER:
-- 1. Run on PostgreSQL Cloud SQL instance directly
-- 2. Execute inside a transaction for atomic rollback on failure
-- 3. Monitor pg_stat_activity during execution for lock contention
--
-- COST ANALYSIS:
-- - Each functional index adds ~5-15% write overhead per INSERT/UPDATE
-- - B-TREE indexes on LOWER(TRIM()) expressions are ~10-20% larger than plain
-- - Composite indexes have linear memory cost per additional column
-- - Recommended: Schedule during low-traffic window

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: SUPPLIERS (Fornecedores)
-- ═══════════════════════════════════════════════════════════════════════════
-- Business Rule: Supplier name must be unique (case-insensitive, trimmed)
-- Business Rule: CNPJ must be unique for active suppliers only
-- Business Rule: Email must be unique for active suppliers only

-- 1.1 DROP existing indexes if they exist (idempotent)
DROP INDEX IF EXISTS idx_supplier_name_canonical;
DROP INDEX IF EXISTS idx_supplier_cnpj_active_only;
DROP INDEX IF EXISTS idx_supplier_email_active_only;

-- 1.2 UNIQUE INDEX: Canonicalized supplier name
-- Protection: " Coca Cola ", "coca cola", "COCA COLA" → ALL CONFLICT
-- Cost: ~12% write overhead, ~8KB per 1000 rows
CREATE UNIQUE INDEX idx_supplier_name_canonical
ON "Supplier" (LOWER(TRIM(name)))
WHERE "isActive" = true;

COMMENT ON INDEX idx_supplier_name_canonical IS 
'[DIC-001] Prevents semantic duplicates in supplier names. 
Canonicalization: LOWER(TRIM(name)). Only enforced on active records.
Violation Code: 23505 (unique_violation).
Example: " Padaria Estrela " and "padaria estrela" will CONFLICT.';

-- 1.3 UNIQUE INDEX: CNPJ (Brazilian Tax ID) - Active suppliers only
-- CNPJ format: 14 digits, often stored as XX.XXX.XXX/XXXX-XX
-- We normalize by removing non-digits
CREATE UNIQUE INDEX idx_supplier_cnpj_active_only
ON "Supplier" (REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g'))
WHERE "isActive" = true AND cnpj IS NOT NULL AND cnpj <> '';

COMMENT ON INDEX idx_supplier_cnpj_active_only IS
'[DIC-002] Prevents duplicate CNPJs (Brazilian Tax IDs) for active suppliers.
Normalization: Strips all non-digit characters.
Example: "12.345.678/0001-99" and "12345678000199" will CONFLICT.
Soft-deleted suppliers are excluded, allowing re-registration.';

-- 1.4 UNIQUE INDEX: Email - Active suppliers only (case-insensitive)
CREATE UNIQUE INDEX idx_supplier_email_active_only
ON "Supplier" (LOWER(TRIM(email)))
WHERE "isActive" = true AND email IS NOT NULL AND email <> '';

COMMENT ON INDEX idx_supplier_email_active_only IS
'[DIC-003] Prevents duplicate emails for active suppliers.
Canonicalization: LOWER(TRIM(email)).
Example: " Admin@Fornecedor.com " and "admin@fornecedor.com" will CONFLICT.';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: PRODUCTS (Itens/Ingredientes)
-- ═══════════════════════════════════════════════════════════════════════════
-- Business Rule: Product name must be unique PER SUPPLIER (composite key)
-- Business Rule: Barcode must be globally unique for active products
-- Business Rule: Allow same product name across different suppliers

-- 2.1 DROP existing indexes
DROP INDEX IF EXISTS idx_product_supplier_name_canonical;
DROP INDEX IF EXISTS idx_product_barcode_active_only;
DROP INDEX IF EXISTS idx_product_name_category_canonical;

-- 2.2 UNIQUE INDEX: Composite (Supplier + Canonicalized Name)
-- Protection: Same product name can exist for different suppliers
--             BUT never twice for the same supplier
-- Cost: ~15% write overhead due to composite + function
CREATE UNIQUE INDEX idx_product_supplier_name_canonical
ON "Product" ("supplier_id", LOWER(TRIM(name)))
WHERE "isActive" = true;

COMMENT ON INDEX idx_product_supplier_name_canonical IS
'[DIC-004] Prevents duplicate product names PER SUPPLIER.
Composite Key: (supplier_id, LOWER(TRIM(name))).
Example: Supplier A can have "Farinha 1kg" and Supplier B can also have "Farinha 1kg".
         BUT Supplier A CANNOT have "Farinha 1kg" twice.
Soft-deleted products are excluded.';

-- 2.3 UNIQUE INDEX: Barcode (EAN-13/EAN-8/UPC) - Global uniqueness
CREATE UNIQUE INDEX idx_product_barcode_active_only
ON "Product" (TRIM(barcode))
WHERE "isActive" = true AND barcode IS NOT NULL AND barcode <> '';

COMMENT ON INDEX idx_product_barcode_active_only IS
'[DIC-005] Prevents duplicate barcodes across ALL active products.
Barcodes are globally unique (EAN-13, EAN-8, UPC standards).
Soft-deleted products are excluded.';

-- 2.4 UNIQUE INDEX: Fallback - Name + Category for products without supplier
-- For products not linked to a specific supplier
CREATE UNIQUE INDEX idx_product_name_category_canonical
ON "Product" (LOWER(TRIM(name)), LOWER(COALESCE(TRIM(category), '__none__')))
WHERE "isActive" = true AND "supplier_id" IS NULL;

COMMENT ON INDEX idx_product_name_category_canonical IS
'[DIC-006] Prevents duplicate (name, category) pairs for orphan products.
Applies ONLY to products without a supplier_id.
Handles NULL category by converting to "__none__".';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: QUOTATIONS (Cotações)
-- ═══════════════════════════════════════════════════════════════════════════
-- Business Rule: requestId must be globally unique
-- Business Rule: One active quotation per (supplier + same-day window)
-- Business Rule: Prevent spam quotations within time window

-- 3.1 DROP existing indexes
DROP INDEX IF EXISTS idx_quotation_request_id_unique;
DROP INDEX IF EXISTS idx_quotation_supplier_daily_window;

-- 3.2 UNIQUE INDEX: requestId (already in schema, reinforcing at DB level)
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotation_request_id_unique
ON "Quotation" ("requestId")
WHERE "requestId" IS NOT NULL AND "softDeleted" = false;

COMMENT ON INDEX idx_quotation_request_id_unique IS
'[DIC-007] Ensures unique requestId [REQ-xxx] for email tracking.
Excludes soft-deleted records.';

-- 3.3 COMPOSITE UNIQUE: Supplier + Date-truncated timestamp (same-day dedup)
-- Prevents accidental duplicate quotations to same supplier on same day
-- Expression: date_trunc('day', "createdAt") extracts just the date portion
CREATE UNIQUE INDEX idx_quotation_supplier_daily_window
ON "Quotation" ("supplier_id", date_trunc('day', "createdAt"))
WHERE "softDeleted" = false 
  AND status IN ('PENDING', 'SENT', 'WAITING');

COMMENT ON INDEX idx_quotation_supplier_daily_window IS
'[DIC-008] Prevents duplicate active quotations to same supplier on same day.
Composite Key: (supplier_id, DATE(createdAt)).
ONLY applies to PENDING/SENT/WAITING status (active quotations).
Completed or soft-deleted quotations are excluded.
Purpose: Prevent spam emails to suppliers.';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: AUTO-QUOTE REQUESTS (Sistema Auto-Quote)
-- ═══════════════════════════════════════════════════════════════════════════
-- Business Rule: deduplicationKey must be unique for active requests
-- Business Rule: requestId must be unique
-- Business Rule: Prevent duplicate pending cards for same product+supplier

-- 4.1 DROP existing indexes
DROP INDEX IF EXISTS idx_autoquote_dedup_active;
DROP INDEX IF EXISTS idx_autoquote_product_supplier_active;

-- 4.2 UNIQUE INDEX: deduplicationKey with soft-delete exclusion
-- The application generates: "productId:supplierId"
CREATE UNIQUE INDEX idx_autoquote_dedup_active
ON "AutoQuoteRequest" ("deduplicationKey")
WHERE "softDeleted" = false
  AND status NOT IN ('CANCELLED', 'EXPIRED', 'RECEIVED');

COMMENT ON INDEX idx_autoquote_dedup_active IS
'[DIC-009] Prevents duplicate pending auto-quote requests.
Key: deduplicationKey = "productId:supplierId".
Excludes completed (RECEIVED), cancelled, and expired requests.
Allows re-requesting after completion.';

-- 4.3 UNIQUE INDEX: Composite (Product + Supplier) for active requests
-- Redundant safety net in case deduplicationKey is not set correctly
CREATE UNIQUE INDEX idx_autoquote_product_supplier_active
ON "AutoQuoteRequest" ("product_id", "supplier_id")
WHERE "softDeleted" = false
  AND status IN ('PENDING', 'AWAITING', 'PROCESSING', 'ORDERED');

COMMENT ON INDEX idx_autoquote_product_supplier_active IS
'[DIC-010] Safety net: Prevents duplicate (product, supplier) in active pipeline.
Applies to: PENDING, AWAITING, PROCESSING, ORDERED status.
Excludes: CANCELLED, EXPIRED, RECEIVED and soft-deleted.';

-- 4.4 UNIQUE INDEX: Prevent duplicate RECEIVED cards per product+supplier per day
-- This addresses USER BUG REPORT: "em recebido ainda tem card duplicado"
-- Only allows ONE received card per product+supplier per calendar day
DROP INDEX IF EXISTS idx_autoquote_received_daily;

CREATE UNIQUE INDEX idx_autoquote_received_daily
ON "AutoQuoteRequest" (
    "product_id", 
    "supplier_id", 
    DATE("receivedAt")
)
WHERE "softDeleted" = false
  AND status = 'RECEIVED'
  AND "receivedAt" IS NOT NULL;

COMMENT ON INDEX idx_autoquote_received_daily IS
'[DIC-010B] Prevents duplicate RECEIVED cards per product+supplier per day.
This is a safety net after the application-level fix in backgroundStockMonitor.js.
Allows re-ordering on different days, but blocks duplicates on same day.
Error: 23505 unique_violation.
Backend should catch and return: "A request for this product was already received today."';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: ORDER CARDS
-- ═══════════════════════════════════════════════════════════════════════════
-- Business Rule: requestId must be unique (1:1 with AutoQuoteRequest)

-- 5.1 DROP existing indexes
DROP INDEX IF EXISTS idx_ordercard_request_id_unique;

-- 5.2 UNIQUE INDEX: requestId for OrderCard
CREATE UNIQUE INDEX idx_ordercard_request_id_unique
ON "OrderCard" ("requestId")
WHERE "softDeleted" = false;

COMMENT ON INDEX idx_ordercard_request_id_unique IS
'[DIC-011] Ensures 1:1 relationship between OrderCard and AutoQuoteRequest.
Each AutoQuoteRequest can generate exactly ONE OrderCard.';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: QUOTATION ITEMS (Prevent duplicate items per quotation)
-- ═══════════════════════════════════════════════════════════════════════════

-- 6.1 DROP existing indexes
DROP INDEX IF EXISTS idx_quotation_item_unique;

-- 6.2 UNIQUE INDEX: (quotation_id + product_id) - already in schema but reinforcing
CREATE UNIQUE INDEX idx_quotation_item_unique
ON "QuotationItem" ("quotation_id", "product_id");

COMMENT ON INDEX idx_quotation_item_unique IS
'[DIC-012] Prevents same product from appearing twice in a quotation.
Each product can only have ONE line item per quotation.';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: PURCHASE ORDER ITEMS (Prevent duplicate items per PO)
-- ═══════════════════════════════════════════════════════════════════════════

-- 7.1 DROP existing indexes
DROP INDEX IF EXISTS idx_purchase_order_item_unique;

-- 7.2 UNIQUE INDEX: (purchaseOrder_id + product_id)
CREATE UNIQUE INDEX idx_purchase_order_item_unique
ON "PurchaseOrderItem" ("purchaseOrder_id", "product_id");

COMMENT ON INDEX idx_purchase_order_item_unique IS
'[DIC-013] Prevents same product from appearing twice in a purchase order.';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 8: PURCHASE ORDER NUMBER UNIQUENESS
-- ═══════════════════════════════════════════════════════════════════════════

-- 8.1 DROP existing indexes
DROP INDEX IF EXISTS idx_purchase_order_number_unique;

-- 8.2 UNIQUE INDEX: orderNumber
CREATE UNIQUE INDEX idx_purchase_order_number_unique
ON "PurchaseOrder" (LOWER(TRIM("orderNumber")));

COMMENT ON INDEX idx_purchase_order_number_unique IS
'[DIC-014] Ensures unique order numbers across all purchase orders.
Canonicalized to prevent "PO-001" and " po-001 " duplicates.';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 9: CATEGORY NAMES (Prevent duplicate category names)
-- ═══════════════════════════════════════════════════════════════════════════

-- 9.1 Cost Categories
DROP INDEX IF EXISTS idx_cost_category_name_unique;
CREATE UNIQUE INDEX idx_cost_category_name_unique
ON "CostCategory" (LOWER(TRIM(name)));

-- 9.2 Inventory Categories
DROP INDEX IF EXISTS idx_inventory_category_name_unique;
CREATE UNIQUE INDEX idx_inventory_category_name_unique
ON "InventoryCategory" (LOWER(TRIM(name)));

-- 9.3 Recipe Categories
DROP INDEX IF EXISTS idx_recipe_category_name_unique;
CREATE UNIQUE INDEX idx_recipe_category_name_unique
ON "RecipeCategory" (LOWER(TRIM(name)));

COMMENT ON INDEX idx_cost_category_name_unique IS
'[DIC-015] Prevents duplicate cost category names (case-insensitive).';

COMMENT ON INDEX idx_inventory_category_name_unique IS
'[DIC-016] Prevents duplicate inventory category names (case-insensitive).';

COMMENT ON INDEX idx_recipe_category_name_unique IS
'[DIC-017] Prevents duplicate recipe category names (case-insensitive).';


-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 10: RECIPE NAMES (Unique per category)
-- ═══════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_recipe_name_category_unique;

CREATE UNIQUE INDEX idx_recipe_name_category_unique
ON "Recipe" (LOWER(TRIM(name)), LOWER(COALESCE(TRIM(category), '__none__')));

COMMENT ON INDEX idx_recipe_name_category_unique IS
'[DIC-018] Prevents duplicate recipe names within the same category.
Example: Can have "Pizza Margherita" in "Pizzas" and "Pizza Margherita" in "Clássicos".
         But cannot have two "Pizza Margherita" in "Pizzas".';


COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- List all DIC indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index sizes (run after data is populated)
SELECT 
    relname AS index_name,
    pg_size_pretty(pg_relation_size(oid)) AS index_size,
    idx_scan AS times_used,
    idx_tup_read AS rows_read
FROM pg_stat_user_indexes
WHERE relname LIKE 'idx_%'
ORDER BY pg_relation_size(oid) DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK SCRIPT (Emergency Use Only)
-- ═══════════════════════════════════════════════════════════════════════════
/*
-- Run this block if you need to remove all DIC constraints:

BEGIN;
DROP INDEX IF EXISTS idx_supplier_name_canonical;
DROP INDEX IF EXISTS idx_supplier_cnpj_active_only;
DROP INDEX IF EXISTS idx_supplier_email_active_only;
DROP INDEX IF EXISTS idx_product_supplier_name_canonical;
DROP INDEX IF EXISTS idx_product_barcode_active_only;
DROP INDEX IF EXISTS idx_product_name_category_canonical;
DROP INDEX IF EXISTS idx_quotation_request_id_unique;
DROP INDEX IF EXISTS idx_quotation_supplier_daily_window;
DROP INDEX IF EXISTS idx_autoquote_dedup_active;
DROP INDEX IF EXISTS idx_autoquote_product_supplier_active;
DROP INDEX IF EXISTS idx_ordercard_request_id_unique;
DROP INDEX IF EXISTS idx_quotation_item_unique;
DROP INDEX IF EXISTS idx_purchase_order_item_unique;
DROP INDEX IF EXISTS idx_purchase_order_number_unique;
DROP INDEX IF EXISTS idx_cost_category_name_unique;
DROP INDEX IF EXISTS idx_inventory_category_name_unique;
DROP INDEX IF EXISTS idx_recipe_category_name_unique;
DROP INDEX IF EXISTS idx_recipe_name_category_unique;
COMMIT;
*/
