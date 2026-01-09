#!/usr/bin/env ts-node
/**
 * API Security Audit Script
 * 
 * Scans all API route files to identify:
 * - TODO auth/permission comments
 * - Manual auth checks (getServerSession instead of centralized middleware)
 * - Missing organization scoping
 * - Inconsistent error handling
 * 
 * Usage:
 *   npx tsx scripts/audit-api-security.ts
 * 
 * Output:
 *   - Console report
 *   - docs/api-security-audit-report.json
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface SecurityIssue {
  file: string;
  line: number;
  type: 'TODO_AUTH' | 'MANUAL_AUTH' | 'MISSING_ORG_SCOPE' | 'INCONSISTENT_ERROR';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  code: string;
}

interface EndpointInfo {
  file: string;
  methods: string[];
  hasCentralizedAuth: boolean;
  hasManualAuth: boolean;
  hasOrgScoping: boolean;
  hasTodoComments: boolean;
  issues: SecurityIssue[];
}

interface AuditReport {
  timestamp: string;
  totalFiles: number;
  totalEndpoints: number;
  filesWithIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  endpoints: EndpointInfo[];
  summary: {
    todoAuthComments: number;
    manualAuthChecks: number;
    missingOrgScoping: number;
    inconsistentErrorHandling: number;
  };
}

/**
 * Scan a single API route file for security issues
 */
