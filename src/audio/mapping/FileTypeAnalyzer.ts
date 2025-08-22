/**
 * FileTypeAnalyzer - Phase 4.1: Enhanced File Type Logic
 * 
 * Provides sophisticated analysis of file types and their metadata characteristics.
 * Analyzes images (metadata for type/dimensions), audio/video (duration/size), 
 * PDFs (pages/structure), and notes (content/complexity).
 */

import { TFile, CachedMetadata, App } from 'obsidian';
import { EnhancedGraphNode } from '../../graph/types';
import { getLogger } from '../../logging';

const logger = getLogger('file-type-analyzer');

/**
 * Enhanced file characteristics with detailed metadata analysis
 */
export interface FileCharacteristics {
    fileType: 'image' | 'audio' | 'video' | 'document' | 'text' | 'code' | 'unknown';
    fileSize: number; // In bytes
    complexity: number; // 0.0 to 1.0 complexity score
    
    metadata: {
        hasAdvancedMetadata: boolean;
        
        // Image-specific metadata
        imageMetadata?: {
            width: number;
            height: number;
            aspectRatio: number;
            colorDepth?: number;
            fileSize: number;
            imageType: 'photo' | 'diagram' | 'chart' | 'screenshot' | 'artwork' | 'unknown';
        };
        
        // Audio/Video metadata
        mediaDuration?: number; // In seconds
        mediaMetadata?: {
            bitrate?: number;
            sampleRate?: number;
            channels?: number;
            codec?: string;
            estimatedQuality: 'low' | 'medium' | 'high';
        };
        
        // Document metadata (PDF, etc.)
        pageCount?: number;
        documentMetadata?: {
            author?: string;
            title?: string;
            subject?: string;
            keywords?: string[];
            estimatedComplexity: 'simple' | 'moderate' | 'complex';
        };
        
        // Text/Note metadata
        wordCount?: number;
        textMetadata?: {
            readingTime?: number; // In minutes
            sentenceCount?: number;
            paragraphCount?: number;
            averageWordsPerSentence?: number;
            lexicalDiversity?: number; // Unique words / total words
            contentType: 'journal' | 'note' | 'article' | 'list' | 'outline' | 'other';
        };
        
        // Code metadata
        codeMetadata?: {
            language?: string;
            lineCount?: number;
            functionCount?: number;
            classCount?: number;
            commentRatio?: number; // Comments / total lines
            complexity: 'simple' | 'moderate' | 'complex';
        };
    };
    
    structure: {
        hasComplexStructure: boolean;
        headingCount: number;
        sectionCount: number;
        linkCount?: number;
        embedCount?: number;
    };
    
    relationships: {
        connectionCount: number;
        linkTypes: string[];
        hasBacklinks?: boolean;
        isHub?: boolean; // Many incoming connections
        isLeaf?: boolean; // Few/no outgoing connections
    };
    
    temporal: {
        daysSinceCreated: number;
        daysSinceModified: number;
        isRecent?: boolean; // Modified within last week
        isStale?: boolean; // Not modified in 6+ months
    };
}

/**
 * File type analysis configuration
 */
export interface FileTypeAnalysisConfig {
    enableImageAnalysis: boolean;
    enableAudioAnalysis: boolean;
    enableDocumentAnalysis: boolean;
    enableTextAnalysis: boolean;
    enableCodeAnalysis: boolean;
    maxAnalysisTimeMs: number;
    cacheResults: boolean;
}

export class FileTypeAnalyzer {
    private app: App;
    private config: FileTypeAnalysisConfig;
    private analysisCache: Map<string, FileCharacteristics>;
    private cacheTimestamps: Map<string, number>;
    private readonly CACHE_TTL = 300000; // 5 minutes

