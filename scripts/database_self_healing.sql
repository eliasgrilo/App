-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║   PADOCA - SELF-HEALING DATABASE SCHEMA                                   ║
-- ║   Automated Sanitization, Constraints & Integrity Enforcement             ║
-- ╠═══════════════════════════════════════════════════════════════════════════╣
-- ║   Author: Principal Database Architect                                    ║
-- ║   Database: PostgreSQL (Firebase Data Connect)                            ║
-- ║   Date: 2026-01-01                                                         ║
-- ║   Purpose: Create a database that is self-healing and impervious to       ║
-- ║            bad data. No application logic is trusted.                     ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- EXECUTION ORDER:
-- 1. Ensure btree_gist extension is installed
-- 2. Run inside a transaction for atomic rollback on failure
-- 3. This script is IDEMPOTENT - safe to run multiple times
--
-- ERROR CODES REFERENCE:
-- ╔═══════════════╦════════════════════════════════════════════════════════════╗
-- ║ 23505         ║ unique_violation - Duplicate key detected                  ║
-- ║ 23503         ║ foreign_key_violation - Parent record missing/referenced   ║
-- ║ 23502         ║ not_null_violation - Required field is NULL                ║
-- ║ 23514         ║ check_violation - CHECK constraint failed                  ║
-- ║ 23P01         ║ exclusion_violation - EXCLUDE constraint failed (overlap)  ║
-- ╚═══════════════╩════════════════════════════════════════════════════════════╝

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- PREREQUISITES: Required Extensions
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS btree_gist;

COMMENT ON EXTENSION btree_gist IS 
'Required for EXCLUDE USING GIST constraints on non-geometric types (UUID, TIMESTAMP).
Enables time-range overlap prevention for quotations and orders.';


-- ═══════════════════════════════════════════════════════════════════════════
-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║                    LAYER 1: AUTOMATED SANITIZATION                        ║
-- ║                    (BEFORE INSERT OR UPDATE Triggers)                     ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
-- BENEFIT: " Coca Cola " and "COCA COLA" become identical before storage.
-- The database FIXES the input automatically - no trust in application layer.


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1.1: SUPPLIER SANITIZATION
-- ───────────────────────────────────────────────────────────────────────────
-- Canonicalizes: name → UPPER(TRIM(collapsed_spaces))
--                email → LOWER(TRIM())
--                cnpj → digits only

CREATE OR REPLACE FUNCTION sanitize_supplier()
RETURNS TRIGGER AS $$
BEGIN
    -- Name: Remove leading/trailing spaces, collapse multiple spaces, uppercase
    IF NEW.name IS NOT NULL THEN
        NEW.name := UPPER(TRIM(REGEXP_REPLACE(NEW.name, '\s+', ' ', 'g')));
    END IF;
    
    -- Email: Lowercase, trim
    IF NEW.email IS NOT NULL THEN
        NEW.email := LOWER(TRIM(NEW.email));
    END IF;
    
    -- CNPJ: Extract digits only (14.123.456/0001-00 → 14123456000100)
    IF NEW.cnpj IS NOT NULL THEN
        NEW.cnpj := REGEXP_REPLACE(NEW.cnpj, '[^0-9]', '', 'g');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

COMMENT ON FUNCTION sanitize_supplier() IS
'[SHF-001] Auto-sanitizes Supplier records before INSERT/UPDATE.
- name: UPPER(TRIM(collapse_spaces)) → "  coca  cola " becomes "COCA COLA"
- email: LOWER(TRIM()) → "ADMIN@EMAIL.COM" becomes "admin@email.com"  
- cnpj: digits only → "12.345.678/0001-99" becomes "12345678000199"
Error handling: Returns cleaned NEW row; never raises exceptions.';

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trg_sanitize_supplier ON "Supplier";
CREATE TRIGGER trg_sanitize_supplier
    BEFORE INSERT OR UPDATE ON "Supplier"
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_supplier();


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1.2: PRODUCT SANITIZATION
-- ───────────────────────────────────────────────────────────────────────────
-- Canonicalizes: name → UPPER(TRIM(collapsed_spaces))
--                barcode → TRIM(no spaces)
--                category → TRIM(collapsed_spaces)