function scanApiFile(filePath: string): EndpointInfo {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const endpoint: EndpointInfo = {
    file: relativePath,
    methods: [],
    hasCentralizedAuth: false,
    hasManualAuth: false,
    hasOrgScoping: false,
    hasTodoComments: false,
    issues: []
  };

  // Detect HTTP methods
  const methodPattern = /export\s+(?:const\s+)?(GET|POST|PUT|DELETE|PATCH)\s*=/g;
  let match;
  while ((match = methodPattern.exec(content)) !== null) {
    endpoint.methods.push(match[1]);
  }

  // Check for centralized auth middleware
  const centralizedAuthPatterns = [
    /requireAuth\s*\(/,
    /requireRole\s*\(/,
    /requirePermission\s*\(/,
    /from\s+['"]@\/lib\/middleware\/auth['"]/
  ];
  endpoint.hasCentralizedAuth = centralizedAuthPatterns.some(pattern => pattern.test(content));

  // Check for manual auth checks
  const manualAuthPatterns = [
    /getServerSession\s*\(/,
    /session\s*=\s*await\s+getServerSession/,
    /if\s*\(\s*!session/,
    /if\s*\(\s*!.*\.user\)/
  ];
  endpoint.hasManualAuth = manualAuthPatterns.some(pattern => pattern.test(content));

  // Check for organization scoping
  const orgScopingPatterns = [
    /getOrganizationScope\s*\(/,
    /organizationId:\s*getOrganizationScope/,
    /validateOrganizationAccess\s*\(/
  ];
  endpoint.hasOrgScoping = orgScopingPatterns.some(pattern => pattern.test(content));

  // Scan for TODO comments
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();

    // TODO auth/permission comments (check current and next line for context)
    const nextLine = index + 1 < lines.length ? lines[index + 1].trim() : '';
    const combinedContext = trimmedLine + ' ' + nextLine;
    
    if (/TODO.*auth/i.test(trimmedLine) || 
        /TODO.*permission/i.test(trimmedLine) || 
        /TODO.*RBAC/i.test(trimmedLine) ||
        /TODO.*role/i.test(trimmedLine) ||
        /TODO.*organization/i.test(trimmedLine) ||
        (/TODO/i.test(trimmedLine) && /auth|permission|role|organization|scoping/i.test(combinedContext))) {
      endpoint.hasTodoComments = true;
      endpoint.issues.push({
        file: relativePath,
        line: lineNum,
        type: 'TODO_AUTH',
        severity: 'CRITICAL',
        description: 'TODO comment for authentication/authorization',
        code: trimmedLine.substring(0, 100)
      });
    }

    // Manual auth checks
    if (endpoint.hasManualAuth && !endpoint.hasCentralizedAuth) {
      if (/getServerSession/.test(line) || /if\s*\(\s*!session/.test(line)) {
        endpoint.issues.push({
          file: relativePath,
          line: lineNum,
          type: 'MANUAL_AUTH',
          severity: 'HIGH',
          description: 'Manual authentication check instead of centralized middleware',
          code: trimmedLine.substring(0, 100)
        });
      }
    }

    // Missing organization scoping in queries
    if (endpoint.hasCentralizedAuth && !endpoint.hasOrgScoping) {
      if (/prisma\.\w+\.(findMany|findUnique|findFirst|create|update|delete)/.test(line)) {
        // Check if query doesn't include organizationId
        const nextLines = lines.slice(index, index + 10).join('\n');
        if (!/organizationId/.test(nextLines)) {
          endpoint.issues.push({
            file: relativePath,
            line: lineNum,
            type: 'MISSING_ORG_SCOPE',
            severity: 'CRITICAL',
            description: 'Database query missing organization scoping',
            code: trimmedLine.substring(0, 100)
          });
        }
      }
    }

    // Inconsistent error handling
    if (/return\s+NextResponse\.json\s*\(\s*\{[^}]*error:/i.test(line) && 
        !/successResponse|withErrorHandler/.test(content)) {
      endpoint.issues.push({
        file: relativePath,
        line: lineNum,
        type: 'INCONSISTENT_ERROR',
        severity: 'MEDIUM',
        description: 'Error response not using standardized format',
        code: trimmedLine.substring(0, 100)
      });
    }
  });

  return endpoint;
}

/**
 * Main audit function
 */
async function auditApiSecurity(): Promise<AuditReport> {
  console.log('🔍 Starting API Security Audit...\n');

  // Find all API route files
  const apiFiles = await glob('src/app/api/**/*.ts', {
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**']
  });

  console.log(`Found ${apiFiles.length} API route files\n`);

  const endpoints: EndpointInfo[] = [];
  let totalEndpoints = 0;
  let filesWithIssues = 0;
  let criticalIssues = 0;
  let highIssues = 0;
  let mediumIssues = 0;
  let lowIssues = 0;
  let todoAuthComments = 0;
  let manualAuthChecks = 0;
  let missingOrgScoping = 0;
  let inconsistentErrorHandling = 0;

  // Scan each file
  for (const file of apiFiles) {
    const endpoint = scanApiFile(file);
    
    if (endpoint.methods.length > 0) {
      totalEndpoints += endpoint.methods.length;
      endpoints.push(endpoint);

      if (endpoint.issues.length > 0) {
        filesWithIssues++;
        
        endpoint.issues.forEach(issue => {
          switch (issue.severity) {
            case 'CRITICAL':
              criticalIssues++;
              break;
            case 'HIGH':
              highIssues++;
              break;
            case 'MEDIUM':
              mediumIssues++;
              break;
            case 'LOW':
              lowIssues++;
              break;
          }

          switch (issue.type) {
            case 'TODO_AUTH':
              todoAuthComments++;
              break;
            case 'MANUAL_AUTH':
              manualAuthChecks++;
              break;
            case 'MISSING_ORG_SCOPE':
              missingOrgScoping++;
              break;
            case 'INCONSISTENT_ERROR':
              inconsistentErrorHandling++;
              break;
          }
        });
      }
    }
  }

  // Generate report
  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalFiles: apiFiles.length,
    totalEndpoints,
    filesWithIssues,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    endpoints,
    summary: {
      todoAuthComments,
      manualAuthChecks,
      missingOrgScoping,
      inconsistentErrorHandling
    }
  };

  // Print summary
  console.log('📊 Audit Summary:');
  console.log('='.repeat(60));
  console.log(`Total API files: ${report.totalFiles}`);
  console.log(`Total endpoints: ${report.totalEndpoints}`);
  console.log(`Files with issues: ${report.filesWithIssues}`);
  console.log('\n🔴 Issues by Severity:');
  console.log(`  CRITICAL: ${criticalIssues}`);
  console.log(`  HIGH: ${highIssues}`);
  console.log(`  MEDIUM: ${mediumIssues}`);
  console.log(`  LOW: ${lowIssues}`);
  console.log('\n📋 Issues by Type:');
  console.log(`  TODO Auth Comments: ${todoAuthComments}`);
  console.log(`  Manual Auth Checks: ${manualAuthChecks}`);
  console.log(`  Missing Org Scoping: ${missingOrgScoping}`);
  console.log(`  Inconsistent Error Handling: ${inconsistentErrorHandling}`);

  // Print critical issues
  if (criticalIssues > 0) {
    console.log('\n🚨 CRITICAL Issues:');
    endpoints.forEach(endpoint => {
      endpoint.issues
        .filter(i => i.severity === 'CRITICAL')
        .forEach(issue => {
          console.log(`  ${issue.file}:${issue.line} - ${issue.description}`);
        });
    });
  }

  // Save report to file
  const reportDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, 'api-security-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved to: ${reportPath}`);

  return report;
}

// Run audit
if (require.main === module) {
  auditApiSecurity()
    .then(() => {
      console.log('\n✅ Audit complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

export { auditApiSecurity, SecurityIssue, EndpointInfo, AuditReport };
