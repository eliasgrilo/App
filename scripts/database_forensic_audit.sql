-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PADOCA DATABASE FORENSIC AUDIT - DEEP SCAN                                   ║
-- ║  Firebase Data Connect / PostgreSQL Backend                                    ║
-- ║  Generated: 2026-01-01 | Author: DBRE Forensic Module                         ║
-- ║  FIXED: Column names now use camelCase to match schema.gql                    ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ══════════════════════════════════════════════════════════════════════════════════
-- SECTION 1: THE DUPLICATE HUNTER (Fuzzy Matching)
-- ══════════════════════════════════════════════════════════════════════════════════

-- 1.1 SUPPLIER DUPLICATE DETECTION (Name)
SELECT 
    'SUPPLIER_NAME_DUPLICATE' AS violation_type,
    LOWER(TRIM(name)) AS normalized_name,
    ARRAY_AGG(id ORDER BY "createdAt") AS duplicate_ids,
    ARRAY_AGG(name ORDER BY "createdAt") AS original_names,
    COUNT(*) AS occurrence_count
FROM "Supplier"
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;

-- 1.2 SUPPLIER DUPLICATE DETECTION (CNPJ)
SELECT 
    'SUPPLIER_CNPJ_DUPLICATE' AS violation_type,
    REGEXP_REPLACE(LOWER(TRIM(cnpj)), '[^0-9]', '', 'g') AS normalized_cnpj,
    ARRAY_AGG(id ORDER BY "createdAt") AS duplicate_ids,
    ARRAY_AGG(name ORDER BY "createdAt") AS supplier_names,
    COUNT(*) AS occurrence_count
FROM "Supplier"
WHERE cnpj IS NOT NULL AND TRIM(cnpj) <> ''
GROUP BY REGEXP_REPLACE(LOWER(TRIM(cnpj)), '[^0-9]', '', 'g')
HAVING COUNT(*) > 1;

-- 1.3 SUPPLIER DUPLICATE DETECTION (Email)
SELECT 
    'SUPPLIER_EMAIL_DUPLICATE' AS violation_type,
    LOWER(TRIM(email)) AS normalized_email,
    ARRAY_AGG(id ORDER BY "createdAt") AS duplicate_ids,
    ARRAY_AGG(name ORDER BY "createdAt") AS supplier_names,
    COUNT(*) AS occurrence_count
FROM "Supplier"
WHERE email IS NOT NULL AND TRIM(email) <> ''
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;

-- 1.4 PRODUCT DUPLICATE DETECTION (Same name within same supplier)
SELECT 
    'PRODUCT_COMPOSITE_DUPLICATE' AS violation_type,
    s.name AS supplier_name,
    LOWER(TRIM(p.name)) AS normalized_product_name,
    ARRAY_AGG(p.id ORDER BY p."createdAt") AS duplicate_ids,
    ARRAY_AGG(p.name ORDER BY p."createdAt") AS original_names,
    COUNT(*) AS occurrence_count
FROM "Product" p
LEFT JOIN "Supplier" s ON p."supplier_id" = s.id
GROUP BY s.id, s.name, LOWER(TRIM(p.name))
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;

-- 1.5 PRODUCT GLOBAL NAME DUPLICATES
SELECT 
    'PRODUCT_NAME_DUPLICATE' AS violation_type,
    LOWER(TRIM(name)) AS normalized_name,
    ARRAY_AGG(id ORDER BY "createdAt") AS duplicate_ids,
    ARRAY_AGG(name ORDER BY "createdAt") AS original_names,
    COUNT(*) AS occurrence_count
FROM "Product"
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;

-- 1.6 QUOTATION ITEM DUPLICATE (Same product in same quotation)
SELECT 
    'QUOTATION_ITEM_DUPLICATE' AS violation_type,
    qi."quotation_id",
    qi."product_id",
    p.name AS product_name,
    ARRAY_AGG(qi.id) AS duplicate_ids,
    COUNT(*) AS occurrence_count
FROM "QuotationItem" qi
JOIN "Product" p ON qi."product_id" = p.id
GROUP BY qi."quotation_id", qi."product_id", p.name
HAVING COUNT(*) > 1;

