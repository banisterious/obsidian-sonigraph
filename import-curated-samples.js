/**
 * Import curated Freesound samples into plugin settings
 *
 * This script transforms curated-samples.json to the plugin's settings format
 * and outputs a migration snippet that can be added to the plugin's settings migration logic.
 */

const fs = require('fs');
const path = require('path');

// Read curated samples
const curatedSamples = JSON.parse(
	fs.readFileSync(path.join(__dirname, 'curated-samples.json'), 'utf8')
);

console.log(`\nFound ${curatedSamples.length} curated samples\n`);

// Transform to plugin settings format
const transformedSamples = curatedSamples.map(sample => ({
	id: sample.id,
	title: sample.name,
	previewUrl: sample.previewUrl || `https://cdn.freesound.org/previews/${Math.floor(sample.id / 1000)}/${sample.id}_preview-hq.mp3`,
	duration: sample.duration,
	license: sample.license,
	attribution: sample.author,
	fadeIn: 2,  // Default fade in
	fadeOut: 3, // Default fade out
	enabled: true,
	tags: sample.tags || [],
	description: sample.description,
	usageNotes: sample.usageNotes
}));

// Output the transformed samples
const outputPath = path.join(__dirname, 'curated-samples-transformed.json');
fs.writeFileSync(outputPath, JSON.stringify(transformedSamples, null, 2));

console.log(`✅ Transformed samples written to: ${outputPath}`);
console.log(`\nSample count: ${transformedSamples.length}`);

// Show statistics
const tagCounts = {};
const licenseCounts = {};

transformedSamples.forEach(sample => {
	// Count tags
	if (sample.tags) {
		sample.tags.forEach(tag => {
			tagCounts[tag] = (tagCounts[tag] || 0) + 1;
		});
	}
	// Count licenses
	licenseCounts[sample.license] = (licenseCounts[sample.license] || 0) + 1;
});

console.log('\nTag distribution:');
Object.entries(tagCounts)
	.sort((a, b) => b[1] - a[1])
	.slice(0, 10)
	.forEach(([tag, count]) => {
		console.log(`  ${tag}: ${count}`);
	});

console.log('\nLicense distribution:');
Object.entries(licenseCounts)
	.sort((a, b) => b[1] - a[1])
	.forEach(([license, count]) => {
		console.log(`  ${license}: ${count}`);
	});

console.log('\n✨ Done! Use curated-samples-transformed.json to populate plugin settings.\n');
