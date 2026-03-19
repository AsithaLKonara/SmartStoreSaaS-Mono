import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function crawlLinks() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: '.auth/superadmin.json'
  });
  const page = await context.newPage();

  const startUrl = 'http://localhost:3000/dashboard';
  const visited = new Set<string>();
  const toVisit = [startUrl];
  const allLinks = new Set<string>();

  console.log('🕸️ Starting link crawler (limited to 50 pages for speed)...');
  
  let count = 0;
  while (toVisit.length > 0 && count < 50) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    count++;

    try {
      console.log(`  Visiting ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
      
      const links = await page.$$eval('a', (els) => els.map(e => (e as HTMLAnchorElement).href));
      for (const link of links) {
        if (link.startsWith('http://localhost:3000') && !link.includes('#')) {
           allLinks.add(link.replace('http://localhost:3000', ''));
           if (!visited.has(link)) toVisit.push(link);
        }
      }
    } catch (e) {
      console.error(`  Failed to visit ${url}`);
    }
  }

  const discoveredFromCrawl = Array.from(allLinks).sort();
  const outputPath = path.join(process.cwd(), 'tests/e2e/advanced/crawled-routes.json');
  fs.writeFileSync(outputPath, JSON.stringify(discoveredFromCrawl, null, 2));
  
  console.log(`🕷️ Crawled ${discoveredFromCrawl.length} unique links. Saved to ${outputPath}`);
  await browser.close();
}

crawlLinks().catch(console.error);