-- 1.7 AUTO-QUOTE REQUEST DUPLICATE (Same deduplication key) - INCLUDES ALL STATUSES
SELECT 
    'AUTOQUOTE_DEDUP_DUPLICATE' AS violation_type,
    "deduplicationKey",
    status,
    ARRAY_AGG(id ORDER BY "createdAt") AS duplicate_ids,
    COUNT(*) AS occurrence_count
FROM "AutoQuoteRequest"
WHERE "softDeleted" = false
GROUP BY "deduplicationKey", status
HAVING COUNT(*) > 1;

-- 1.8 AUTO-QUOTE REQUEST - DUPLICATES IN RECEIVED STATUS (USER REPORTED ISSUE)
SELECT 
    'AUTOQUOTE_RECEIVED_DUPLICATE' AS violation_type,
    "product_id",
    "supplier_id",
    ARRAY_AGG(id ORDER BY "createdAt") AS duplicate_ids,
    ARRAY_AGG("requestId" ORDER BY "createdAt") AS request_ids,
    COUNT(*) AS occurrence_count
FROM "AutoQuoteRequest"
WHERE status = 'RECEIVED' AND "softDeleted" = false
GROUP BY "product_id", "supplier_id"
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;

-- 1.9 ORDER CARD DUPLICATE (Same requestId - should never happen)
SELECT 
    'ORDERCARD_REQUESTID_DUPLICATE' AS violation_type,
    "requestId",
    ARRAY_AGG(id ORDER BY "createdAt") AS duplicate_ids,
    COUNT(*) AS occurrence_count
FROM "OrderCard"
WHERE "softDeleted" = false
GROUP BY "requestId"
HAVING COUNT(*) > 1;

-- 1.10 ORDER CARD - DUPLICATES FOR SAME SUPPLIER (Possible spam)
SELECT 
    'ORDERCARD_SUPPLIER_DUPLICATE' AS violation_type,
    "supplier_id",
    s.name AS supplier_name,
    DATE("createdAt") AS order_date,
    ARRAY_AGG(id ORDER BY "createdAt") AS duplicate_ids,
    COUNT(*) AS occurrence_count
FROM "OrderCard" oc
LEFT JOIN "Supplier" s ON oc."supplier_id" = s.id
WHERE oc."softDeleted" = false
GROUP BY oc."supplier_id", s.name, DATE(oc."createdAt")
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC;


-- ══════════════════════════════════════════════════════════════════════════════════
-- SECTION 2: ORPHAN DETECTION (Referential Integrity)
-- ══════════════════════════════════════════════════════════════════════════════════

-- 2.1 PRODUCTS referencing non-existent SUPPLIERS
SELECT 
    'ORPHAN_PRODUCT_SUPPLIER' AS violation_type,
    p.id AS orphan_product_id,
    p.name AS product_name,
    p."supplier_id" AS missing_supplier_id
FROM "Product" p
LEFT JOIN "Supplier" s ON p."supplier_id" = s.id
WHERE p."supplier_id" IS NOT NULL AND s.id IS NULL;

-- 2.2 QUOTATIONS referencing non-existent SUPPLIERS
SELECT 
    'ORPHAN_QUOTATION_SUPPLIER' AS violation_type,
    q.id AS orphan_quotation_id,
    q.status,
    q."supplier_id" AS missing_supplier_id
FROM "Quotation" q
LEFT JOIN "Supplier" s ON q."supplier_id" = s.id
WHERE s.id IS NULL;

-- 2.3 QUOTATION ITEMS referencing non-existent QUOTATIONS
SELECT 
    'ORPHAN_QUOTATION_ITEM_QUOTATION' AS violation_type,
    qi.id AS orphan_item_id,
    qi."quotation_id" AS missing_quotation_id
FROM "QuotationItem" qi
LEFT JOIN "Quotation" q ON qi."quotation_id" = q.id
WHERE q.id IS NULL;

-- 2.4 QUOTATION ITEMS referencing non-existent PRODUCTS
SELECT 
    'ORPHAN_QUOTATION_ITEM_PRODUCT' AS violation_type,
    qi.id AS orphan_item_id,
    qi."product_id" AS missing_product_id
FROM "QuotationItem" qi
LEFT JOIN "Product" p ON qi."product_id" = p.id
WHERE p.id IS NULL;

-- 2.5 AUTO-QUOTE REQUESTS referencing non-existent PRODUCTS
SELECT 
    'ORPHAN_AUTOQUOTE_PRODUCT' AS violation_type,
    aqr.id AS orphan_request_id,
    aqr."requestId",
    aqr."product_id" AS missing_product_id