CREATE OR REPLACE FUNCTION sanitize_product()
RETURNS TRIGGER AS $$
BEGIN
    -- Name: Remove leading/trailing spaces, collapse multiple spaces, uppercase
    IF NEW.name IS NOT NULL THEN
        NEW.name := UPPER(TRIM(REGEXP_REPLACE(NEW.name, '\s+', ' ', 'g')));
    END IF;
    
    -- Barcode: Remove ALL whitespace (EAN-13/UPC should have no spaces)
    IF NEW.barcode IS NOT NULL THEN
        NEW.barcode := REGEXP_REPLACE(NEW.barcode, '\s', '', 'g');
    END IF;
    
    -- Category: Trim and collapse spaces only (preserve case for display)
    IF NEW.category IS NOT NULL THEN
        NEW.category := TRIM(REGEXP_REPLACE(NEW.category, '\s+', ' ', 'g'));
    END IF;
    
    -- Subcategory: Same treatment
    IF NEW.subcategory IS NOT NULL THEN
        NEW.subcategory := TRIM(REGEXP_REPLACE(NEW.subcategory, '\s+', ' ', 'g'));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

COMMENT ON FUNCTION sanitize_product() IS
'[SHF-002] Auto-sanitizes Product records before INSERT/UPDATE.
- name: UPPER(TRIM(collapse_spaces)) → "  farinha 1kg  " becomes "FARINHA 1KG"
- barcode: removes all whitespace → "7891234 567890" becomes "7891234567890"
- category/subcategory: TRIM(collapse_spaces), case preserved for display';

DROP TRIGGER IF EXISTS trg_sanitize_product ON "Product";
CREATE TRIGGER trg_sanitize_product
    BEFORE INSERT OR UPDATE ON "Product"
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_product();


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1.3: PURCHASE ORDER SANITIZATION
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sanitize_purchase_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Order Number: Uppercase, trim, collapse spaces
    IF NEW."orderNumber" IS NOT NULL THEN
        NEW."orderNumber" := UPPER(TRIM(REGEXP_REPLACE(NEW."orderNumber", '\s+', ' ', 'g')));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

COMMENT ON FUNCTION sanitize_purchase_order() IS
'[SHF-003] Auto-sanitizes PurchaseOrder records.
- orderNumber: UPPER(TRIM()) → " po-001 " becomes "PO-001"';

DROP TRIGGER IF EXISTS trg_sanitize_purchase_order ON "PurchaseOrder";
CREATE TRIGGER trg_sanitize_purchase_order
    BEFORE INSERT OR UPDATE ON "PurchaseOrder"
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_purchase_order();


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1.4: CATEGORY SANITIZATION (All category tables)
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sanitize_category_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Name: Trim and collapse spaces, preserve case
    IF NEW.name IS NOT NULL THEN
        NEW.name := TRIM(REGEXP_REPLACE(NEW.name, '\s+', ' ', 'g'));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

COMMENT ON FUNCTION sanitize_category_name() IS
'[SHF-004] Generic sanitizer for category tables (CostCategory, InventoryCategory, RecipeCategory).
- name: TRIM(collapse_spaces), case preserved';

-- Apply to all category tables
DROP TRIGGER IF EXISTS trg_sanitize_cost_category ON "CostCategory";
CREATE TRIGGER trg_sanitize_cost_category
    BEFORE INSERT OR UPDATE ON "CostCategory"
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_category_name();

DROP TRIGGER IF EXISTS trg_sanitize_inventory_category ON "InventoryCategory";
CREATE TRIGGER trg_sanitize_inventory_category
    BEFORE INSERT OR UPDATE ON "InventoryCategory"
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_category_name();

DROP TRIGGER IF EXISTS trg_sanitize_recipe_category ON "RecipeCategory";
CREATE TRIGGER trg_sanitize_recipe_category
    BEFORE INSERT OR UPDATE ON "RecipeCategory"
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_category_name();


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1.5: RECIPE SANITIZATION
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION sanitize_recipe()
RETURNS TRIGGER AS $$
BEGIN
    -- Name: Trim and collapse spaces
    IF NEW.name IS NOT NULL THEN
        NEW.name := TRIM(REGEXP_REPLACE(NEW.name, '\s+', ' ', 'g'));
    END IF;
    
    -- Category: Trim and collapse spaces
    IF NEW.category IS NOT NULL THEN
        NEW.category := TRIM(REGEXP_REPLACE(NEW.category, '\s+', ' ', 'g'));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

COMMENT ON FUNCTION sanitize_recipe() IS
'[SHF-005] Auto-sanitizes Recipe records.
- name: TRIM(collapse_spaces)
- category: TRIM(collapse_spaces)';

DROP TRIGGER IF EXISTS trg_sanitize_recipe ON "Recipe";
CREATE TRIGGER trg_sanitize_recipe
    BEFORE INSERT OR UPDATE ON "Recipe"
    FOR EACH ROW
    EXECUTE FUNCTION sanitize_recipe();


