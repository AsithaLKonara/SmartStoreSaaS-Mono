const fs = require('fs');
const path = require('path');

function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  
  return results;
}

function fixUnusedVars(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix unused imports
    const importRegex = /import\s+([^;]+)\s+from\s+['"][^'"]+['"];?/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const importContent = match[1];
      
      // Skip if already commented
      if (fullMatch.includes('//')) continue;
      
      // Check for named imports
      if (importContent.includes('{') && importContent.includes('}')) {
        const namedImports = importContent.match(/\{([^}]+)\}/)[1];
        const imports = namedImports.split(',').map(imp => imp.trim());
        
        // Check each import
        imports.forEach(imp => {
          const importName = imp.split(' as ')[0].trim();
          if (importName && !content.includes(importName) && importName !== 'React') {
            // Comment out this specific import
            const newImport = importContent.replace(imp, `// ${imp}`);
            content = content.replace(importContent, newImport);
            updated = true;
            console.log(`Commented unused import in ${filePath}: ${importName}`);
          }
        });
      } else {
        // Default import
        const defaultImport = importContent.trim();
        if (defaultImport && !content.includes(defaultImport) && defaultImport !== 'React') {
          const commentedImport = `// ${fullMatch}`;
          content = content.replace(fullMatch, commentedImport);
          updated = true;
          console.log(`Commented unused default import in ${filePath}: ${defaultImport}`);
        }
      }
    }
    
    // Fix unused function parameters
    const functionRegex = /function\s+\w+\s*\(([^)]*)\)/g;
    while ((match = functionRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const params = match[1];
      
      if (params.trim()) {
        const paramList = params.split(',').map(p => p.trim());
        paramList.forEach(param => {
          const paramName = param.split(':')[0].trim();
          if (paramName && !content.includes(paramName) && paramName !== 'this') {
            // Comment out unused parameter
            const newParams = params.replace(param, `// ${param}`);
            const newFunction = fullMatch.replace(params, newParams);
            content = content.replace(fullMatch, newFunction);
            updated = true;
            console.log(`Commented unused parameter in ${filePath}: ${paramName}`);
          }
        });
      }
    }
    
    // Fix unused arrow function parameters
    const arrowRegex = /\(([^)]*)\)\s*=>/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const params = match[1];
      
      if (params.trim()) {
        const paramList = params.split(',').map(p => p.trim());
        paramList.forEach(param => {
          const paramName = param.split(':')[0].trim();
          if (paramName && !content.includes(paramName) && paramName !== 'this') {
            // Comment out unused parameter
            const newParams = params.replace(param, `// ${param}`);
            const newArrow = fullMatch.replace(params, newParams);
            content = content.replace(fullMatch, newArrow);
            updated = true;
            console.log(`Commented unused arrow parameter in ${filePath}: ${paramName}`);
          }
        });
      }
    }
    
    // Fix unused variables
    const varRegex = /(const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g;
    while ((match = varRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const varName = match[2];
      
      // Skip if already commented or if it's a common pattern
      if (fullMatch.includes('//') || 
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
      
      // Check if variable is used
      const lines = content.split('\n');
      let varUsed = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(varName) && !line.includes(fullMatch) && !line.includes('//')) {
          varUsed = true;
          break;
        }
      }
      
      if (!varUsed) {
        // Comment out the line
        const commentedLine = `// ${fullMatch}`;
        content = content.replace(fullMatch, commentedLine);
        updated = true;
        console.log(`Commented unused variable in ${filePath}: ${varName}`);
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

const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} TypeScript files`);

files.forEach(fixUnusedVars);

console.log('Unused variables and imports fix completed!');
