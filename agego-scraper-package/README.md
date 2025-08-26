# ExoGroup Web Scrapers

A collection of web scrapers for various ExoGroup projects and external websites.

## Available Scrapers

### AgeGo Scraper
Comprehensive content scraper for AgeGo documentation pages with change detection capabilities.

- **Location**: `scrapers/agego/`
- **Features**: Change detection, parallel processing, flexible output
- **Status**: ✅ Production ready

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

## Development Guidelines

- Each scraper should be self-contained in its own directory
- Include comprehensive README.md for each scraper
- Use consistent JSON output formats where possible
- Include both development and production modes
- Add appropriate .gitignore for output files

## Contributing

1. Create new scraper in `scrapers/<project-name>/`
2. Include complete documentation
3. Add entry to this main README
4. Test thoroughly before committing

## License

Internal ExoGroup project.