-- ═══════════════════════════════════════════════════════════════════════════
-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║                    LAYER 2: ADVANCED CHECK CONSTRAINTS                    ║
-- ║                    (The "No-Nonsense" Rules)                             ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
-- BENEFIT: Reject invalid data at storage level. No negative prices. No paradoxes.
-- ERROR CODE: 23514 (check_violation)


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.1: PRODUCT CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

-- Price must be non-negative
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS chk_product_price_non_negative;
ALTER TABLE "Product" ADD CONSTRAINT chk_product_price_non_negative
    CHECK ("pricePerUnit" >= 0);

COMMENT ON CONSTRAINT chk_product_price_non_negative ON "Product" IS
'[CHK-001] Prevents negative prices. pricePerUnit must be >= 0.
Error: 23514 check_violation
Backend should catch and return: "Product price cannot be negative"';

-- Total cost must be non-negative
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS chk_product_total_cost_non_negative;
ALTER TABLE "Product" ADD CONSTRAINT chk_product_total_cost_non_negative
    CHECK ("totalCost" >= 0);

COMMENT ON CONSTRAINT chk_product_total_cost_non_negative ON "Product" IS
'[CHK-002] Prevents negative total cost. totalCost must be >= 0.
Error: 23514 check_violation';

-- Stock bounds: min >= 0, max >= min
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS chk_product_stock_bounds;
ALTER TABLE "Product" ADD CONSTRAINT chk_product_stock_bounds
    CHECK (
        "minStock" >= 0 
        AND "maxStock" >= 0 
        AND ("maxStock" >= "minStock" OR "maxStock" = 0)
    );

COMMENT ON CONSTRAINT chk_product_stock_bounds ON "Product" IS
'[CHK-003] Validates stock thresholds.
- minStock must be >= 0
- maxStock must be >= 0
- maxStock must be >= minStock (or 0 if unlimited)
Error: 23514 check_violation';

-- Package quantity must be positive
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS chk_product_package_quantity;
ALTER TABLE "Product" ADD CONSTRAINT chk_product_package_quantity
    CHECK ("packageQuantity" IS NULL OR "packageQuantity" > 0);

COMMENT ON CONSTRAINT chk_product_package_quantity ON "Product" IS
'[CHK-004] Package quantity must be positive if specified.
Error: 23514 check_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.2: PRODUCT MOVEMENT CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

-- Quantity must be positive (movement of 0 items is meaningless)
ALTER TABLE "ProductMovement" DROP CONSTRAINT IF EXISTS chk_movement_quantity_positive;
ALTER TABLE "ProductMovement" ADD CONSTRAINT chk_movement_quantity_positive
    CHECK (quantity > 0);

COMMENT ON CONSTRAINT chk_movement_quantity_positive ON "ProductMovement" IS
'[CHK-005] Movement quantity must be > 0. Zero movements are rejected.
Error: 23514 check_violation
Backend should catch and return: "Movement quantity must be greater than zero"';

-- Price if specified must be non-negative
ALTER TABLE "ProductMovement" DROP CONSTRAINT IF EXISTS chk_movement_price_non_negative;
ALTER TABLE "ProductMovement" ADD CONSTRAINT chk_movement_price_non_negative
    CHECK (price IS NULL OR price >= 0);

COMMENT ON CONSTRAINT chk_movement_price_non_negative ON "ProductMovement" IS
'[CHK-006] Movement price must be >= 0 if specified.
Error: 23514 check_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.3: QUOTATION ITEM CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

-- Requested quantity must be positive
ALTER TABLE "QuotationItem" DROP CONSTRAINT IF EXISTS chk_quotation_item_requested_qty;
ALTER TABLE "QuotationItem" ADD CONSTRAINT chk_quotation_item_requested_qty
    CHECK ("requestedQuantity" > 0);

COMMENT ON CONSTRAINT chk_quotation_item_requested_qty ON "QuotationItem" IS
'[CHK-007] Requested quantity must be > 0.
Error: 23514 check_violation
Backend should catch and return: "Requested quantity must be greater than zero"';

-- Quoted price and quantity must be non-negative if specified
ALTER TABLE "QuotationItem" DROP CONSTRAINT IF EXISTS chk_quotation_item_quoted_values;
ALTER TABLE "QuotationItem" ADD CONSTRAINT chk_quotation_item_quoted_values
    CHECK (
        ("quotedPrice" IS NULL OR "quotedPrice" >= 0)
        AND ("quotedQuantity" IS NULL OR "quotedQuantity" > 0)
    );

COMMENT ON CONSTRAINT chk_quotation_item_quoted_values ON "QuotationItem" IS
'[CHK-008] Quoted values must be valid: price >= 0, quantity > 0.
Error: 23514 check_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.4: PURCHASE ORDER CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

