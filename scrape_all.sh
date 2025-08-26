#!/bin/bash

# AgeGo URLs to scrape
urls=(
  "https://www.agego.com/verification-methods"
  "https://www.agego.com/verification-methods/selfie"
  "https://www.agego.com/verification-methods/selfie-and-official-government-id-document"
  "https://www.agego.com/verification-methods/credit-card"
  "https://www.agego.com/verification-methods/digital-id"
  "https://www.agego.com/verification-methods/sms"
  "https://www.agego.com/about-us"
  "https://www.agego.com/help-about-agego"
  "https://www.agego.com/help-verification-methods"
  "https://www.agego.com/help-verification-failed"
  "https://www.agego.com/help-privacy-protection"
  "https://www.agego.com/help-general-questions"
)

echo "Starting to scrape ${#urls[@]} URLs..."
start_time=$(date +%s)

# Run all URLs in parallel
for url in "${urls[@]}"; do
  node scrape_single.js "$url" &
done

# Wait for all background processes to complete
wait

end_time=$(date +%s)
duration=$((end_time - start_time))

echo "All scraping completed in ${duration} seconds!"
echo "Results saved in scraped_results/ folder"
