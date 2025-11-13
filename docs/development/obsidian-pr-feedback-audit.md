# Obsidian PR Feedback Audit - Sonigraph Plugin

**PR Reference**: https://github.com/obsidianmd/obsidian-releases/pull/8036#issuecomment-3525528794
**Date**: 2025-11-13
**Status**: Required fixes pending

---

## Overview

The ObsidianReviewBot has identified code quality issues that must be resolved before the Sonigraph plugin can be approved for the community plugin registry.

## Required Issues (Must Fix)

### 1. Async Methods with No Await (~73 instances)

**Issue**: Async methods that contain no `await` expressions.

**Bot Message**: "Async method 'methodName' has no 'await' expression."

**Action Required**: Either:
- Remove the `async` keyword if no await is needed
- Add proper `await` if async operations exist
- Return a resolved promise explicitly if the async signature is required by an interface

**Example Pattern**:
```typescript
// Before: Unnecessary async
async method() {
  return someValue;
}

// After: Remove async
method() {
  return someValue;
}

// Or if interface requires async:
async method(): Promise<void> {
  return Promise.resolve();
}
```

### 2. Unnecessary Type Assertions (~2 instances)

**Issue**: Non-null assertions (`!`) that don't change expression types.

**Bot Message**: "This assertion is unnecessary since it does not change the type of the expression."

**Action Required**: Remove unnecessary assertions where TypeScript can already infer the correct type.

**Example Pattern**:
```typescript
// Before: Unnecessary assertion
const value = someObject.property!;

// After: Remove if TypeScript can infer the type
const value = someObject.property;
```

### 3. Promise Returned in Void Argument (~79 instances)

**Issue**: Promise returned in function argument where void return is expected (typically in event handlers or callbacks).

**Bot Message**: "Promise returned in function argument where a void return was expected."

**Action Required**: Wrap the promise-returning call to handle the promise properly without returning it.

**Example Pattern**:
```typescript
// Before: Returns promise in void callback
button.onClick(() => this.handleClick()); // handleClick returns Promise<void>

// After: Explicitly handle promise
button.onClick(() => {
  this.handleClick().catch(err => logger.error('click', err));
});

// Or wrap in void operator
button.onClick(() => void this.handleClick());
```

### 4. Promise-Returning Method in Plugin Interface (~1 instance)

**Issue**: Promise returned where void is expected in Plugin base class method.

**Bot Message**: "Promise-returning method provided where a void return was expected by extended/implemented type 'Plugin'."

**Action Required**: Make the Plugin method properly async if it's onload/onunload.

**Example Pattern**:
```typescript
// Before: Returns promise but Plugin expects void
onload() {
  return this.initialize(); // returns Promise
}

// After: Make it properly async
async onload() {
  await this.initialize();
}
```

### 5. Unexpected Any Types (~317 instances)

**Issue**: Use of `any` type without explicit type annotation.

**Bot Message**: "Unexpected any. Specify a different type."

**Action Required**: Replace implicit or explicit `any` types with proper type definitions.

**Example Pattern**:
```typescript
// Before: Implicit any
function process(data) { // parameter has implicit any
  return data;
}

// After: Explicit type
function process(data: DataType): DataType {
  return data;
}

// Before: Explicit any in type definition
interface Config {
  settings: any;
}

// After: Proper type
interface Config {
  settings: Record<string, unknown> | SettingsType;
}
```

## Optional Issues (Recommended)

### 6. Unsafe `any` Type Casts (~200+ instances)

**Issue**: Extensive use of `as any` type assertions, particularly in:
- StaffRenderer.ts (45+ instances)
- Visualization files
- UI components

**Action Required**: While not blocking approval, these should be addressed for type safety:
1. Define proper interfaces for typed objects
2. Use type guards for runtime type checking
3. Replace `any` with specific types or `unknown` where appropriate

## Implementation Plan

### Phase 1: Required Fixes (Blocking)
1. Fix async methods with no await expressions (~73)
2. Remove unnecessary type assertions (~2)
3. Fix Promise returned in void argument (~79)
4. Fix Promise-returning method in Plugin interface (~1)
5. Fix unexpected any types (~317)
6. Run bot validation (automatic within 6 hours of push)

### Phase 2: Optional Improvements (Post-Approval)
1. Audit all `as any` casts (~200+)
2. Create proper type definitions
3. Implement type guards where needed

## Validation Process

**Important**: Do NOT open a new PR for re-validation. Once required changes are pushed to the repo, the bot will automatically update labels within 6 hours.

## Search Patterns for Audit

```bash
# Find async methods with no await
grep -rn "async " src/ --include="*.ts" | while read line; do
  file=$(echo $line | cut -d: -f1)
  linenum=$(echo $line | cut -d: -f2)
  # Check if method has await
done

# Find unnecessary type assertions
grep -rn '!' src/ --include="*.ts" | grep -v "!==" | grep -v "!="

# Find 'as any' casts
grep -rn "as any" src/ --include="*.ts"
```

## Status Tracking

- [ ] Fix async methods with no await (~73)
- [ ] Remove unnecessary type assertions (~2)
- [ ] Fix Promise returned in void argument (~79)
- [ ] Fix Promise-returning method in Plugin interface (~1)
- [ ] Fix unexpected any types (~317)
- [ ] Push changes to repository
- [ ] Wait for bot re-validation (within 6 hours)
- [ ] Address optional `any` type casts post-approval (~200+)

---

**Next Steps**: Create branch and systematically address each required issue category.
