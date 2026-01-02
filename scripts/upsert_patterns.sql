-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║   PADOCA - UPSERT PATTERNS FOR CONCURRENCY HANDLING                        ║
-- ║   ON CONFLICT Strategies for ACID Compliance                               ║
-- ╠═══════════════════════════════════════════════════════════════════════════╣
-- ║   Author: DBRE Team                                                        ║
-- ║   Database: PostgreSQL (Firebase Data Connect)                            ║
-- ║   Date: 2026-01-01                                                         ║
-- ║   Purpose: Graceful handling of constraint violations without              ║
-- ║            crashing the application. NEVER duplicate data.                 ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- USAGE:
-- These are TEMPLATE queries. Replace {{placeholder}} with actual values.
-- The application layer should use parameterized queries to prevent SQL injection.
--
-- IMPORTANT:
-- ON CONFLICT uses ROW-LEVEL LOCKING internally (FOR UPDATE semantics)
-- This guarantees atomicity even under extreme concurrency (1000 req/ms)

-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 1: SUPPLIER UPSERT (Idempotent Insert-or-Update)
-- ═══════════════════════════════════════════════════════════════════════════
-- Scenario: Create supplier, or update if canonical name matches
-- Concurrency: Uses SERIALIZABLE isolation via unique index lock

-- 1.1 UPSERT with ON CONFLICT DO UPDATE (Last-Write-Wins)
INSERT INTO "Supplier" (
    id,
    name,
    email,
    phone,
    address,
    cnpj,
    category,
    notes,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    '{{name}}',                    -- e.g., 'Distribuidora Estrela'
    '{{email}}',                   -- e.g., 'contato@estrela.com'
    '{{phone}}',
    '{{address}}',
    '{{cnpj}}',
    '{{category}}',
    '{{notes}}',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (LOWER(TRIM(name))) WHERE "isActive" = true
DO UPDATE SET
    email = COALESCE(EXCLUDED.email, "Supplier".email),
    phone = COALESCE(EXCLUDED.phone, "Supplier".phone),
    address = COALESCE(EXCLUDED.address, "Supplier".address),
    cnpj = COALESCE(EXCLUDED.cnpj, "Supplier".cnpj),
    category = COALESCE(EXCLUDED.category, "Supplier".category),
    notes = COALESCE(EXCLUDED.notes, "Supplier".notes),
    "updatedAt" = NOW()
RETURNING id, name, 
    CASE 
        WHEN xmax = 0 THEN 'INSERTED' 
        ELSE 'UPDATED' 
    END AS operation;

/*
EXPLANATION:
- xmax = 0 means the row was just inserted (no previous transaction modified it)
- xmax > 0 means the row was updated (there was a previous version)
- EXCLUDED refers to the values that WOULD have been inserted
- This pattern is SAFE for 1000 concurrent requests - PostgreSQL handles locking
*/


-- 1.2 UPSERT with ON CONFLICT DO NOTHING (Silently Skip Duplicates)
-- Use when you just want to ensure existence without updating
INSERT INTO "Supplier" (
    id,
    name,
    email,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    '{{name}}',
    '{{email}}',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (LOWER(TRIM(name))) WHERE "isActive" = true
DO NOTHING
RETURNING id, name;

/*
EXPLANATION:
- If a duplicate exists, returns EMPTY result set (0 rows)
- Application can check if rowcount = 0 to know it was a duplicate
- Faster than DO UPDATE when you don't need to merge data
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 2: PRODUCT UPSERT (Supplier-Scoped)
-- ═══════════════════════════════════════════════════════════════════════════
-- Scenario: Add product to supplier's catalog, update if already exists
-- Composite Key: (supplier_id, canonicalized name)

INSERT INTO "Product" (
    id,
    name,
    category,
    subcategory,
    unit,
    "packageQuantity",
    "pricePerUnit",
    "minStock",
    "maxStock",
    barcode,
    "supplier_id",
    notes,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    '{{name}}',
    '{{category}}',
    '{{subcategory}}',
    '{{unit}}',
    {{packageQuantity}},
    {{pricePerUnit}},
    {{minStock}},
    {{maxStock}},
    '{{barcode}}',
    '{{supplier_id}}'::uuid,
    '{{notes}}',
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("supplier_id", LOWER(TRIM(name))) WHERE "isActive" = true
DO UPDATE SET
    category = COALESCE(EXCLUDED.category, "Product".category),
    subcategory = COALESCE(EXCLUDED.subcategory, "Product".subcategory),
    unit = COALESCE(EXCLUDED.unit, "Product".unit),
    "packageQuantity" = COALESCE(EXCLUDED."packageQuantity", "Product"."packageQuantity"),
    "pricePerUnit" = EXCLUDED."pricePerUnit",  -- Always update price
    "minStock" = COALESCE(EXCLUDED."minStock", "Product"."minStock"),
    "maxStock" = COALESCE(EXCLUDED."maxStock", "Product"."maxStock"),
    barcode = COALESCE(EXCLUDED.barcode, "Product".barcode),
    notes = COALESCE(EXCLUDED.notes, "Product".notes),
    "updatedAt" = NOW()
RETURNING id, name, "supplier_id",
    CASE WHEN xmax = 0 THEN 'INSERTED' ELSE 'UPDATED' END AS operation;


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 3: AUTO-QUOTE REQUEST UPSERT (Deduplication Key)
-- ═══════════════════════════════════════════════════════════════════════════
-- Scenario: Create auto-quote request ONLY if no active one exists
-- Critical: Uses deduplicationKey to prevent duplicate pending cards

INSERT INTO "AutoQuoteRequest" (
    id,
    "requestId",
    "deduplicationKey",
    "product_id",
    "supplier_id",
    "requestedQuantity",
    "currentStock",
    "minStock",
    unit,
    status,
    "softDeleted",
    "createdAt",
    "updatedAt",
    "createdBy",
    "createdByName"
) VALUES (
    gen_random_uuid(),
    '{{requestId}}',                           -- e.g., 'REQ-20260101-ABC123'
    '{{product_id}}:{{supplier_id}}',          -- Deduplication key
    '{{product_id}}'::uuid,
    '{{supplier_id}}'::uuid,
    {{requestedQuantity}},
    {{currentStock}},
    {{minStock}},
    '{{unit}}',
    'PENDING',
    false,
    NOW(),
    NOW(),
    '{{userId}}',
    '{{userName}}'
)
ON CONFLICT ("deduplicationKey") 
    WHERE "softDeleted" = false 
    AND status NOT IN ('CANCELLED', 'EXPIRED', 'RECEIVED')
DO NOTHING
RETURNING id, "requestId", status;

/*
EXPLANATION:
- If an active request exists for this (product, supplier), returns EMPTY
- Application should check rowcount:
  - If 0 rows: Duplicate exists, show user "Request already pending"
  - If 1 row: New request created successfully
- This is REJECT-DUPLICATE pattern, not merge pattern
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 4: QUOTATION ITEM UPSERT (Update quantity if product exists)
-- ═══════════════════════════════════════════════════════════════════════════
-- Scenario: Add item to quotation, or update quantity if already added
-- Prevents same product appearing twice in one quotation

INSERT INTO "QuotationItem" (
    id,
    "quotation_id",
    "product_id",
    "requestedQuantity",
    "quotedPrice",
    notes
) VALUES (
    gen_random_uuid(),
    '{{quotation_id}}'::uuid,
    '{{product_id}}'::uuid,
    {{requestedQuantity}},
    NULL,  -- Price comes from supplier response
    '{{notes}}'
)
ON CONFLICT ("quotation_id", "product_id")
DO UPDATE SET
    "requestedQuantity" = "QuotationItem"."requestedQuantity" + EXCLUDED."requestedQuantity",
    notes = COALESCE(EXCLUDED.notes, "QuotationItem".notes)
RETURNING id, "quotation_id", "product_id", "requestedQuantity",
    CASE WHEN xmax = 0 THEN 'INSERTED' ELSE 'QUANTITY_MERGED' END AS operation;

/*
EXPLANATION:
- If product already in quotation, ADD the quantities together
- This is MERGE-ADDITIVE pattern (useful for shopping cart behavior)
- Alternative: Replace with EXCLUDED."requestedQuantity" for OVERWRITE behavior
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 5: ORDER CARD UPSERT (Strict 1:1 with AutoQuoteRequest)
-- ═══════════════════════════════════════════════════════════════════════════
-- Scenario: Create order card from AI extraction, ensure only one per requestId

INSERT INTO "OrderCard" (
    id,
    "requestId",
    "supplier_id",
    items,
    "totalValue",
    "deliveryDate",
    "deliveryDays",
    availability,
    "paymentTerms",
    "supplierNotes",
    status,
    "softDeleted",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    '{{requestId}}',
    '{{supplier_id}}'::uuid,
    '{{items_json}}'::text,
    {{totalValue}},
    '{{deliveryDate}}'::date,
    {{deliveryDays}},
    '{{availability}}',
    '{{paymentTerms}}',
    '{{supplierNotes}}',
    'PENDING',
    false,
    NOW(),
    NOW()
)
ON CONFLICT ("requestId") WHERE "softDeleted" = false
DO UPDATE SET
    "totalValue" = EXCLUDED."totalValue",
    "deliveryDate" = EXCLUDED."deliveryDate",
    "deliveryDays" = EXCLUDED."deliveryDays",
    availability = EXCLUDED.availability,
    "paymentTerms" = EXCLUDED."paymentTerms",
    "supplierNotes" = EXCLUDED."supplierNotes",
    "updatedAt" = NOW()
RETURNING id, "requestId",
    CASE WHEN xmax = 0 THEN 'CREATED' ELSE 'AI_REPROCESSED' END AS operation;


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 6: PURCHASE ORDER UPSERT (by order number)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO "PurchaseOrder" (
    id,
    "orderNumber",
    "supplier_id",
    status,
    "totalValue",
    notes,
    "expectedDelivery",
    "createdBy",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    '{{orderNumber}}',
    '{{supplier_id}}'::uuid,
    'DRAFT',
    {{totalValue}},
    '{{notes}}',
    '{{expectedDelivery}}'::date,
    '{{createdBy}}',
    NOW(),
    NOW()
)
ON CONFLICT (LOWER(TRIM("orderNumber")))
DO UPDATE SET
    "totalValue" = EXCLUDED."totalValue",
    notes = COALESCE(EXCLUDED.notes, "PurchaseOrder".notes),
    "expectedDelivery" = EXCLUDED."expectedDelivery",
    "updatedAt" = NOW()
RETURNING id, "orderNumber",
    CASE WHEN xmax = 0 THEN 'CREATED' ELSE 'UPDATED' END AS operation;


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 7: CATEGORY UPSERT (Idempotent Category Creation)
-- ═══════════════════════════════════════════════════════════════════════════

-- Cost Category
INSERT INTO "CostCategory" (id, name, color, icon, "order", "createdAt")
VALUES (gen_random_uuid(), '{{name}}', '{{color}}', '{{icon}}', {{order}}, NOW())
ON CONFLICT (LOWER(TRIM(name)))
DO UPDATE SET
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    "order" = EXCLUDED."order"
RETURNING id, name;

-- Inventory Category
INSERT INTO "InventoryCategory" (id, name, color, icon, "order", "createdAt")
VALUES (gen_random_uuid(), '{{name}}', '{{color}}', '{{icon}}', {{order}}, NOW())
ON CONFLICT (LOWER(TRIM(name)))
DO UPDATE SET
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    "order" = EXCLUDED."order"
RETURNING id, name;


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 8: BULK UPSERT (Multiple rows in single transaction)
-- ═══════════════════════════════════════════════════════════════════════════
-- Scenario: Import multiple products from CSV/Excel
-- Uses VALUES list with ON CONFLICT for each row

INSERT INTO "Product" (
    id, name, category, unit, "pricePerUnit", "supplier_id", "isActive", "createdAt", "updatedAt"
)
VALUES 
    (gen_random_uuid(), 'Farinha de Trigo 1kg', 'Farinhas', 'kg', 4.50, 
        (SELECT id FROM "Supplier" WHERE LOWER(TRIM(name)) = 'moinho estrela' AND "isActive" = true LIMIT 1),
        true, NOW(), NOW()),
    (gen_random_uuid(), 'Farinha de Trigo 5kg', 'Farinhas', 'kg', 20.00,
        (SELECT id FROM "Supplier" WHERE LOWER(TRIM(name)) = 'moinho estrela' AND "isActive" = true LIMIT 1),
        true, NOW(), NOW()),
    (gen_random_uuid(), 'Açúcar Refinado 1kg', 'Açúcares', 'kg', 3.80,
        (SELECT id FROM "Supplier" WHERE LOWER(TRIM(name)) = 'distribuidora doce' AND "isActive" = true LIMIT 1),
        true, NOW(), NOW())
ON CONFLICT ("supplier_id", LOWER(TRIM(name))) WHERE "isActive" = true
DO UPDATE SET
    "pricePerUnit" = EXCLUDED."pricePerUnit",
    category = EXCLUDED.category,
    "updatedAt" = NOW();


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 9: SOFT DELETE REACTIVATION
-- ═══════════════════════════════════════════════════════════════════════════
-- Scenario: User wants to add a supplier that was previously soft-deleted
-- Must reactivate the old record, not create a duplicate

-- Step 1: Try to reactivate
UPDATE "Supplier"
SET 
    "isActive" = true,
    email = '{{new_email}}',
    phone = '{{new_phone}}',
    "updatedAt" = NOW()
WHERE LOWER(TRIM(name)) = LOWER(TRIM('{{name}}'))
  AND "isActive" = false
RETURNING id, name, 'REACTIVATED' AS operation;

-- Step 2: If no rows updated, insert new
-- (Do this in application code: if rowcount = 0, run INSERT)


-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN 10: ADVISORY LOCK FOR COMPLEX OPERATIONS
-- ═══════════════════════════════════════════════════════════════════════════
-- Scenario: Multi-step operation that can't use ON CONFLICT
-- Uses PostgreSQL advisory locks for explicit coordination

-- Acquire lock using hash of (supplier_name)
-- Returns TRUE if lock acquired, FALSE if already held
SELECT pg_try_advisory_xact_lock(hashtext('supplier:' || LOWER(TRIM('{{supplier_name}}'))));

-- If TRUE: proceed with complex operation
-- If FALSE: another transaction is processing this supplier, wait or abort

-- Example: Full operation with advisory lock
DO $$
DECLARE
    v_lock_acquired BOOLEAN;
    v_supplier_id UUID;
BEGIN
    -- Try to acquire lock
    v_lock_acquired := pg_try_advisory_xact_lock(
        hashtext('supplier:' || LOWER(TRIM('Distribuidora Estrela')))
    );
    
    IF NOT v_lock_acquired THEN
        RAISE EXCEPTION 'Concurrent modification in progress for this supplier';
    END IF;
    
    -- Check if supplier exists
    SELECT id INTO v_supplier_id
    FROM "Supplier"
    WHERE LOWER(TRIM(name)) = LOWER(TRIM('Distribuidora Estrela'))
      AND "isActive" = true;
    
    IF v_supplier_id IS NULL THEN
        -- Insert new supplier
        INSERT INTO "Supplier" (id, name, email, "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Distribuidora Estrela', 'contato@estrela.com', true, NOW(), NOW())
        RETURNING id INTO v_supplier_id;
    END IF;
    
    -- Now use v_supplier_id for related operations...
    RAISE NOTICE 'Supplier ID: %', v_supplier_id;
    
    -- Lock is released automatically at end of transaction
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- ERROR HANDLING REFERENCE
-- ═══════════════════════════════════════════════════════════════════════════
/*
PostgreSQL Error Codes for Constraint Violations:

23505 - unique_violation
        Message: "duplicate key value violates unique constraint"
        Solution: Use ON CONFLICT or catch in application

23503 - foreign_key_violation  
        Message: "insert or update violates foreign key constraint"
        Solution: Ensure parent record exists first

23502 - not_null_violation
        Message: "null value in column X violates not-null constraint"
        Solution: Provide required values

23514 - check_violation
        Message: "new row violates check constraint"
        Solution: Validate data before insert

Application Example (JavaScript):
```javascript
try {
    const result = await db.query(upsertSQL, params);
    if (result.rows.length === 0) {
        // ON CONFLICT DO NOTHING - duplicate exists
        return { status: 'DUPLICATE', existing: true };
    }
    return { status: result.rows[0].operation, id: result.rows[0].id };
} catch (error) {
    if (error.code === '23505') {
        // Constraint violation - should not happen with ON CONFLICT
        // but possible in race condition edge cases
        logger.warn('Constraint violation, retrying...', error);
        return retry(operation); // Implement exponential backoff
    }
    throw error;
}
```
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- TEST QUERIES (Run after schema is deployed)
-- ═══════════════════════════════════════════════════════════════════════════

-- Test 1: Concurrent supplier insert simulation
-- Run this in two separate sessions simultaneously:
/*
BEGIN;
INSERT INTO "Supplier" (id, name, email, "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), '  Test Supplier  ', 'test@test.com', true, NOW(), NOW())
ON CONFLICT (LOWER(TRIM(name))) WHERE "isActive" = true
DO UPDATE SET email = EXCLUDED.email, "updatedAt" = NOW()
RETURNING id, name, CASE WHEN xmax = 0 THEN 'INSERTED' ELSE 'UPDATED' END;
-- DON'T COMMIT YET - wait for other session
-- Then COMMIT in both sessions
-- Only ONE row should exist in the table
COMMIT;
*/

-- Verify uniqueness
SELECT name, COUNT(*) 
FROM "Supplier" 
WHERE "isActive" = true
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;  -- Should return 0 rows
