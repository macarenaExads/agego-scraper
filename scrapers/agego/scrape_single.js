const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate SHA1 hash for URL
function generateSHA1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

async function extractMainContent(page) {
  // Remove nav, header, footer, and common menu elements
  await page.evaluate(() => {
    document.querySelectorAll('nav, header, footer, .nav-header, .navbar, .site-header, .main-nav, .navigation, .menu, .site-nav').forEach(el => el.remove());
    document.querySelectorAll('[role="navigation"]').forEach(el => el.remove());
    document.querySelectorAll('.sidebar, .side-menu, .drawer, .drawer-menu').forEach(el => el.remove());
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
        
        // Step 3: Capture the expanded content
        const main = await page.$('main');
        let expandedContent;
        if (main) {
          expandedContent = await main.innerText();
        } else {
          expandedContent = await page.innerText('body');
        }
        
        // Step 4: Find the expanded content using a more precise method
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
        
        // Step 5: Store the accordion content pair
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
          }
        }
      });
      
      return cleanContent.join('\n');
    }

  } catch (error) {
    // Continue silently on content expansion errors
  }

  return baseContent;
}

async function scrapeSinglePage(url, outputMode = 'file', useHashKey = false) {
  console.log(`Scraping: ${url}`);
  const startTime = Date.now();
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const content = await extractMainContent(page);
    
    const result = {
      url: url,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      contentLength: content.trim().length,
      urlHash: generateSHA1(url)
    };
    
    const timeTaken = Date.now() - startTime;
    console.log(`Completed in ${timeTaken}ms`);
    
    if (outputMode === 'console') {
      // Output to console for capturing
      if (useHashKey) {
        // Format as object with hash as key (consistent with batch mode)
        const hashResult = {};
        hashResult[result.urlHash] = result;
        console.log(JSON.stringify(hashResult, null, 2));
      } else {
        // Format as single object
        console.log(JSON.stringify(result, null, 2));
      }
      return result;
    } else {
      // Default: save to file
      // Create filename from URL
      const urlObj = new URL(url);
      const filename = `${urlObj.hostname}${urlObj.pathname}`.replace(/[^\w\-_.]/g, '_') + '.json';
      
      // Create output folder if it doesn't exist
      const outputFolder = path.join(__dirname, 'outputs', 'scraped_results');
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }
      
      const filepath = path.join(outputFolder, filename);
      
      // Write to JSON file
      fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
      console.log(`Result saved to: outputs/scraped_results/${filename}`);
      
      return result;
    }
    
  } catch (error) {
    const timeTaken = Date.now() - startTime;
    console.log(`Failed in ${timeTaken}ms: ${error.message}`);
    
    const errorResult = {
      url: url,
      error: error.message,
      timestamp: new Date().toISOString(),
      urlHash: generateSHA1(url)
    };
    
    if (outputMode === 'console') {
      // Output error to console
      if (useHashKey) {
        // Format as object with hash as key
        const hashResult = {};
        hashResult[errorResult.urlHash] = errorResult;
        console.error(JSON.stringify(hashResult, null, 2));
      } else {
        // Format as single object
        console.error(JSON.stringify(errorResult, null, 2));
      }
      return errorResult;
    } else {
      // Default: save error to file
      // Create filename from URL for error case too
      const urlObj = new URL(url);
      const filename = `error_${urlObj.hostname}${urlObj.pathname}`.replace(/[^\w\-_.]/g, '_') + '.json';
      
      // Create output folder if it doesn't exist
      const outputFolder = path.join(__dirname, 'outputs', 'scraped_results');
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }
      
      const filepath = path.join(outputFolder, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(errorResult, null, 2));
      console.error(`Error result saved to: outputs/scraped_results/${filename}`);
      return errorResult;
    }
  } finally {
    await browser.close();
  }
}

// Get URL, output mode, and format option from command line arguments
const url = process.argv[2];
const outputMode = process.argv[3] || 'file'; // Default to 'file', can be 'console'
const useHashKey = process.argv[4] === 'hash'; // If 'hash' is passed, use SHA1 as key

if (!url) {
  console.error('Usage: node scrape_single.js <URL> [output_mode] [hash]');
  console.error('Output modes: file (default) | console');
  console.error('Hash option: add "hash" to use SHA1 as key in console mode');
  console.error('Examples:');
  console.error('  node scrape_single.js https://www.agego.com/verification-methods');
  console.error('  node scrape_single.js https://www.agego.com/verification-methods file');
  console.error('  node scrape_single.js https://www.agego.com/verification-methods console');
  console.error('  node scrape_single.js https://www.agego.com/verification-methods console hash');
  process.exit(1);
}

if (outputMode !== 'file' && outputMode !== 'console') {
  console.error('Invalid output mode. Use "file" or "console"');
  process.exit(1);
}

// Validate URL
try {
  new URL(url);
} catch (error) {
  console.error('Invalid URL provided:', url);
  process.exit(1);
}

if (require.main === module) {
  scrapeSinglePage(url, outputMode, useHashKey).catch(e => {
    console.error('Scraping failed:', e.message);
    process.exit(1);
  });
}