    constructor(app: App, config?: Partial<FileTypeAnalysisConfig>) {
        this.app = app;
        this.config = {
            enableImageAnalysis: true,
            enableAudioAnalysis: true,
            enableDocumentAnalysis: true,
            enableTextAnalysis: true,
            enableCodeAnalysis: true,
            maxAnalysisTimeMs: 1000,
            cacheResults: true,
            ...config
        };
        
        this.analysisCache = new Map();
        this.cacheTimestamps = new Map();

        logger.info('file-type-analyzer-init', 'FileTypeAnalyzer initialized', {
            enabledAnalysisTypes: {
                image: this.config.enableImageAnalysis,
                audio: this.config.enableAudioAnalysis,
                document: this.config.enableDocumentAnalysis,
                text: this.config.enableTextAnalysis,
                code: this.config.enableCodeAnalysis
            }
        });
    }

    /**
     * Analyze file characteristics comprehensively
     */
    async analyzeFile(file: TFile, node: EnhancedGraphNode): Promise<FileCharacteristics> {
        const cacheKey = `${file.path}-${file.stat.mtime}`;
        
        // Check cache first
        if (this.config.cacheResults && this.isCached(cacheKey)) {
            logger.debug('cache-hit', `Using cached analysis for ${file.path}`);
            return this.analysisCache.get(cacheKey)!;
        }

        const startTime = performance.now();
        
        try {
            // Basic file analysis
            const fileType = this.determineFileType(file);
            const complexity = await this.calculateComplexity(file, node, fileType);
            
            // Get Obsidian metadata cache
            const cache = this.app.metadataCache.getFileCache(file);
            
            // Analyze metadata based on file type
            const metadata = await this.analyzeMetadata(file, node, fileType, cache);
            
            // Analyze structure
            const structure = this.analyzeStructure(file, node, cache);
            
            // Analyze relationships
            const relationships = this.analyzeRelationships(node);
            
            // Analyze temporal aspects
            const temporal = this.analyzeTemporal(file);

            const characteristics: FileCharacteristics = {
                fileType,
                fileSize: file.stat.size,
                complexity,
                metadata,
                structure,
                relationships,
                temporal
            };

            const analysisTime = performance.now() - startTime;
            
            // Cache if enabled and analysis was successful
            if (this.config.cacheResults) {
                this.analysisCache.set(cacheKey, characteristics);
                this.cacheTimestamps.set(cacheKey, Date.now());
            }

            logger.debug('file-analysis-complete', `Analysis complete for ${file.path}`, {
                fileType,
                complexity: complexity.toFixed(2),
                analysisTime: analysisTime.toFixed(2) + 'ms',
                hasAdvancedMetadata: metadata.hasAdvancedMetadata
            });

            return characteristics;
        } catch (error) {
            logger.error('file-analysis-error', `Failed to analyze ${file.path}`, { error: error.message });
            return this.createFallbackCharacteristics(file, node);
        }
    }

