#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."
SRC_DIR="$PROJECT_ROOT/src"
ANALYSIS_DIR="$PROJECT_ROOT/analysis"

echo -e "${BLUE}🔍 Starting Codebase Analysis...${NC}"

# Create analysis directory if it doesn't exist
mkdir -p "$ANALYSIS_DIR"

# Function to analyze and write results
analyze_pattern() {
    local name=$1
    local pattern=$2
    local output_file="$ANALYSIS_DIR/$3"
    
    echo "🔍 Analyzing $name..."
    find "$SRC_DIR" -type f -name "*.js" -exec grep -l "$pattern" {} \; > "$output_file"
}

# Run various analyses
analyze_pattern "Scene Hierarchy" "extends.*Scene" "scene_hierarchy.txt"
analyze_pattern "Manager Classes" "class.*Manager" "manager_classes.txt"
analyze_pattern "Event Handlers" "on(" "event_handlers.txt"
analyze_pattern "Update Methods" "update.*(" "update_methods.txt"
analyze_pattern "Collision Handlers" "collide\|overlap\|addCollider" "collision_handlers.txt"
analyze_pattern "Constructor Patterns" "constructor" "constructor_patterns.txt"

# Generate summary report
echo "📊 Generating Summary Report..."
{
    echo "# Codebase Analysis Summary"
    echo "Generated on: $(date)"
    echo
    echo "## Scene Hierarchy"
    echo "\`\`\`"
    cat "$ANALYSIS_DIR/scene_hierarchy.txt"
    echo "\`\`\`"
    echo
    echo "## Manager Classes"
    echo "\`\`\`"
    cat "$ANALYSIS_DIR/manager_classes.txt"
    echo "\`\`\`"
    echo
    echo "## Event Handlers"
    echo "\`\`\`"
    cat "$ANALYSIS_DIR/event_handlers.txt"
    echo "\`\`\`"
    echo
    echo "## Update Methods"
    echo "\`\`\`"
    cat "$ANALYSIS_DIR/update_methods.txt"
    echo "\`\`\`"
    echo
    echo "## Collision Handlers"
    echo "\`\`\`"
    cat "$ANALYSIS_DIR/collision_handlers.txt"
    echo "\`\`\`"
    echo
    echo "## Constructor Patterns"
    echo "\`\`\`"
    cat "$ANALYSIS_DIR/constructor_patterns.txt"
    echo "\`\`\`"
} > "$ANALYSIS_DIR/summary.md"

echo -e "${GREEN}✨ Analysis complete!${NC}"
echo "Results are available in the analysis directory:"
echo "- Open analysis/summary.md for a complete overview"
echo "- Individual analysis files are available for detailed review"
