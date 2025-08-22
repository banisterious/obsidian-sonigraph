/**
 * PathAnalyzer - Path parsing and analysis utilities for folder hierarchy mapping
 * Part of Phase 4.3: Folder Hierarchy and Path Mapping
 */

export interface PathAnalysis {
    fullPath: string;
    components: string[];
    depth: number;
    rootFolder: string;
    parentFolder: string;
    fileName: string;
    extension: string;
    complexity: number; // 0.0 - 1.0
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    averageComponentLength: number;
}

export interface FolderMetrics {
    depth: number;
    nestingComplexity: number; // Based on path length and depth ratio
    semanticWeight: number; // Based on folder names
    organizationalScore: number; // How well-organized the path appears
}

export class PathAnalyzer {
    private static readonly SPECIAL_FOLDERS = new Set([
        'projects', 'project',
        'journal', 'journals', 'daily',
        'research', 'studies',
        'archive', 'archives', 'old',
        'ideas', 'thoughts', 'brainstorm',
        'tasks', 'todo',
        'resources', 'reference',
        'templates', 'template',
        'media', 'images', 'attachments'
    ]);

    private static readonly ORGANIZED_PATTERNS = [
        /^\d{4}(-\d{2})?(-\d{2})?/, // Date patterns
        /^v\d+(\.\d+)*/, // Version patterns
        /^(draft|final|rev\d+)/, // Document stages
    ];

    /**
     * Analyze a file path and extract comprehensive path information
     */
    public analyzePath(filePath: string): PathAnalysis {
        // Normalize path separators
        const normalizedPath = filePath.replace(/\\/g, '/');
        const components = normalizedPath.split('/').filter(c => c.length > 0);
        
        // Extract file information
        const fileName = components[components.length - 1] || '';
        const extensionMatch = fileName.match(/\.([^.]+)$/);
        const extension = extensionMatch ? extensionMatch[1] : '';
        
        // Calculate complexity based on various factors
        const complexity = this.calculatePathComplexity(components);
        
        // Check for special characters and numbers
        const hasNumbers = components.some(c => /\d/.test(c));
        const hasSpecialChars = components.some(c => /[^a-zA-Z0-9\-_\s.]/.test(c));
        
        // Calculate average component length
        const totalLength = components.reduce((sum, c) => sum + c.length, 0);
        const averageComponentLength = components.length > 0 ? totalLength / components.length : 0;

        return {
            fullPath: normalizedPath,
            components,
            depth: components.length,
            rootFolder: components[0] || '',
            parentFolder: components[components.length - 2] || '',
            fileName,
            extension,
            complexity,
            hasNumbers,
            hasSpecialChars,
            averageComponentLength
        };
    }

    /**
     * Calculate folder-specific metrics
     */
    public calculateFolderMetrics(pathAnalysis: PathAnalysis): FolderMetrics {
        const { components, depth } = pathAnalysis;
        
        // Nesting complexity: deeper paths with longer components are more complex
        const nestingComplexity = Math.min(1.0, 
            (depth * 0.15) + (pathAnalysis.averageComponentLength / 50 * 0.35)
        );
        
        // Semantic weight: special folders have higher weight
        const semanticWeight = this.calculateSemanticWeight(components);
        
        // Organizational score: well-organized paths score higher
        const organizationalScore = this.calculateOrganizationalScore(components);

        return {
            depth,
            nestingComplexity,
            semanticWeight,
            organizationalScore
        };
    }

