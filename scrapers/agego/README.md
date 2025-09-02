# AgeGo Content Scraper

A comprehensive web scraping solution for AgeGo documentation pages using Playwright with advanced accordion handling.

## Overview

This scraper provides two complementary approaches:
- **Single URL Scraper**: `scrape_single.js` - Individual page scraping with flexible output modes
- **Batch Scraper**: `scrape_agego.js` - Multi-page scraping with change detection capabilities

## Key Features

- **Advanced Accordion Extraction**: Automatically detects and expands Material-UI accordions to capture hidden content
- **Smart Navigation Filtering**: Removes navigation menus and focuses on main content
- **Change Detection**: Compares content between runs and tracks changes over time
- **Flexible Output**: File storage or console output with hash-based formatting
- **Progress Tracking**: Shows scraping progress with timing information
- **Error Handling**: Graceful error handling with detailed reporting

## Quick Start

```bash
# Install dependencies
npm install

# Single URL scraping
node scrape_single.js "https://www.agego.com/help-verification-methods" console

# Batch scraping with change detection
node scrape_agego.js

# Shell wrapper for batch processing
./scrape_all.sh
```

## Usage Examples

### Single URL Scraper

```bash
# Output to console
node scrape_single.js "https://www.agego.com/about-us" console

# Save to individual file
node scrape_single.js "https://www.agego.com/about-us" file

# Output with hash-based keys (consistent with batch mode)
node scrape_single.js "https://www.agego.com/about-us" console hash
```

### Batch Scraper

```bash
# Run change detection on all configured URLs
node scrape_agego.js

# Test mode with mock content
MOCK_CONTENT=1 node scrape_agego.js
```

## Data Format

All outputs use consistent JSON structure with SHA1 hash keys:
```json
{
  "hash_key": {
    "url": "https://www.agego.com/page",
    "content": "cleaned page content with accordion content",
    "timestamp": "2025-09-02T12:00:00.000Z",
    "contentLength": 1234,
    "urlHash": "hash_key"
  }
}
```

## Output Files

- `outputs/scraped_results/` - Individual page JSON files (single scraper)
- `outputs/agegodoc_snapshots.json` - All pages with change detection (batch scraper)
- `outputs/agegodoc_changed.json` - Changed pages data

## Dependencies

- **playwright**: Browser automation framework for Material-UI accordion handling
