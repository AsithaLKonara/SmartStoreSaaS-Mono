import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function discoverPages() {
  const appDir = path.join(process.cwd(), 'src/app');
  // Find all page.tsx files, excluding those in parenthesis groups or dynamic segments if needed
  // But for full coverage, we want all of them.
  const files = await glob('**/page.tsx', { cwd: appDir });
  
  const routes = files.map(file => {
    let route = '/' + file.replace('/page.tsx', '').replace('page.tsx', '');
    
    // Remove (dashboard), (auth), etc.
    route = route.replace(/\/\([^)]+\)/g, '');
    
    // Handle dynamic routes [id] to something testable
    route = route.replace(/\[([^\]]+)\]/g, 'test-$1');
    
    if (route === '') route = '/';
    if (route.endsWith('/')) route = route.slice(0, -1);
    if (!route.startsWith('/')) route = '/' + route;
    
    return route;
  });

  // Filter out duplicates and normalize
  const uniqueRoutes = Array.from(new Set(routes)).sort();
  
  const outputPath = path.join(process.cwd(), 'tests/e2e/advanced/discovered-routes.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(uniqueRoutes, null, 2));
  
  console.log(`🚀 Discovered ${uniqueRoutes.length} pages. Route list saved to ${outputPath}`);
}

discoverPages().catch(console.error);