FROM "AutoQuoteRequest" aqr
LEFT JOIN "Product" p ON aqr."product_id" = p.id
WHERE p.id IS NULL;

-- 2.6 AUTO-QUOTE REQUESTS referencing non-existent SUPPLIERS
SELECT 
    'ORPHAN_AUTOQUOTE_SUPPLIER' AS violation_type,
    aqr.id AS orphan_request_id,
    aqr."requestId",
    aqr."supplier_id" AS missing_supplier_id
FROM "AutoQuoteRequest" aqr
LEFT JOIN "Supplier" s ON aqr."supplier_id" = s.id
WHERE s.id IS NULL;

-- 2.7 ORDER CARDS referencing non-existent SUPPLIERS
SELECT 
    'ORPHAN_ORDERCARD_SUPPLIER' AS violation_type,
    oc.id AS orphan_order_id,
    oc."requestId",
    oc."supplier_id" AS missing_supplier_id
FROM "OrderCard" oc
LEFT JOIN "Supplier" s ON oc."supplier_id" = s.id
WHERE s.id IS NULL;

-- 2.8 PRODUCT MOVEMENTS referencing non-existent PRODUCTS
SELECT 
    'ORPHAN_MOVEMENT_PRODUCT' AS violation_type,
    pm.id AS orphan_movement_id,
    pm."product_id" AS missing_product_id,
    pm.quantity,
    pm."createdAt"
FROM "ProductMovement" pm
LEFT JOIN "Product" p ON pm."product_id" = p.id
WHERE p.id IS NULL;

-- 2.9 RECIPE INGREDIENTS referencing non-existent RECIPES
SELECT 
    'ORPHAN_RECIPE_INGREDIENT' AS violation_type,
    ri.id AS orphan_ingredient_id,
    ri."recipe_id" AS missing_recipe_id
FROM "RecipeIngredient" ri
LEFT JOIN "Recipe" r ON ri."recipe_id" = r.id
WHERE r.id IS NULL;

-- 2.10 PURCHASE ORDER ITEMS referencing non-existent ORDERS
SELECT 
    'ORPHAN_PO_ITEM' AS violation_type,
    poi.id AS orphan_item_id,
    poi."purchaseOrder_id" AS missing_order_id
FROM "PurchaseOrderItem" poi
LEFT JOIN "PurchaseOrder" po ON poi."purchaseOrder_id" = po.id
WHERE po.id IS NULL;


-- ══════════════════════════════════════════════════════════════════════════════════
-- SECTION 3: SCHEMA HEALTH & NULL SAFETY
-- ══════════════════════════════════════════════════════════════════════════════════

-- 3.1 PRODUCTS with NULL/empty names (CRITICAL)
SELECT 
    'NULL_CRITICAL_PRODUCT' AS violation_type,
    id,
    name,
    'name is null/empty' AS null_field
FROM "Product"
WHERE name IS NULL OR TRIM(name) = '';

-- 3.2 SUPPLIERS with NULL/empty names (CRITICAL)
SELECT 
    'NULL_CRITICAL_SUPPLIER' AS violation_type,
    id,
    'name is null/empty' AS null_field
FROM "Supplier"
WHERE name IS NULL OR TRIM(name) = '';

-- 3.3 AUTO-QUOTE REQUESTS missing required fields
SELECT 
    'NULL_CRITICAL_AUTOQUOTE' AS violation_type,
    id,
    "requestId",
    CASE 
        WHEN "requestId" IS NULL THEN 'requestId'
        WHEN "deduplicationKey" IS NULL THEN 'deduplicationKey'
        WHEN "product_id" IS NULL THEN 'product_id'
        WHEN "supplier_id" IS NULL THEN 'supplier_id'
    END AS null_field
FROM "AutoQuoteRequest"
WHERE "requestId" IS NULL 
   OR "deduplicationKey" IS NULL 
   OR "product_id" IS NULL 
   OR "supplier_id" IS NULL;

-- 3.4 ORDER CARDS missing required fields
SELECT 
    'NULL_CRITICAL_ORDERCARD' AS violation_type,
    id,
    "requestId",
    CASE 
        WHEN "requestId" IS NULL THEN 'requestId'
        WHEN "supplier_id" IS NULL THEN 'supplier_id'
        WHEN items IS NULL THEN 'items'
    END AS null_field
