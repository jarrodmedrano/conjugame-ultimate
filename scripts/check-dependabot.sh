#!/bin/bash

# Script to check Dependabot alerts and create a summary
# Usage: ./scripts/check-dependabot.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔍 Checking Dependabot Alerts${NC}"
echo "=================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: brew install gh"
    echo "Then authenticate with: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Fetch Dependabot alerts
echo -e "\n${CYAN}Fetching Dependabot alerts...${NC}"
ALERTS=$(gh api repos/:owner/:repo/dependabot/alerts --jq 'length' 2>/dev/null || echo "0")

if [ "$ALERTS" -eq 0 ]; then
    echo -e "${GREEN}✅ No Dependabot alerts found!${NC}"
else
    echo -e "${YELLOW}⚠️  Found $ALERTS Dependabot alert(s)${NC}\n"
    
    # Show alert details
    gh api repos/:owner/:repo/dependabot/alerts --jq '.[] | "---\n🔔 \(.security_advisory.summary)\n   Package: \(.dependency.package.name)\n   Severity: \(.security_advisory.severity)\n   State: \(.state)"'
    
    echo -e "\n${CYAN}Recommendations:${NC}"
    echo "1. Run: node scripts/fix-dependabot-issues.js"
    echo "2. Or manually fix with: pnpm audit --fix"
    echo "3. Review and test changes"
    echo "4. Commit: git commit -m 'fix: resolve security vulnerabilities'"
fi

# Check for open Dependabot PRs
echo -e "\n${CYAN}Checking for Dependabot PRs...${NC}"
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --json number,title,url --jq 'length' 2>/dev/null || echo "0")

if [ "$DEPENDABOT_PRS" -eq 0 ]; then
    echo -e "${GREEN}✅ No open Dependabot PRs${NC}"
else
    echo -e "${YELLOW}📋 Found $DEPENDABOT_PRS Dependabot PR(s):${NC}\n"
    gh pr list --author "app/dependabot" --json number,title,url --jq '.[] | "  #\(.number): \(.title)\n  \(.url)"'
fi

echo -e "\n${CYAN}Current dependency status:${NC}"
pnpm outdated || echo -e "${GREEN}All dependencies are up to date!${NC}"

echo -e "\n${GREEN}✨ Check complete!${NC}"
