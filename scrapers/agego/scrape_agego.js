const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

function generateSHA1(text) {
  return crypto.createHash('sha1').update(text, 'utf8').digest('hex');
}

const SCRAPE_CONFIG = {
  name: 'agegodoc',
  urls: [
    'https://www.agego.com/verification-methods',
    'https://www.agego.com/verification-methods/selfie',
    'https://www.agego.com/verification-methods/credit-card',
    'https://www.agego.com/verification-methods/digital-id',
    'https://www.agego.com/about-us',
    'https://www.agego.com/help-about-agego',
    'https://www.agego.com/help-verification-methods',
    'https://www.agego.com/help-verification-failed',
    'https://www.agego.com/help-privacy-protection',
    'https://www.agego.com/help-general-questions',
  ],
  snapshotFile: path.join(__dirname, 'outputs', 'agegodoc_snapshots.json'),
};

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function extractMainContent(page, url) {
  // Mock mode: if MOCK_CONTENT env var is set, simulate a change for the first URL
  if (process.env.MOCK_CONTENT === '1' && url === SCRAPE_CONFIG.urls[0]) {
    return 'MOCKED CONTENT FOR TESTING CHANGE DETECTION';
  }

  // Remove nav, header, footer, and common menu elements
  await page.evaluate(() => {
    document.querySelectorAll('nav, header, footer, .nav-header, .navbar, .site-header, .main-nav, .navigation, .menu, .site-nav').forEach(el => el.remove());
    document.querySelectorAll('[role="navigation"]').forEach(el => el.remove());
    document.querySelectorAll('.sidebar, .side-menu, .drawer, .drawer-menu').forEach(el => el.remove());
    // Remove cookie banners
    document.querySelectorAll('#onetrust-consent-sdk, .cookie-banner, .cookie-consent').forEach(el => el.remove());
  });

  // Get base content before any expansion
  const main = await page.$('main');
  let baseContent;
  if (main) {
    baseContent = await main.innerText();
  } else {
    baseContent = await page.innerText('body');
  }

  try {
    // Dismiss any cookie banners first
    const cookieSelectors = [
      'button:has-text("Reject All")',
      'button:has-text("Accept All")', 
      'button:has-text("OK")',
      '#onetrust-reject-all-handler',
      '.cookie-banner button'
    ];
    
    for (const selector of cookieSelectors) {
      try {
        const cookieButton = await page.$(selector);
        if (cookieButton) {
          await cookieButton.click();
          await page.waitForTimeout(1000);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
  } catch (error) {
    // Continue silently on cookie banner errors
  }

  try {
    const allAccordionContent = [];
    
    // For Material-UI accordions, process them individually
    // because they typically only allow one to be open at a time
    const accordionSummaries = await page.locator('.MuiAccordionSummary-root').all();
    
    for (let i = 0; i < accordionSummaries.length; i++) {
      const summary = accordionSummaries[i];
      
      try {
        // Step 1: Get the accordion header text (collapsed content)
        const headerText = await summary.innerText();
        if (!headerText || headerText.trim().length === 0) continue;
        
        const accordionHeader = headerText.trim();
        
        // Step 2: Click to expand this accordion
        await summary.click();
        await page.waitForTimeout(800); // Wait for expansion animation
        
        // Step 3: Find the expanded content using a more precise method
        // Get the accordion content element (not the whole page)
        const accordionParent = await summary.locator('..').first(); // Get parent accordion
        const accordionContent = await accordionParent.innerText();
        
        // Split into lines and find our accordion header
        const lines = accordionContent.split('\n').map(l => l.trim()).filter(l => l);
        const headerIndex = lines.findIndex(line => line === accordionHeader);
        
        let childContent = '';
        if (headerIndex >= 0) {
          // Collect child content lines after the header
          const childLines = [];
          for (let j = headerIndex + 1; j < lines.length; j++) {
            const line = lines[j];
            // Include all non-empty lines - since we're getting content from the specific
            // accordion parent, this should only contain content from this accordion
            if (line.trim()) {
              childLines.push(line);
            }
          }
          childContent = childLines.join(' ').trim();
        }
        
        // Step 4: Store the accordion content pair
        if (childContent && childContent.trim()) {
          allAccordionContent.push({
            header: accordionHeader,
            content: childContent.trim()
          });
        }
        
      } catch (error) {
        // Continue with next accordion
      }
    }
    
    // Fallback: Try other expandable patterns if no accordions found
    if (allAccordionContent.length === 0) {
      
      const expandableSelectors = [
        'details summary',
        '[aria-expanded="false"]',
        'button[aria-expanded="false"]',
        '.accordion-toggle',
        '.collapsible-header'
      ];
      
      let expandedCount = 0;
      const maxExpansions = 15;
      
      for (const selector of expandableSelectors) {
        if (expandedCount >= maxExpansions) break;
        
        try {
          const elements = await page.$$(selector);
          
          for (const element of elements.slice(0, 5)) {
            if (expandedCount >= maxExpansions) break;
            
            try {
              const isVisible = await element.isVisible();
              const isEnabled = await element.isEnabled();
              
              if (isVisible && isEnabled) {
                const collapsedText = await element.innerText();
                
                await element.click();
                expandedCount++;
                await page.waitForTimeout(500);
                
                const main = await page.$('main');
                let expandedContent;
                if (main) {
                  expandedContent = await main.innerText();
                } else {
                  expandedContent = await page.innerText('body');
                }
                
                allAccordionContent.push({
                  header: collapsedText.trim(),
                  expandedContent: expandedContent
                });
              }
            } catch (error) {
              // Continue with next element
            }
          }
        } catch (error) {
          // Continue with next selector
        }
      }
    }
    
    // Build clean content
    if (allAccordionContent.length > 0) {
      // Add header/navigation elements
      const baseLines = baseContent.split('\n').map(line => line.trim()).filter(line => line);
      const headerLines = baseLines.filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.endsWith('?') && 
               !allAccordionContent.some(ac => ac.header.trim() === trimmed) &&
               trimmed.length < 100 && 
               (trimmed.includes('Back to') || trimmed.includes('Questions') || trimmed.includes('Help'));
      });
      
      let cleanContent = [];
      cleanContent.push(...headerLines);
      if (headerLines.length > 0) {
        cleanContent.push(''); // Separator
      }
      
      // Add each unique accordion header with its content
      const processedHeaders = new Set();
      
      allAccordionContent.forEach(ac => {
        if (!processedHeaders.has(ac.header)) {
          processedHeaders.add(ac.header);
          cleanContent.push(ac.header);
          if (ac.content && ac.content.trim()) {
            cleanContent.push(ac.content);
          } else if (ac.expandedContent && ac.expandedContent.trim()) {
            cleanContent.push(ac.expandedContent);
          }
        }
      });
      
      return cleanContent.join('\n');
    }

  } catch (error) {
    // Continue silently on accordion expansion errors
  }

  return baseContent;
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
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const content = await extractMainContent(page, url);
      const hash = hashContent(content);
      const timestamp = new Date().toISOString();
      const urlHash = generateSHA1(url);
      
      newSnapshots[urlHash] = { 
        url,
        content, 
        timestamp,
        contentLength: content.length,
        urlHash,
        hash
      };

    } catch (error) {
      const urlTimeTaken = Date.now() - urlStartTime;
      console.log(`Failed in ${urlTimeTaken}ms: ${error.message}`);
      
      // Add error entry to snapshots
      newSnapshots[urlHash] = {
        url,
        error: error.message,
        timestamp: new Date().toISOString(),
        urlHash: generateSHA1(url)
      };
    }

    // For comparison, we need to check against the URL hash in previous snapshots
    if (!prevSnapshots[urlHash]) {
      report.push({ url, status: 'NEW', details: 'First time scraped.' });
      if (!isFirstRun) {
        changedContent.push({ 
          url, 
          content,
          timestamp,
          contentLength: content.length,
          urlHash
        });
      }
    } else if (prevSnapshots[urlHash].hash !== hash) {
      // Find diff (simple line diff)
      const oldLines = prevSnapshots[urlHash].content.split('\n');
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
      changedContent.push({ 
        url, 
        content,
        timestamp,
        contentLength: content.length,
        urlHash
      });
    } else {
      report.push({ url, status: 'UNCHANGED' });
    }
  }

  await browser.close();
  await saveSnapshots(SCRAPE_CONFIG.snapshotFile, newSnapshots);

  // Only write changed content file if not first run
  const changedFile = path.join(__dirname, 'outputs', 'agegodoc_changed.json');
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
