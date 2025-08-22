/**
 * Phase 4.2 Test Script - Tag-Based Musical Semantics
 * 
 * Quick test to verify the TagSemanticMapper integration
 */

import { TagSemanticMapper, DEFAULT_TAG_MAPPINGS } from './src/audio/mapping/TagSemanticMapper';
import { ContentAwareMapper } from './src/audio/mapping/ContentAwareMapper';
import { EnhancedGraphNode } from './src/graph/types';

// Mock App for testing
const mockApp = {
    vault: {
        getAbstractFileByPath: () => null
    }
} as any;

// Test configuration
const testConfig = {
    contentAwareMapping: {
        enabled: true,
        fileTypePreferences: {},
        tagMappings: {},
        folderMappings: {},
        connectionTypeMappings: {}
    },
    enhancedMapping: {
        analyzeImageMetadata: false,
        analyzeAudioDuration: false,
        analyzePdfStructure: false,
        analyzeNoteComplexity: false,
        enableFileSystemAnalysis: false,
        enableSemanticAnalysis: true,
        useAdvancedHeuristics: false,
        weightings: {
            fileSize: 0.2,
            contentStructure: 0.3,
            metadata: 0.2,
            semantics: 0.6, // High semantic weight for testing
            relationships: 0.1
        }
    },
    tagSemantics: {
        enabled: true,
        weightings: {
            emotional: 0.3,
            functional: 0.4,
            topical: 0.2,
            complexity: 0.1,
            temporal: 0.1
        },
        enableComplexityMapping: true,
        enableTemporalAnalysis: true
    }
};

// Test node with various tags
const testNode: EnhancedGraphNode = {
    id: 'test-node',
    name: 'Test Note',
    path: 'test-note.md',
    connections: [],
    connectionCount: 2,
    wordCount: 500,
    tags: ['#idea', '#creative', '#project'],
    headings: ['Introduction', 'Main Content'],
    created: Date.now() - 86400000, // 1 day ago
    modified: Date.now() - 3600000, // 1 hour ago
    metadata: {
        tags: ['idea', 'creative', 'project'],
        frontmatter: {
            tags: ['idea', 'creative', 'project'],
            mood: 'excited'
        },
        wordCount: 500,
        headingCount: 2
    },
    connectionDetails: {
        wikilinks: [],
        markdownLinks: [],
        embeds: [],
        tagConnections: ['creative-writing', 'project-ideas'],
        totalCount: 2
    },
    folderDepth: 2,
    pathComponents: ['Projects', 'Creative', 'test-note.md']
};

async function testTagSemanticMapping() {
    console.log('🎵 Testing Phase 4.2: Tag-Based Musical Semantics');
    console.log('='.repeat(50));

    try {
        // Test TagSemanticMapper directly
        console.log('\n1. Testing TagSemanticMapper directly:');
        const semanticMapper = new TagSemanticMapper(mockApp, testConfig);
        const semanticResult = await semanticMapper.performSemanticMapping(testNode);
        
        console.log(`   Selected Instrument: ${semanticResult.selectedInstrument}`);
        console.log(`   Confidence: ${semanticResult.confidence.toFixed(2)}`);
        console.log(`   Emotional Valence: ${semanticResult.analysis.emotionalContext.valence.toFixed(2)}`);
        console.log(`   Functional Context: ${semanticResult.analysis.functionalContext.primaryFunction}`);
        console.log(`   Topical Context: ${semanticResult.analysis.topicalContext.primaryTopic}`);
        console.log(`   Tag Complexity: ${semanticResult.analysis.complexity.chordComplexity.toFixed(2)}`);
        console.log(`   Alternative Instruments: ${semanticResult.alternativeInstruments.join(', ')}`);

        // Test integrated ContentAwareMapper
        console.log('\n2. Testing integrated ContentAwareMapper:');
        const contentMapper = new ContentAwareMapper(mockApp, testConfig);
        const combinedResult = await contentMapper.performContentAwareMapping(testNode);
        
        console.log(`   Final Instrument: ${combinedResult.selectedInstrument}`);
        console.log(`   Combined Confidence: ${combinedResult.confidence.toFixed(2)}`);
        console.log(`   Pitch Range: ${combinedResult.musicalProperties.pitchRange}`);
        console.log(`   Velocity: ${combinedResult.musicalProperties.velocity.toFixed(2)}`);
        console.log(`   Harmonic Density: ${combinedResult.musicalProperties.harmonicDensity.toFixed(2)}`);
        console.log(`   Analysis Time: ${combinedResult.analysisTime.toFixed(2)}ms`);

        // Test default mappings
        console.log('\n3. Testing default tag mappings:');
        console.log(`   Idea instruments: ${DEFAULT_TAG_MAPPINGS.functionalTags.default.ideationInstruments.join(', ')}`);
        console.log(`   Creative instruments: ${DEFAULT_TAG_MAPPINGS.functionalTags.default.creativeInstruments.join(', ')}`);
        console.log(`   Reflective instruments: ${DEFAULT_TAG_MAPPINGS.functionalTags.default.reflectiveInstruments.join(', ')}`);
        
        console.log('\n✅ Phase 4.2 testing completed successfully!');
        
    } catch (error) {
        console.error('❌ Phase 4.2 testing failed:', error);
    }
}

// Run the test
testTagSemanticMapping();