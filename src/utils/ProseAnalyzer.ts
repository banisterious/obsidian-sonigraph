/**
 * ProseAnalyzer
 *
 * Analyzes markdown content structure and prose characteristics to inform musical parameter modulation.
 * Provides metrics on content density, structural complexity, content type, and linguistic features.
 */

import { getLogger } from '../logging';

const logger = getLogger('ProseAnalyzer');

/**
 * Content type classifications
 */
export type ContentType =
	| 'meeting-notes'      // Bullets, dates, action items
	| 'research'           // Citations, quotes, dense paragraphs
	| 'creative'           // Long paragraphs, narrative flow
	| 'technical'          // Code blocks, structured headings
	| 'journal'            // Personal, emotional, dated entries
	| 'outline'            // Heavy heading structure, minimal prose
	| 'mixed';             // No clear dominant type

/**
 * Comprehensive prose analysis result
 */
export interface ProseAnalysis {
	// Content Density Metrics
	density: {
		wordsPerParagraph: number;      // Average words per paragraph
		whitespaceRatio: number;         // Ratio of empty lines to total lines (0-1)
		listDensity: number;             // Ratio of list items to total lines (0-1)
		contentDensity: number;          // Overall density score (0-1, higher = denser)
	};

	// Structural Complexity Metrics
	structure: {
		headingCount: number;            // Total number of headings
		maxHeadingLevel: number;         // Deepest heading level (1-6)
		nestingDepth: number;            // Average nesting depth
		calloutCount: number;            // Number of callouts/blockquotes
		codeBlockCount: number;          // Number of code blocks
		tableCount: number;              // Number of tables
		complexityScore: number;         // Overall structural complexity (0-1)
	};

	// Linguistic Features
	linguistic: {
		avgSentenceLength: number;       // Average words per sentence
		vocabularyDiversity: number;     // Unique words / total words (0-1)
		punctuationDensity: number;      // Punctuation marks per 100 words
		questionRatio: number;           // Questions / total sentences (0-1)
		avgWordLength: number;           // Average characters per word
		readabilityScore: number;        // Combined readability metric (0-1)
	};

	// Content Type Classification
	contentType: ContentType;            // Detected content type
	typeConfidence: number;              // Confidence in classification (0-1)

	// Overall Scores (normalized 0-1)
	overallComplexity: number;           // Combined complexity from all metrics
	musicalExpressiveness: number;       // How much musical variation this content suggests
}

/**
 * Default/empty prose analysis
 */
export const DEFAULT_PROSE_ANALYSIS: ProseAnalysis = {
	density: {
		wordsPerParagraph: 50,
		whitespaceRatio: 0.3,
		listDensity: 0.1,
		contentDensity: 0.5
	},
	structure: {
		headingCount: 0,
		maxHeadingLevel: 0,
		nestingDepth: 0,
		calloutCount: 0,
		codeBlockCount: 0,
		tableCount: 0,
		complexityScore: 0.5
	},
	linguistic: {
		avgSentenceLength: 15,
		vocabularyDiversity: 0.5,
		punctuationDensity: 10,
		questionRatio: 0.1,
		avgWordLength: 5,
		readabilityScore: 0.5
	},
	contentType: 'mixed',
	typeConfidence: 0.5,
	overallComplexity: 0.5,
	musicalExpressiveness: 0.5
};

/**
 * ProseAnalyzer class
 */
export class ProseAnalyzer {
	/**
	 * Analyze markdown content and return comprehensive prose metrics
	 */
	public static analyze(content: string): ProseAnalysis {
		if (!content || content.trim().length === 0) {
			logger.debug('analyze', 'Empty content, returning defaults');
			return DEFAULT_PROSE_ANALYSIS;
		}

		logger.debug('analyze', 'Analyzing prose structure', {
			contentLength: content.length
		});

		// Split into lines for analysis
		const lines = content.split('\n');
		const nonEmptyLines = lines.filter(l => l.trim().length > 0);

		// Analyze each category
		const density = this.analyzeDensity(content, lines, nonEmptyLines);
		const structure = this.analyzeStructure(content, lines);
		const linguistic = this.analyzeLinguistic(content);
		const { contentType, typeConfidence } = this.classifyContentType(density, structure, linguistic);

		// Calculate overall scores
		const overallComplexity = this.calculateOverallComplexity(density, structure, linguistic);
		const musicalExpressiveness = this.calculateMusicalExpressiveness(density, structure, linguistic);

		const analysis: ProseAnalysis = {
			density,
			structure,
			linguistic,
			contentType,
			typeConfidence,
			overallComplexity,
			musicalExpressiveness
		};

		logger.info('analyze-complete', 'Prose analysis complete', {
			contentType,
			typeConfidence: typeConfidence.toFixed(2),
			complexity: overallComplexity.toFixed(2),
			expressiveness: musicalExpressiveness.toFixed(2)
		});

		return analysis;
	}

