
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

Scrapes URLs independently with flexible output options. Much faster for bulk scraping.

### Usage

```sh
# Scrape a single URL (saves to file by default)
npm run scrape:single https://www.agego.com/verification-methods

# Scrape with explicit file output
node scrape_single.js https://www.agego.com/verification-methods file

# Scrape with console output (for capturing/piping)
node scrape_single.js https://www.agego.com/verification-methods console

# Capture output in scripts
result=$(node scrape_single.js https://www.agego.com/verification-methods console)
echo "$result" | jq '.contentLength'

# Save console output to file
node scrape_single.js https://www.agego.com/verification-methods console > output.json

# Scrape all predefined AgeGo URLs in parallel (saves to files)
npm run scrape:all

# Scrape all predefined AgeGo URLs with console output
npm run scrape:all:console

# Or use the script directly with output mode
./scrape_all.sh file
./scrape_all.sh console

# Capture all results to a single file
./scrape_all.sh console > all_results.json

# Scrape multiple custom URLs in parallel
node scrape_single.js https://www.agego.com/verification-methods &
node scrape_single.js https://www.agego.com/about-us &
wait
```

### Output

Version 2 supports two output modes:

**File Mode (default):** Each URL creates a JSON file in `scraped_results/` with this structure:

```json
{
  "url": "https://www.agego.com/verification-methods",
  "content": "THE AGE VERIFICATION PROCESS...",
  "timestamp": "2025-08-25T15:48:18.703Z",
  "contentLength": 1744
}
```

**Console Mode:** JSON output is printed to stdout for capturing/piping:

```bash
node scrape_single.js https://www.agego.com/verification-methods console
# Outputs JSON directly to console
```

## Comparison

| Feature | Version 1 | Version 2 |
|---------|-----------|-----------|
| Execution | Sequential | Parallel |
| Change Detection | ✅ | ❌ |
| Speed | Slower | Faster |
| Output | Single comparison file | Individual JSON files or console |
| Output Modes | File only | File or console |
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
- `npm run scrape:single <URL>` - Version 2: Scrape a single URL (file mode)
- `npm run scrape:all` - Version 2: Scrape all predefined URLs in parallel (file mode)
- `npm run scrape:all:console` - Version 2: Scrape all predefined URLs in parallel (console mode)

### Command Line Options for Version 2

```bash
# Single URL
node scrape_single.js <URL>              # File output (default)
node scrape_single.js <URL> file         # File output (explicit)
node scrape_single.js <URL> console      # Console output

# Batch scraping
./scrape_all.sh                          # File output (default)
./scrape_all.sh file                     # File output (explicit)
./scrape_all.sh console                  # Console output
```

## More Info

- See [Playwright docs](https://playwright.dev/docs/intro) for more usage examples and advanced configuration.
