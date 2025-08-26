# AgeGo Content Scraper

A comprehensive web scraping solution for AgeGo documentation pages using Playwright.

## Overview

This scraper provides two complementary approaches:
- **Version 1**: Sequential scraping with change detection capabilities
- **Version 2**: Fast parallel scraping for bulk content extraction

## Features

- **Content Extraction**: Removes navigation/footer elements for clean main content
- **Change Detection**: Compares content between runs and tracks changes over time
- **Flexible Output**: File storage or console output with hash-based formatting
- **Data Consistency**: Identical JSON structure across both versions with SHA1 hash keys
- **Mock Testing**: Built-in mock mode for testing without affecting live websites

## Quick Start

```bash
# Install dependencies
npm install

# Change detection (monitors all AgeGo pages)
npm run scrape:agego

# Single URL scraping
node scrape_single.js "https://www.agego.com/about-us"

# Batch parallel scraping
./scrape_all.sh console
```

## Usage Options

**Version 1 (Change Detection):**
- `npm run scrape:agego` - Monitor all AgeGo pages for changes
- `MOCK_CONTENT=1 npm run scrape:agego` - Test with mock data

**Version 2 (Single URL):**
- `node scrape_single.js <URL>` - Save to file
- `node scrape_single.js <URL> console` - Output to console
- `node scrape_single.js <URL> console hash` - Output with hash keys

**Version 2 (Batch):**
- `./scrape_all.sh` - Save all pages to files
- `./scrape_all.sh console` - Output to console with hash keys

## Data Format

All outputs use consistent JSON structure with SHA1 hash keys:
```json
{
  "hash_key": {
    "url": "https://www.agego.com/page",
    "content": "cleaned page content",
    "timestamp": "2025-08-26T10:00:00.000Z",
    "contentLength": 1234,
    "urlHash": "hash_key"
  }
}
```

## Scraped URLs

- Verification methods and guides (12 pages total)
- Help documentation
- About pages
- Privacy and compliance information

## Dependencies

- **playwright**: Browser automation framework

## Output Files

- `outputs/scraped_results/` - Individual page JSON files
- `agegodoc_snapshots.json` - Historical snapshots for change detection
- `agegodoc_changed.json` - Changed pages data

## Version Comparison

| Feature | Version 1 | Version 2 |
|---------|-----------|-----------|
| Execution | Sequential | Parallel |
| Change Detection | ✅ | ❌ |
| Speed | Slower | Faster |
| Output Modes | File only | File or console |
| Hash Keys | ✅ | ✅ |
| Use Case | Monitoring changes | Quick content extraction |
