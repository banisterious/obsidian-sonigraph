#!/bin/bash

# Obsidian PR Compliance Audit Script
# Based on PR review #8036 requirements

echo "════════════════════════════════════════════════════════"
echo "  Obsidian PR Compliance Audit"
echo "════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Exit code tracker
EXIT_CODE=0

# 1. Check innerHTML/outerHTML usage
echo "📋 [1/3] Checking innerHTML/outerHTML usage..."
INNERHTML_COUNT=$(grep -rn --include='*.ts' --include='*.tsx' -E '\.(innerHTML|outerHTML)\s*=' src/ 2>/dev/null | wc -l)
if [ "$INNERHTML_COUNT" -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Found: $INNERHTML_COUNT instances (target: 0)"
else
    echo -e "   ${RED}✗${NC} Found: $INNERHTML_COUNT instances (target: 0)"
    echo -e "   ${YELLOW}Files with violations:${NC}"
    grep -rn --include='*.ts' --include='*.tsx' -E '\.(innerHTML|outerHTML)\s*=' src/ 2>/dev/null | sed 's/^/     /'
    EXIT_CODE=1
fi
echo ""

# 2. Check console statements (excluding logging.ts)
echo "📋 [2/3] Checking console.log/debug/info statements..."
CONSOLE_COUNT=$(grep -rn --include='*.ts' --include='*.tsx' --exclude='logging.ts' 'console\.(log|debug|info)' src/ 2>/dev/null | wc -l)
if [ "$CONSOLE_COUNT" -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} Found: $CONSOLE_COUNT instances (target: 0)"
else
    echo -e "   ${RED}✗${NC} Found: $CONSOLE_COUNT instances (target: 0)"
    echo -e "   ${YELLOW}Files with violations:${NC}"
    grep -rn --include='*.ts' --include='*.tsx' --exclude='logging.ts' 'console\.(log|debug|info)' src/ 2>/dev/null | sed 's/^/     /'
    EXIT_CODE=1
fi
echo ""

# 3. Check 'as any' casts
echo "📋 [3/3] Checking 'as any' type casts..."
AS_ANY_COUNT=$(grep -rn --include='*.ts' --include='*.tsx' 'as any' src/ 2>/dev/null | wc -l)
if [ "$AS_ANY_COUNT" -lt 50 ]; then
    echo -e "   ${GREEN}✓${NC} Found: $AS_ANY_COUNT instances (target: <50)"
elif [ "$AS_ANY_COUNT" -lt 85 ]; then
    echo -e "   ${YELLOW}⚠${NC} Found: $AS_ANY_COUNT instances (target: <50, acceptable: <85)"
else
    echo -e "   ${RED}✗${NC} Found: $AS_ANY_COUNT instances (target: <50)"
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════"
echo "  Summary"
echo "════════════════════════════════════════════════════════"
echo ""
echo "innerHTML/outerHTML:  $INNERHTML_COUNT (target: 0)"
echo "'as any' casts:       $AS_ANY_COUNT (target: <50)"
echo "console statements:   $CONSOLE_COUNT (target: 0)"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Audit passed!${NC}"
else
    echo -e "${RED}✗ Audit failed - please fix critical violations${NC}"
fi

exit $EXIT_CODE
