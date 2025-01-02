#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Starting Codebase Analysis...${NC}"

# Create scripts directory if it doesn't exist
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Run the analysis script
echo -e "${GREEN}Running analysis script...${NC}"
node scripts/analyze_codebase.js

# Make the results easily viewable
echo -e "\n${GREEN}Analysis complete!${NC}"
echo "Results are available in the analysis directory:"
echo "- Open analysis/summary.md for a complete overview"
echo "- Individual analysis files are available for detailed review"
