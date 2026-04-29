#!/bin/bash

# MakingItMixProStudio - Build Script
# This script builds the production version ready for deployment

set -e

echo "🏗️  Building MakingItMixProStudio..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🔨 Building frontend...${NC}"
npm run build

echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${BLUE}📁 Output directory: ./dist${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Verify .env.production has all required variables"
echo -e "  2. Run: ${BLUE}./deploy.sh${NC}"
