#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle size...\n');

// Set environment variable for bundle analysis
process.env.ANALYZE = 'true';

try {
  // Build the application with bundle analysis
  console.log('Building application with bundle analyzer...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Bundle analysis complete!');
  console.log('📊 Check the generated report in your browser.');
  
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
  process.exit(1);
}

// Generate bundle size report
const generateReport = () => {
  const nextDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(nextDir)) {
    console.log('⚠️  Build directory not found. Run "npm run build" first.');
    return;
  }

  const staticDir = path.join(nextDir, 'static');
  
  if (!fs.existsSync(staticDir)) {
    console.log('⚠️  Static directory not found.');
    return;
  }

  let totalSize = 0;
  const files = [];

  const scanDirectory = (dir, prefix = '') => {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, prefix + item + '/');
      } else {
        const size = stat.size;
        totalSize += size;
        files.push({
          name: prefix + item,
          size: size,
          sizeKB: Math.round(size / 1024 * 100) / 100
        });
      }
    });
  };

  scanDirectory(staticDir);

  // Sort files by size
  files.sort((a, b) => b.size - a.size);

  console.log('\n📦 Bundle Size Report:');
  console.log('=' .repeat(50));
  console.log(`Total Size: ${Math.round(totalSize / 1024 / 1024 * 100) / 100} MB`);
  console.log('=' .repeat(50));
  
  console.log('\nTop 10 Largest Files:');
  files.slice(0, 10).forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}: ${file.sizeKB} KB`);
  });

  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  
  const largeFiles = files.filter(f => f.sizeKB > 100);
  if (largeFiles.length > 0) {
    console.log('• Consider code splitting for large files:');
    largeFiles.forEach(file => {
      console.log(`  - ${file.name} (${file.sizeKB} KB)`);
    });
  }

  const jsFiles = files.filter(f => f.name.endsWith('.js'));
  const totalJSSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
  
  if (totalJSSize > 500 * 1024) { // 500KB
    console.log('• JavaScript bundle is large. Consider:');
    console.log('  - Dynamic imports for route-based code splitting');
    console.log('  - Tree shaking unused code');
    console.log('  - Using lighter alternatives for heavy libraries');
  }

  const cssFiles = files.filter(f => f.name.endsWith('.css'));
  const totalCSSSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
  
  if (totalCSSSize > 100 * 1024) { // 100KB
    console.log('• CSS bundle is large. Consider:');
    console.log('  - Purging unused CSS');
    console.log('  - Using CSS-in-JS for component-scoped styles');
    console.log('  - Optimizing images and fonts');
  }

  console.log('\n🎯 Target Goals:');
  console.log('• Initial bundle: < 250KB (gzipped)');
  console.log('• Total JavaScript: < 500KB (gzipped)');
  console.log('• Total CSS: < 100KB (gzipped)');
  console.log('• First Contentful Paint: < 1.5s');
  console.log('• Largest Contentful Paint: < 2.5s');
};

generateReport();




