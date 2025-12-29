-- ============================================================
-- PADOCA - AUDIT LOG IMMUTABILITY CONSTRAINTS
-- ============================================================
-- 
-- Este script cria triggers que impedem a modificação ou deleção
-- de registros na tabela AuditLog, garantindo conformidade fiscal.
--
-- EXECUÇÃO:
-- Este script deve ser executado diretamente no PostgreSQL do
-- Firebase Data Connect através do Cloud SQL ou console.
--
-- NOTA: Os nomes de tabela e coluna podem variar dependendo de
-- como o Firebase Data Connect gera o schema. Ajuste conforme necessário.
-- ============================================================

-- ============================================================
-- FUNÇÃO: Prevenir UPDATE em AuditLog
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 
        '[SECURITY VIOLATION] Registros de auditoria não podem ser modificados. '
        'ID: %, EntityType: %, EntityId: %, Action: %, CreatedAt: %',
        OLD.id, 
        OLD.entity_type, 
        OLD.entity_id, 
        OLD.action,
        OLD.created_at;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNÇÃO: Prevenir DELETE em AuditLog
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 
        '[SECURITY VIOLATION] Registros de auditoria não podem ser deletados. '
        'ID: %, EntityType: %, EntityId: %, Action: %, CreatedAt: %',
        OLD.id, 
        OLD.entity_type, 
        OLD.entity_id, 
        OLD.action,
        OLD.created_at;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: Bloquear UPDATE
-- ============================================================
-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS audit_log_no_update ON "AuditLog";

-- Criar trigger de bloqueio de UPDATE
CREATE TRIGGER audit_log_no_update
    BEFORE UPDATE ON "AuditLog"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_update();

-- ============================================================
-- TRIGGER: Bloquear DELETE
-- ============================================================
-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS audit_log_no_delete ON "AuditLog";

-- Criar trigger de bloqueio de DELETE
CREATE TRIGGER audit_log_no_delete
    BEFORE DELETE ON "AuditLog"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_delete();

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índice para busca por entidade
CREATE INDEX IF NOT EXISTS idx_audit_log_entity 
    ON "AuditLog" (entity_type, entity_id);

-- Índice para busca por data (relatórios fiscais)
CREATE INDEX IF NOT EXISTS idx_audit_log_created 
    ON "AuditLog" (created_at);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_audit_log_user 
    ON "AuditLog" (user_id);

-- Índice composto para relatórios de período + entidade
CREATE INDEX IF NOT EXISTS idx_audit_log_period_entity 
    ON "AuditLog" (created_at, entity_type);

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================

-- Verificar se os triggers foram criados
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'AuditLog';

-- Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'AuditLog';

-- ============================================================
-- TESTE (Opcional - descomente para testar)
-- ============================================================

-- Teste 1: Tentar UPDATE (deve falhar)
-- UPDATE "AuditLog" SET action = 'TESTE' WHERE id = 'algum-uuid';

-- Teste 2: Tentar DELETE (deve falhar)  
-- DELETE FROM "AuditLog" WHERE id = 'algum-uuid';

-- ============================================================
-- NOTA SOBRE BYPASS
-- ============================================================
-- 
-- Em caso de necessidade de correção de dados (erro de sistema),
-- um DBA pode desabilitar temporariamente os triggers:
--
-- ALTER TABLE "AuditLog" DISABLE TRIGGER audit_log_no_update;
-- ALTER TABLE "AuditLog" DISABLE TRIGGER audit_log_no_delete;
-- 
-- -- Fazer correção necessária com registro em outro log
-- 
-- ALTER TABLE "AuditLog" ENABLE TRIGGER audit_log_no_update;
-- ALTER TABLE "AuditLog" ENABLE TRIGGER audit_log_no_delete;
--
-- IMPORTANTE: Qualquer bypass deve ser documentado e justificado
-- para fins de auditoria e conformidade fiscal.
-- ============================================================
