#!/usr/bin/env node
/**
 * Remove unused imports based on ESLint output
 *
 * Finds lines like:
 * import { Foo, Bar } from 'module';
 *
 * And removes unused items based on ESLint errors
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Get ESLint output
console.log('Running ESLint to find unused imports...\n');
const lintOutput = execSync('npx eslint src --ext .ts --format json', { encoding: 'utf8' });
const results = JSON.parse(lintOutput);

const filesToFix = new Map();

// Parse ESLint results for unused-vars errors
for (const result of results) {
  if (result.messages.length === 0) continue;

  const unusedVars = result.messages
    .filter(msg => msg.ruleId === '@typescript-eslint/no-unused-vars')
    .filter(msg => msg.message.includes('is defined but never used') || msg.message.includes('is assigned a value but never used'));

  if (unusedVars.length > 0) {
    filesToFix.set(result.filePath, unusedVars);
  }
}

console.log(`Found ${filesToFix.size} files with unused variables\n`);

let totalFixed = 0;

for (const [filePath, unusedVars] of filesToFix) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const unusedNames = unusedVars.map(v => {
    // Extract variable name from message like "'Foo' is defined but never used"
    const match = v.message.match(/'([^']+)'/);
    return match ? match[1] : null;
  }).filter(Boolean);

  if (unusedNames.length === 0) continue;

  let modified = false;
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let modifiedLine = line;
    let lineModified = false;

    // Check if this is an import line
    const importMatch = line.match(/^import\s+(?:type\s+)?{([^}]+)}\s+from/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(s => s.trim());
      const keptImports = imports.filter(imp => {
        const impName = imp.split(/\s+as\s+/)[1] || imp;
        return !unusedNames.includes(impName);
      });

      if (keptImports.length < imports.length) {
        if (keptImports.length === 0) {
          // Remove entire import line
          modifiedLine = null;
          lineModified = true;
        } else {
          // Keep some imports
          const typePrefix = line.includes('import type') ? 'import type ' : 'import ';
          const fromPart = line.match(/from\s+.+$/)[0];
          modifiedLine = `${typePrefix}{ ${keptImports.join(', ')} } ${fromPart}`;
          lineModified = true;
        }
      }
    }

    // Check for standalone unused variable declarations
    for (const unusedName of unusedNames) {
      // Match: const foo = ... or let foo = ... or const { foo } = ...
      const varMatch = line.match(new RegExp(`^\\s*(const|let|var)\\s+(?:\\{[^}]*)?${unusedName}\\b`));
      if (varMatch && !line.includes('import')) {
        // Comment out the line instead of removing (safer)
        modifiedLine = `// ${line.trimStart()} // Unused variable removed`;
        lineModified = true;
        break;
      }
    }

    if (lineModified) {
      modified = true;
      totalFixed++;
      if (modifiedLine !== null) {
        newLines.push(modifiedLine);
      }
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    const shortPath = filePath.replace(/^.*\/sonigraph\//, '');
    console.log(`✓ ${shortPath}: Fixed ${unusedNames.length} unused variables`);
  }
}

console.log(`\n✓ Done! Modified ${totalFixed} lines across ${filesToFix.size} files`);
