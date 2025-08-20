const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Function to fix unknown$2 issues
function fixUnknownIssues(content) {
  let updated = content;
  
  // Fix function parameter types
  updated = updated.replace(/(\w+):\s*unknown\$2\s*[,)]/g, '$1: unknown$2');
  updated = updated.replace(/(\w+):\s*unknown\$2\s*=\s*([^,;]+)/g, '$1: unknown = $2');
  updated = updated.replace(/(\w+):\s*unknown\$2\s*:\s*([^,;]+)/g, '$1: unknown: $2');
  
  // Fix function return types
  updated = updated.replace(/:\s*unknown\$2\s*=>/g, ': unknown =>');
  updated = updated.replace(/:\s*unknown\$2\s*\{/g, ': unknown {');
  
  // Fix variable declarations
  updated = updated.replace(/(\w+)\s*:\s*unknown\$2\s*;/g, '$1: unknown;');
  updated = updated.replace(/(\w+)\s*:\s*unknown\$2\s*=/g, '$1: unknown =');
  
  // Fix generic constraints
  updated = updated.replace(/<T\s+extends\s+unknown\$2>/g, '<T extends unknown>');
  updated = updated.replace(/<T\s*,\s*unknown\$2>/g, '<T, unknown>');
  
  // Fix specific patterns
  updated = updated.replace(/Promise<unknown\$2>/g, 'Promise<unknown>');
  updated = updated.replace(/Array<unknown\$2>/g, 'Array<unknown>');
  updated = updated.replace(/Record<string,\s*unknown\$2>/g, 'Record<string, unknown>');
  
  // Fix map function parameters
  updated = updated.replace(/\.map\(\((\w+):\s*unknown\$2\s*\)/g, '.map(($1: unknown)');
  updated = updated.replace(/\.map\(\((\w+):\s*unknown\$2\s*=>/g, '.map(($1: unknown =>');
  
  // Fix filter function parameters
  updated = updated.replace(/\.filter\(\((\w+):\s*unknown\$2\s*\)/g, '.filter(($1: unknown)');
  updated = updated.replace(/\.filter\(\((\w+):\s*unknown\$2\s*=>/g, '.filter(($1: unknown =>');
  
  // Fix reduce function parameters
  updated = updated.replace(/\.reduce\(\((\w+):\s*unknown\$2\s*,\s*(\w+):\s*unknown\$2\s*\)/g, '.reduce(($1: unknown, $2: unknown)');
  updated = updated.replace(/\.reduce\(\((\w+):\s*unknown\$2\s*,\s*(\w+):\s*unknown\$2\s*=>/g, '.reduce(($1: unknown, $2: unknown =>');
  
  // Fix forEach function parameters
  updated = updated.replace(/\.forEach\(\((\w+):\s*unknown\$2\s*\)/g, '.forEach(($1: unknown)');
  updated = updated.replace(/\.forEach\(\((\w+):\s*unknown\$2\s*=>/g, '.forEach(($1: unknown =>');
  
  // Fix some function parameters
  updated = updated.replace(/\.some\(\((\w+):\s*unknown\$2\s*\)/g, '.some(($1: unknown)');
  updated = updated.replace(/\.some\(\((\w+):\s*unknown\$2\s*=>/g, '.some(($1: unknown =>');
  
  // Fix every function parameters
  updated = updated.replace(/\.every\(\((\w+):\s*unknown\$2\s*\)/g, '.every(($1: unknown)');
  updated = updated.replace(/\.every\(\((\w+):\s*unknown\$2\s*=>/g, '.every(($1: unknown =>');
  
  // Fix find function parameters
  updated = updated.replace(/\.find\(\((\w+):\s*unknown\$2\s*\)/g, '.find(($1: unknown)');
  updated = updated.replace(/\.find\(\((\w+):\s*unknown\$2\s*=>/g, '.find(($1: unknown =>');
  
  // Fix findIndex function parameters
  updated = updated.replace(/\.findIndex\(\((\w+):\s*unknown\$2\s*\)/g, '.findIndex(($1: unknown)');
  updated = updated.replace(/\.findIndex\(\((\w+):\s*unknown\$2\s*=>/g, '.findIndex(($1: unknown =>');
  
  // Fix flatMap function parameters
  updated = updated.replace(/\.flatMap\(\((\w+):\s*unknown\$2\s*\)/g, '.flatMap(($1: unknown)');
  updated = updated.replace(/\.flatMap\(\((\w+):\s*unknown\$2\s*=>/g, '.flatMap(($1: unknown =>');
  
  // Fix sort function parameters
  updated = updated.replace(/\.sort\(\((\w+):\s*unknown\$2\s*,\s*(\w+):\s*unknown\$2\s*\)/g, '.sort(($1: unknown, $2: unknown)');
  updated = updated.replace(/\.sort\(\((\w+):\s*unknown\$2\s*,\s*(\w+):\s*unknown\$2\s*=>/g, '.sort(($1: unknown, $2: unknown =>');
  
  // Fix callback function parameters
  updated = updated.replace(/callback:\s*\((\w+):\s*unknown\$2\s*\)/g, 'callback: ($1: unknown)');
  updated = updated.replace(/callback:\s*\((\w+):\s*unknown\$2\s*=>/g, 'callback: ($1: unknown =>');
  
  // Fix async function parameters
  updated = updated.replace(/async\s+function\s+(\w+)\(([^)]*unknown\$2[^)]*\)/g, (match, funcName, params) => {
    return `async function ${funcName}(${params.replace(/unknown\$2/g, 'unknown')})`;
  });
  
  // Fix arrow function parameters
  updated = updated.replace(/\(([^)]*unknown\$2[^)]*)\)\s*=>/g, (match, params) => {
    return `(${params.replace(/unknown\$2/g, 'unknown')}) =>`;
  });
  
  return updated;
}

// Main function to process all files
function processFiles() {
  console.log('🔍 Finding all TypeScript/JavaScript files...');
  const files = findFiles('./src');
  
  console.log(`📁 Found ${files.length} files to process`);
  
  let totalChanges = 0;
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file contains unknown$2
      if (content.includes('unknown$2')) {
        const updated = fixUnknownIssues(content);
        
        if (updated !== content) {
          fs.writeFileSync(filePath, updated, 'utf8');
          totalChanges++;
          console.log(`✅ Fixed: ${filePath}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });
  
  console.log(`\n🎉 Processing complete! Fixed ${totalChanges} files.`);
  console.log('📝 Now run: npm run build');
}

// Run the script
processFiles();
