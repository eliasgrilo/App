#!/usr/bin/env node
/**
 * Orphan File Checker
 * Identifies files in Storage without DB reference and vice versa
 * 
 * Usage: 
 *   node scripts/orphanFileChecker.js          - Run integrity check
 *   node scripts/orphanFileChecker.js --cleanup - Clean orphan files (with confirmation)
 *   node scripts/orphanFileChecker.js --dry-run - Simulate cleanup without deleting
 * 
 * For use with Firebase Data Connect + Firebase Storage
 */

import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, listAll, getMetadata, deleteObject, getDownloadURL } from 'firebase/storage';
import { getDataConnect, queryRef, executeQuery } from 'firebase/data-connect';
import readline from 'readline';

// Firebase configuration - import from your firebase.js or set via env
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID || 'padoca-app',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase if not already initialized
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const storage = getStorage(app);
const dataConnect = getDataConnect(app, {
    connector: 'padoca-connector',
    location: 'southamerica-east1',
    service: 'padoca-dataconnect'
});

// Known entity types that store files
const ENTITY_TYPES = [
    'products',
    'recipes',
    'costs',
    'files',
    'suppliers',
    'quotations'
];

// ===================================================================
// STORAGE SCANNING
// ===================================================================

/**
 * Recursively list all files in Firebase Storage
 * @param {string} folderPath - Starting folder path
 * @returns {Promise<Array>} - Array of file objects
 */
async function getAllStorageFiles(folderPath = '') {
    const files = [];

    try {
        const folderRef = ref(storage, folderPath);
        const result = await listAll(folderRef);

        // Process files in this folder
        for (const item of result.items) {
            // Skip thumbnails for counting
            if (item.name.includes('_thumb')) continue;

            try {
                const metadata = await getMetadata(item);
                let url = null;
                try {
                    url = await getDownloadURL(item);
                } catch {
                    // URL might not be accessible
                }

                files.push({
                    path: item.fullPath,
                    name: item.name,
                    size: metadata.size,
                    createdAt: metadata.timeCreated,
                    contentType: metadata.contentType,
                    url: url,
                    customMetadata: metadata.customMetadata || {}
                });
            } catch (metaError) {
                console.warn(`  ⚠️ Não foi possível ler metadados de: ${item.fullPath}`);
                files.push({
                    path: item.fullPath,
                    name: item.name,
                    size: 0,
                    createdAt: null,
                    contentType: 'unknown',
                    error: metaError.message
                });
            }
        }

        // Recursively process subfolders
        for (const prefix of result.prefixes) {
            const subFiles = await getAllStorageFiles(prefix.fullPath);
            files.push(...subFiles);
        }
    } catch (error) {
        if (error.code !== 'storage/object-not-found') {
            console.error(`  ❌ Erro ao listar ${folderPath}:`, error.message);
        }
    }

    return files;
}

// ===================================================================
// DATABASE QUERIES
// ===================================================================

/**
 * Query to list all files - must be added to operations.gql if not present
 */
const LIST_ALL_FILES_QUERY = `
query ListAllFiles {
  files(orderBy: [{ createdAt: DESC }]) {
    id
    name
    type
    mimeType
    size
    storageUrl
    storagePath
    thumbnailUrl
    entityType
    entityId
    createdAt
  }
}
`;

/**
 * Get all file records from the database
 * @returns {Promise<Array>} - Array of file records
 */