FROM "OrderCard"
WHERE "requestId" IS NULL OR "supplier_id" IS NULL OR items IS NULL;

-- 3.5 INDEX HEALTH CHECK
SELECT 
    'INDEX_STATUS' AS check_type,
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS times_used,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'RARELY_USED'
        ELSE 'ACTIVE'
    END AS health_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- 3.6 INVALID INDEXES
SELECT 
    'INVALID_INDEX' AS violation_type,
    indexrelid::regclass AS index_name,
    indrelid::regclass AS table_name
FROM pg_index
WHERE NOT indisvalid;

-- 3.7 BLOATED TABLES DETECTION
SELECT 
    'TABLE_BLOAT' AS check_type,
    relname AS table_name,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    CASE WHEN n_live_tup > 0 
        THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2) 
        ELSE 0 
    END AS dead_percentage,
    CASE 
        WHEN n_live_tup > 0 AND (100.0 * n_dead_tup / n_live_tup) > 20 THEN 'CRITICAL'
        WHEN n_live_tup > 0 AND (100.0 * n_dead_tup / n_live_tup) > 10 THEN 'WARNING'
        ELSE 'OK'
    END AS status
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND n_dead_tup > 0
ORDER BY dead_percentage DESC;


-- ══════════════════════════════════════════════════════════════════════════════════
-- SECTION 4: FIREBASE COMPATIBILITY CHECK
-- ══════════════════════════════════════════════════════════════════════════════════

-- 4.1 PRIMARY KEY TYPE VALIDATION
SELECT 
    'NON_UUID_PRIMARY_KEY' AS violation_type,
    c.table_name,
    c.column_name,
    c.data_type
FROM information_schema.columns c
JOIN information_schema.table_constraints tc 
    ON c.table_name = tc.table_name AND tc.constraint_type = 'PRIMARY KEY'
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name AND c.column_name = kcu.column_name
WHERE c.table_schema = 'public'
    AND c.data_type <> 'uuid';

-- 4.2 ZOMBIE PRODUCTS (empty name/unit)
SELECT 
    'ZOMBIE_PRODUCT' AS violation_type,
    id,
    name,
    "createdAt",
    CASE 
        WHEN name IS NULL OR TRIM(name) = '' THEN 'empty_name'
        WHEN unit IS NULL OR TRIM(unit) = '' THEN 'missing_unit'
    END AS zombie_reason
FROM "Product"
WHERE (name IS NULL OR TRIM(name) = '')
   OR (unit IS NULL OR TRIM(unit) = '');

-- 4.3 ZOMBIE SUPPLIERS (autoRequest=true but no email)
SELECT 
    'ZOMBIE_SUPPLIER' AS violation_type,
    id,
    name,
    "autoRequest",
    "createdAt"
FROM "Supplier"
WHERE "autoRequest" = true 
  AND (email IS NULL OR TRIM(email) = '');

-- 4.4 ZOMBIE AUTO-QUOTE (invalid state transitions)
SELECT 
    'ZOMBIE_AUTOQUOTE' AS violation_type,
    id,
    "requestId",
    status,
    "emailSentAt",
    "createdAt",
    CASE 
        WHEN status = 'AWAITING' AND "emailSentAt" IS NULL THEN 'awaiting_no_email'
        WHEN status = 'ORDERED' AND "orderId" IS NULL THEN 'ordered_no_orderid'
        WHEN status = 'PROCESSING' AND "aiRawResponse" IS NULL THEN 'processing_no_ai'
    END AS zombie_reason
FROM "AutoQuoteRequest"
WHERE (status = 'AWAITING' AND "emailSentAt" IS NULL)
   OR (status = 'ORDERED' AND "orderId" IS NULL)
   OR (status = 'PROCESSING' AND "aiRawResponse" IS NULL);

-- 4.5 FUTURE TIMESTAMPS
SELECT 'FUTURE_TIMESTAMP' AS violation_type, 'Product' AS tbl, id, "createdAt"
FROM "Product" WHERE "createdAt" > NOW()
UNION ALL
SELECT 'FUTURE_TIMESTAMP', 'Supplier', id, "createdAt"
FROM "Supplier" WHERE "createdAt" > NOW()
UNION ALL
SELECT 'FUTURE_TIMESTAMP', 'AutoQuoteRequest', id, "createdAt"
FROM "AutoQuoteRequest" WHERE "createdAt" > NOW();

