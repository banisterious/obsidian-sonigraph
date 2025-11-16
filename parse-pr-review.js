#!/usr/bin/env node
/**
 * Parse Obsidian PR review comments and categorize issues
 *
 * Format: Groups start with [[1]] followed by description line
 * Each subsequent line until next [[1]] is an instance of that issue type
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2] || 'obsidian-pr-review-comment-3537235271.md';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const categories = [];
let currentCategory = null;
let instanceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (line === '[[1]]') {
    // Save previous category if exists
    if (currentCategory) {
      categories.push({ ...currentCategory, count: instanceCount });
    }

    // Get description from next non-empty line
    let description = '';
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j].trim();
      if (nextLine && !nextLine.startsWith('[[')) {
        description = nextLine;
        break;
      }
    }

    currentCategory = { description };
    instanceCount = 0;
  } else if (line.startsWith('[[') && line !== '[[1]]' && currentCategory) {
    // Count instance
    instanceCount++;
  }
}

// Save last category
if (currentCategory) {
  categories.push({ ...currentCategory, count: instanceCount });
}

// Output results
console.log(`Total Issue Categories: ${categories.length}\n`);
console.log('| # | Count | Description |');
console.log('|---|-------|-------------|');

let totalIssues = 0;
categories.forEach((cat, idx) => {
  console.log(`| ${idx + 1} | ${cat.count} | ${cat.description} |`);
  totalIssues += cat.count;
});

console.log(`\nTotal Issues: ${totalIssues}`);

// Detailed breakdown
console.log('\n\n## Detailed Breakdown\n');
categories.forEach((cat, idx) => {
  console.log(`### ${idx + 1}. ${cat.description}`);
  console.log(`**Count:** ${cat.count}\n`);
});
