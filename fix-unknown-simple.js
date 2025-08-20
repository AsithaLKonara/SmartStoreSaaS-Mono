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
  
  // Simple replacement of all unknown$2 with unknown
  updated = updated.replace(/unknown\$2/g, 'unknown');
  
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
