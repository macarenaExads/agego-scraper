#!/bin/bash

# Get output mode from first argument, default to 'file'
output_mode=${1:-file}

# Validate output mode
if [[ "$output_mode" != "file" && "$output_mode" != "console" ]]; then
  echo "Usage: $0 [output_mode]"
  echo "Output modes: file (default) | console"
  echo "Examples:"
  echo "  $0"
  echo "  $0 file"
  echo "  $0 console"
  exit 1
fi

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

echo "Starting to scrape ${#urls[@]} URLs in $output_mode mode..."
start_time=$(date +%s)

if [[ "$output_mode" == "console" ]]; then
  # For console mode, collect all outputs and format as JSON object with SHA1 hashes as keys
  temp_dir=$(mktemp -d)
  
  # Run all URLs in parallel and save outputs to temp files
  for i in "${!urls[@]}"; do
    url="${urls[$i]}"
    node scrape_single.js "$url" console > "$temp_dir/result_$i.json" 2>/dev/null &
  done
  
  # Wait for all background processes to complete
  wait
  
  # Combine all results into a single JSON object with SHA1 hashes as keys
  echo "{"
  for i in "${!urls[@]}"; do
    if [ -f "$temp_dir/result_$i.json" ]; then
      url="${urls[$i]}"
      # Generate SHA1 hash of the URL
      url_hash=$(echo -n "$url" | shasum -a 1 | cut -d' ' -f1)
      echo "  \"$url_hash\": $(cat "$temp_dir/result_$i.json")"
      if [ $i -lt $((${#urls[@]} - 1)) ]; then
        echo ","
      fi
    fi
  done
  echo "}"
  
  # Clean up temp files
  rm -rf "$temp_dir"
else
  # For file mode, run as before
  for url in "${urls[@]}"; do
    node scrape_single.js "$url" "$output_mode" &
  done
  
  # Wait for all background processes to complete
  wait
fi

end_time=$(date +%s)
duration=$((end_time - start_time))

echo "All scraping completed in ${duration} seconds!"
if [[ "$output_mode" == "file" ]]; then
  echo "Results saved in scraped_results/ folder"
fi
