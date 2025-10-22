/**
 * Frontend API Integration Check
 * Scans frontend code for API calls and validates integration patterns
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface APICall {
  file: string;
  line: number;
  method: string;
  endpoint: string;
  type: 'fetch' | 'axios' | 'swr' | 'react-query' | 'other';
}

interface IntegrationIssue {
  file: string;
  line: number;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

class FrontendAPIChecker {
  private apiCalls: APICall[] = [];
  private issues: IntegrationIssue[] = [];
  private srcPath = 'src';

  async checkFrontendIntegrations(): Promise<void> {
    console.log('🔍 Starting Frontend API Integration Check...\n');

    // Scan all frontend files
    await this.scanDirectory(this.srcPath);

    // Analyze findings
    this.analyzeAPICalls();
    this.checkErrorHandling();
    this.checkLoadingStates();
    this.checkDataFlow();
    this.checkAuthentication();

    // Generate report
    this.generateReport();
  }

  private async scanDirectory(dir: string): Promise<void> {
    try {
      const files = readdirSync(dir);
      
      for (const file of files) {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        
        if (stat.isDirectory()) {
          await this.scanDirectory(filePath);
        } else if (this.isFrontendFile(file)) {
          await this.scanFile(filePath);
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not scan directory ${dir}: ${error}`);
    }
  }

  private isFrontendFile(file: string): boolean {
    return file.endsWith('.tsx') || 
           file.endsWith('.ts') || 
           file.endsWith('.jsx') || 
           file.endsWith('.js');
  }

  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        this.scanLineForAPICalls(filePath, line, index + 1);
      });
    } catch (error) {
      console.log(`⚠️ Could not read file ${filePath}: ${error}`);
    }
  }

  private scanLineForAPICalls(file: string, line: string, lineNumber: number): void {
    // Check for fetch calls
    const fetchMatch = line.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (fetchMatch) {
      this.apiCalls.push({
        file,
        line: lineNumber,
        method: this.extractMethod(line),
        endpoint: fetchMatch[1],
        type: 'fetch'
      });
    }

    // Check for axios calls
    const axiosMatch = line.match(/(axios|api)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (axiosMatch) {
      this.apiCalls.push({
        file,
        line: lineNumber,
        method: axiosMatch[2].toUpperCase(),
        endpoint: axiosMatch[3],
        type: 'axios'
      });
    }

    // Check for SWR useSWR calls
    const swrMatch = line.match(/useSWR\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (swrMatch) {
      this.apiCalls.push({
        file,
        line: lineNumber,
        method: 'GET',
        endpoint: swrMatch[1],
        type: 'swr'
      });
    }

    // Check for React Query useQuery calls
    const queryMatch = line.match(/useQuery\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (queryMatch) {
      this.apiCalls.push({
        file,
        line: lineNumber,
        method: 'GET',
        endpoint: queryMatch[1],
        type: 'react-query'
      });
    }

    // Check for custom API calls
    const customMatch = line.match(/(api|API)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (customMatch) {
      this.apiCalls.push({
        file,
        line: lineNumber,
        method: customMatch[2].toUpperCase(),
        endpoint: customMatch[3],
        type: 'other'
      });
    }
  }

  private extractMethod(line: string): string {
    if (line.includes('method:') || line.includes('method =')) {
      const methodMatch = line.match(/method\s*[:=]\s*['"`]([^'"`]+)['"`]/);
      return methodMatch ? methodMatch[1].toUpperCase() : 'GET';
    }
    return 'GET';
  }

  private analyzeAPICalls(): void {
    console.log('📊 API Calls Analysis:');
    console.log('='.repeat(50));

    const callsByType = this.apiCalls.reduce((acc, call) => {
      acc[call.type] = (acc[call.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const callsByMethod = this.apiCalls.reduce((acc, call) => {
      acc[call.method] = (acc[call.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`Total API calls found: ${this.apiCalls.length}`);
    console.log('\nBy Type:');
    Object.entries(callsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    console.log('\nBy Method:');
    Object.entries(callsByMethod).forEach(([method, count]) => {
      console.log(`  ${method}: ${count}`);
    });

    console.log('\nAPI Endpoints:');
    const endpoints = [...new Set(this.apiCalls.map(call => call.endpoint))];
    endpoints.forEach(endpoint => {
      const count = this.apiCalls.filter(call => call.endpoint === endpoint).length;
      console.log(`  ${endpoint} (${count} calls)`);
    });
  }

  private checkErrorHandling(): void {
    console.log('\n🔍 Checking Error Handling...');
    console.log('='.repeat(50));

    let errorHandlingCount = 0;
    let missingErrorHandling = 0;

    this.apiCalls.forEach(call => {
      // This is a simplified check - in reality, we'd need to analyze the surrounding code
      const hasTryCatch = this.checkForTryCatch(call.file, call.line);
      const hasCatchBlock = this.checkForCatchBlock(call.file, call.line);
      
      if (hasTryCatch || hasCatchBlock) {
        errorHandlingCount++;
      } else {
        missingErrorHandling++;
        this.issues.push({
          file: call.file,
          line: call.line,
          issue: 'Missing error handling for API call',
          severity: 'warning',
          suggestion: 'Add try-catch block or .catch() handler'
        });
      }
    });

    console.log(`✅ API calls with error handling: ${errorHandlingCount}`);
    console.log(`⚠️ API calls missing error handling: ${missingErrorHandling}`);
  }

  private checkForTryCatch(file: string, lineNumber: number): boolean {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      // Check 5 lines before and after for try-catch
      const start = Math.max(0, lineNumber - 6);
      const end = Math.min(lines.length, lineNumber + 5);
      
      const relevantLines = lines.slice(start, end).join('\n');
      return relevantLines.includes('try {') || relevantLines.includes('try{');
    } catch {
      return false;
    }
  }

  private checkForCatchBlock(file: string, lineNumber: number): boolean {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      // Check 5 lines before and after for .catch()
      const start = Math.max(0, lineNumber - 6);
      const end = Math.min(lines.length, lineNumber + 5);
      
      const relevantLines = lines.slice(start, end).join('\n');
      return relevantLines.includes('.catch(') || relevantLines.includes('.catch (');
    } catch {
      return false;
    }
  }

  private checkLoadingStates(): void {
    console.log('\n🔍 Checking Loading States...');
    console.log('='.repeat(50));

    let loadingStatesCount = 0;
    let missingLoadingStates = 0;

    // This is a simplified check - we'd need more sophisticated analysis
    this.apiCalls.forEach(call => {
      const hasLoadingState = this.checkForLoadingState(call.file, call.line);
      
      if (hasLoadingState) {
        loadingStatesCount++;
      } else {
        missingLoadingStates++;
        this.issues.push({
          file: call.file,
          line: call.line,
          issue: 'Missing loading state for API call',
          severity: 'info',
          suggestion: 'Add loading state management (useState, SWR loading, etc.)'
        });
      }
    });

    console.log(`✅ API calls with loading states: ${loadingStatesCount}`);
    console.log(`ℹ️ API calls missing loading states: ${missingLoadingStates}`);
  }

  private checkForLoadingState(file: string, lineNumber: number): boolean {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      
      // Check for common loading patterns
      const start = Math.max(0, lineNumber - 10);
      const end = Math.min(lines.length, lineNumber + 10);
      
      const relevantLines = lines.slice(start, end).join('\n');
      
      return relevantLines.includes('loading') ||
             relevantLines.includes('isLoading') ||
             relevantLines.includes('isPending') ||
             relevantLines.includes('Spinner') ||
             relevantLines.includes('Loading');
    } catch {
      return false;
    }
  }

  private checkDataFlow(): void {
    console.log('\n🔍 Checking Data Flow...');
    console.log('='.repeat(50));

    // Check for proper data handling patterns
    const dataFlowIssues = this.apiCalls.filter(call => {
      return !call.endpoint.startsWith('/api/') && 
             !call.endpoint.startsWith('http') &&
             !call.endpoint.startsWith('https');
    });

    dataFlowIssues.forEach(call => {
      this.issues.push({
        file: call.file,
        line: call.line,
        issue: 'API endpoint may be malformed',
        severity: 'warning',
        suggestion: 'Ensure API endpoint starts with /api/ or full URL'
      });
    });

    console.log(`✅ Proper API endpoints: ${this.apiCalls.length - dataFlowIssues.length}`);
    console.log(`⚠️ Potentially malformed endpoints: ${dataFlowIssues.length}`);
  }

  private checkAuthentication(): void {
    console.log('\n🔍 Checking Authentication Integration...');
    console.log('='.repeat(50));

    let authCalls = 0;
    let publicCalls = 0;

    this.apiCalls.forEach(call => {
      if (call.endpoint.includes('/auth/') || 
          call.endpoint.includes('/login') || 
          call.endpoint.includes('/logout')) {
        authCalls++;
      } else {
        publicCalls++;
      }
    });

    console.log(`🔐 Authentication-related API calls: ${authCalls}`);
    console.log(`🌐 Public API calls: ${publicCalls}`);

    // Check for session management
    const sessionChecks = this.apiCalls.filter(call => 
      call.endpoint.includes('/session') || 
      call.endpoint.includes('/me') ||
      call.endpoint.includes('/profile')
    );

    console.log(`👤 Session management calls: ${sessionChecks.length}`);
  }

  private generateReport(): void {
    console.log('\n📋 Frontend Integration Report');
    console.log('='.repeat(50));

    if (this.issues.length === 0) {
      console.log('✅ No integration issues found!');
    } else {
      console.log(`Found ${this.issues.length} integration issues:\n`);

      const issuesBySeverity = this.issues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Issues by severity:');
      Object.entries(issuesBySeverity).forEach(([severity, count]) => {
        const icon = severity === 'error' ? '❌' : severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`  ${icon} ${severity}: ${count}`);
      });

      console.log('\nDetailed Issues:');
      this.issues.forEach((issue, index) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`\n${index + 1}. ${icon} ${issue.issue}`);
        console.log(`   File: ${issue.file}:${issue.line}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
      });
    }

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAPICalls: this.apiCalls.length,
        totalIssues: this.issues.length,
        issuesBySeverity: this.issues.reduce((acc, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      apiCalls: this.apiCalls,
      issues: this.issues
    };

    const fs = require('fs');
    fs.writeFileSync('test-results/frontend-integration-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: test-results/frontend-integration-report.json');
  }
}

// Run the check
const checker = new FrontendAPIChecker();
checker.checkFrontendIntegrations()
  .then(() => {
    console.log('\n✅ Frontend integration check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Frontend integration check failed:', error);
    process.exit(1);
  });
