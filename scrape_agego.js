const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const SCRAPE_CONFIG = {
  name: 'agegodoc',
  urls: [
    'https://www.agego.com/verification-methods',
    'https://www.agego.com/verification-methods/selfie',
    'https://www.agego.com/verification-methods/selfie-and-official-government-id-document',
    'https://www.agego.com/verification-methods/credit-card',
    'https://www.agego.com/verification-methods/digital-id',
    'https://www.agego.com/verification-methods/sms',
    'https://www.agego.com/about-us',
    'https://www.agego.com/help-about-agego',
    'https://www.agego.com/help-verification-methods',
    'https://www.agego.com/help-verification-failed',
    'https://www.agego.com/help-privacy-protection',
    'https://www.agego.com/help-general-questions',
  ],
  snapshotFile: path.join(__dirname, 'agegodoc_snapshots.json'),
};

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function extractMainContent(page, url) {
  // Mock mode: if MOCK_CONTENT env var is set, simulate a change for the first URL
  if (process.env.MOCK_CONTENT === '1' && url === SCRAPE_CONFIG.urls[0]) {
    return 'MOCKED CONTENT FOR TESTING CHANGE DETECTION';
  }
  // Remove nav, header, and footer elements, and common nav classes
  await page.evaluate(() => {
    // Remove all nav, header, and footer elements
    document.querySelectorAll('nav, header, footer, .nav-header, .navbar, .site-header, .main-nav, .navigation, .menu, .site-nav').forEach(el => el.remove());
    // Remove elements with role="navigation"
    document.querySelectorAll('[role="navigation"]').forEach(el => el.remove());
    // Optionally remove sidebars or known menu containers
    document.querySelectorAll('.sidebar, .side-menu, .drawer, .drawer-menu').forEach(el => el.remove());
  });
  // Try to get main, else body
  const main = await page.$('main');
  if (main) {
    return await main.innerText();
  } else {
    return await page.innerText('body');
  }
}

async function loadSnapshots(file) {
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
  return {};
}

async function saveSnapshots(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function scrapeAndCompare() {
  const startTime = Date.now();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const prevSnapshots = await loadSnapshots(SCRAPE_CONFIG.snapshotFile);
  const newSnapshots = {};
  const report = [];
  const changedContent = [];

  const isFirstRun = Object.keys(prevSnapshots).length === 0;

  for (const url of SCRAPE_CONFIG.urls) {
    console.log(`Scraping: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const content = await extractMainContent(page, url);
    const hash = hashContent(content);
    newSnapshots[url] = { hash, content };

    if (!prevSnapshots[url]) {
      report.push({ url, status: 'NEW', details: 'First time scraped.' });
      if (!isFirstRun) changedContent.push({ url, content });
    } else if (prevSnapshots[url].hash !== hash) {
      // Find diff (simple line diff)
      const oldLines = prevSnapshots[url].content.split('\n');
      const newLines = content.split('\n');
      const added = newLines.filter(line => !oldLines.includes(line));
      const removed = oldLines.filter(line => !newLines.includes(line));
      report.push({
        url,
        status: 'CHANGED',
        details: `Content changed.\nAdded: ${added.length} lines.\nRemoved: ${removed.length} lines.`,
        added,
        removed,
      });
      changedContent.push({ url, content });
    } else {
      report.push({ url, status: 'UNCHANGED' });
    }
  }

  await browser.close();
  await saveSnapshots(SCRAPE_CONFIG.snapshotFile, newSnapshots);

  // Only write changed content file if not first run
  const changedFile = path.join(__dirname, 'agegodoc_changed.json');
  if (!isFirstRun) {
    if (changedContent.length > 0) {
      fs.writeFileSync(changedFile, JSON.stringify(changedContent, null, 2));
    } else {
      // No changes: clear the file to an empty array
      fs.writeFileSync(changedFile, '[]');
    }
  } else if (isFirstRun && fs.existsSync(changedFile)) {
    // Remove changed file if it exists from a previous run
    fs.unlinkSync(changedFile);
  }

  // Print report
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n==== Scrape Report ====');
  for (const entry of report) {
    console.log(`- ${entry.url}: ${entry.status}`);
    if (entry.status === 'CHANGED') {
      console.log(entry.details);
      if (entry.added.length) console.log('  Added lines:', entry.added.slice(0, 5));
      if (entry.removed.length) console.log('  Removed lines:', entry.removed.slice(0, 5));
    } else if (entry.status === 'NEW') {
      console.log('  First time scraped.');
    }
  }
  console.log('=======================');
  console.log(`Scrape completed in ${duration} seconds.\n`);
}

if (require.main === module) {
  scrapeAndCompare().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
