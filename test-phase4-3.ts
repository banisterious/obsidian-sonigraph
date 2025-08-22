/**
 * Test script for Phase 4.3: Folder Hierarchy and Path Mapping
 * 
 * Tests the new FolderHierarchyMapper and PathAnalyzer components
 * to ensure they correctly map folder structures to musical characteristics.
 */

import { FolderHierarchyMapper, PathAnalyzer } from './src/audio/mapping';

// Mock App for testing
const mockApp = {
    vault: {
        getAbstractFileByPath: (path: string): any => {
            // Mock folder structure for testing
            const mockFolders: Record<string, { children: { name: string }[] }> = {
                'Projects': { children: [{ name: 'Work' }, { name: 'Personal' }] },
                'Journal': { children: [{ name: '2024' }, { name: 'Daily' }] },
                'Research': { children: [{ name: 'Papers' }, { name: 'Notes' }] },
                'Archive': { children: [{ name: 'Old' }] },
                'Ideas': { children: [{ name: 'Creative' }, { name: 'Brainstorm' }] }
            };
            
            // Simple mock implementation
            const pathParts = path.split('/');
            const folderName = pathParts[0];
            
            if (mockFolders[folderName]) {
                return {
                    parent: null as any,
                    children: mockFolders[folderName].children
                };
            }
            
            return null;
        }
    }
} as any;

async function testPathAnalysis() {
    console.log('='.repeat(60));
    console.log('PHASE 4.3 PATH ANALYSIS TEST');
    console.log('='.repeat(60));
    
    const pathAnalyzer = new PathAnalyzer(mockApp);
    
    const testPaths = [
        'Projects/Work/Current-Tasks.md',
        'Journal/Daily/2024-08-22.md',
        'Research/Papers/AI-Music-Generation.md',
        'Archive/Old-Projects/Completed.md',
        'Ideas/Creative/New-Concepts.md',
        'Notes.md', // Root level file
        'Deep/Nested/Folder/Structure/Test.md'
    ];
    
    for (const testPath of testPaths) {
        try {
            console.log(`\nAnalyzing path: ${testPath}`);
            console.log('-'.repeat(40));
            
            const analysis = await pathAnalyzer.analyzePath(testPath);
            
            console.log(`  Path Components: [${analysis.pathComponents.join(' → ')}]`);
            console.log(`  Depth: ${analysis.depth}`);
            console.log(`  Root Folder: ${analysis.rootFolder}`);
            console.log(`  Parent Folder: ${analysis.parentFolder}`);
            console.log(`  Complexity: ${analysis.pathComplexity.toFixed(2)}`);
            console.log(`  Folder Types: [${analysis.folderCharacteristics.map(f => f.folderType).join(', ')}]`);
            
        } catch (error) {
            console.log(`  Error: ${error.message}`);
        }
    }
}