async function getAllDatabaseFiles() {
    const dbFiles = [];

    try {
        // Try to use ListFilesByEntity for each entity type
        for (const entityType of ENTITY_TYPES) {
            try {
                const result = await executeQuery(
                    queryRef(dataConnect, 'ListFilesByEntity'),
                    { entityType, entityId: '' } // Empty to get all
                );

                if (result.data?.files) {
                    dbFiles.push(...result.data.files.map(f => ({
                        ...f,
                        entityType
                    })));
                }
            } catch (queryError) {
                // This entity type might not have files
                console.log(`  📋 ${entityType}: nenhum arquivo encontrado`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao consultar banco de dados:', error.message);
    }

    // Also check for URLs stored directly in entity records
    const urlFields = await findURLFieldsInEntities();
    dbFiles.push(...urlFields);

    return dbFiles;
}

/**
 * Find URL fields stored directly in entities (imageUrl, attachmentUrl, etc.)
 * @returns {Promise<Array>} - Array of URL references
 */
async function findURLFieldsInEntities() {
    const urlRefs = [];

    // Check Products for imageUrl
    try {
        const result = await executeQuery(queryRef(dataConnect, 'ListProducts'));
        if (result.data?.products) {
            result.data.products.forEach(p => {
                if (p.imageUrl) {
                    urlRefs.push({
                        id: `product_${p.id}`,
                        entityType: 'Product',
                        entityId: p.id,
                        storageUrl: p.imageUrl,
                        storagePath: extractPathFromURL(p.imageUrl),
                        fieldName: 'imageUrl'
                    });
                }
            });
        }
    } catch (e) { /* Products query failed */ }

    // Check Recipes for imageUrl
    try {
        const result = await executeQuery(queryRef(dataConnect, 'ListRecipes'));
        if (result.data?.recipes) {
            result.data.recipes.forEach(r => {
                if (r.imageUrl) {
                    urlRefs.push({
                        id: `recipe_${r.id}`,
                        entityType: 'Recipe',
                        entityId: r.id,
                        storageUrl: r.imageUrl,
                        storagePath: extractPathFromURL(r.imageUrl),
                        fieldName: 'imageUrl'
                    });
                }
            });
        }
    } catch (e) { /* Recipes query failed */ }

    // Check Costs for attachmentUrl
    try {
        const result = await executeQuery(queryRef(dataConnect, 'ListCosts'), {});
        if (result.data?.costs) {
            result.data.costs.forEach(c => {
                if (c.attachmentUrl) {
                    urlRefs.push({
                        id: `cost_${c.id}`,
                        entityType: 'Cost',
                        entityId: c.id,
                        storageUrl: c.attachmentUrl,
                        storagePath: extractPathFromURL(c.attachmentUrl),
                        fieldName: 'attachmentUrl'
                    });
                }
            });
        }
    } catch (e) { /* Costs query failed */ }

    return urlRefs;
}

/**
 * Extract storage path from Firebase Storage URL
 * @param {string} url - Firebase Storage URL
 * @returns {string|null} - Storage path or null
 */
function extractPathFromURL(url) {
    if (!url) return null;

    try {
        // Firebase Storage URL format: 
        // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded_path}?...
        const match = url.match(/\/o\/([^?]+)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
    } catch {
        return null;
    }

    return null;
}

// ===================================================================
// INTEGRITY CHECK
// ===================================================================

/**
 * Find orphan files and broken references
 * @returns {Promise<Object>} - Report object
 */
async function findIntegrityIssues() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE - PADOCA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Get all files from Storage
    console.log('📦 Listando arquivos no Firebase Storage...');
    const storageFiles = await getAllStorageFiles();
    console.log(`   ✓ Encontrados: ${storageFiles.length} arquivos\n`);

    // Get all file references from Database
    console.log('🗄️  Listando referências no PostgreSQL...');
    const dbFiles = await getAllDatabaseFiles();
    console.log(`   ✓ Encontradas: ${dbFiles.length} referências\n`);

    // Create sets for comparison
    const storagePathSet = new Set(storageFiles.map(f => f.path));
    const dbPathSet = new Set(dbFiles.map(f => f.storagePath).filter(Boolean));
    const dbUrlSet = new Set(dbFiles.map(f => f.storageUrl).filter(Boolean));

    // Find orphan files (in Storage but not in DB)
    const orphanFiles = storageFiles.filter(f => {
        const inDbByPath = dbPathSet.has(f.path);
        const inDbByUrl = f.url && dbUrlSet.has(f.url);
        return !inDbByPath && !inDbByUrl;
    });

    // Find broken references (in DB but not in Storage)
    const brokenRefs = dbFiles.filter(f => {
        if (!f.storagePath) return false;
        return !storagePathSet.has(f.storagePath);
    });

    // Calculate storage used
    const totalStorageBytes = storageFiles.reduce((sum, f) => sum + (f.size || 0), 0);
    const orphanStorageBytes = orphanFiles.reduce((sum, f) => sum + (f.size || 0), 0);

    return {
        storageFiles,
        dbFiles,
        orphanFiles,
        brokenRefs,
        totalStorageBytes,
        orphanStorageBytes,
        integrity: orphanFiles.length === 0 && brokenRefs.length === 0
    };
}

/**
 * Print detailed report
 */
function printReport(report) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RELATÓRIO DE INTEGRIDADE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Orphan Files
    if (report.orphanFiles.length > 0) {
        console.log(`⚠️  ARQUIVOS ÓRFÃOS (${report.orphanFiles.length}):`);
        console.log('   (Arquivos no Storage sem referência no banco)');
        console.log('');

        report.orphanFiles.slice(0, 20).forEach((f, i) => {
            console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${f.path}`);
            console.log(`       Tamanho: ${formatBytes(f.size)}`);
            console.log(`       Criado:  ${f.createdAt ? new Date(f.createdAt).toLocaleString('pt-BR') : 'Desconhecido'}`);
            console.log('');
        });

        if (report.orphanFiles.length > 20) {
            console.log(`   ... e mais ${report.orphanFiles.length - 20} arquivos\n`);
        }
    } else {
        console.log('✅ Nenhum arquivo órfão encontrado.\n');
    }

    // Broken References
    if (report.brokenRefs.length > 0) {
        console.log(`❌ REFERÊNCIAS QUEBRADAS (${report.brokenRefs.length}):`);
        console.log('   (URLs no banco que não existem no Storage)');
        console.log('');

        report.brokenRefs.slice(0, 20).forEach((f, i) => {
            console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ID: ${f.id}`);
            console.log(`       Path esperado: ${f.storagePath}`);
            console.log(`       Entidade: ${f.entityType}/${f.entityId}`);
            if (f.fieldName) {
                console.log(`       Campo: ${f.fieldName}`);
            }
            console.log('');
        });

        if (report.brokenRefs.length > 20) {
            console.log(`   ... e mais ${report.brokenRefs.length - 20} referências\n`);
        }
    } else {
        console.log('✅ Nenhuma referência quebrada encontrada.\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📈 RESUMO');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Total no Storage:       ${report.storageFiles.length} arquivos (${formatBytes(report.totalStorageBytes)})`);
    console.log(`   Total no Banco:         ${report.dbFiles.length} referências`);
    console.log(`   Arquivos Órfãos:        ${report.orphanFiles.length} (${formatBytes(report.orphanStorageBytes)})`);
    console.log(`   Referências Quebradas:  ${report.brokenRefs.length}`);
    console.log('');
    console.log(`   Status de Integridade:  ${report.integrity ? '✅ 100% ÍNTEGRO' : '❌ COMPROMETIDA'}`);
    console.log('');
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===================================================================
// CLEANUP FUNCTIONS
// ===================================================================

/**
 * Ask for user confirmation
 */
function askConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'sim');
        });
    });
}

/**
 * Clean up orphan files
 */
async function cleanupOrphanFiles(orphanFiles, dryRun = false) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🧹 LIMPEZA DE ARQUIVOS ÓRFÃOS ${dryRun ? '[SIMULAÇÃO]' : ''}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    let deleted = 0;
    let failed = 0;
    let bytesFreed = 0;

    for (const file of orphanFiles) {
        if (dryRun) {
            console.log(`   [DRY RUN] Deletaria: ${file.path} (${formatBytes(file.size)})`);
            bytesFreed += file.size || 0;
            deleted++;
        } else {
            try {
                const fileRef = ref(storage, file.path);
                await deleteObject(fileRef);

                // Also try to delete thumbnail
                try {
                    const thumbPath = file.path.replace(/(\.[^.]+)$/, '_thumb$1');
                    const thumbRef = ref(storage, thumbPath);
                    await deleteObject(thumbRef);
                } catch {
                    // Thumbnail might not exist
                }

                console.log(`   ✅ Deletado: ${file.path}`);
                bytesFreed += file.size || 0;
                deleted++;
            } catch (error) {
                console.log(`   ❌ Falha: ${file.path} - ${error.message}`);
                failed++;
            }
        }
    }

    console.log('');
    console.log(`   ${dryRun ? 'Simulação' : 'Limpeza'} concluída:`);
    console.log(`   - Arquivos ${dryRun ? 'que seriam ' : ''}deletados: ${deleted}`);
    console.log(`   - Falhas: ${failed}`);
    console.log(`   - Espaço ${dryRun ? 'que seria ' : ''}liberado: ${formatBytes(bytesFreed)}`);
    console.log('');
}

// ===================================================================
// MAIN EXECUTION
// ===================================================================

async function main() {
    const args = process.argv.slice(2);
    const doCleanup = args.includes('--cleanup');
    const dryRun = args.includes('--dry-run');

    try {
        // Run integrity check
        const report = await findIntegrityIssues();
        printReport(report);

        // Handle cleanup
        if (report.orphanFiles.length > 0) {
            if (doCleanup) {
                if (dryRun) {
                    await cleanupOrphanFiles(report.orphanFiles, true);
                } else {
                    console.log('⚠️  ATENÇÃO: Esta operação irá DELETAR arquivos permanentemente!');
                    console.log('');
                    const confirmed = await askConfirmation('   Deseja continuar? (y/N): ');

                    if (confirmed) {
                        await cleanupOrphanFiles(report.orphanFiles, false);
                    } else {
                        console.log('   ❌ Operação cancelada pelo usuário.');
                    }
                }
            } else {
                console.log('💡 Para limpar arquivos órfãos, execute:');
                console.log('   node scripts/orphanFileChecker.js --dry-run   (simular)');
                console.log('   node scripts/orphanFileChecker.js --cleanup   (deletar)');
                console.log('');
            }
        }

        // Handle broken references
        if (report.brokenRefs.length > 0) {
            console.log('⚠️  Referências quebradas precisam ser corrigidas manualmente no banco.');
            console.log('   Você pode limpar os campos de URL ou restaurar os arquivos ausentes.');
            console.log('');
        }

        // Exit code based on integrity
        process.exit(report.integrity ? 0 : 1);

    } catch (error) {
        console.error('');
        console.error('❌ ERRO FATAL:', error.message);
        console.error('');
        console.error('   Verifique se:');
        console.error('   1. As variáveis de ambiente do Firebase estão configuradas');
        console.error('   2. Você tem permissão de acesso ao Storage e Data Connect');
        console.error('   3. O projeto Firebase está corretamente inicializado');
        console.error('');
        process.exit(1);
    }
}

// Export for use as module
export { findIntegrityIssues, cleanupOrphanFiles, getAllStorageFiles, getAllDatabaseFiles };

// Run if called directly
main();
