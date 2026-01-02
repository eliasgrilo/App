/**
 * Code Sanitizer Service - Dead Code Elimination & Hygiene
 * 
 * PREMIUM UTILITY: Code Sanitization Protocol
 * 
 * Static analysis, dead code detection, and production-ready cleanup.
 * 
 * @module codeSanitizer
 */

const SanitizationType = Object.freeze({
    UNUSED_IMPORT: 'unused_import',
    UNUSED_VARIABLE: 'unused_variable',
    DEAD_FUNCTION: 'dead_function',
    CONSOLE_LOG: 'console_log',
    LEGACY_PROMISE: 'legacy_promise',
    VAR_DECLARATION: 'var_declaration',
    TODO_COMMENT: 'todo_comment',
    DEBUG_CODE: 'debug_code'
});

const SeverityLevel = Object.freeze({
    INFO: 'info', WARNING: 'warning', ERROR: 'error', CRITICAL: 'critical'
});

class SanitizationIssue {
    constructor(type, config) {
        this.id = `issue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.type = type;
        this.severity = config.severity || SeverityLevel.WARNING;
        this.file = config.file;
        this.line = config.line;
        this.column = config.column;
        this.message = config.message;
        this.code = config.code;
        this.fix = config.fix;
        this.autoFixable = config.autoFixable || false;
    }
}

class CodeSanitizerService {
    constructor() {
        this.issues = [];
        this.rules = new Map();
        this.metrics = {
            filesScanned: 0,
            issuesFound: 0,
            issuesFixed: 0,
            bytesRemoved: 0
        };
        this.registerDefaultRules();
    }

    registerDefaultRules() {
        // Console.log detection
        this.registerRule({
            id: 'no-console',
            type: SanitizationType.CONSOLE_LOG,
            pattern: /console\.(log|warn|error|info|debug)\([^)]*\);?/g,
            severity: SeverityLevel.WARNING,
            message: 'Remove console statements for production',
            autoFixable: true,
            fix: (match) => `// [REMOVED] ${match.substring(0, 30)}...`
        });

        // Unused TODO comments
        this.registerRule({
            id: 'no-todo',
            type: SanitizationType.TODO_COMMENT,
            pattern: /\/\/\s*(TODO|FIXME|HACK|XXX):?.*/gi,
            severity: SeverityLevel.INFO,
            message: 'Review or remove TODO comment',
            autoFixable: false
        });

        // Debug code patterns
        this.registerRule({
            id: 'no-debug',
            type: SanitizationType.DEBUG_CODE,
            pattern: /debugger;?/g,
            severity: SeverityLevel.ERROR,
            message: 'Remove debugger statement',
            autoFixable: true,
            fix: () => ''
        });

        // var declarations
        this.registerRule({
            id: 'no-var',
            type: SanitizationType.VAR_DECLARATION,
            pattern: /\bvar\s+/g,
            severity: SeverityLevel.WARNING,
            message: 'Replace var with const/let',
            autoFixable: true,
            fix: () => 'let '
        });

        // Legacy promise then
        this.registerRule({
            id: 'prefer-async-await',
            type: SanitizationType.LEGACY_PROMISE,
            pattern: /\.then\s*\(\s*(async\s*)?\(/g,
            severity: SeverityLevel.INFO,
            message: 'Consider using async/await instead of .then()',
            autoFixable: false
        });
    }

    registerRule(rule) {
        this.rules.set(rule.id, rule);
    }

    analyzeCode(code, filename = 'unknown.js') {
        const issues = [];
        const lines = code.split('\n');

        for (const [ruleId, rule] of this.rules) {
            let match;
            let searchCode = code;
            let offset = 0;

            while ((match = rule.pattern.exec(searchCode)) !== null) {
                const position = this.getLineColumn(code, match.index + offset);

                issues.push(new SanitizationIssue(rule.type, {
                    severity: rule.severity,
                    file: filename,
                    line: position.line,
                    column: position.column,
                    message: rule.message,
                    code: match[0].substring(0, 50),
                    fix: rule.fix ? rule.fix(match[0]) : null,
                    autoFixable: rule.autoFixable
                }));

                // Prevent infinite loops
                if (rule.pattern.lastIndex === 0) break;
            }
            // Reset regex
            rule.pattern.lastIndex = 0;
        }

        this.issues.push(...issues);
        this.metrics.filesScanned++;
        this.metrics.issuesFound += issues.length;

        return issues;
    }

    getLineColumn(code, index) {
        const lines = code.substring(0, index).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    sanitizeCode(code, options = {}) {
        let sanitized = code;
        let removedBytes = 0;
        const originalLength = code.length;

        if (options.removeConsole !== false) {
            sanitized = sanitized.replace(
                /console\.(log|warn|error|info|debug)\([^)]*\);?\n?/g,
                ''
            );
        }

        if (options.removeDebugger !== false) {
            sanitized = sanitized.replace(/debugger;?\n?/g, '');
        }

        if (options.convertVar) {
            sanitized = sanitized.replace(/\bvar\s+/g, 'let ');
        }

        if (options.removeEmptyLines) {
            sanitized = sanitized.replace(/\n\s*\n\s*\n/g, '\n\n');
        }

        if (options.trimTrailingWhitespace) {
            sanitized = sanitized.split('\n').map(line => line.trimEnd()).join('\n');
        }

        removedBytes = originalLength - sanitized.length;
        this.metrics.bytesRemoved += removedBytes;
        this.metrics.issuesFixed++;

        return { code: sanitized, bytesRemoved, changes: originalLength !== sanitized.length };
    }

    // ─────────────────────────────────────────────────
    // UNUSED IMPORT DETECTION
    // ─────────────────────────────────────────────────

    detectUnusedImports(code) {
        const imports = this.extractImports(code);
        const unused = [];

        for (const imp of imports) {
            for (const name of imp.names) {
                // Check if the imported name is used anywhere in the code (excluding import line)
                const codeWithoutImports = code.replace(/^import.*$/gm, '');
                const usagePattern = new RegExp(`\\b${name}\\b`, 'g');

                if (!usagePattern.test(codeWithoutImports)) {
                    unused.push({
                        name,
                        source: imp.source,
                        line: imp.line,
                        suggestion: `Remove unused import: ${name}`
                    });
                }
            }
        }

        return unused;
    }

    extractImports(code) {
        const imports = [];
        const importPattern = /^import\s+(?:(\{[^}]+\})|(\w+)|\*\s+as\s+(\w+))(?:\s*,\s*(\{[^}]+\}))?(?:\s*,\s*(\w+))?\s+from\s+['"]([^'"]+)['"]/gm;
        const lines = code.split('\n');

        let match;
        while ((match = importPattern.exec(code)) !== null) {
            const lineNumber = code.substring(0, match.index).split('\n').length;
            const names = [];

            // Named imports { a, b }
            if (match[1]) {
                const named = match[1].replace(/[{}]/g, '').split(',').map(s => s.trim().split(' as ')[0]);
                names.push(...named);
            }
            // Default import
            if (match[2]) names.push(match[2]);
            // Namespace import * as name
            if (match[3]) names.push(match[3]);
            // Additional named imports
            if (match[4]) {
                const named = match[4].replace(/[{}]/g, '').split(',').map(s => s.trim().split(' as ')[0]);
                names.push(...named);
            }
            // Additional default
            if (match[5]) names.push(match[5]);

            imports.push({
                names: names.filter(n => n.length > 0),
                source: match[6],
                line: lineNumber
            });
        }

        return imports;
    }

    // ─────────────────────────────────────────────────
    // TREE SHAKING ANALYSIS
    // ─────────────────────────────────────────────────

    analyzeTreeShaking(code) {
        const heavyLibraries = ['lodash', 'moment', 'date-fns', 'rxjs'];
        const issues = [];

        for (const lib of heavyLibraries) {
            // Check for full imports
            const fullImport = new RegExp(`import\\s+\\*\\s+as\\s+\\w+\\s+from\\s+['"]${lib}['"]`);
            const defaultImport = new RegExp(`import\\s+\\w+\\s+from\\s+['"]${lib}['"]`);

            if (fullImport.test(code) || defaultImport.test(code)) {
                issues.push({
                    library: lib,
                    issue: 'Full library import detected',
                    suggestion: `Use named imports: import { specificFunction } from '${lib}'`,
                    severity: SeverityLevel.WARNING
                });
            }
        }

        return issues;
    }

    // ─────────────────────────────────────────────────
    // REPORTING
    // ─────────────────────────────────────────────────

    generateReport() {
        const byType = {};
        const bySeverity = {};
        const byFile = {};

        for (const issue of this.issues) {
            byType[issue.type] = (byType[issue.type] || 0) + 1;
            bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
            byFile[issue.file] = (byFile[issue.file] || 0) + 1;
        }

        return {
            summary: {
                totalIssues: this.issues.length,
                autoFixable: this.issues.filter(i => i.autoFixable).length,
                ...this.metrics
            },
            byType,
            bySeverity,
            byFile,
            issues: this.issues.slice(0, 100) // Limit for readability
        };
    }

    clearIssues() {
        this.issues = [];
    }

    getMetrics() {
        return this.metrics;
    }
}

export const codeSanitizer = new CodeSanitizerService();
export { SanitizationType, SeverityLevel, SanitizationIssue, CodeSanitizerService };
export default codeSanitizer;
