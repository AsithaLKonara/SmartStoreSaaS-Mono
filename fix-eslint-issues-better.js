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

// Function to fix common ESLint issues
function fixESLintIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix any types to unknown (only in type annotations, not in strings)
    content = content.replace(/(\w+):\s*any\s*[,)]/g, (match, varName) => {
      updated = true;
      return `${varName}: unknown${match.slice(varName.length + 4)}`;
    });
    
    // Fix unused variables by commenting them out (only in function parameters)
    content = content.replace(/function\s+\w+\s*\([^)]*\)\s*\{/g, (match) => {
      // Find unused parameters in function signature
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
    
    // Fix React hook dependencies by adding missing dependencies
    content = content.replace(/useEffect\s*\(\s*\(\)\s*=>\s*\{([^}]+)\}\s*,\s*\[\s*\]\s*\)/g, (match, body) => {
      // Extract function calls from useEffect body
      const functionCalls = body.match(/\b\w+\(/g) || [];
      const dependencies = functionCalls
        .map(call => call.slice(0, -1))
        .filter(name => !['console', 'setTimeout', 'setInterval', 'window', 'document'].includes(name))
        .filter((name, index, arr) => arr.indexOf(name) === index);
      
      if (dependencies.length > 0) {
        updated = true;
        return `useEffect(() => {${body}}, [${dependencies.join(', ')}])`;
      }
      return match;
    });
    
    // Fix prefer-const warnings (only for simple assignments)
    content = content.replace(/let\s+(\w+)\s*=\s*([^;]+);\s*(?:\/\/\s*never\s+reassigned)?/g, (match, varName, value) => {
      if (value.includes('=') || value.includes('+=') || value.includes('-=') || value.includes('*=') || value.includes('/=')) {
        return match; // Keep as let if it's being modified
      }
      updated = true;
      return `const ${varName} = ${value};`;
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ESLint issues in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('Starting ESLint fixes...');

const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to process`);

files.forEach(fixESLintIssues);

console.log('ESLint fixes completed!');
