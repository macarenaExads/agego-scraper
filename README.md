
# AgeGo Scraper Project

This project scrapes a list of AgeGo web pages, detects content changes, and reports them using [Playwright](https://playwright.dev/).

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```


2. **Run the scraper:**
   ```sh
   npm run scrape:agego
   ```
   This will scrape all configured AgeGo URLs, compare their content to the last run, and report any changes.

3. **Check the output:**
   - `agegodoc_snapshots.json`: Stores the latest content snapshot and hash for each URL. On the very first run, only this file is created.
   - `agegodoc_changed.json`: Only generated after the first run, and only if there are actual changes (new or updated content) since the last run. Share this file with other apps as needed.

4. **Run a mock test (simulate a content change):**
   ```sh
   MOCK_CONTENT=1 npm run scrape:agego
   ```
   This will simulate a content change for the first URL, allowing you to test the change-detection and reporting logic without modifying the real site.

## Project Structure
- `scrape_agego.js`: Main scraping and change-detection script.
- `example.spec.js`: Example Playwright test script.
- `package.json`: Project configuration and dependencies.
- `agegodoc_snapshots.json`: Stores last-scraped content and hashes.
- `agegodoc_changed.json`: Contains new/changed content after each run.

## More Info
- See [Playwright docs](https://playwright.dev/docs/intro) for more usage examples and advanced configuration.