    /**
     * Extract semantic meaning from path components
     */
    public extractPathSemantics(components: string[]): {
        category: 'personal' | 'work' | 'creative' | 'technical' | 'archival' | 'general';
        confidence: number;
        keywords: string[];
    } {
        const lowerComponents = components.map(c => c.toLowerCase());
        const keywords: string[] = [];
        
        // Categorization scores
        const scores = {
            personal: 0,
            work: 0,
            creative: 0,
            technical: 0,
            archival: 0,
            general: 0
        };

        // Analyze each component
        for (const component of lowerComponents) {
            // Personal indicators
            if (/journal|diary|daily|personal|private/.test(component)) {
                scores.personal += 2;
                keywords.push(component);
            }
            
            // Work indicators
            if (/project|work|task|meeting|report|presentation/.test(component)) {
                scores.work += 2;
                keywords.push(component);
            }
            
            // Creative indicators
            if (/idea|creative|art|design|music|story|poem/.test(component)) {
                scores.creative += 2;
                keywords.push(component);
            }
            
            // Technical indicators
            if (/code|dev|tech|research|study|analysis|data/.test(component)) {
                scores.technical += 2;
                keywords.push(component);
            }
            
            // Archival indicators
            if (/archive|old|backup|history|past|legacy/.test(component)) {
                scores.archival += 2;
                keywords.push(component);
            }
        }

        // Find category with highest score
        let maxScore = 0;
        let category: keyof typeof scores = 'general';
        
        for (const [cat, score] of Object.entries(scores)) {
            if (score > maxScore) {
                maxScore = score;
                category = cat as keyof typeof scores;
            }
        }

        // Calculate confidence based on score strength
        const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
        const confidence = totalScore > 0 ? maxScore / totalScore : 0;

        return {
            category,
            confidence,
            keywords: [...new Set(keywords)] // Remove duplicates
        };
    }

    /**
     * Calculate path complexity score
     */
    private calculatePathComplexity(components: string[]): number {
        let complexity = 0;
        
        // Depth factor (max 0.3)
        complexity += Math.min(0.3, components.length * 0.05);
        
        // Length factor (max 0.3)
        const avgLength = components.reduce((sum, c) => sum + c.length, 0) / components.length;
        complexity += Math.min(0.3, avgLength / 30);
        
        // Special character factor (max 0.2)
        const specialCharCount = components.filter(c => /[^a-zA-Z0-9\-_]/.test(c)).length;
        complexity += Math.min(0.2, specialCharCount / components.length * 0.4);
        
        // Variation factor (max 0.2)
        const uniqueComponents = new Set(components.map(c => c.toLowerCase()));
        const repetitionRatio = uniqueComponents.size / components.length;
        complexity += (1 - repetitionRatio) * 0.2;
        
        return Math.min(1.0, complexity);
    }

    /**
     * Calculate semantic weight based on special folder recognition
     */
    private calculateSemanticWeight(components: string[]): number {
        let weight = 0;
        const lowerComponents = components.map(c => c.toLowerCase());
        
        for (const component of lowerComponents) {
            if (PathAnalyzer.SPECIAL_FOLDERS.has(component)) {
                weight += 0.3;
            }
            
            // Partial matches
            for (const specialFolder of PathAnalyzer.SPECIAL_FOLDERS) {
                if (component.includes(specialFolder) || specialFolder.includes(component)) {
                    weight += 0.15;
                    break;
                }
            }
        }
        
        return Math.min(1.0, weight);
    }

    /**
     * Calculate how well-organized a path appears to be
     */
    private calculateOrganizationalScore(components: string[]): number {
        let score = 0;
        
        for (const component of components) {
            // Check for organized patterns
            for (const pattern of PathAnalyzer.ORGANIZED_PATTERNS) {
                if (pattern.test(component)) {
                    score += 0.25;
                    break;
                }
            }
            
            // Clean naming (no special chars except dash/underscore)
            if (/^[a-zA-Z0-9\-_\s]+$/.test(component)) {
                score += 0.1;
            }
            
            // Reasonable length
            if (component.length >= 3 && component.length <= 30) {
                score += 0.05;
            }
        }
        
        // Bonus for consistent naming style
        if (this.hasConsistentNamingStyle(components)) {
            score += 0.2;
        }
        
        return Math.min(1.0, score);
    }

    /**
     * Check if path components follow a consistent naming style
     */
    private hasConsistentNamingStyle(components: string[]): boolean {
        if (components.length < 2) return true;
        
        // Check for consistent case style
        const styles = {
            kebab: 0,
            snake: 0,
            camel: 0,
            pascal: 0,
            space: 0
        };
        
        for (const component of components) {
            if (/-/.test(component)) styles.kebab++;
            if (/_/.test(component)) styles.snake++;
            if (/[a-z][A-Z]/.test(component)) styles.camel++;
            if (/^[A-Z][a-z]/.test(component)) styles.pascal++;
            if (/\s/.test(component)) styles.space++;
        }
        
        // Find dominant style
        const maxStyle = Math.max(...Object.values(styles));
        const dominantStyles = Object.values(styles).filter(v => v === maxStyle && v > 0).length;
        
        // Consistent if one style dominates
        return dominantStyles === 1 && maxStyle >= components.length * 0.6;
    }
}