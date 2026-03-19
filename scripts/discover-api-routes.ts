import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function discoverAPIRoutes() {
  const apiDir = path.join(process.cwd(), 'src/app/api');
  const files = await glob('**/route.ts', { cwd: apiDir });
  
  const routes = files.map(file => {
    let route = '/api/' + file.replace('/route.ts', '').replace('route.ts', '');
    
    // Ignore [id] for simple health check or replace with common IDs
    // But for a fast HEALH check, we can just skip dynamic ones or use mock IDs
    if (route.includes('[') || route.includes(']')) {
       // Optional: include them with a known ID
       return route.replace(/\[([^\]]+)\]/g, 'test-$1');
    }
    
    return route;
  });

  const uniqueRoutes = Array.from(new Set(routes)).sort();
  const outputPath = path.join(process.cwd(), 'tests/e2e/advanced/discovered-api-routes.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueRoutes, null, 2));
  
  console.log(`📡 Discovered ${uniqueRoutes.length} API routes. Saved to ${outputPath}`);
}

discoverAPIRoutes().catch(console.error);
