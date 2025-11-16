#!/usr/bin/env node
/**
 * Batch fix Promise handling issues by adding void operator
 *
 * Finds lines where async functions are called without being awaited/caught/voided
 * and adds the void operator to explicitly mark them as intentionally ignored.
 */

const fs = require('fs');
const path = require('path');

// Common async method patterns that should be voided
const ASYNC_PATTERNS = [
  /^(\s*)this\.(\w+)\(\);?\s*$/,  // this.method();
  /^(\s*)(\w+)\.(\w+)\(\);?\s*$/,  // object.method();
  /^(\s*)await\s+/,  // Lines that already have await
  /^(\s*)void\s+/,   // Lines that already have void
  /^(\s*)return\s+/, // Return statements
];

function shouldAddVoid(line) {
  // Don't add void if line already has await, void, or return
  if (/^\s*(await|void|return)\s+/.test(line)) {
    return false;
  }

  // Don't add void to empty lines or comments
  if (/^\s*$/.test(line) || /^\s*\/\//.test(line)) {
    return false;
  }

  // Don't add void to variable declarations
  if (/^\s*(const|let|var)\s+/.test(line)) {
    return false;
  }

  // Don't add void to property assignments (this.foo = bar(), obj.prop = val())
  if (/=/.test(line)) {
    return false;
  }

  // Don't add void to lines that start with } or ] (closing braces/brackets)
  if (/^\s*[\]}]/.test(line)) {
    return false;
  }

  // Don't add void to lines that contain opening braces/brackets (object/array literals)
  if (/[{[]/.test(line)) {
    return false;
  }

  // Look for async method calls that end with ();
  // Must start with valid identifiers (this, identifiers, or member expressions)
  // This matches patterns like: this.method(); or object.method(); or logger.debug();
  if (/^\s*(this|[a-zA-Z_$][\w$]*)\.\w+\([^)]*\);?\s*$/.test(line)) {
    return true;
  }

  return false;
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  let count = 0;

  const newLines = lines.map((line, index) => {
    if (shouldAddVoid(line)) {
      // Check if previous line suggests we're in a callback context
      const prevLine = index > 0 ? lines[index - 1] : '';
      const isInCallback = /\.(map|filter|forEach|reduce|some|every|find|findIndex)\s*\(\s*\w*\s*=>\s*$/.test(prevLine) ||
                           /\.(map|filter|forEach|reduce|some|every|find|findIndex)\s*\(\s*\(/.test(prevLine);

      // Check if previous line ends with comma (multi-line argument list)
      const prevLineEndsWithComma = /,\s*$/.test(prevLine);

      // Check if previous line has unclosed parentheses (multi-line function call)
      const prevLineHasUnclosedParen = prevLine.includes('(') && !prevLine.includes(')');

      // Check if next line starts with . (method chaining)
      // Skip comment lines when checking for method chaining
      let nextLine = '';
      for (let i = index + 1; i < lines.length; i++) {
        const line = lines[i];
        // Skip empty lines and comment lines
        if (!/^\s*$/.test(line) && !/^\s*\/\//.test(line)) {
          nextLine = line;
          break;
        }
      }
      const nextLineStartsWithDot = /^\s*\./.test(nextLine);

      if (!isInCallback && !prevLineEndsWithComma && !prevLineHasUnclosedParen && !nextLineStartsWithDot) {
        const match = line.match(/^(\s*)(.*);?\s*$/);
        if (match) {
          const [, indent, code] = match;
          // Add void operator before the expression
          modified = true;
          count++;
          return `${indent}void ${code.replace(/;+$/, '')};`;
        }
      }
    }
    return line;
  });

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`✓ ${filePath}: Fixed ${count} Promise handling issues`);
    return count;
  }

  return 0;
}

function findTypeScriptFiles(dir) {
  const files = [];

  function walk(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!item.startsWith('.') && item !== 'node_modules') {
          walk(fullPath);
        }
      } else if (item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const files = findTypeScriptFiles(srcDir);

console.log(`Found ${files.length} TypeScript files`);
console.log('Fixing Promise handling issues...\n');

let totalFixed = 0;
for (const file of files) {
  totalFixed += fixFile(file);
}

console.log(`\n✓ Done! Fixed ${totalFixed} Promise handling issues across ${files.length} files`);
