const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('==================================================');
console.log('🛡️  SRE PRE-DEPLOYMENT SAFETY CHECKLIST STARTING...');
console.log('==================================================\n');

let failed = false;

// Helper to run a shell command and print status
function runCheck(name, command) {
  process.stdout.write(`👉 Checking ${name}... `);
  try {
    execSync(command, { stdio: 'ignore' });
    console.log('✅ PASS');
    return true;
  } catch (err) {
    console.log('❌ FAIL');
    console.error(`   Error details: Command failed: "${command}"\n`);
    failed = true;
    return false;
  }
}

// 1. Prisma Schema Validation
runCheck('Prisma Schema Validity', 'npx prisma validate');

// 2. Lint Check (ensure no syntax or export issues)
runCheck('Code Linter validation', 'npm run lint');

// 3. Typesafe build compiles for active hardened services
runCheck('Typescript Compilation build check', 'npx tsc -p tsconfig.predeploy.json --noEmit');

// 4. Config Schema Module verification
process.stdout.write('👉 Verifying Config Validation module structure... ');
const configPath = path.join(__dirname, '../src/lib/config-validator.ts');
if (fs.existsSync(configPath)) {
  console.log('✅ PASS');
} else {
  console.log('❌ FAIL (config-validator.ts missing)');
  failed = true;
}

// 5. Health API endpoint existence check
process.stdout.write('👉 Verifying Health check endpoint file structure... ');
const healthPath = path.join(__dirname, '../src/app/api/health/route.ts');
if (fs.existsSync(healthPath)) {
  console.log('✅ PASS');
} else {
  console.log('❌ FAIL (health check endpoint route file missing)');
  failed = true;
}

console.log('\n==================================================');
if (failed) {
  console.error('❌ PRE-DEPLOYMENT SAFETY CHECKLIST FAILED!');
  console.error('   Please resolve the issues listed above before deploying to production.');
  console.log('==================================================');
  process.exit(1);
} else {
  console.log('🎉 ALL SRE PRE-DEPLOYMENT VERIFICATION CHECKS PASSED!');
  console.log('   The codebase is officially marked PRODUCTION-READY.');
  console.log('==================================================');
  process.exit(0);
}
