/**
 * Verify Freesound sample IDs and update with real data
 *
 * This script checks each hardcoded sample ID against the Freesound API
 * to determine which are real and which are fake placeholders.
 */

const sampleIds = [
  // Ambient
  17854, 18765, 28117,
  // Drone
  234567, 411089, 458282,
  // Electronic
  345678, 527845, 456123,
  // Industrial
  456789, 385943, 412345,
  // Orchestral
  523789, 398765, 456234,
  // Minimal
  389012, 467823, 501234,
  // Oceanic
  213435, 334456, 523901,
  // Sci-Fi
  456901, 398234, 527123,
  // Experimental
  478901, 512345, 489234,
  // Urban
  345234, 267890, 423789,
  // Nature
  398432, 456734, 378901,
  // Rhythmic
  389456, 467234, 523456,
  // Jazz
  412678, 498234, 523678
];

const API_KEY = 'QrzV6b6oeafDH3MK7MCEgb8cQiQV4g3BpkJcokzD';

async function verifySample(id) {
  try {
    const url = `https://freesound.org/apiv2/sounds/${id}/?token=${API_KEY}&fields=id,name,previews,duration,license,username`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return {
        id,
        valid: true,
        data: {
          id: data.id,
          title: data.name,
          previewUrl: data.previews['preview-hq-mp3'] || data.previews['preview-lq-mp3'],
          duration: data.duration,
          license: data.license,
          attribution: data.username
        }
      };
    } else {
      return {
        id,
        valid: false,
        status: response.status
      };
    }
  } catch (error) {
    return {
      id,
      valid: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('Verifying Freesound sample IDs...\n');

  const results = [];

  for (const id of sampleIds) {
    const result = await verifySample(id);
    results.push(result);

    if (result.valid) {
      console.log(`✓ ${id}: ${result.data.title} by ${result.data.attribution}`);
    } else {
      console.log(`✗ ${id}: Invalid (${result.status || result.error})`);
    }

    // Rate limiting - wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n--- Summary ---');
  const valid = results.filter(r => r.valid);
  const invalid = results.filter(r => !r.valid);

  console.log(`Valid: ${valid.length}/${results.length}`);
  console.log(`Invalid: ${invalid.length}/${results.length}`);

  console.log('\n--- Invalid IDs ---');
  invalid.forEach(r => console.log(`  ${r.id}`));

  console.log('\n--- Valid Sample Data (JSON) ---');
  console.log(JSON.stringify(valid.map(r => r.data), null, 2));
}

main().catch(console.error);
