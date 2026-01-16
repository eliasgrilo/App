/**
 * PrintStyles — Print Document Styles (Apple HIG)
 * 
 * Centralized print styles for all report printouts.
 * Forces light mode with Apple-style bank statement formatting.
 * 
 * @author Padoca Engineering Team
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const PRINT_STYLES = {
    document: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
        fontSize: '10pt',
        lineHeight: 1.5,
        color: '#1d1d1f',
        backgroundColor: '#ffffff',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: '16pt',
        marginBottom: '24pt',
        borderBottom: '1pt solid #d2d2d7',
    },
    logoText: {
        width: '36pt',
        height: '36pt',
        backgroundColor: '#1d1d1f',
        color: '#ffffff',
        fontSize: '15pt',
        fontWeight: 700,
        borderRadius: '10pt',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    companyName: {
        fontSize: '17pt',
        fontWeight: 600,
        color: '#1d1d1f',
        margin: '0 0 6pt 0',
    },
    companyMeta: {
        fontSize: '10pt',
        color: '#86868b',
        margin: 0,
        lineHeight: 1.4,
    },
    docTitle: {
        fontSize: '15pt',
        fontWeight: 600,
        color: '#1d1d1f',
        margin: '0 0 8pt 0',
        textAlign: 'right' as const,
    },
    section: {
        marginBottom: '40pt',
        pageBreakInside: 'avoid' as const,
    },
    sectionTitle: {
        fontSize: '13pt',
        fontWeight: 600,
        color: '#1d1d1f',
        margin: '24pt 0 16pt 0',
        paddingBottom: '8pt',
        borderBottom: '2pt solid #1d1d1f',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '9pt',
    },
    th: {
        padding: '10pt 12pt',
        fontWeight: 600,
        fontSize: '8pt',
        color: '#1d1d1f',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
        backgroundColor: '#f5f5f7',
        borderBottom: '1pt solid #1d1d1f',
        textAlign: 'left' as const,
    },
    td: {
        padding: '9pt 12pt',
        color: '#1d1d1f',
        backgroundColor: '#ffffff',
        borderBottom: '0.5pt solid #d2d2d7',
    },
    summaryCard: {
        display: 'inline-block',
        minWidth: '100pt',
        padding: '12pt 16pt',
        backgroundColor: '#f5f5f7',
        borderRadius: '8pt',
        marginRight: '12pt',
        marginBottom: '12pt',
    },
    summaryLabel: {
        display: 'block' as const,
        fontSize: '9pt',
        fontWeight: 500,
        color: '#86868b',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        marginBottom: '4pt',
    },
    summaryValue: {
        fontSize: '16pt',
        fontWeight: 600,
        color: '#1d1d1f',
    },
    footer: {
        marginTop: '40pt',
        paddingTop: '16pt',
        borderTop: '1pt solid #d2d2d7',
    },
    footerText: {
        fontSize: '9pt',
        color: '#86868b',
        margin: 0,
    },
} as const

// ═══════════════════════════════════════════════════════════════════════════════
// CSS STRING FOR POPUP WINDOW
// ═══════════════════════════════════════════════════════════════════════════════

export const PRINT_CSS = `
    @page {
        size: A4 portrait;
        margin: 15mm 12mm 15mm 12mm;
    }
    
    * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
        font-size: 10pt;
        line-height: 1.5;
        color: #1d1d1f !important;
        background: #ffffff !important;
        margin: 0;
        padding: 0;
    }
    
    table { 
        width: 100%; 
        border-collapse: collapse; 
        page-break-inside: avoid;
    }
    
    th, td { 
        padding: 8pt 10pt; 
        text-align: left; 
    }
    
    th {
        background: #f5f5f7 !important;
        font-weight: 600;
        font-size: 8pt;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1pt solid #1d1d1f;
    }
    
    td { 
        border-bottom: 0.5pt solid #d2d2d7; 
    }
    
    .page-break { 
        page-break-before: always; 
    }
    
    .no-break { 
        page-break-inside: avoid; 
    }
`

export type PrintStyleKey = keyof typeof PRINT_STYLES
