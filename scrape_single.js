const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

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

async function scrapeSinglePage(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log(`Scraping: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const content = await extractMainContent(page);
    
    const result = {
      url: url,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      contentLength: content.trim().length
    };
    
    // Create filename from URL
    const urlObj = new URL(url);
    const filename = `${urlObj.hostname}${urlObj.pathname}`.replace(/[^\w\-_.]/g, '_') + '.json';
    
    // Create output folder if it doesn't exist
    const outputFolder = path.join(__dirname, 'scraped_results');
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }
    
    const filepath = path.join(outputFolder, filename);
    
    // Write to JSON file
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`Result saved to: scraped_results/${filename}`);
    
    return result;
    
  } catch (error) {
    const errorResult = {
      url: url,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    // Create filename from URL for error case too
    const urlObj = new URL(url);
    const filename = `error_${urlObj.hostname}${urlObj.pathname}`.replace(/[^\w\-_.]/g, '_') + '.json';
    
    // Create output folder if it doesn't exist
    const outputFolder = path.join(__dirname, 'scraped_results');
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }
    
    const filepath = path.join(outputFolder, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(errorResult, null, 2));
    console.error(`Error result saved to: scraped_results/${filename}`);
    return errorResult;
  } finally {
    await browser.close();
  }
}

// Get URL from command line argument
const url = process.argv[2];

if (!url) {
  console.error('Usage: node scrape_single.js <URL>');
  console.error('Example: node scrape_single.js https://www.agego.com/verification-methods');
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
  scrapeSinglePage(url).catch(e => {
    console.error('Scraping failed:', e.message);
    process.exit(1);
  });
}
