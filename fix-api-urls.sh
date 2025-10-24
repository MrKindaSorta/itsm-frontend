#!/bin/bash

# Replace all hardcoded API_BASE declarations with import from lib/api
find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
  # Check if file contains hardcoded API_BASE
  if grep -q "const API_BASE = 'https://itsm-backend" "$file"; then
    echo "Fixing $file..."

    # Remove the hardcoded line
    sed -i "/const API_BASE = 'https:\/\/itsm-backend.joshua-r-klimek.workers.dev';/d" "$file"

    # Add import at top if not already there
    if ! grep -q "import { API_BASE } from '@/lib/api';" "$file"; then
      # Find the last import line
      last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import" ]; then
        sed -i "${last_import}a import { API_BASE } from '@/lib/api';" "$file"
      fi
    fi
  fi
done

# Fix WebSocket URL
find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
  if grep -q "const WS_URL = 'wss://itsm-backend" "$file"; then
    echo "Fixing WebSocket in $file..."
    sed -i "/const WS_URL = 'wss:\/\/itsm-backend.joshua-r-klimek.workers.dev\/api\/ws';/d" "$file"
    if ! grep -q "import { WS_URL } from '@/lib/api';" "$file"; then
      last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      if [ -n "$last_import" ]; then
        sed -i "${last_import}a import { WS_URL } from '@/lib/api';" "$file"
      fi
    fi
  fi
done

# Fix hardcoded URLs in fetch calls
find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|'https://itsm-backend.joshua-r-klimek.workers.dev/api/|\${API_BASE}/api/|g" {} \;

echo "Done!"
