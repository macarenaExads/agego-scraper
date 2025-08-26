const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateSHA1(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

async function extractMainContent(page) {
  // Remove nav, header, footer, and common menu elements
  await page.evaluate(() => {
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

async function scrapeSinglePage(url, outputMode = 'file', useHashKey = false) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    if (outputMode !== 'console') {
      console.log(`Scraping: ${url}`);
    }
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const content = await extractMainContent(page);
    
    const result = {
      url: url,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      contentLength: content.trim().length,
      urlHash: generateSHA1(url)
    };
    
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
