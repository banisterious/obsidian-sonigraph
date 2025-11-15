#!/usr/bin/env node
/**
 * Batch fix D3.js any types by replacing with unknown
 *
 * Replaces patterns like:
 * - (d: any) => with (d: unknown) =>
 * - d3.Selection<..., any> with d3.Selection<..., unknown>
 *
 * Also removes the eslint-disable comment since unknown is safer than any
 */

const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  let count = 0;

  const newLines = [];
  let skipNextLine = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a D3.js-related eslint-disable comment
    if (line.includes('eslint-disable-next-line @typescript-eslint/no-explicit-any') &&
        line.includes('D3.js')) {
      // Check the next line to see if we should fix it
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';

      if (nextLine.includes('any') &&
          (nextLine.includes('d3.Selection') || nextLine.includes('(d: any)') ||
           nextLine.includes('(d: any,') || nextLine.includes(': any)') ||
           nextLine.includes('style(') || nextLine.includes('attr(') ||
           nextLine.includes('text('))) {
        // Skip the eslint-disable comment
        modified = true;
        count++;
        skipNextLine = true;
        continue;
      }
    }

    if (skipNextLine) {
      skipNextLine = false;
      // Replace any with unknown in this line
      let fixedLine = line
        // Function parameters: (d: any) => or (d: any, i: number) =>
        .replace(/\(d: any\)/g, '(d: unknown)')
        .replace(/\(d: any,/g, '(d: unknown,')
        // D3 Selection types: d3.Selection<..., any>
        .replace(/d3\.Selection<([^,>]+),\s*([^,>]+),\s*([^,>]+),\s*any>/g, 'd3.Selection<$1, $2, $3, unknown>')
        // Simple Selection types: Selection<..., any>
        .replace(/Selection<([^,>]+),\s*([^,>]+),\s*([^,>]+),\s*any>/g, 'Selection<$1, $2, $3, unknown>')
        // Property declarations: private foo: any
        .replace(/:\s*any(?=\s*[;=])/g, ': unknown');

      newLines.push(fixedLine);
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log(`✓ ${filePath}: Fixed ${count} D3.js any types`);
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
console.log('Fixing D3.js any types...\n');

let totalFixed = 0;
for (const file of files) {
  totalFixed += fixFile(file);
}

console.log(`\n✓ Done! Fixed ${totalFixed} D3.js any type issues across ${files.length} files`);
