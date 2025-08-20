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

// Function to fix any types to unknown (only in type annotations)
function fixAnyTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Fix any types in type annotations (only when followed by comma, parenthesis, or space)
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
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed any types in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Main execution
console.log('Starting simple any type fixes...');

const srcDir = path.join(__dirname, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to process`);

files.forEach(fixAnyTypes);

console.log('Simple any type fixes completed!');
