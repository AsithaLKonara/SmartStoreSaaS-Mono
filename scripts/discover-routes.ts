import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

async function scanRoutes() {
  const appDir = path.join(process.cwd(), 'src/app');
  const files = await glob('**/page.tsx', { cwd: appDir });
  
  const routes = files.map(file => {
    let route = '/' + file.replace('/page.tsx', '').replace('page.tsx', '');
    
    // Remove route groups like (dashboard), (auth)
    route = route.replace(/\/\([^)]+\)/g, '');
    
    // Normalize root route
    if (route === '') route = '/';
    
    return route;
  });

  // Filter out duplicates (if any after removing route groups)
  const uniqueRoutes = [...new Set(routes)].sort();
  
  console.log(JSON.stringify(uniqueRoutes, null, 2));
}

scanRoutes().catch(console.error);
