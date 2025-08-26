# ExoGroup Web Scrapers

A collection of web scrapers for various ExoGroup projects and external websites.

## Available Scrapers

### AgeGo Scraper
Comprehensive content scraper for AgeGo documentation pages with change detection capabilities.

- **Location**: `scrapers/agego/`
- **Features**: Change detection, parallel processing, flexible output

## Repository Structure

```
web-scraper/
├── README.md              # This file
├── package.json           # Root dependencies
├── scrapers/              # Individual scrapers
│   └── agego/            # AgeGo scraper
│       ├── README.md     # Scraper documentation
│       ├── package.json  # Scraper dependencies
│       ├── scrape_*.js   # Scraper scripts
│       └── outputs/      # Generated content
└── shared/               # Common utilities (future)
```

## Quick Start

```bash
# Clone repository
git clone https://github.com/exogroup/web-scraper.git
cd web-scraper

# Install root dependencies
npm install

# Run AgeGo scraper
cd scrapers/agego
npm install
npm run scrape:agego
```
