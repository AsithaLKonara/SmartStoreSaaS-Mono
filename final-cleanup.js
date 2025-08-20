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

// Function to fix remaining ESLint issues
function fixRemainingIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix remaining any types in type annotations
    content = content.replace(/(\w+):\s*any\s*[,)]/g, (match, varName) => {
      updated = true;
      return `${varName}: unknown${match.slice(varName.length + 4)}`;
    });
    
    // Fix any types in function parameters
    content = content.replace(/:\s*any\s*[,)]/g, (match) => {
      updated = true;
      return `: unknown${match.slice(4)}`;
    });
    
    // Fix any types in return types
    content = content.replace(/:\s*Promise<any>/g, ': Promise<unknown>');
    content = content.replace(/:\s*any\[\]/g, ': unknown[]');
    content = content.replace(/:\s*Record<string,\s*any>/g, ': Record<string, unknown>');
    
    // Fix unused imports by commenting them out
    content = content.replace(/import\s*{\s*([^}]+)\s*}\s*from\s*['"][^'"]+['"];?/g, (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = importList.filter(imp => {
        if (!imp) return false;
        const varName = imp.replace(/\s+as\s+\w+/, '').trim();
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        const count = (content.match(regex) || []).length;
        return count > 1; // More than just the import declaration
      });
      
      if (usedImports.length === 0) {
        updated = true;
        return `// ${match} // Unused import`;
      } else if (usedImports.length < importList.length) {
        updated = true;
        return `import { ${usedImports.join(', ')} } from '${match.match(/from\s+['"]([^'"]+)['"]/)[1]}';`;
      }
      return match;
    });
    
    // Fix unused function parameters by commenting them out
    content = content.replace(/function\s+\w+\s*\([^)]*\)\s*\{/g, (match) => {
      const paramsMatch = match.match(/\(([^)]*)\)/);
      if (paramsMatch) {
        const params = paramsMatch[1].split(',').map(p => p.trim());
        const bodyStart = content.indexOf(match) + match.length;
        const bodyEnd = content.indexOf('}', bodyStart);
        const body = content.substring(bodyStart, bodyEnd);
        
        const unusedParams = params.filter(param => {
          if (!param) return false;
          const paramName = param.split(':')[0].trim();
          const regex = new RegExp(`\\b${paramName}\\b`, 'g');
          const count = (body.match(regex) || []).length;
          return count === 0;
        });
        
        if (unusedParams.length > 0) {
          updated = true;
          const newParams = params.map(param => {
            if (!param) return param;
            const paramName = param.split(':')[0].trim();
            if (unusedParams.includes(paramName)) {
              return `// ${param} // Unused parameter`;
            }
            return param;
          });
          return match.replace(paramsMatch[0], `(${newParams.join(', ')})`);
        }
      }
      return match;
    });
    
    // Fix unused variables by commenting them out
    content = content.replace(/(\w+)\s*=\s*([^;]+);\s*(?:\/\/\s*assigned\s+a\s+value\s+but\s+never\s+used)?/g, (match, varName, value) => {
      // Check if this variable is actually used elsewhere in the file
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      const count = (content.match(regex) || []).length;
      if (count === 1) { // Only the assignment
        updated = true;
        return `// ${match} // Unused variable`;
      }
      return match;
    });
    
    // Fix prefer-const warnings
    content = content.replace(/let\s+(\w+)\s*=\s*([^;]+);\s*(?:\/\/\s*never\s+reassigned)?/g, (match, varName, value) => {
      if (value.includes('=') || value.includes('+=') || value.includes('-=') || value.includes('*=') || value.includes('/=')) {
        return match; // Keep as let if it's being modified
      }
      updated = true;
      return `const ${varName} = ${value};`;
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed remaining issues in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('Starting final cleanup...');

const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to process`);

files.forEach(fixRemainingIssues);

console.log('Final cleanup completed!');