-- Total value must be non-negative
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT IF EXISTS chk_purchase_order_value;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT chk_purchase_order_value
    CHECK ("totalValue" >= 0);

COMMENT ON CONSTRAINT chk_purchase_order_value ON "PurchaseOrder" IS
'[CHK-009] Purchase order total must be >= 0.
Error: 23514 check_violation';

-- Purchase Order Item constraints
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS chk_po_item_quantity;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT chk_po_item_quantity
    CHECK (quantity > 0);

ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS chk_po_item_prices;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT chk_po_item_prices
    CHECK ("unitPrice" >= 0 AND "totalPrice" >= 0);

ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS chk_po_item_received;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT chk_po_item_received
    CHECK ("receivedQuantity" IS NULL OR "receivedQuantity" >= 0);

COMMENT ON CONSTRAINT chk_po_item_quantity ON "PurchaseOrderItem" IS
'[CHK-010] PO item quantity must be > 0.
Error: 23514 check_violation';

COMMENT ON CONSTRAINT chk_po_item_prices ON "PurchaseOrderItem" IS
'[CHK-011] PO item prices must be >= 0.
Error: 23514 check_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.5: COST CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

-- Cost amount must be non-negative (it's an expense, not income)
ALTER TABLE "Cost" DROP CONSTRAINT IF EXISTS chk_cost_amount_non_negative;
ALTER TABLE "Cost" ADD CONSTRAINT chk_cost_amount_non_negative
    CHECK (amount >= 0);

COMMENT ON CONSTRAINT chk_cost_amount_non_negative ON "Cost" IS
'[CHK-012] Cost amount must be >= 0.
Error: 23514 check_violation
Backend should catch and return: "Cost amount cannot be negative"';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.6: AUTO-QUOTE REQUEST CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS chk_autoquote_quantities;
ALTER TABLE "AutoQuoteRequest" ADD CONSTRAINT chk_autoquote_quantities
    CHECK (
        "requestedQuantity" > 0
        AND ("currentStock" IS NULL OR "currentStock" >= 0)
        AND ("minStock" IS NULL OR "minStock" >= 0)
    );

ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS chk_autoquote_ai_confidence;
ALTER TABLE "AutoQuoteRequest" ADD CONSTRAINT chk_autoquote_ai_confidence
    CHECK ("aiConfidence" IS NULL OR ("aiConfidence" >= 0 AND "aiConfidence" <= 1));

COMMENT ON CONSTRAINT chk_autoquote_quantities ON "AutoQuoteRequest" IS
'[CHK-013] Auto-quote quantities must be valid: requested > 0, stock >= 0.
Error: 23514 check_violation';

COMMENT ON CONSTRAINT chk_autoquote_ai_confidence ON "AutoQuoteRequest" IS
'[CHK-014] AI confidence must be between 0 and 1.
Error: 23514 check_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.7: ORDER CARD CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "OrderCard" DROP CONSTRAINT IF EXISTS chk_ordercard_value;
ALTER TABLE "OrderCard" ADD CONSTRAINT chk_ordercard_value
    CHECK ("totalValue" >= 0);

COMMENT ON CONSTRAINT chk_ordercard_value ON "OrderCard" IS
'[CHK-015] Order card total value must be >= 0.
Error: 23514 check_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.8: RECIPE CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS chk_recipe_servings;
ALTER TABLE "Recipe" ADD CONSTRAINT chk_recipe_servings
    CHECK ("servings" IS NULL OR "servings" > 0);

ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS chk_recipe_times;
ALTER TABLE "Recipe" ADD CONSTRAINT chk_recipe_times
    CHECK (
        ("prepTime" IS NULL OR "prepTime" >= 0)
        AND ("cookTime" IS NULL OR "cookTime" >= 0)
        AND ("totalTime" IS NULL OR "totalTime" >= 0)
    );

COMMENT ON CONSTRAINT chk_recipe_servings ON "Recipe" IS
'[CHK-016] Recipe servings must be > 0 if specified.
Error: 23514 check_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.9: RECIPE INGREDIENT CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "RecipeIngredient" DROP CONSTRAINT IF EXISTS chk_recipe_ingredient_qty;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT chk_recipe_ingredient_qty
    CHECK (quantity > 0);

COMMENT ON CONSTRAINT chk_recipe_ingredient_qty ON "RecipeIngredient" IS
'[CHK-017] Recipe ingredient quantity must be > 0.
Error: 23514 check_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2.10: DEMAND FORECAST CONSTRAINTS
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "DemandForecast" DROP CONSTRAINT IF EXISTS chk_forecast_confidence;
ALTER TABLE "DemandForecast" ADD CONSTRAINT chk_forecast_confidence
    CHECK (confidence >= 0 AND confidence <= 1);

ALTER TABLE "DemandForecast" DROP CONSTRAINT IF EXISTS chk_forecast_horizon;
ALTER TABLE "DemandForecast" ADD CONSTRAINT chk_forecast_horizon
    CHECK ("forecastHorizon" > 0);

COMMENT ON CONSTRAINT chk_forecast_confidence ON "DemandForecast" IS
'[CHK-018] Forecast confidence must be between 0 and 1.
Error: 23514 check_violation';


-- ═══════════════════════════════════════════════════════════════════════════
-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║              LAYER 3: EXCLUSION CONSTRAINTS (PostgreSQL Specialty)        ║
-- ║              Prevents overlapping time windows for same resource          ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
-- BENEFIT: Prevents duplicate active quotations to same supplier within time window.
-- Superior to unique indexes for time-based logic.
-- ERROR CODE: 23P01 (exclusion_violation)


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3.1: QUOTATION SUPPLIER TIME WINDOW
-- ───────────────────────────────────────────────────────────────────────────
-- Prevents sending multiple quotations to the same supplier within 24 hours

-- First, ensure we have the GiST index support for the columns
DROP INDEX IF EXISTS idx_quotation_gist_supplier_time;
CREATE INDEX idx_quotation_gist_supplier_time ON "Quotation" 
    USING GIST ("supplier_id", "createdAt");

-- Drop existing constraint if exists
ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS excl_quotation_supplier_daily;

-- Create exclusion constraint
-- Note: This requires all active quotations to same supplier be at least 24h apart
ALTER TABLE "Quotation" ADD CONSTRAINT excl_quotation_supplier_daily
    EXCLUDE USING GIST (
        "supplier_id" WITH =,
        tstzrange("createdAt", "createdAt" + interval '24 hours', '[)') WITH &&
    )
    WHERE (status IN ('PENDING', 'SENT', 'WAITING') AND "softDeleted" = false);

COMMENT ON CONSTRAINT excl_quotation_supplier_daily ON "Quotation" IS
'[EXCL-001] Prevents spam quotations to same supplier.
Only ONE active quotation (PENDING/SENT/WAITING) per supplier per 24-hour window.
Error: 23P01 exclusion_violation
Backend should catch and return: "A quotation to this supplier is already pending. Please wait 24 hours."';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3.2: AUTO-QUOTE REQUEST TIME WINDOW
-- ───────────────────────────────────────────────────────────────────────────
-- Prevents creating duplicate auto-quote requests for same product+supplier within 48h

DROP INDEX IF EXISTS idx_autoquote_gist_product_supplier_time;
CREATE INDEX idx_autoquote_gist_product_supplier_time ON "AutoQuoteRequest"
    USING GIST ("product_id", "supplier_id", "createdAt");

ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS excl_autoquote_product_supplier_window;

ALTER TABLE "AutoQuoteRequest" ADD CONSTRAINT excl_autoquote_product_supplier_window
    EXCLUDE USING GIST (
        "product_id" WITH =,
        "supplier_id" WITH =,
        tstzrange("createdAt", "createdAt" + interval '48 hours', '[)') WITH &&
    )
    WHERE (status IN ('PENDING', 'AWAITING', 'PROCESSING') AND "softDeleted" = false);

COMMENT ON CONSTRAINT excl_autoquote_product_supplier_window ON "AutoQuoteRequest" IS
'[EXCL-002] Prevents duplicate auto-quote requests.
Only ONE active request per (product, supplier) per 48-hour window.
Allows re-requesting after the window expires or status changes.
Error: 23P01 exclusion_violation
Backend should catch and return: "An active request for this product from this supplier already exists."';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3.3: RECEIVED STATUS COOLDOWN (Prevents spam after delivery)
-- ───────────────────────────────────────────────────────────────────────────
-- Prevents creating new requests for the same product+supplier if one was
-- received within the last 7 days. This avoids immediate re-triggering when
-- stock is still low after receiving partial quantities.

ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS excl_autoquote_received_cooldown;

ALTER TABLE "AutoQuoteRequest" ADD CONSTRAINT excl_autoquote_received_cooldown
    EXCLUDE USING GIST (
        "product_id" WITH =,
        "supplier_id" WITH =,
        tstzrange("createdAt", "createdAt" + interval '7 days', '[)') WITH &&
    )
    WHERE (status = 'RECEIVED' AND "softDeleted" = false);

COMMENT ON CONSTRAINT excl_autoquote_received_cooldown ON "AutoQuoteRequest" IS
'[EXCL-003] Prevents duplicate RECEIVED cards (user reported bug fix).
Only ONE received request per (product, supplier) per 7-day cooldown window.
This prevents spam cards when stock remains low after partial delivery.
Error: 23P01 exclusion_violation
Backend should catch and return: "A request for this product was recently received."';


-- ═══════════════════════════════════════════════════════════════════════════
-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║              LAYER 4: BULLETPROOF FOREIGN KEY ENFORCEMENT                 ║
-- ║              ON DELETE RESTRICT - Prevent orphaning                       ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
-- ═══════════════════════════════════════════════════════════════════════════
-- BENEFIT: Prevents accidental deletion of parent records with active children.
-- ERROR CODE: 23503 (foreign_key_violation)
-- 
-- STRATEGY:
-- - ON DELETE RESTRICT: Block deletion if children exist (safe default)
-- - ON DELETE CASCADE: Auto-delete children (only for 1:N ownership relationships)
-- - ON DELETE SET NULL: Orphan gracefully (only when parent is optional)


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.1: PRODUCT → SUPPLIER
-- ───────────────────────────────────────────────────────────────────────────
-- Cannot delete a Supplier who has Products

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS fk_product_supplier_restrict;
ALTER TABLE "Product" ADD CONSTRAINT fk_product_supplier_restrict
    FOREIGN KEY ("supplier_id") 
    REFERENCES "Supplier"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_product_supplier_restrict ON "Product" IS
'[FK-001] Prevents deletion of Supplier with linked Products.
Action: Soft-delete the supplier or reassign products first.
Error: 23503 foreign_key_violation
Backend should catch and return: "Cannot delete supplier: has X active products"';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.2: QUOTATION → SUPPLIER
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS fk_quotation_supplier_restrict;
ALTER TABLE "Quotation" ADD CONSTRAINT fk_quotation_supplier_restrict
    FOREIGN KEY ("supplier_id")
    REFERENCES "Supplier"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_quotation_supplier_restrict ON "Quotation" IS
'[FK-002] Prevents deletion of Supplier with Quotation history.
Action: Soft-delete the supplier instead.
Error: 23503 foreign_key_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.3: QUOTATION ITEM → QUOTATION & PRODUCT
-- ───────────────────────────────────────────────────────────────────────────
-- QuotationItem is owned by Quotation (CASCADE) but references Product (RESTRICT)

ALTER TABLE "QuotationItem" DROP CONSTRAINT IF EXISTS fk_quotation_item_quotation_cascade;
ALTER TABLE "QuotationItem" ADD CONSTRAINT fk_quotation_item_quotation_cascade
    FOREIGN KEY ("quotation_id")
    REFERENCES "Quotation"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "QuotationItem" DROP CONSTRAINT IF EXISTS fk_quotation_item_product_restrict;
ALTER TABLE "QuotationItem" ADD CONSTRAINT fk_quotation_item_product_restrict
    FOREIGN KEY ("product_id")
    REFERENCES "Product"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_quotation_item_quotation_cascade ON "QuotationItem" IS
'[FK-003] Deleting a Quotation auto-deletes its items (owned relationship).';

COMMENT ON CONSTRAINT fk_quotation_item_product_restrict ON "QuotationItem" IS
'[FK-004] Prevents deletion of Product referenced in quotations.
Error: 23503 foreign_key_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.4: PURCHASE ORDER → SUPPLIER
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "PurchaseOrder" DROP CONSTRAINT IF EXISTS fk_purchase_order_supplier_restrict;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT fk_purchase_order_supplier_restrict
    FOREIGN KEY ("supplier_id")
    REFERENCES "Supplier"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_purchase_order_supplier_restrict ON "PurchaseOrder" IS
'[FK-005] Prevents deletion of Supplier with purchase orders.
Error: 23503 foreign_key_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.5: PURCHASE ORDER ITEM → PURCHASE ORDER & PRODUCT
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS fk_po_item_order_cascade;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT fk_po_item_order_cascade
    FOREIGN KEY ("purchaseOrder_id")
    REFERENCES "PurchaseOrder"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS fk_po_item_product_restrict;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT fk_po_item_product_restrict
    FOREIGN KEY ("product_id")
    REFERENCES "Product"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_po_item_order_cascade ON "PurchaseOrderItem" IS
'[FK-006] Deleting a PurchaseOrder auto-deletes its items.';

COMMENT ON CONSTRAINT fk_po_item_product_restrict ON "PurchaseOrderItem" IS
'[FK-007] Prevents deletion of Product referenced in purchase orders.
Error: 23503 foreign_key_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.6: AUTO-QUOTE REQUEST → PRODUCT & SUPPLIER
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS fk_autoquote_product_restrict;
ALTER TABLE "AutoQuoteRequest" ADD CONSTRAINT fk_autoquote_product_restrict
    FOREIGN KEY ("product_id")
    REFERENCES "Product"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS fk_autoquote_supplier_restrict;
ALTER TABLE "AutoQuoteRequest" ADD CONSTRAINT fk_autoquote_supplier_restrict
    FOREIGN KEY ("supplier_id")
    REFERENCES "Supplier"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_autoquote_product_restrict ON "AutoQuoteRequest" IS
'[FK-008] Prevents deletion of Product with pending auto-quote requests.
Error: 23503 foreign_key_violation';

COMMENT ON CONSTRAINT fk_autoquote_supplier_restrict ON "AutoQuoteRequest" IS
'[FK-009] Prevents deletion of Supplier with pending auto-quote requests.
Error: 23503 foreign_key_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.7: ORDER CARD → SUPPLIER
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "OrderCard" DROP CONSTRAINT IF EXISTS fk_ordercard_supplier_restrict;
ALTER TABLE "OrderCard" ADD CONSTRAINT fk_ordercard_supplier_restrict
    FOREIGN KEY ("supplier_id")
    REFERENCES "Supplier"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_ordercard_supplier_restrict ON "OrderCard" IS
'[FK-010] Prevents deletion of Supplier with order cards.
Error: 23503 foreign_key_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.8: PRODUCT MOVEMENT → PRODUCT
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "ProductMovement" DROP CONSTRAINT IF EXISTS fk_movement_product_restrict;
ALTER TABLE "ProductMovement" ADD CONSTRAINT fk_movement_product_restrict
    FOREIGN KEY ("product_id")
    REFERENCES "Product"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_movement_product_restrict ON "ProductMovement" IS
'[FK-011] Prevents deletion of Product with movement history (audit trail).
Error: 23503 foreign_key_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.9: COST → SUPPLIER (Optional relationship)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "Cost" DROP CONSTRAINT IF EXISTS fk_cost_supplier_set_null;
ALTER TABLE "Cost" ADD CONSTRAINT fk_cost_supplier_set_null
    FOREIGN KEY ("supplier_id")
    REFERENCES "Supplier"(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_cost_supplier_set_null ON "Cost" IS
'[FK-012] Supplier is optional for costs. Deletion sets to NULL.
This is SET NULL (not RESTRICT) because costs can exist without supplier.';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.10: RECIPE INGREDIENTS → RECIPE & PRODUCT
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "RecipeIngredient" DROP CONSTRAINT IF EXISTS fk_recipe_ingredient_recipe_cascade;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT fk_recipe_ingredient_recipe_cascade
    FOREIGN KEY ("recipe_id")
    REFERENCES "Recipe"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "RecipeIngredient" DROP CONSTRAINT IF EXISTS fk_recipe_ingredient_product_set_null;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT fk_recipe_ingredient_product_set_null
    FOREIGN KEY ("product_id")
    REFERENCES "Product"(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_recipe_ingredient_recipe_cascade ON "RecipeIngredient" IS
'[FK-013] Deleting a Recipe auto-deletes its ingredients.';

COMMENT ON CONSTRAINT fk_recipe_ingredient_product_set_null ON "RecipeIngredient" IS
'[FK-014] Product is optional for ingredients. Deletion sets to NULL.
Recipe can still exist with manual ingredient names.';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.11: RECIPE INSTRUCTIONS → RECIPE
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "RecipeInstruction" DROP CONSTRAINT IF EXISTS fk_recipe_instruction_recipe_cascade;
ALTER TABLE "RecipeInstruction" ADD CONSTRAINT fk_recipe_instruction_recipe_cascade
    FOREIGN KEY ("recipe_id")
    REFERENCES "Recipe"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_recipe_instruction_recipe_cascade ON "RecipeInstruction" IS
'[FK-015] Deleting a Recipe auto-deletes its instructions.';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.12: STOCK SNAPSHOT → PRODUCT
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "StockSnapshot" DROP CONSTRAINT IF EXISTS fk_snapshot_product_restrict;
ALTER TABLE "StockSnapshot" ADD CONSTRAINT fk_snapshot_product_restrict
    FOREIGN KEY ("product_id")
    REFERENCES "Product"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_snapshot_product_restrict ON "StockSnapshot" IS
'[FK-016] Prevents deletion of Product with snapshot history (time travel).
Error: 23503 foreign_key_violation';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.13: DEMAND FORECAST → PRODUCT
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "DemandForecast" DROP CONSTRAINT IF EXISTS fk_forecast_product_cascade;
ALTER TABLE "DemandForecast" ADD CONSTRAINT fk_forecast_product_cascade
    FOREIGN KEY ("product_id")
    REFERENCES "Product"(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_forecast_product_cascade ON "DemandForecast" IS
'[FK-017] Deleting a Product auto-deletes its forecasts.
Forecasts are derived data, safe to delete.';


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4.14: KANBAN TASK → RECIPE (Optional)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "KanbanTask" DROP CONSTRAINT IF EXISTS fk_kanban_recipe_set_null;
ALTER TABLE "KanbanTask" ADD CONSTRAINT fk_kanban_recipe_set_null
    FOREIGN KEY ("recipe_id")
    REFERENCES "Recipe"(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_kanban_recipe_set_null ON "KanbanTask" IS
'[FK-018] Recipe is optional for tasks. Deletion sets to NULL.';


COMMIT;


-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- List all triggers created by this script
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trg_sanitize_%'
ORDER BY event_object_table;

-- List all CHECK constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE 'chk_%'
ORDER BY tc.table_name, tc.constraint_name;

-- List all FOREIGN KEY constraints with actions
SELECT
    tc.table_name AS child_table,
    kcu.column_name AS child_column,
    ccu.table_name AS parent_table,
    ccu.column_name AS parent_column,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name LIKE 'fk_%'
ORDER BY child_table;

-- List EXCLUSION constraints
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'x'
ORDER BY conrelid::regclass::text;


-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK SCRIPT (Emergency Use Only)
-- ═══════════════════════════════════════════════════════════════════════════
/*
-- Run this block to remove all self-healing constraints:

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_sanitize_supplier ON "Supplier";
DROP TRIGGER IF EXISTS trg_sanitize_product ON "Product";
DROP TRIGGER IF EXISTS trg_sanitize_purchase_order ON "PurchaseOrder";
DROP TRIGGER IF EXISTS trg_sanitize_cost_category ON "CostCategory";
DROP TRIGGER IF EXISTS trg_sanitize_inventory_category ON "InventoryCategory";
DROP TRIGGER IF EXISTS trg_sanitize_recipe_category ON "RecipeCategory";
DROP TRIGGER IF EXISTS trg_sanitize_recipe ON "Recipe";

-- Drop functions
DROP FUNCTION IF EXISTS sanitize_supplier();
DROP FUNCTION IF EXISTS sanitize_product();
DROP FUNCTION IF EXISTS sanitize_purchase_order();
DROP FUNCTION IF EXISTS sanitize_category_name();
DROP FUNCTION IF EXISTS sanitize_recipe();

-- Drop CHECK constraints
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS chk_product_price_non_negative;
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS chk_product_total_cost_non_negative;
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS chk_product_stock_bounds;
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS chk_product_package_quantity;
ALTER TABLE "ProductMovement" DROP CONSTRAINT IF EXISTS chk_movement_quantity_positive;
ALTER TABLE "ProductMovement" DROP CONSTRAINT IF EXISTS chk_movement_price_non_negative;
ALTER TABLE "QuotationItem" DROP CONSTRAINT IF EXISTS chk_quotation_item_requested_qty;
ALTER TABLE "QuotationItem" DROP CONSTRAINT IF EXISTS chk_quotation_item_quoted_values;
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT IF EXISTS chk_purchase_order_value;
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS chk_po_item_quantity;
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS chk_po_item_prices;
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT IF EXISTS chk_po_item_received;
ALTER TABLE "Cost" DROP CONSTRAINT IF EXISTS chk_cost_amount_non_negative;
ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS chk_autoquote_quantities;
ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS chk_autoquote_ai_confidence;
ALTER TABLE "OrderCard" DROP CONSTRAINT IF EXISTS chk_ordercard_value;
ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS chk_recipe_servings;
ALTER TABLE "Recipe" DROP CONSTRAINT IF EXISTS chk_recipe_times;
ALTER TABLE "RecipeIngredient" DROP CONSTRAINT IF EXISTS chk_recipe_ingredient_qty;
ALTER TABLE "DemandForecast" DROP CONSTRAINT IF EXISTS chk_forecast_confidence;
ALTER TABLE "DemandForecast" DROP CONSTRAINT IF EXISTS chk_forecast_horizon;

-- Drop EXCLUSION constraints
ALTER TABLE "Quotation" DROP CONSTRAINT IF EXISTS excl_quotation_supplier_daily;
ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS excl_autoquote_product_supplier_window;
ALTER TABLE "AutoQuoteRequest" DROP CONSTRAINT IF EXISTS excl_autoquote_received_cooldown;

-- Drop GiST indexes
DROP INDEX IF EXISTS idx_quotation_gist_supplier_time;
DROP INDEX IF EXISTS idx_autoquote_gist_product_supplier_time;

-- Note: FK constraints should be evaluated carefully before dropping
-- as they may break referential integrity

COMMIT;
*/
