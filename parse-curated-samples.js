/**
 * Parse curated samples from freesound-audio-library.md
 * Extracts all metadata for table-based UI implementation
 */

const fs = require('fs');

const content = fs.readFileSync('docs/planning/freesound-audio-library.md', 'utf-8');

// Split by sample entries (marked by ####)
const sections = content.split(/####\s+/);

const samples = [];
let currentGenre = '';

sections.forEach(section => {
  // Extract genre from ## headings
  const genreMatch = section.match(/^##\s+(\w+)\s+Genre/m);
  if (genreMatch) {
    currentGenre = genreMatch[1].toLowerCase();
  }

  // Parse sample data
  const nameMatch = section.match(/^(.+?)$/m);
  const urlMatch = section.match(/sounds\/(\d+)/);
  const licenseMatch = section.match(/\*\*License:\*\*\s*(.+?)$/m);
  const attributionMatch = section.match(/\*\*Attribution(?:\s+Required)?:\*\*\s*(.+?)$/m);
  const durationMatch = section.match(/\*\*Duration:\*\*\s*([\d:\.]+)\s*\(([\d\.]+)\s*seconds\)/);
  const descriptionMatch = section.match(/\*\*Description:\*\*\s*(.+?)$/m);
  const tagsMatch = section.match(/\*\*Tags:\*\*\s*(.+?)$/m);
  const usageMatch = section.match(/\*\*Usage Notes:\*\*\s*(.+?)$/m);

  if (urlMatch && nameMatch) {
    const id = parseInt(urlMatch[1]);
    const name = nameMatch[1].trim();

    // Extract author from attribution or URL
    const authorMatch = section.match(/people\/([^\/]+)\//) ||
                        attributionMatch && attributionMatch[1].match(/by\s+(\S+)/);
    const author = authorMatch ? authorMatch[1] : 'Unknown';

    // Parse duration in seconds
    const durationSeconds = durationMatch ? parseFloat(durationMatch[2]) : 0;

    // Parse license type
    let license = 'Unknown';
    if (licenseMatch) {
      const licenseText = licenseMatch[1];
      if (licenseText.includes('CC0')) license = 'CC0';
      else if (licenseText.includes('CC BY 4.0')) license = 'CC BY 4.0';
      else if (licenseText.includes('CC BY 3.0')) license = 'CC BY 3.0';
      else if (licenseText.includes('CC BY-NC')) license = 'CC BY-NC';
      else license = licenseText.split('(')[0].trim();
    }

    // Parse tags
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];
    if (currentGenre && !tags.includes(currentGenre)) {
      tags.unshift(currentGenre);
    }

    const sample = {
      id,
      name,
      author,
      duration: durationSeconds,
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      license,
      previewUrl: `https://cdn.freesound.org/previews/${id.toString().substring(0, 3)}/${id}_preview-hq.mp3`,
      tags,
      usageNotes: usageMatch ? usageMatch[1].trim() : '',
      genre: currentGenre
    };

    samples.push(sample);
  }
});

console.log(`\nParsed ${samples.length} curated samples\n`);

// Group by genre
const byGenre = {};
samples.forEach(s => {
  if (!byGenre[s.genre]) byGenre[s.genre] = [];
  byGenre[s.genre].push(s);
});

console.log('Samples by genre:');
Object.entries(byGenre).forEach(([genre, items]) => {
  console.log(`  ${genre}: ${items.length} samples`);
});

// Write to JSON for TypeScript import
fs.writeFileSync(
  'curated-samples.json',
  JSON.stringify(samples, null, 2)
);

console.log('\nWrote curated-samples.json');

// Sample preview
console.log('\nFirst 3 samples:');
samples.slice(0, 3).forEach(s => {
  console.log(`  ${s.id}: "${s.name}" by ${s.author} [${s.license}]`);
  console.log(`     Tags: ${s.tags.join(', ')}`);
  console.log(`     ${s.duration}s - ${s.description}`);
});