-- 4.6 NEGATIVE VALUES
SELECT 'NEGATIVE_VALUE' AS violation_type, 'Product.pricePerUnit' AS field, id, "pricePerUnit" AS val
FROM "Product" WHERE "pricePerUnit" < 0
UNION ALL
SELECT 'NEGATIVE_VALUE', 'QuotationItem.requestedQuantity', id, "requestedQuantity"
FROM "QuotationItem" WHERE "requestedQuantity" < 0
UNION ALL
SELECT 'NEGATIVE_VALUE', 'AutoQuoteRequest.requestedQuantity', id, "requestedQuantity"
FROM "AutoQuoteRequest" WHERE "requestedQuantity" < 0;


-- ══════════════════════════════════════════════════════════════════════════════════
-- SECTION 5: DUPLICATE CLEANUP QUERIES (RUN WITH CAUTION)
-- ══════════════════════════════════════════════════════════════════════════════════

-- 5.1 IDENTIFY DUPLICATES IN RECEIVED STATUS (Keep oldest, mark others for deletion)
WITH duplicates AS (
    SELECT 
        id,
        "requestId",
        "product_id",
        "supplier_id",
        status,
        "createdAt",
        ROW_NUMBER() OVER (
            PARTITION BY "product_id", "supplier_id" 
            ORDER BY "createdAt" ASC
        ) AS rn
    FROM "AutoQuoteRequest"
    WHERE status = 'RECEIVED' AND "softDeleted" = false
)
SELECT 
    id AS duplicate_to_softdelete,
    "requestId",
    "product_id",
    "supplier_id",
    "createdAt"
FROM duplicates
WHERE rn > 1;

-- 5.2 SOFT DELETE DUPLICATE RECEIVED REQUESTS (UNCOMMENT TO EXECUTE)
/*
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "product_id", "supplier_id" 
            ORDER BY "createdAt" ASC
        ) AS rn
    FROM "AutoQuoteRequest"
    WHERE status = 'RECEIVED' AND "softDeleted" = false
)
UPDATE "AutoQuoteRequest"
SET 
    "softDeleted" = true,
    "deletedAt" = NOW(),
    "deletedReason" = 'Duplicate cleanup - kept oldest record'
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
*/


-- ══════════════════════════════════════════════════════════════════════════════════
-- SUMMARY REPORT
-- ══════════════════════════════════════════════════════════════════════════════════

WITH violations AS (
    SELECT 'duplicate_supplier_name' AS cat, COUNT(*) AS cnt
    FROM (SELECT 1 FROM "Supplier" GROUP BY LOWER(TRIM(name)) HAVING COUNT(*) > 1) x
    UNION ALL
    SELECT 'duplicate_product_name', COUNT(*)
    FROM (SELECT 1 FROM "Product" GROUP BY LOWER(TRIM(name)) HAVING COUNT(*) > 1) x
    UNION ALL
    SELECT 'duplicate_autoquote_received', COUNT(*)
    FROM (
        SELECT 1 FROM "AutoQuoteRequest" 
        WHERE status = 'RECEIVED' AND "softDeleted" = false
        GROUP BY "product_id", "supplier_id" 
        HAVING COUNT(*) > 1
    ) x
    UNION ALL
    SELECT 'orphan_products', COUNT(*)
    FROM "Product" p LEFT JOIN "Supplier" s ON p."supplier_id" = s.id 
    WHERE p."supplier_id" IS NOT NULL AND s.id IS NULL
    UNION ALL
    SELECT 'orphan_quotation_items', COUNT(*)
    FROM "QuotationItem" qi LEFT JOIN "Quotation" q ON qi."quotation_id" = q.id WHERE q.id IS NULL
)
SELECT 
    cat AS violation_category,
    cnt AS violation_count,
    CASE 
        WHEN cnt = 0 THEN 'CLEAN'
        WHEN cnt < 5 THEN 'MINOR'
        WHEN cnt < 20 THEN 'MODERATE'
        ELSE 'CRITICAL'
    END AS severity
FROM violations
WHERE cnt > 0
ORDER BY cnt DESC;
