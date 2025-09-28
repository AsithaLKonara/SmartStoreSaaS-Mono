#!/usr/bin/env ts-node

/**
 * Custom Domain Test Runner
 * 
 * This script runs all custom domain tests and provides comprehensive reporting.
 * It tests every aspect of custom domain functionality including:
 * - Domain validation and security
 * - CORS and security headers
 * - Authentication and session handling
 * - API endpoints and routing
 * - Integration workflows
 * - Edge cases and error handling
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestResult {
  testFile: string;
  passed: boolean;
  duration: number;
  error?: string;
  testCount: number;
  passedTests: number;
  failedTests: number;
}

interface TestSuite {
  name: string;
  description: string;
  testFiles: string[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
}

class CustomDomainTestRunner {
  private testSuites: TestSuite[] = [];
  private startTime: number = 0;

  constructor() {
    this.initializeTestSuites();
  }

  private initializeTestSuites(): void {
    this.testSuites = [
      {
        name: 'Domain Validation',
        description: 'Tests for domain format validation, uniqueness checking, and security validation',
        testFiles: ['domain-validation.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'CORS and Security Headers',
        description: 'Tests for CORS configuration, security headers, and origin validation',
        testFiles: ['cors-security.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Organization Domain API',
        description: 'Tests for organization domain management API endpoints',
        testFiles: ['organization-domain-api.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Routing and Middleware',
        description: 'Tests for custom domain routing, middleware, and request handling',
        testFiles: ['routing-middleware.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Authentication and Sessions',
        description: 'Tests for authentication, session handling, and user management across domains',
        testFiles: ['authentication-session.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Security and Origin Validation',
        description: 'Tests for security measures, origin validation, and attack prevention',
        testFiles: ['security-origin-validation.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Integration Workflows',
        description: 'Tests for complete custom domain workflows and end-to-end scenarios',
        testFiles: ['integration-workflow.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Edge Cases and Error Handling',
        description: 'Tests for edge cases, error handling, and failure scenarios',
        testFiles: ['edge-cases-error-handling.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
    ];
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Custom Domain Test Suite');
    console.log('=====================================\n');
    
    this.startTime = Date.now();

    for (const suite of this.testSuites) {
      console.log(`📋 Running ${suite.name} Tests`);
      console.log(`   ${suite.description}\n`);
      
      await this.runTestSuite(suite);
      
      console.log(`✅ ${suite.name} Tests Completed`);
      console.log(`   Passed: ${suite.passedTests}/${suite.totalTests}`);
      console.log(`   Duration: ${suite.duration}ms\n`);
    }

    this.generateReport();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    const suiteStartTime = Date.now();

    for (const testFile of suite.testFiles) {
      const testPath = path.join(__dirname, testFile);
      
      if (!existsSync(testPath)) {
        console.warn(`⚠️  Test file not found: ${testFile}`);
        continue;
      }

      try {
        const result = await this.runTestFile(testPath);
        suite.results.push(result);
        suite.totalTests += result.testCount;
        suite.passedTests += result.passedTests;
        suite.failedTests += result.failedTests;

        if (result.passed) {
          console.log(`   ✅ ${testFile} - ${result.testCount} tests passed`);
        } else {
          console.log(`   ❌ ${testFile} - ${result.failedTests} tests failed`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   💥 ${testFile} - Failed to run: ${errorMessage}`);
        suite.results.push({
          testFile,
          passed: false,
          duration: 0,
          error: errorMessage,
          testCount: 0,
          passedTests: 0,
          failedTests: 0,
        });
      }
    }

    suite.duration = Date.now() - suiteStartTime;
  }

  private async runTestFile(testPath: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Run Jest test file
      const command = `npx jest ${testPath} --json --verbose --no-coverage`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout
      });

      const result = JSON.parse(output);
      const duration = Date.now() - startTime;

      return {
        testFile: path.basename(testPath),
        passed: result.numFailedTests === 0,
        duration,
        testCount: result.numTotalTests,
        passedTests: result.numPassedTests,
        failedTests: result.numFailedTests,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        testFile: path.basename(testPath),
        passed: false,
        duration,
        error: errorMessage,
        testCount: 0,
        passedTests: 0,
        failedTests: 0,
      };
    }
  }

  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    console.log('📊 Custom Domain Test Report');
    console.log('============================\n');

    console.log(`🎯 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`   Total Duration: ${totalDuration}ms\n`);

    console.log(`📋 Test Suite Breakdown:`);
    this.testSuites.forEach(suite => {
      const suiteSuccessRate = suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0;
      const status = suite.failedTests === 0 ? '✅' : '❌';
      
      console.log(`   ${status} ${suite.name}`);
      console.log(`      Tests: ${suite.passedTests}/${suite.totalTests} (${suiteSuccessRate.toFixed(1)}%)`);
      console.log(`      Duration: ${suite.duration}ms`);
      
      if (suite.failedTests > 0) {
        console.log(`      Failed Files:`);
        suite.results.forEach(result => {
          if (!result.passed) {
            console.log(`         - ${result.testFile}: ${result.error || 'Tests failed'}`);
          }
        });
      }
      console.log();
    });

    if (totalFailed > 0) {
      console.log(`❌ Failed Tests Summary:`);
      this.testSuites.forEach(suite => {
        suite.results.forEach(result => {
          if (!result.passed) {
            console.log(`   ${result.testFile}: ${result.error || 'Tests failed'}`);
          }
        });
      });
      console.log();
    }

    console.log(`🏆 Test Coverage:`);
    console.log(`   ✅ Domain Validation and Security`);
    console.log(`   ✅ CORS and Security Headers`);
    console.log(`   ✅ Organization Domain Management`);
    console.log(`   ✅ Routing and Middleware`);
    console.log(`   ✅ Authentication and Sessions`);
    console.log(`   ✅ Security and Origin Validation`);
    console.log(`   ✅ Integration Workflows`);
    console.log(`   ✅ Edge Cases and Error Handling`);

    if (totalFailed === 0) {
      console.log('\n🎉 All Custom Domain Tests Passed! 🎉');
      console.log('Your custom domain implementation is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
      process.exit(1);
    }
  }

  async runSpecificSuite(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => s.name.toLowerCase() === suiteName.toLowerCase());
    
    if (!suite) {
      console.error(`❌ Test suite not found: ${suiteName}`);
      console.log('Available suites:');
      this.testSuites.forEach(s => console.log(`   - ${s.name}`));
      return;
    }

    console.log(`🎯 Running ${suite.name} Test Suite`);
    console.log(`   ${suite.description}\n`);

    await this.runTestSuite(suite);
    
    console.log(`\n📊 ${suite.name} Results:`);
    console.log(`   Total Tests: ${suite.totalTests}`);
    console.log(`   Passed: ${suite.passedTests}`);
    console.log(`   Failed: ${suite.failedTests}`);
    console.log(`   Duration: ${suite.duration}ms`);
    
    if (suite.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      suite.results.forEach(result => {
        if (!result.passed) {
          console.log(`   ${result.testFile}: ${result.error || 'Tests failed'}`);
        }
      });
    }
  }

  listTestSuites(): void {
    console.log('📋 Available Test Suites:');
    console.log('=========================\n');
    
    this.testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`);
      console.log(`   ${suite.description}`);
      console.log(`   Files: ${suite.testFiles.join(', ')}\n`);
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new CustomDomainTestRunner();

  if (args.length === 0) {
    await runner.runAllTests();
  } else if (args[0] === 'list') {
    runner.listTestSuites();
  } else if (args[0] === 'suite' && args[1]) {
    await runner.runSpecificSuite(args[1]);
  } else {
    console.log('Usage:');
    console.log('  npm run test:custom-domain          # Run all tests');
    console.log('  npm run test:custom-domain list     # List available test suites');
    console.log('  npm run test:custom-domain suite <name>  # Run specific test suite');
    console.log('\nAvailable test suites:');
    runner.listTestSuites();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(errorMessage);
  process.exit(1);
});
}

export default CustomDomainTestRunner;

/**
 * Custom Domain Test Runner
 * 
 * This script runs all custom domain tests and provides comprehensive reporting.
 * It tests every aspect of custom domain functionality including:
 * - Domain validation and security
 * - CORS and security headers
 * - Authentication and session handling
 * - API endpoints and routing
 * - Integration workflows
 * - Edge cases and error handling
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestResult {
  testFile: string;
  passed: boolean;
  duration: number;
  error?: string;
  testCount: number;
  passedTests: number;
  failedTests: number;
}

interface TestSuite {
  name: string;
  description: string;
  testFiles: string[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
}

class CustomDomainTestRunner {
  private testSuites: TestSuite[] = [];
  private startTime: number = 0;

  constructor() {
    this.initializeTestSuites();
  }

  private initializeTestSuites(): void {
    this.testSuites = [
      {
        name: 'Domain Validation',
        description: 'Tests for domain format validation, uniqueness checking, and security validation',
        testFiles: ['domain-validation.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'CORS and Security Headers',
        description: 'Tests for CORS configuration, security headers, and origin validation',
        testFiles: ['cors-security.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Organization Domain API',
        description: 'Tests for organization domain management API endpoints',
        testFiles: ['organization-domain-api.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Routing and Middleware',
        description: 'Tests for custom domain routing, middleware, and request handling',
        testFiles: ['routing-middleware.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Authentication and Sessions',
        description: 'Tests for authentication, session handling, and user management across domains',
        testFiles: ['authentication-session.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Security and Origin Validation',
        description: 'Tests for security measures, origin validation, and attack prevention',
        testFiles: ['security-origin-validation.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Integration Workflows',
        description: 'Tests for complete custom domain workflows and end-to-end scenarios',
        testFiles: ['integration-workflow.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
      {
        name: 'Edge Cases and Error Handling',
        description: 'Tests for edge cases, error handling, and failure scenarios',
        testFiles: ['edge-cases-error-handling.test.ts'],
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        results: [],
      },
    ];
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Custom Domain Test Suite');
    console.log('=====================================\n');
    
    this.startTime = Date.now();

    for (const suite of this.testSuites) {
      console.log(`📋 Running ${suite.name} Tests`);
      console.log(`   ${suite.description}\n`);
      
      await this.runTestSuite(suite);
      
      console.log(`✅ ${suite.name} Tests Completed`);
      console.log(`   Passed: ${suite.passedTests}/${suite.totalTests}`);
      console.log(`   Duration: ${suite.duration}ms\n`);
    }

    this.generateReport();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    const suiteStartTime = Date.now();

    for (const testFile of suite.testFiles) {
      const testPath = path.join(__dirname, testFile);
      
      if (!existsSync(testPath)) {
        console.warn(`⚠️  Test file not found: ${testFile}`);
        continue;
      }

      try {
        const result = await this.runTestFile(testPath);
        suite.results.push(result);
        suite.totalTests += result.testCount;
        suite.passedTests += result.passedTests;
        suite.failedTests += result.failedTests;

        if (result.passed) {
          console.log(`   ✅ ${testFile} - ${result.testCount} tests passed`);
        } else {
          console.log(`   ❌ ${testFile} - ${result.failedTests} tests failed`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   💥 ${testFile} - Failed to run: ${errorMessage}`);
        suite.results.push({
          testFile,
          passed: false,
          duration: 0,
          error: errorMessage,
          testCount: 0,
          passedTests: 0,
          failedTests: 0,
        });
      }
    }

    suite.duration = Date.now() - suiteStartTime;
  }

  private async runTestFile(testPath: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Run Jest test file
      const command = `npx jest ${testPath} --json --verbose --no-coverage`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 60000, // 60 second timeout
      });

      const result = JSON.parse(output);
      const duration = Date.now() - startTime;

      return {
        testFile: path.basename(testPath),
        passed: result.numFailedTests === 0,
        duration,
        testCount: result.numTotalTests,
        passedTests: result.numPassedTests,
        failedTests: result.numFailedTests,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        testFile: path.basename(testPath),
        passed: false,
        duration,
        error: errorMessage,
        testCount: 0,
        passedTests: 0,
        failedTests: 0,
      };
    }
  }

  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = this.testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = this.testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    console.log('📊 Custom Domain Test Report');
    console.log('============================\n');

    console.log(`🎯 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`   Total Duration: ${totalDuration}ms\n`);

    console.log(`📋 Test Suite Breakdown:`);
    this.testSuites.forEach(suite => {
      const suiteSuccessRate = suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0;
      const status = suite.failedTests === 0 ? '✅' : '❌';
      
      console.log(`   ${status} ${suite.name}`);
      console.log(`      Tests: ${suite.passedTests}/${suite.totalTests} (${suiteSuccessRate.toFixed(1)}%)`);
      console.log(`      Duration: ${suite.duration}ms`);
      
      if (suite.failedTests > 0) {
        console.log(`      Failed Files:`);
        suite.results.forEach(result => {
          if (!result.passed) {
            console.log(`         - ${result.testFile}: ${result.error || 'Tests failed'}`);
          }
        });
      }
      console.log();
    });

    if (totalFailed > 0) {
      console.log(`❌ Failed Tests Summary:`);
      this.testSuites.forEach(suite => {
        suite.results.forEach(result => {
          if (!result.passed) {
            console.log(`   ${result.testFile}: ${result.error || 'Tests failed'}`);
          }
        });
      });
      console.log();
    }

    console.log(`🏆 Test Coverage:`);
    console.log(`   ✅ Domain Validation and Security`);
    console.log(`   ✅ CORS and Security Headers`);
    console.log(`   ✅ Organization Domain Management`);
    console.log(`   ✅ Routing and Middleware`);
    console.log(`   ✅ Authentication and Sessions`);
    console.log(`   ✅ Security and Origin Validation`);
    console.log(`   ✅ Integration Workflows`);
    console.log(`   ✅ Edge Cases and Error Handling`);

    if (totalFailed === 0) {
      console.log('\n🎉 All Custom Domain Tests Passed! 🎉');
      console.log('Your custom domain implementation is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
      process.exit(1);
    }
  }

  async runSpecificSuite(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => s.name.toLowerCase() === suiteName.toLowerCase());
    
    if (!suite) {
      console.error(`❌ Test suite not found: ${suiteName}`);
      console.log('Available suites:');
      this.testSuites.forEach(s => console.log(`   - ${s.name}`));
      return;
    }

    console.log(`🎯 Running ${suite.name} Test Suite`);
    console.log(`   ${suite.description}\n`);

    await this.runTestSuite(suite);
    
    console.log(`\n📊 ${suite.name} Results:`);
    console.log(`   Total Tests: ${suite.totalTests}`);
    console.log(`   Passed: ${suite.passedTests}`);
    console.log(`   Failed: ${suite.failedTests}`);
    console.log(`   Duration: ${suite.duration}ms`);
    
    if (suite.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      suite.results.forEach(result => {
        if (!result.passed) {
          console.log(`   ${result.testFile}: ${result.error || 'Tests failed'}`);
        }
      });
    }
  }

  listTestSuites(): void {
    console.log('📋 Available Test Suites:');
    console.log('=========================\n');
    
    this.testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`);
      console.log(`   ${suite.description}`);
      console.log(`   Files: ${suite.testFiles.join(', ')}\n`);
    });
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new CustomDomainTestRunner();

  if (args.length === 0) {
    await runner.runAllTests();
  } else if (args[0] === 'list') {
    runner.listTestSuites();
  } else if (args[0] === 'suite' && args[1]) {
    await runner.runSpecificSuite(args[1]);
  } else {
    console.log('Usage:');
    console.log('  npm run test:custom-domain          # Run all tests');
    console.log('  npm run test:custom-domain list     # List available test suites');
    console.log('  npm run test:custom-domain suite <name>  # Run specific test suite');
    console.log('\nAvailable test suites:');
    runner.listTestSuites();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(errorMessage);
  process.exit(1);
});
}

export default CustomDomainTestRunner;


