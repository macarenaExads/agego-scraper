
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
  "contentLength": 1744,
  "urlHash": "a1b2c3d4e5f6789012345678901234567890abcd"
}
```

**Console Mode:** JSON output is printed to stdout for capturing/piping.

*Single URL format:*
```bash
node scrape_single.js https://www.agego.com/verification-methods console
```
```json
{
  "url": "https://www.agego.com/verification-methods",
  "content": "THE AGE VERIFICATION PROCESS...",
  "timestamp": "2025-08-25T15:48:18.703Z",
  "contentLength": 1744,
  "urlHash": "a1b2c3d4e5f6789012345678901234567890abcd"
}
```

*Single URL with hash key (consistent with batch):*
```bash
node scrape_single.js https://www.agego.com/verification-methods console hash
```
```json
{
  "a1b2c3d4e5f6789012345678901234567890abcd": {
    "url": "https://www.agego.com/verification-methods",
    "content": "THE AGE VERIFICATION PROCESS...",
    "timestamp": "2025-08-25T15:48:18.703Z",
    "contentLength": 1744,
    "urlHash": "a1b2c3d4e5f6789012345678901234567890abcd"
  }
}
```

*Batch format (all URLs as object with SHA1 keys):*
```bash
./scrape_all.sh console
```
```json
{
  "a1b2c3d4e5f6789012345678901234567890abcd": {
    "url": "https://www.agego.com/verification-methods",
    "content": "THE AGE VERIFICATION PROCESS...",
    "timestamp": "2025-08-25T15:48:18.703Z",
    "contentLength": 1744,
    "urlHash": "a1b2c3d4e5f6789012345678901234567890abcd"
  },
  "ef12345678901234567890abcdef1234567890ab": {
    "url": "https://www.agego.com/about-us",
    "content": "ABOUT US CONTENT...",
    "timestamp": "2025-08-25T15:48:18.703Z",
    "contentLength": 892,
    "urlHash": "ef12345678901234567890abcdef1234567890ab"
  }
}
```

## Comparison

| Feature | Version 1 | Version 2 |
|---------|-----------|-----------|
| Execution | Sequential | Parallel |
| Change Detection | ✅ | ❌ |
| Speed | Slower | Faster |
| Output | Single comparison file | Individual JSON files or console |
| Output Modes | File only | File or console |
| Hash Keys | ❌ | ✅ (SHA1 of URLs) |
| Batch Format | N/A | Object with hash keys |
| Use Case | Monitoring changes | Quick content extraction |

## Project Structure

```
agego-scraper/
├── package.json              # Dependencies and npm scripts
├── README.md                 # This documentation
├── scrape_agego.js          # Version 1: Sequential with change detection
├── scrape_single.js         # Version 2: Single URL with flexible output
├── scrape_all.sh           # Batch processor for parallel execution
├── scraped_results/        # Output directory for JSON files
├── test-results/          # Playwright test artifacts
└── .github/
    └── copilot-instructions.md
```

## Key Features

- **Dual Approach**: Sequential change detection vs. fast parallel processing
- **Flexible Output**: File storage or console output with optional hash keys
- **Change Detection**: Content comparison with snapshot management (Version 1)
- **Content Extraction**: Removes navigation and footer elements for clean content
- **SHA1 Hash Keys**: Consistent URL-to-key mapping for easy data access
- **Mock Mode**: Test change detection without modifying websites
- **Parallel Processing**: Fast batch scraping with organized output (Version 2)

## Quick Start

```bash
# Install dependencies
npm install

# Single URL scraping (file output)
node scrape_single.js "https://www.agego.com/about-us"

# Batch scraping (console output with hash keys)
./scrape_all.sh console

# Change detection (sequential)
npm run scrape:agego
```

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
node scrape_single.js <URL> console      # Console output (single object)
node scrape_single.js <URL> console hash # Console output (hash key format)

# Batch scraping
./scrape_all.sh                          # File output (default)
./scrape_all.sh file                     # File output (explicit)
./scrape_all.sh console                  # Console output (object with SHA1 keys)
```

### JSON Structure

All output includes:
- `url`: Original URL
- `content`: Extracted page content (nav/footer removed)
- `timestamp`: ISO timestamp when scraped
- `contentLength`: Length of extracted content
- `urlHash`: SHA1 hash of the URL (for consistent keying)

### Advanced Usage Examples

```bash
# Get content length for a specific URL using hash
url_hash=$(echo -n "https://www.agego.com/verification-methods" | shasum -a 1 | cut -d' ' -f1)
./scrape_all.sh console | jq ".[\"$url_hash\"].contentLength"

# Extract all URLs and their content lengths
./scrape_all.sh console | jq 'to_entries[] | "\(.value.url): \(.value.contentLength)"'

# Save batch results and process later
./scrape_all.sh console > all_results.json
cat all_results.json | jq 'keys | length'  # Count of URLs scraped
```

## More Info

- See [Playwright docs](https://playwright.dev/docs/intro) for more usage examples and advanced configuration.