async function testFolderHierarchyMapping() {
    console.log('\n' + '='.repeat(60));
    console.log('PHASE 4.3 FOLDER HIERARCHY MAPPING TEST');
    console.log('='.repeat(60));
    
    const folderHierarchyMapper = new FolderHierarchyMapper(mockApp, {
        enableDepthMapping: true,
        enableThematicMapping: true,
        depthInfluenceWeight: 0.7,
        thematicInfluenceWeight: 0.8,
        maxDepthConsideration: 6,
        customFolderMappings: {},
        pitchDepthSensitivity: 1.0,
        timbreDepthSensitivity: 1.0
    });
    
    const testPaths = [
        'Projects/Work/Sprint-Planning.md',
        'Journal/Personal/Reflections.md',
        'Research/AI/Machine-Learning.md',
        'Archive/2023/Old-Notes.md',
        'Ideas/Brainstorm/Innovation.md'
    ];
    
    for (const testPath of testPaths) {
        try {
            console.log(`\nMapping path: ${testPath}`);
            console.log('-'.repeat(40));
            
            const characteristics = await folderHierarchyMapper.analyzeFolderPath(testPath);
            
            console.log(`  Dominant Theme: ${characteristics.dominantTheme.primary}`);
            console.log(`  Instrument Family: ${characteristics.instrumentFamily}`);
            console.log(`  Musical Character:`);
            console.log(`    Energy: ${characteristics.dominantTheme.musicalCharacter.energy.toFixed(2)}`);
            console.log(`    Formality: ${characteristics.dominantTheme.musicalCharacter.formality.toFixed(2)}`);
            console.log(`    Complexity: ${characteristics.dominantTheme.musicalCharacter.complexity.toFixed(2)}`);
            console.log(`    Emotional Tone: ${characteristics.dominantTheme.musicalCharacter.emotionalTone}`);
            
            console.log(`  Pitch Modifications:`);
            console.log(`    Base Note Offset: ${characteristics.pitchModification.baseNoteOffset.toFixed(1)} semitones`);
            console.log(`    Pitch Range Multiplier: ${characteristics.pitchModification.pitchRangeMultiplier.toFixed(2)}`);
            console.log(`    Scale Mode: ${characteristics.pitchModification.scaleMode}`);
            
            console.log(`  Timbre Modifications:`);
            console.log(`    Brightness: ${characteristics.timbreModification.brightnessAdjustment.toFixed(2)}`);
            console.log(`    Richness: ${characteristics.timbreModification.richnessMultiplier.toFixed(2)}`);
            
            console.log(`  Confidence: ${characteristics.confidence.toFixed(2)}`);
            
        } catch (error) {
            console.log(`  Error: ${error.message}`);
        }
    }
}

async function testInstrumentFamilyMappings() {
    console.log('\n' + '='.repeat(60));
    console.log('PHASE 4.3 INSTRUMENT FAMILY MAPPINGS TEST');
    console.log('='.repeat(60));
    
    const folderHierarchyMapper = new FolderHierarchyMapper(mockApp);
    
    const folderThemes = [
        ['Projects', 'Work'],
        ['Journal', 'Personal'],
        ['Research', 'Analysis'],
        ['Archive', 'History'],
        ['Ideas', 'Creative'],
        ['Topics', 'Academic'],
        ['2024', '01-January'],
        ['Workflow', 'Tasks'],
        ['Resources', 'References'],
        ['Templates'],
        ['Inbox', 'New']
    ];
    
    console.log('Folder Theme → Instrument Family Mappings:');
    console.log('-'.repeat(50));
    
    for (const pathComponents of folderThemes) {
        const instrumentFamily = folderHierarchyMapper.mapPathToInstrumentFamily(pathComponents);
        const pathString = pathComponents.join('/');
        console.log(`  ${pathString.padEnd(30)} → ${instrumentFamily}`);
    }
    
    console.log('\nSupported Instrument Families:');
    const supportedFamilies = folderHierarchyMapper.getSupportedInstrumentFamilies();
    console.log(`  [${supportedFamilies.join(', ')}]`);
}

async function testDepthInfluence() {
    console.log('\n' + '='.repeat(60));
    console.log('PHASE 4.3 DEPTH INFLUENCE TEST');
    console.log('='.repeat(60));
    
    const folderHierarchyMapper = new FolderHierarchyMapper(mockApp);
    
    console.log('Depth → Pitch Modifications:');
    console.log('-'.repeat(40));
    
    for (let depth = 0; depth <= 6; depth++) {
        const pitchMod = folderHierarchyMapper.calculateDepthInfluence(depth);
        console.log(`  Depth ${depth}:`);
        console.log(`    Base Note Offset: ${pitchMod.baseNoteOffset.toFixed(1)} semitones`);
        console.log(`    Range Multiplier: ${pitchMod.pitchRangeMultiplier.toFixed(2)}`);
        console.log(`    Scale Mode: ${pitchMod.scaleMode}`);
        console.log(`    Intervals: [${pitchMod.intervalPattern.join(', ')}]`);
        console.log('');
    }
}

async function runAllTests() {
    try {
        await testPathAnalysis();
        await testFolderHierarchyMapping();
        await testInstrumentFamilyMappings();
        await testDepthInfluence();
        
        console.log('\n' + '='.repeat(60));
        console.log('PHASE 4.3 TESTS COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\nTest failed with error:', error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

export { runAllTests };