	/**
	 * Analyze content density metrics
	 */
	private static analyzeDensity(content: string, lines: string[], nonEmptyLines: string[]): ProseAnalysis['density'] {
		// Words per paragraph
		const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
		const totalWords = this.countWords(content);
		const wordsPerParagraph = paragraphs.length > 0 ? totalWords / paragraphs.length : 0;

		// Whitespace ratio
		const emptyLines = lines.length - nonEmptyLines.length;
		const whitespaceRatio = lines.length > 0 ? emptyLines / lines.length : 0;

		// List density
		const listItems = nonEmptyLines.filter(l => /^[\s]*[-*+]\s/.test(l) || /^[\s]*\d+\.\s/.test(l));
		const listDensity = nonEmptyLines.length > 0 ? listItems.length / nonEmptyLines.length : 0;

		// Overall content density (inverse of whitespace, factoring in word density)
		const avgWordsPerLine = nonEmptyLines.length > 0 ? totalWords / nonEmptyLines.length : 0;
		const contentDensity = Math.min(1, (1 - whitespaceRatio) * Math.min(1, avgWordsPerLine / 10));

		return {
			wordsPerParagraph: Math.round(wordsPerParagraph),
			whitespaceRatio: Math.min(1, Math.max(0, whitespaceRatio)),
			listDensity: Math.min(1, Math.max(0, listDensity)),
			contentDensity: Math.min(1, Math.max(0, contentDensity))
		};
	}

