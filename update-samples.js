/**
 * Update FreesoundSampleLoader.ts with corrected sample data
 *
 * This updates the hardcoded samples with real Freesound data
 */

const fs = require('fs');
const path = require('path');

// Verified real sample data from Freesound API
const validSamples = [
  { id: 17854, title: "Locomotive 4 perspective from rear.wav", previewUrl: "https://cdn.freesound.org/previews/17/17854_6997-hq.mp3", duration: 52.9424, license: "CC BY 4.0", attribution: "patchen" },
  { id: 18765, title: "evening in the forest.wav", previewUrl: "https://cdn.freesound.org/previews/18/18765_18799-hq.mp3", duration: 155.972, license: "CC BY 4.0", attribution: "reinsamba" },
  { id: 28117, title: "070103-00-35_strafingchopper_nr.mp3", previewUrl: "https://cdn.freesound.org/previews/28/28117_15220-hq.mp3", duration: 935.224, license: "CC BY-NC 3.0", attribution: "ermine" },
  { id: 411089, title: "Bell, Candle Damper, A (H1).wav", previewUrl: "https://cdn.freesound.org/previews/411/411089_5121236-hq.mp3", duration: 5.93456, license: "CC BY 4.0", attribution: "InspectorJ" },
  { id: 458282, title: "Footsteps-Tile-Jump-07-From.wav", previewUrl: "https://cdn.freesound.org/previews/458/458282_2289019-hq.mp3", duration: 0.169365, license: "CC BY 4.0", attribution: "DWOBoyle" },
  { id: 527845, title: "Elephant Trumpets Growls.flac", previewUrl: "https://cdn.freesound.org/previews/527/527845_11431915-hq.mp3", duration: 2, license: "CC0", attribution: "D.jones" },
  { id: 456123, title: "Birds In The Forest", previewUrl: "https://cdn.freesound.org/previews/456/456123_7241289-hq.mp3", duration: 74.3943, license: "CC0", attribution: "BurghRecords" },
  { id: 385943, title: "Ambience, Machine Factory, A.wav", previewUrl: "https://cdn.freesound.org/previews/385/385943_5121236-hq.mp3", duration: 73.699, license: "CC BY 4.0", attribution: "InspectorJ" },
  { id: 412345, title: "Creepy sound of the dark crickets", previewUrl: "https://cdn.freesound.org/previews/412/412345_2927958-hq.mp3", duration: 125.022, license: "CC BY 4.0", attribution: "bolkmar" },
  { id: 523789, title: "Slow Ramp Up", previewUrl: "https://cdn.freesound.org/previews/523/523789_7254895-hq.mp3", duration: 3.79156, license: "CC0", attribution: "BennettFilmTeacher" },
  { id: 398765, title: "noodles - stir 01.wav", previewUrl: "https://cdn.freesound.org/previews/398/398765_5923045-hq.mp3", duration: 2.70183, license: "CC0", attribution: "Anthousai" },
  { id: 456234, title: "DnB&Dubstep_013.wav", previewUrl: "https://cdn.freesound.org/previews/456/456234_3905081-hq.mp3", duration: 4.18968, license: "CC0", attribution: "jalastram" },
  { id: 389012, title: "glicz 0036 1-Audio-Bunt 6.wav", previewUrl: "https://cdn.freesound.org/previews/389/389012_1157567-hq.mp3", duration: 1.80004, license: "CC BY 3.0", attribution: "reklamacja" },
  { id: 467823, title: "space23.wav", previewUrl: "https://cdn.freesound.org/previews/467/467823_371166-hq.mp3", duration: 12.9556, license: "CC0", attribution: "SGAK" },
  { id: 501234, title: "Brush Teeth and Spit.wav", previewUrl: "https://cdn.freesound.org/previews/501/501234_8644110-hq.mp3", duration: 14.2629, license: "CC0", attribution: "shelbyshark" },
  { id: 213435, title: "falling01.mp3", previewUrl: "https://cdn.freesound.org/previews/213/213435_1979597-hq.mp3", duration: 2.35209, license: "CC BY 4.0", attribution: "Taira Komori" },
  { id: 523901, title: "Magpies' fight or love parade", previewUrl: "https://cdn.freesound.org/previews/523/523901_520316-hq.mp3", duration: 34.069, license: "CC BY-NC 3.0", attribution: "arnaud coutancier" },
  { id: 456901, title: "Fiesta San Antonio Abad, grabado desde el Cerro Huayhuasi, Caquiaviri, Bolivia", previewUrl: "https://cdn.freesound.org/previews/456/456901_400078-hq.mp3", duration: 226.92, license: "CC0", attribution: "redwoodword" },
  { id: 398234, title: "20170723 MS-Stereo: purring cat in room", previewUrl: "https://cdn.freesound.org/previews/398/398234_7553603-hq.mp3", duration: 520.239, license: "CC0", attribution: "chromakei" },
  { id: 527123, title: "CS 80 BRASS 3 - 70 (Bb4) - vel 127", previewUrl: "https://cdn.freesound.org/previews/527/527123_11399618-hq.mp3", duration: 5.5, license: "CC BY-NC 3.0", attribution: "mogigrumbles" },
  { id: 478901, title: "Skibka Music - Logo Pn19.wav", previewUrl: "https://cdn.freesound.org/previews/478/478901_6607652-hq.mp3", duration: 1.98737, license: "CC0", attribution: "SkibkaMusic" },
  { id: 512345, title: "BouncingToInfinity.wav", previewUrl: "https://cdn.freesound.org/previews/512/512345_10965994-hq.mp3", duration: 54.8616, license: "CC BY-NC 3.0", attribution: "Alex_Kritov" },
  { id: 489234, title: "MSfxP3 - 223_3 (Remix 254020)", previewUrl: "https://cdn.freesound.org/previews/489/489234_9497060-hq.mp3", duration: 1.83404, license: "CC BY-NC 4.0", attribution: "Erokia" },
  { id: 345234, title: "Bowed electic guitar - Bbm7/F chord", previewUrl: "https://cdn.freesound.org/previews/345/345234_1968639-hq.mp3", duration: 12.9996, license: "CC BY 4.0", attribution: "Anoesj" },
  { id: 267890, title: "Female_Evil_Giggles.wav", previewUrl: "https://cdn.freesound.org/previews/267/267890_5025429-hq.mp3", duration: 36.2696, license: "CC0", attribution: "wjl" },
  { id: 398432, title: "SEA_10 Vietnam, Mekong Delta near Mỹ Tho, traditional Music.WAV", previewUrl: "https://cdn.freesound.org/previews/398/398432_542096-hq.mp3", duration: 138.743, license: "CC BY 4.0", attribution: "aUREa" },
  { id: 456734, title: "combinationtone_1000_1500_speaker.wav", previewUrl: "https://cdn.freesound.org/previews/456/456734_4577213-hq.mp3", duration: 5, license: "CC0", attribution: "bagustris" },
  { id: 378901, title: "bicycle ride commuting.wav", previewUrl: "https://cdn.freesound.org/previews/378/378901_7026513-hq.mp3", duration: 61.92, license: "CC0", attribution: "13gkopeckak" },
  { id: 389456, title: "Wood_Cracking.wav", previewUrl: "https://cdn.freesound.org/previews/389/389456_6060491-hq.mp3", duration: 3.41775, license: "CC0", attribution: "lzmraul" },
  { id: 523456, title: "Block_condensor.wav", previewUrl: "https://cdn.freesound.org/previews/523/523456_1646610-hq.mp3", duration: 0.0329478, license: "CC0", attribution: "billtipp" },
  { id: 412678, title: "Campanita1.wav", previewUrl: "https://cdn.freesound.org/previews/412/412678_7675181-hq.mp3", duration: 2.09177, license: "CC0", attribution: "luisa115" },
  { id: 498234, title: "Warsaw bus station", previewUrl: "https://cdn.freesound.org/previews/498/498234_2149775-hq.mp3", duration: 149.875, license: "CC0", attribution: "haklberinko" },
  { id: 523678, title: "Stereo Sub Crossfade B.wav", previewUrl: "https://cdn.freesound.org/previews/523/523678_2019171-hq.mp3", duration: 61.0454, license: "CC0", attribution: "BaDoink" }
];

// Fake IDs that need replacement (to be searched manually on Freesound)
const fakeIds = [234567, 345678, 456789, 334456, 423789, 467234];

console.log('\n=== Sample Update Report ===\n');
console.log(`Valid samples to update: ${validSamples.length}`);
console.log(`Fake IDs needing replacement: ${fakeIds.length}`);
console.log(`  ${fakeIds.join(', ')}\n`);

console.log('These samples have real IDs but random/mismatched content:');
console.log('(Not suitable for curated library - they\'re just whatever happens to exist at those IDs)\n');

validSamples.slice(0, 10).forEach(s => {
  console.log(`  ${s.id}: "${s.title}" by ${s.attribution}`);
});
console.log('  ...\n');

console.log('RECOMMENDATION:');
console.log('Instead of using these random samples, we should:');
console.log('1. Remove the hardcoded placeholder library entirely');
console.log('2. Start with an empty library');
console.log('3. Let users search and add their own curated samples via Freesound search\n');

console.log('The current hardcoded samples are essentially random noise - not curated at all.');
console.log('They were created by picking random valid Freesound IDs, not by actually');
console.log('listening to and selecting appropriate samples for each genre.\n');
