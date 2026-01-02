#!/usr/bin/env node
/**
 * Code Audit Script - Dead Code Elimination
 * 
 * Scans all source files for:
 * - Unused imports
 * - Orphan functions (defined but never called)
 * - Debug statements (console.log left in production)
 * - TODO/FIXME comments
 * 
 * Run: node scripts/runCodeAudit.js
 */

import { codeSanitizer } from '../src/services/codeSanitizer.js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = './src';
const EXTENSIONS = ['.js', '.jsx'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', '.firebase'];

// Recursively get all files
function getAllFiles(dir, files = []) {
    const items = readdirSync(dir);

    for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(item)) {
                getAllFiles(fullPath, files);
            }
        } else if (EXTENSIONS.includes(extname(item))) {
            files.push(fullPath);
        }
    }

    return files;
}

// Main audit function
async function runAudit() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   DEAD CODE ELIMINATION AUDIT - Golden Master Release');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    const files = getAllFiles(SRC_DIR);
    console.log(`📂 Found ${files.length} source files to analyze`);
    console.log('');

    codeSanitizer.clearIssues();

    let totalIssues = 0;
    let totalBytes = 0;

    for (const file of files) {
        try {
            const code = readFileSync(file, 'utf-8');
            totalBytes += code.length;

            // Run analysis
            const issues = codeSanitizer.analyzeCode(code, file);

            if (issues.length > 0) {
                console.log(`\n📄 ${file}`);
                issues.forEach(issue => {
                    console.log(`   L${issue.line}: [${issue.type}] ${issue.message}`);
                });
                totalIssues += issues.length;
            }
        } catch (error) {
            console.error(`   ⚠️ Error analyzing ${file}: ${error.message}`);
        }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   AUDIT SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   Files scanned:    ${files.length}`);
    console.log(`   Total bytes:      ${(totalBytes / 1024).toFixed(1)} KB`);
    console.log(`   Issues found:     ${totalIssues}`);
    console.log('');

    // Generate report
    const report = codeSanitizer.generateReport();
    console.log('📊 Detailed Report:');
    console.log(JSON.stringify(report.summary, null, 2));

    return { files: files.length, issues: totalIssues, bytes: totalBytes };
}

// Run if called directly
runAudit().then(result => {
    console.log('');
    console.log('✅ Audit complete');
    process.exit(result.issues > 0 ? 1 : 0);
}).catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
});

export { runAudit };
