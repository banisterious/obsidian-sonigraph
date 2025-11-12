#!/bin/bash

# Obsidian Plugin PR Review Requirements Audit
# Checks for common issues flagged during plugin review

set -e

echo "🔍 Auditing for Obsidian Plugin PR Review Requirements..."
echo ""

ERRORS=0

# 1. Check for console statements
echo "1️⃣  Checking for console.log/debug/info statements..."
if grep -rn --include='*.ts' --include='*.tsx' --exclude='logging.ts' 'console\.(log|debug|info)' src/ 2>/dev/null; then
    echo "   ❌ Found console statements (除 logging.ts)"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No inappropriate console statements found"
fi
echo ""

# 2. Check for innerHTML/outerHTML usage
echo "2️⃣  Checking for innerHTML/outerHTML usage..."
if grep -rn --include='*.ts' --include='*.tsx' -E '\.(innerHTML|outerHTML)\s*=' src/ 2>/dev/null; then
    echo "   ❌ Found innerHTML/outerHTML usage"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ No innerHTML/outerHTML usage found"
fi
echo ""

# 3. Check for 'as any' casts
echo "3️⃣  Checking for 'as any' type casts..."
AS_ANY_COUNT=$(grep -rn --include='*.ts' --include='*.tsx' 'as any' src/ 2>/dev/null | wc -l)
if [ "$AS_ANY_COUNT" -gt 0 ]; then
    echo "   ⚠️  Found $AS_ANY_COUNT 'as any' casts"
    echo "   📝 Note: Some may be acceptable if properly justified"
    grep -rn --include='*.ts' --include='*.tsx' 'as any' src/ 2>/dev/null | head -10
    if [ "$AS_ANY_COUNT" -gt 10 ]; then
        echo "   ... and $((AS_ANY_COUNT - 10)) more"
    fi
else
    echo "   ✅ No 'as any' casts found"
fi
echo ""

# 4. Check for non-null assertions (!)
echo "4️⃣  Checking for non-null assertions (!)..."
NON_NULL_COUNT=$(grep -rn --include='*.ts' --include='*.tsx' -E '!\s*(\.|\[)' src/ 2>/dev/null | wc -l)
if [ "$NON_NULL_COUNT" -gt 0 ]; then
    echo "   ⚠️  Found $NON_NULL_COUNT non-null assertions"
    echo "   📝 Note: These should have proper null checks"
    grep -rn --include='*.ts' --include='*.tsx' -E '!\s*(\.|\[)' src/ 2>/dev/null | head -10
    if [ "$NON_NULL_COUNT" -gt 10 ]; then
        echo "   ... and $((NON_NULL_COUNT - 10)) more"
    fi
else
    echo "   ✅ No non-null assertions found"
fi
echo ""

# 5. Run ESLint
echo "5️⃣  Running ESLint checks..."
if npm run lint --silent; then
    echo "   ✅ ESLint passed"
else
    echo "   ❌ ESLint found issues"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 6. Run TypeScript compiler check
echo "6️⃣  Running TypeScript compiler check..."
if npx tsc -noEmit -skipLibCheck --silent 2>&1 | grep -q "error TS"; then
    echo "   ❌ TypeScript compilation errors found"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ TypeScript compilation passed"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All PR requirements checks passed!"
    exit 0
else
    echo "❌ Found $ERRORS critical issue(s)"
    echo "   Please fix these before submitting for review"
    exit 1
fi
