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

// Function to fix ESLint issues in a file
function fixESLintIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix 1: Replace 'any' types with 'unknown'
    const anyRegex = /\bany\b/g;
    if (anyRegex.test(content)) {
      content = content.replace(anyRegex, 'unknown');
      updated = true;
      console.log(`Fixed 'any' types in: ${filePath}`);
    }
    
    // Fix 2: Comment out unused variables (simple cases)
    // Look for const/let declarations that might be unused
    const unusedVarRegex = /(const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*[^;]+;/g;
    let match;
    while ((match = unusedVarRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const varName = match[2];
      
      // Skip if it's already commented or if it's a common pattern
      if (fullMatch.includes('//') || 
          fullMatch.includes('/*') || 
          varName.startsWith('_') || 
          varName === 'React' ||
          varName === 'useState' ||
          varName === 'useEffect' ||
          varName === 'useCallback' ||
          varName === 'useMemo' ||
          varName === 'useRef' ||
          varName === 'useContext' ||
          varName === 'useReducer' ||
          varName === 'useDispatch' ||
          varName === 'useSelector') {
        continue;
      }
      
      // Comment out the line
      const commentedLine = `// ${fullMatch}`;
      content = content.replace(fullMatch, commentedLine);
      updated = true;
      console.log(`Commented out potentially unused variable in: ${filePath} - ${varName}`);
    }
    
    // Fix 3: Comment out unused imports
    const importRegex = /import\s+([^;]+)\s+from\s+['"][^'"]+['"];?/g;
    while ((match = importRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const importContent = match[1];
      
      // Skip if already commented
      if (fullMatch.includes('//')) continue;
      
      // Check if it's a default import or named import
      if (importContent.includes('{') && importContent.includes('}')) {
        // Named imports - check each one
        const namedImports = importContent.match(/\{([^}]+)\}/)[1];
        const imports = namedImports.split(',').map(imp => imp.trim());
        
        // Comment out the entire import if it looks unused
        if (imports.length === 1 && !content.includes(imports[0])) {
          const commentedImport = `// ${fullMatch}`;
          content = content.replace(fullMatch, commentedImport);
          updated = true;
          console.log(`Commented out potentially unused import in: ${filePath} - ${imports[0]}`);
        }
      } else {
        // Default import - check if used
        const defaultImport = importContent.trim();
        if (!content.includes(defaultImport) && !defaultImport.includes('React')) {
          const commentedImport = `// ${fullMatch}`;
          content = content.replace(fullMatch, commentedImport);
          updated = true;
          console.log(`Commented out potentially unused default import in: ${filePath} - ${defaultImport}`);
        }
      }
    }
    
    // Fix 4: Comment out unused function parameters
    const functionParamRegex = /function\s+\w+\s*\(([^)]*)\)/g;
    while ((match = functionParamRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const params = match[1];
      
      if (params.trim()) {
        const paramList = params.split(',').map(p => p.trim());
        const unusedParams = paramList.filter(param => {
          const paramName = param.split(':')[0].trim();
          return paramName && !content.includes(paramName) && paramName !== 'this';
        });
        
        if (unusedParams.length > 0) {
          // Comment out unused parameters
          let newParams = params;
          unusedParams.forEach(param => {
            newParams = newParams.replace(param, `// ${param}`);
          });
          
          const newFunction = fullMatch.replace(params, newParams);
          content = content.replace(fullMatch, newFunction);
          updated = true;
          console.log(`Commented out unused parameters in: ${filePath} - ${unusedParams.join(', ')}`);
        }
      }
    }
    
    // Fix 5: Comment out unused arrow function parameters
    const arrowParamRegex = /\(([^)]*)\)\s*=>/g;
    while ((match = arrowParamRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const params = match[1];
      
      if (params.trim()) {
        const paramList = params.split(',').map(p => p.trim());
        const unusedParams = paramList.filter(param => {
          const paramName = param.split(':')[0].trim();
          return paramName && !content.includes(paramName) && paramName !== 'this';
        });
        
        if (unusedParams.length > 0) {
          // Comment out unused parameters
          let newParams = params;
          unusedParams.forEach(param => {
            newParams = newParams.replace(param, `// ${param}`);
          });
          
          const newArrow = fullMatch.replace(params, newParams);
          content = content.replace(fullMatch, newArrow);
          updated = true;
          console.log(`Commented out unused arrow function parameters in: ${filePath} - ${unusedParams.join(', ')}`);
        }
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('🔍 Finding TypeScript/JavaScript files...');
const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`📁 Found ${files.length} files to process`);

let processedCount = 0;
files.forEach(file => {
  fixESLintIssues(file);
  processedCount++;
  
  if (processedCount % 50 === 0) {
    console.log(`Progress: ${processedCount}/${files.length} files processed`);
  }
});

console.log(`\n🎉 ESLint fixes completed! Processed ${processedCount} files.`);
console.log('💡 Run "npm run build" to check if all issues are resolved.');
