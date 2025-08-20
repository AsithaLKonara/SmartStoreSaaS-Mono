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
    
    // Fix unused variables by commenting them out
    content = content.replace(/(\w+):\s*any\s*[,)]/g, (match, varName) => {
      updated = true;
      return `${varName}: unknown${match.slice(varName.length + 4)}`;
    });
    
    // Fix unused imports by commenting them out
    content = content.replace(/import\s*{\s*([^}]+)\s*}\s*from\s*['"][^'"]+['"];?/g, (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = importList.filter(imp => {
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
    
    // Fix React hook dependencies
    content = content.replace(/useEffect\s*\(\s*\(\)\s*=>\s*\{([^}]+)\}\s*,\s*\[\s*\]\s*\)/g, (match, body) => {
      // Extract function calls from useEffect body
      const functionCalls = body.match(/\b\w+\(/g) || [];
      const dependencies = functionCalls
        .map(call => call.slice(0, -1))
        .filter(name => !['console', 'setTimeout', 'setInterval'].includes(name))
        .filter((name, index, arr) => arr.indexOf(name) === index);
      
      if (dependencies.length > 0) {
        updated = true;
        return `useEffect(() => {${body}}, [${dependencies.join(', ')}])`;
      }
      return match;
    });
    
    // Fix unescaped entities
    content = content.replace(/(?<!\\)'/g, "&apos;");
    content = content.replace(/(?<!\\)"/g, "&quot;");
    
    // Fix prefer-const warnings
    content = content.replace(/let\s+(\w+)\s*=\s*([^;]+);\s*(?:\/\/\s*never\s+reassigned)?/g, (match, varName, value) => {
      if (value.includes('=') || value.includes('+=') || value.includes('-=')) {
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