	/**
	 * Analyze structural complexity
	 */
	private static analyzeStructure(content: string, lines: string[]): ProseAnalysis['structure'] {
		// Count headings
		const headingLines = lines.filter(l => /^#+\s/.test(l));
		const headingCount = headingLines.length;

		// Max heading level
		const headingLevels = headingLines.map(l => (l.match(/^#+/) || [''])[0].length);
		const maxHeadingLevel = headingLevels.length > 0 ? Math.max(...headingLevels) : 0;

		// Nesting depth (average heading level)
		const nestingDepth = headingLevels.length > 0
			? headingLevels.reduce((sum, level) => sum + level, 0) / headingLevels.length
			: 0;

		// Count callouts (Obsidian-style and blockquotes)
		const calloutCount = (content.match(/^>\s*\[!/gm) || []).length +
							 (content.match(/^>/gm) || []).length;

		// Count code blocks
		const codeBlockCount = (content.match(/```/g) || []).length / 2; // Pairs of ```

		// Count tables
		const tableCount = (content.match(/^\|.*\|$/gm) || []).length > 0 ?
						   (content.match(/^\|[-:| ]+\|$/gm) || []).length : 0;

		// Complexity score (normalized combination)
		const complexityScore = Math.min(1,
			(headingCount * 0.05) +
			(maxHeadingLevel * 0.1) +
			(calloutCount * 0.1) +
			(codeBlockCount * 0.15) +
			(tableCount * 0.15)
		);

		return {
			headingCount,
			maxHeadingLevel,
			nestingDepth: Math.round(nestingDepth * 10) / 10,
			calloutCount,
			codeBlockCount: Math.floor(codeBlockCount),
			tableCount,
			complexityScore: Math.min(1, Math.max(0, complexityScore))
		};
	}

	/**
	 * Analyze linguistic features
	 */
	private static analyzeLinguistic(content: string): ProseAnalysis['linguistic'] {
		// Strip markdown syntax for linguistic analysis
		const plainText = this.stripMarkdown(content);
		const words = plainText.split(/\s+/).filter(w => w.length > 0);
		const totalWords = words.length;

		// Average sentence length
		const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
		const avgSentenceLength = sentences.length > 0 ? totalWords / sentences.length : 0;

		// Vocabulary diversity (unique words / total words)
		const uniqueWords = new Set(words.map(w => w.toLowerCase()));
		const vocabularyDiversity = totalWords > 0 ? uniqueWords.size / totalWords : 0;

		// Punctuation density
		const punctuation = (plainText.match(/[.,;:!?]/g) || []).length;
		const punctuationDensity = totalWords > 0 ? (punctuation / totalWords) * 100 : 0;

		// Question ratio
		const questions = (plainText.match(/\?/g) || []).length;
		const questionRatio = sentences.length > 0 ? questions / sentences.length : 0;

		// Average word length
		const avgWordLength = totalWords > 0
			? words.reduce((sum, w) => sum + w.length, 0) / totalWords
			: 0;

		// Readability score (simplified - higher = more complex)
		// Based on sentence length and word length
		const readabilityScore = Math.min(1,
			(avgSentenceLength / 30) * 0.5 +
			(avgWordLength / 10) * 0.5
		);

		return {
			avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
			vocabularyDiversity: Math.min(1, Math.max(0, vocabularyDiversity)),
			punctuationDensity: Math.round(punctuationDensity * 10) / 10,
			questionRatio: Math.min(1, Math.max(0, questionRatio)),
			avgWordLength: Math.round(avgWordLength * 10) / 10,
			readabilityScore: Math.min(1, Math.max(0, readabilityScore))
		};
	}

	/**
	 * Classify content type based on metrics
	 */
	private static classifyContentType(
		density: ProseAnalysis['density'],
		structure: ProseAnalysis['structure'],
		linguistic: ProseAnalysis['linguistic']
	): { contentType: ContentType; typeConfidence: number } {
		const scores = {
			'meeting-notes': 0,
			'research': 0,
			'creative': 0,
			'technical': 0,
			'journal': 0,
			'outline': 0
		};

		// Meeting notes: High list density, low words per paragraph, questions
		scores['meeting-notes'] =
			density.listDensity * 0.4 +
			(1 - density.wordsPerParagraph / 100) * 0.3 +
			linguistic.questionRatio * 0.3;

		// Research: Dense prose, citations, high vocabulary diversity
		scores['research'] =
			density.contentDensity * 0.3 +
			(density.wordsPerParagraph / 100) * 0.3 +
			linguistic.vocabularyDiversity * 0.4;

		// Creative: Long paragraphs, few headings, flowing prose
		scores['creative'] =
			(density.wordsPerParagraph / 100) * 0.4 +
			(1 - structure.complexityScore) * 0.3 +
			linguistic.avgSentenceLength / 30 * 0.3;

		// Technical: Code blocks, tables, structured headings
		scores['technical'] =
			(structure.codeBlockCount / 5) * 0.4 +
			(structure.tableCount / 3) * 0.3 +
			structure.complexityScore * 0.3;

		// Journal: Personal, dated, moderate prose
		scores['journal'] =
			(1 - density.listDensity) * 0.3 +
			(1 - structure.complexityScore) * 0.3 +
			linguistic.questionRatio * 0.2 +
			(density.wordsPerParagraph / 100) * 0.2;

		// Outline: Many headings, minimal prose per section
		scores['outline'] =
			(structure.headingCount / 10) * 0.5 +
			structure.complexityScore * 0.3 +
			(1 - density.contentDensity) * 0.2;

		// Find highest score
		const entries = Object.entries(scores) as [ContentType, number][];
		entries.sort((a, b) => b[1] - a[1]);

		const [topType, topScore] = entries[0];
		const [secondType, secondScore] = entries[1];

		// If top score is weak or similar to second, classify as mixed
		if (topScore < 0.3 || topScore - secondScore < 0.1) {
			return { contentType: 'mixed', typeConfidence: 0.5 };
		}

		return {
			contentType: topType,
			typeConfidence: Math.min(1, Math.max(0, topScore))
		};
	}

	/**
	 * Calculate overall complexity score
	 */
	private static calculateOverallComplexity(
		density: ProseAnalysis['density'],
		structure: ProseAnalysis['structure'],
		linguistic: ProseAnalysis['linguistic']
	): number {
		return Math.min(1, Math.max(0,
			density.contentDensity * 0.3 +
			structure.complexityScore * 0.4 +
			linguistic.readabilityScore * 0.3
		));
	}

	/**
	 * Calculate musical expressiveness potential
	 */
	private static calculateMusicalExpressiveness(
		density: ProseAnalysis['density'],
		structure: ProseAnalysis['structure'],
		linguistic: ProseAnalysis['linguistic']
	): number {
		// Higher expressiveness = more variation potential
		return Math.min(1, Math.max(0,
			linguistic.vocabularyDiversity * 0.4 +
			structure.complexityScore * 0.3 +
			linguistic.punctuationDensity / 20 * 0.3
		));
	}

	/**
	 * Helper: Count words in text
	 */
	private static countWords(text: string): number {
		return text.split(/\s+/).filter(w => w.length > 0).length;
	}

	/**
	 * Helper: Strip markdown syntax for linguistic analysis
	 */
	private static stripMarkdown(text: string): string {
		return text
			// Remove code blocks
			.replace(/```[\s\S]*?```/g, '')
			// Remove inline code
			.replace(/`[^`]+`/g, '')
			// Remove headings markers
			.replace(/^#+\s/gm, '')
			// Remove links but keep text
			.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
			// Remove images
			.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
			// Remove bold/italic markers
			.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
			// Remove blockquotes
			.replace(/^>\s*/gm, '')
			// Remove list markers
			.replace(/^[\s]*[-*+]\s/gm, '')
			.replace(/^[\s]*\d+\.\s/gm, '');
	}
}
