
# AgeGo Scraper Project

This project scrapes AgeGo web pages using [Playwright](https://playwright.dev/) and offers two approaches:

- **Version 1**: Sequential scraping with change detection and comparison
- **Version 2**: Fast parallel scraping with individual JSON output files

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```

## Version 1: Change Detection (Sequential)

Scrapes all URLs sequentially, compares content to previous runs, and reports changes.

### Usage

```sh
# Run the change detection scraper
npm run scrape:agego

# Run a mock test (simulate a content change)
MOCK_CONTENT=1 npm run scrape:agego
```

### Output

- `agegodoc_snapshots.json`: Stores the latest content snapshot and hash for each URL. On the very first run, only this file is created.
- `agegodoc_changed.json`: Only generated after the first run, and only if there are actual changes (new or updated content) since the last run. Share this file with other apps as needed.

## Version 2: Fast Parallel Scraping

Scrapes URLs independently and outputs individual JSON files for each URL. Much faster for bulk scraping.

### Usage

```sh
# Scrape a single URL
npm run scrape:single https://www.agego.com/verification-methods

# Scrape all predefined AgeGo URLs in parallel
npm run scrape:all

# Scrape multiple custom URLs in parallel
node scrape_single.js https://www.agego.com/verification-methods &
node scrape_single.js https://www.agego.com/about-us &
wait
```

### Output

Each URL creates a JSON file in `scraped_results/` with this structure:

```json
{
  "url": "https://www.agego.com/verification-methods",
  "content": "THE AGE VERIFICATION PROCESS...",
  "timestamp": "2025-08-25T15:48:18.703Z",
  "contentLength": 1744
}
```

## Comparison

| Feature | Version 1 | Version 2 |
|---------|-----------|-----------|
| Execution | Sequential | Parallel |
| Change Detection | ✅ | ❌ |
| Speed | Slower | Faster |
| Output | Single comparison file | Individual JSON files |
| Use Case | Monitoring changes | Quick content extraction |

## Project Structure

- `scrape_agego.js`: Version 1 - Sequential scraping with change detection
- `scrape_single.js`: Version 2 - Single URL scraper
- `scrape_all.sh`: Version 2 - Batch script for parallel scraping
- `scraped_results/`: Output folder for Version 2 JSON files
- `agegodoc_snapshots.json`: Version 1 - Stores content snapshots
- `agegodoc_changed.json`: Version 1 - Contains changed content
- `example.spec.js`: Example Playwright test script

## Available Scripts

- `npm run scrape:agego` - Version 1: Sequential scraping with change detection
- `npm run scrape:single <URL>` - Version 2: Scrape a single URL
- `npm run scrape:all` - Version 2: Scrape all predefined URLs in parallel

## More Info

- See [Playwright docs](https://playwright.dev/docs/intro) for more usage examples and advanced configuration.