    /**
     * Determine file type based on extension and content hints
     */
    private determineFileType(file: TFile): FileCharacteristics['fileType'] {
        const extension = file.extension.toLowerCase();
        
        // Image files
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'ico'].includes(extension)) {
            return 'image';
        }
        
        // Audio files
        if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'].includes(extension)) {
            return 'audio';
        }
        
        // Video files
        if (['mp4', 'avi', 'mov', 'webm', 'mkv', 'wmv', 'flv', '3gp'].includes(extension)) {
            return 'video';
        }
        
        // Document files
        if (['pdf', 'doc', 'docx', 'rtf', 'odt', 'pages'].includes(extension)) {
            return 'document';
        }
        
        // Code files
        if (['js', 'ts', 'py', 'java', 'cpp', 'c', 'h', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'html', 'css', 'scss', 'less', 'xml', 'json', 'yaml', 'yml', 'toml', 'ini', 'conf', 'sh', 'bat', 'ps1', 'sql'].includes(extension)) {
            return 'code';
        }
        
        // Text files (including markdown)
        if (['md', 'txt', 'rtf', 'org', 'tex', 'adoc', 'rst'].includes(extension)) {
            return 'text';
        }
        
        return 'unknown';
    }

    /**
     * Calculate overall complexity score for the file
     */
    private async calculateComplexity(file: TFile, node: EnhancedGraphNode, fileType: FileCharacteristics['fileType']): Promise<number> {
        let complexity = 0.5; // Base complexity
        
        try {
            // File size contribution (logarithmic scale)
            const sizeMB = file.stat.size / (1024 * 1024);
            const sizeComplexity = Math.min(0.3, Math.log10(sizeMB + 1) * 0.15);
            complexity += sizeComplexity;
            
            // Connection count contribution
            const connectionComplexity = Math.min(0.2, node.connectionCount * 0.01);
            complexity += connectionComplexity;
            
            // File type specific complexity
            switch (fileType) {
                case 'image':
                    // Image complexity based on file size (higher quality = more complex)
                    if (sizeMB > 5) complexity += 0.15;
                    else if (sizeMB < 0.1) complexity -= 0.1;
                    break;
                    
                case 'audio':
                case 'video':
                    // Media complexity based on size and estimated quality
                    if (sizeMB > 50) complexity += 0.2; // Large media files
                    else if (sizeMB > 10) complexity += 0.1;
                    break;
                    
                case 'document':
                    // Document complexity will be refined with page count analysis
                    complexity += 0.1; // Documents are generally more complex
                    break;
                    
                case 'text':
                    // Text complexity based on word count and structure
                    const wordCount = node.wordCount || 0;
                    const wordComplexity = Math.min(0.15, wordCount / 5000);
                    complexity += wordComplexity;
                    
                    const headingCount = node.headings?.length || 0;
                    if (headingCount > 3) complexity += 0.1;
                    break;
                    
                case 'code':
                    // Code is inherently complex
                    complexity += 0.15;
                    break;
            }
            
            // Metadata richness contribution
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter && Object.keys(cache.frontmatter).length > 3) {
                complexity += 0.1;
            }
            
            // Tag complexity
            const tags = cache?.tags || [];
            if (tags.length > 2) {
                complexity += Math.min(0.1, tags.length * 0.02);
            }
            
        } catch (error) {
            logger.warn('complexity-calculation-error', `Error calculating complexity for ${file.path}`, { error: error.message });
        }
        
        return Math.max(0.1, Math.min(1.0, complexity));
    }

    /**
     * Analyze metadata based on file type
     */
    private async analyzeMetadata(
        file: TFile, 
        node: EnhancedGraphNode, 
        fileType: FileCharacteristics['fileType'], 
        cache: CachedMetadata | null
    ): Promise<FileCharacteristics['metadata']> {
        const metadata: FileCharacteristics['metadata'] = {
            hasAdvancedMetadata: false
        };

        try {
            switch (fileType) {
                case 'image':
                    if (this.config.enableImageAnalysis) {
                        metadata.imageMetadata = await this.analyzeImageMetadata(file);
                        metadata.hasAdvancedMetadata = !!metadata.imageMetadata;
                    }
                    break;
                    
                case 'audio':
                case 'video':
                    if (this.config.enableAudioAnalysis) {
                        metadata.mediaDuration = await this.estimateMediaDuration(file);
                        metadata.mediaMetadata = await this.analyzeMediaMetadata(file);
                        metadata.hasAdvancedMetadata = !!metadata.mediaDuration;
                    }
                    break;
                    
                case 'document':
                    if (this.config.enableDocumentAnalysis) {
                        metadata.pageCount = await this.estimatePageCount(file);
                        metadata.documentMetadata = await this.analyzeDocumentMetadata(file, cache);
                        metadata.hasAdvancedMetadata = !!metadata.pageCount;
                    }
                    break;
                    
                case 'text':
                    if (this.config.enableTextAnalysis) {
                        metadata.wordCount = node.wordCount || 0;
                        metadata.textMetadata = await this.analyzeTextMetadata(file, node, cache);
                        metadata.hasAdvancedMetadata = !!metadata.textMetadata;
                    }
                    break;
                    
                case 'code':
                    if (this.config.enableCodeAnalysis) {
                        metadata.codeMetadata = await this.analyzeCodeMetadata(file);
                        metadata.hasAdvancedMetadata = !!metadata.codeMetadata;
                    }
                    break;
            }
        } catch (error) {
            logger.warn('metadata-analysis-error', `Error analyzing metadata for ${file.path}`, { error: error.message });
        }

        return metadata;
    }

    /**
     * Analyze image metadata (simulated - real implementation would read EXIF data)
     */
    private async analyzeImageMetadata(file: TFile): Promise<FileCharacteristics['metadata']['imageMetadata']> {
        // In a real implementation, this would read actual image metadata
        // For now, we'll estimate based on file size and extension
        
        const sizeMB = file.stat.size / (1024 * 1024);
        const extension = file.extension.toLowerCase();
        
        // Estimate dimensions based on file size and format
        let estimatedWidth = 1000;
        let estimatedHeight = 800;
        
        if (['jpg', 'jpeg'].includes(extension)) {
            // JPEG estimates
            if (sizeMB > 5) { estimatedWidth = 4000; estimatedHeight = 3000; } // High res photo
            else if (sizeMB > 1) { estimatedWidth = 2000; estimatedHeight = 1500; } // Medium res
            else if (sizeMB < 0.1) { estimatedWidth = 400; estimatedHeight = 300; } // Thumbnail
        } else if (extension === 'png') {
            // PNG estimates (typically larger for same dimensions)
            if (sizeMB > 2) { estimatedWidth = 2000; estimatedHeight = 1500; }
            else if (sizeMB < 0.05) { estimatedWidth = 200; estimatedHeight = 150; } // Icon
        } else if (extension === 'svg') {
            // SVG - vector format, typically smaller files
            estimatedWidth = 800;
            estimatedHeight = 600;
        }
        
        const aspectRatio = estimatedWidth / estimatedHeight;
        
        // Determine image type based on name and characteristics
        let imageType: FileCharacteristics['metadata']['imageMetadata']['imageType'] = 'unknown';
        const filename = file.basename.toLowerCase();
        
        if (filename.includes('screenshot') || filename.includes('screen') || filename.includes('capture')) {
            imageType = 'screenshot';
        } else if (filename.includes('chart') || filename.includes('graph') || filename.includes('plot')) {
            imageType = 'chart';
        } else if (filename.includes('diagram') || filename.includes('flow') || filename.includes('schema')) {
            imageType = 'diagram';
        } else if (['jpg', 'jpeg'].includes(extension) && sizeMB > 1) {
            imageType = 'photo';
        } else if (extension === 'svg' || filename.includes('icon')) {
            imageType = 'artwork';
        }
        
        return {
            width: estimatedWidth,
            height: estimatedHeight,
            aspectRatio,
            fileSize: file.stat.size,
            imageType
        };
    }

    /**
     * Estimate media duration (simulated)
     */
    private async estimateMediaDuration(file: TFile): Promise<number> {
        // Rough estimation based on file size and format
        const sizeMB = file.stat.size / (1024 * 1024);
        const extension = file.extension.toLowerCase();
        
        let estimatedDuration = 60; // Default 1 minute
        
        if (['mp3', 'ogg', 'm4a'].includes(extension)) {
            // Audio files - roughly 1MB per minute for decent quality
            estimatedDuration = Math.max(10, sizeMB * 0.8);
        } else if (['mp4', 'webm', 'avi'].includes(extension)) {
            // Video files - roughly 10-20MB per minute for decent quality
            estimatedDuration = Math.max(5, sizeMB / 15);
        }
        
        return estimatedDuration;
    }

    /**
     * Analyze media metadata (simulated)
     */
    private async analyzeMediaMetadata(file: TFile): Promise<FileCharacteristics['metadata']['mediaMetadata']> {
        const sizeMB = file.stat.size / (1024 * 1024);
        const extension = file.extension.toLowerCase();
        
        let estimatedQuality: 'low' | 'medium' | 'high' = 'medium';
        
        if (['mp3', 'ogg', 'm4a'].includes(extension)) {
            if (sizeMB < 3) estimatedQuality = 'low';
            else if (sizeMB > 8) estimatedQuality = 'high';
        } else if (['mp4', 'webm'].includes(extension)) {
            if (sizeMB < 10) estimatedQuality = 'low';
            else if (sizeMB > 100) estimatedQuality = 'high';
        }
        
        return {
            estimatedQuality
        };
    }

    /**
     * Estimate page count for documents (simulated)
     */
    private async estimatePageCount(file: TFile): Promise<number> {
        const sizeMB = file.stat.size / (1024 * 1024);
        
        // Rough estimation: PDF pages are typically 100-500KB each
        if (file.extension.toLowerCase() === 'pdf') {
            return Math.max(1, Math.round(sizeMB * 3)); // ~300KB per page average
        }
        
        // Other document formats
        return Math.max(1, Math.round(sizeMB * 5)); // Smaller average page size
    }

    /**
     * Analyze document metadata (simulated)
     */
    private async analyzeDocumentMetadata(file: TFile, cache: CachedMetadata | null): Promise<FileCharacteristics['metadata']['documentMetadata']> {
        const sizeMB = file.stat.size / (1024 * 1024);
        
        let estimatedComplexity: 'simple' | 'moderate' | 'complex' = 'moderate';
        
        if (sizeMB < 0.5) estimatedComplexity = 'simple';
        else if (sizeMB > 5) estimatedComplexity = 'complex';
        
        // Extract title from frontmatter if available
        const title = cache?.frontmatter?.title || file.basename;
        
        return {
            title,
            estimatedComplexity
        };
    }

    /**
     * Analyze text metadata comprehensively
     */
    private async analyzeTextMetadata(file: TFile, node: EnhancedGraphNode, cache: CachedMetadata | null): Promise<FileCharacteristics['metadata']['textMetadata']> {
        const wordCount = node.wordCount || 0;
        
        // Estimate reading time (average 200 words per minute)
        const readingTime = Math.max(1, Math.round(wordCount / 200));
        
        // Estimate sentence count (average 15 words per sentence)
        const sentenceCount = Math.max(1, Math.round(wordCount / 15));
        
        // Estimate paragraph count (average 100 words per paragraph)
        const paragraphCount = Math.max(1, Math.round(wordCount / 100));
        
        // Average words per sentence
        const averageWordsPerSentence = wordCount / sentenceCount;
        
        // Determine content type based on file name and structure
        let contentType: FileCharacteristics['metadata']['textMetadata']['contentType'] = 'other';
        const filename = file.basename.toLowerCase();
        const headingCount = node.headings?.length || 0;
        
        if (filename.includes('journal') || filename.includes('diary') || filename.includes('daily')) {
            contentType = 'journal';
        } else if (headingCount > 5 && wordCount > 1000) {
            contentType = 'article';
        } else if (headingCount > 3) {
            contentType = 'outline';
        } else if (wordCount < 500 && headingCount <= 2) {
            contentType = 'note';
        } else if (cache?.listItems && cache.listItems.length > 5) {
            contentType = 'list';
        }
        
        return {
            readingTime,
            sentenceCount,
            paragraphCount,
            averageWordsPerSentence,
            contentType
        };
    }

    /**
     * Analyze code metadata (simulated)
     */
    private async analyzeCodeMetadata(file: TFile): Promise<FileCharacteristics['metadata']['codeMetadata']> {
        const extension = file.extension.toLowerCase();
        const sizeMB = file.stat.size / (1024 * 1024);
        
        // Language mapping
        const languageMap: Record<string, string> = {
            'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python', 'java': 'Java',
            'cpp': 'C++', 'c': 'C', 'php': 'PHP', 'rb': 'Ruby', 'go': 'Go',
            'rs': 'Rust', 'swift': 'Swift', 'kt': 'Kotlin', 'html': 'HTML',
            'css': 'CSS', 'scss': 'SCSS', 'json': 'JSON', 'xml': 'XML',
            'yaml': 'YAML', 'yml': 'YAML', 'sql': 'SQL', 'sh': 'Shell'
        };
        
        const language = languageMap[extension] || 'Unknown';
        
        // Estimate line count based on file size (roughly 50 chars per line average)
        const lineCount = Math.max(10, Math.round((sizeMB * 1024 * 1024) / 50));
        
        // Estimate complexity
        let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
        if (lineCount < 100) complexity = 'simple';
        else if (lineCount > 1000) complexity = 'complex';
        
        return {
            language,
            lineCount,
            complexity
        };
    }

    /**
     * Analyze file structure
     */
    private analyzeStructure(file: TFile, node: EnhancedGraphNode, cache: CachedMetadata | null): FileCharacteristics['structure'] {
        const headingCount = node.headings?.length || 0;
        const linkCount = cache?.links?.length || 0;
        const embedCount = cache?.embeds?.length || 0;
        
        // Determine if structure is complex
        const hasComplexStructure = headingCount > 3 || linkCount > 5 || embedCount > 2;
        
        // Estimate section count based on headings
        const sectionCount = Math.max(1, headingCount > 0 ? headingCount : 1);
        
        return {
            hasComplexStructure,
            headingCount,
            sectionCount,
            linkCount,
            embedCount
        };
    }

    /**
     * Analyze file relationships
     */
    private analyzeRelationships(node: EnhancedGraphNode): FileCharacteristics['relationships'] {
        const connectionCount = node.connectionCount;
        
        // Determine link types based on connection details
        const linkTypes: string[] = ['basic'];
        if (node.connectionDetails) {
            if (node.connectionDetails.wikilinks.length > 0) linkTypes.push('wikilink');
            if (node.connectionDetails.markdownLinks.length > 0) linkTypes.push('markdown');
            if (node.connectionDetails.embeds.length > 0) linkTypes.push('embed');
            if (node.connectionDetails.tagConnections.length > 0) linkTypes.push('tag');
        }
        
        // Determine if this is a hub (many connections) or leaf (few connections)
        const isHub = connectionCount > 10;
        const isLeaf = connectionCount <= 2;
        
        return {
            connectionCount,
            linkTypes,
            isHub,
            isLeaf
        };
    }

    /**
     * Analyze temporal aspects of the file
     */
    private analyzeTemporal(file: TFile): FileCharacteristics['temporal'] {
        const now = Date.now();
        const daysSinceCreated = Math.floor((now - file.stat.ctime) / (1000 * 60 * 60 * 24));
        const daysSinceModified = Math.floor((now - file.stat.mtime) / (1000 * 60 * 60 * 24));
        
        const isRecent = daysSinceModified <= 7;
        const isStale = daysSinceModified >= 180;
        
        return {
            daysSinceCreated,
            daysSinceModified,
            isRecent,
            isStale
        };
    }

    /**
     * Create fallback characteristics for error cases
     */
    private createFallbackCharacteristics(file: TFile, node: EnhancedGraphNode): FileCharacteristics {
        const fileType = this.determineFileType(file);
        
        return {
            fileType,
            fileSize: file.stat.size,
            complexity: 0.5,
            metadata: {
                hasAdvancedMetadata: false,
                wordCount: node.wordCount
            },
            structure: {
                hasComplexStructure: false,
                headingCount: node.headings?.length || 0,
                sectionCount: 1
            },
            relationships: {
                connectionCount: node.connectionCount,
                linkTypes: ['basic']
            },
            temporal: this.analyzeTemporal(file)
        };
    }

    /**
     * Check if analysis is cached and still valid
     */
    private isCached(cacheKey: string): boolean {
        if (!this.analysisCache.has(cacheKey) || !this.cacheTimestamps.has(cacheKey)) {
            return false;
        }

        const timestamp = this.cacheTimestamps.get(cacheKey)!;
        return (Date.now() - timestamp) < this.CACHE_TTL;
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<FileTypeAnalysisConfig>): void {
        this.config = { ...this.config, ...config };
        
        // Clear cache if analysis settings changed
        this.analysisCache.clear();
        this.cacheTimestamps.clear();
        
        logger.info('file-type-analyzer-config-update', 'Configuration updated, cache cleared');
    }

    /**
     * Get analysis statistics
     */
    getAnalysisStats(): { cacheSize: number; analysisTypes: Record<string, boolean> } {
        return {
            cacheSize: this.analysisCache.size,
            analysisTypes: {
                image: this.config.enableImageAnalysis,
                audio: this.config.enableAudioAnalysis,
                document: this.config.enableDocumentAnalysis,
                text: this.config.enableTextAnalysis,
                code: this.config.enableCodeAnalysis
            }
        };
    }

    /**
     * Clear all caches
     */
    clearCaches(): void {
        this.analysisCache.clear();
        this.cacheTimestamps.clear();
        
        logger.info('file-type-analyzer-cache-clear', 'Analysis cache cleared');
    }
}