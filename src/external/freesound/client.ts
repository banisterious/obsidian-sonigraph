/**
 * Freesound.org API Client
 * Implements the whale discovery strategy based on research findings
 */

import { requestUrl } from 'obsidian';
import {
    FreesoundSample,
    FreesoundSearchResult,
    WhaleSearchQuery,
    SampleDiscoveryResult,
    WhaleSpecies,
    FreesoundAuthResponse
} from './types';
import { getLogger } from '../../logging';

const logger = getLogger('freesound-client');

export class FreesoundAPIClient {
    private static readonly BASE_URL = 'https://freesound.org/apiv2';
    private static readonly CLIENT_ID = process.env.FREESOUND_CLIENT_ID || '';
    
    private accessToken?: string;
    private rateLimitRemaining: number = 60; // Default rate limit
    private rateLimitReset: number = 0;

    constructor(
        private clientId: string = FreesoundAPIClient.CLIENT_ID,
        private clientSecret?: string
    ) {}

    /**
     * Search for whale samples using anonymous API access
     * Based on our research: target trusted institutions first
     */
    async searchWhaleContent(query: WhaleSearchQuery): Promise<SampleDiscoveryResult> {
        try {
            const searchQueries = this.buildSearchQueries(query);
            const allResults: FreesoundSample[] = [];

            // Execute searches in priority order
            for (const searchQuery of searchQueries) {
                const results = await this.executeSearch(searchQuery);
                void allResults.push(...results.results);
                
                // Rate limiting consideration
                await this.respectRateLimit();
            }

            logger.info('search', `Found ${allResults.length} potential whale samples`);
            return this.processSamples(allResults, query);

        } catch (error) {
            void logger.error('search', 'Whale sample search failed:', error);
            throw new Error(`Freesound search failed: ${error}`);
        }
    }

    /**
     * Build search queries based on our research findings
     * Priority: Trusted institutions > Scientific terms > General search
     */
    private buildSearchQueries(query: WhaleSearchQuery): string[] {
        const { species } = query;
        
        // Tier 1: Trusted research institutions (highest priority)
        const institutionQueries = this.buildInstitutionQueries(species);
        
        // Tier 2: Scientific search terms
        const scientificQueries = this.buildScientificQueries(species);
        
        // Tier 3: General community search
        const generalQueries = this.buildGeneralQueries(species);

        const allQueries = [
            ...institutionQueries,
            ...scientificQueries,
            ...generalQueries
        ];

        // Apply filters
        return allQueries.map(q => this.applyFilters(q, duration, excludeTerms));
    }

    /**
     * Target trusted institutions based on our research
     */
    private buildInstitutionQueries(species: WhaleSpecies): string[] {
        const TRUSTED_INSTITUTIONS = [
            'MBARI_MARS',
            'NOAA_fisheries', 
            'WHOI_acoustics',
            'scripps_whale_acoustics'
        ];

        const GOVERNMENT_TERMS = [
            'NOAA',
            'PMEL', 
            'Ocean Explorer',
            'government research',
            'marine laboratory'
        ];

        const speciesTerms = this.getSpeciesTerms(species);
        const queries: string[] = [];

        // Direct institution targeting
        TRUSTED_INSTITUTIONS.forEach(institution => {
            speciesTerms.forEach(term => {
                queries.push(`${term} user:${institution} hydrophone`);
            });
        });

        // Government source references
        GOVERNMENT_TERMS.forEach(govTerm => {
            speciesTerms.forEach(term => {
                queries.push(`${term} "${govTerm}" spectrogram research`);
            });
        });

        return queries;
    }

    /**
     * Scientific search terms based on successful patterns
     */
    private buildScientificQueries(species: WhaleSpecies): string[] {
        const speciesTerms = this.getSpeciesTerms(species);
        const scientificTerms = [
            'hydrophone recording',
            'field recording cetacean',
            'marine acoustics',
            'scientific recording',
            'observatory recording',
            'research expedition'
        ];

        const queries: string[] = [];
        speciesTerms.forEach(speciesTerm => {
            scientificTerms.forEach(sciTerm => {
                queries.push(`${speciesTerm} ${sciTerm}`);
            });
        });

        return queries;
    }

    /**
     * General community search as fallback
     */
    private buildGeneralQueries(species: WhaleSpecies): string[] {
        const speciesTerms = this.getSpeciesTerms(species);
        return speciesTerms.map(term => `${term} whale ocean marine`);
    }

    /**
     * Get species-specific search terms based on research
     */
    private getSpeciesTerms(species: WhaleSpecies): string[] {
        const SPECIES_TERMS = {
            humpback: [
                'humpback whale song',
                'megaptera novaeangliae',
                'whale song field recording'
            ],
            blue: [
                'blue whale call',
                'balaenoptera musculus',
                'blue whale hydrophone',
                'infrasonic whale'
            ],
            orca: [
                'orca vocalization',
                'killer whale call',
                'orcinus orca',
                'pod communication'
            ],
            gray: [
                'gray whale',
                'eschrichtius robustus',
                'oceanic soundscape'
            ],
            sperm: [
                'sperm whale',
                'cachalot',
                'physeter macrocephalus',
                'echolocation'
            ],
            minke: [
                'minke whale',
                'balaenoptera acutorostrata',
                'thump trains'
            ],
            fin: [
                'fin whale',
                'balaenoptera physalus',
                'pulse sequences'
            ],
            right: [
                'right whale',
                'eubalaena glacialis',
                'upcall',
                'north atlantic right whale'
            ],
            sei: [
                'sei whale',
                'balaenoptera borealis',
                'downsweep'
            ],
            pilot: [
                'pilot whale',
                'globicephala',
                'toothed whale'
            ],
            mixed: [
                'whale',
                'cetacean',
                'marine mammal'
            ]
        };

        return SPECIES_TERMS[species] || SPECIES_TERMS.mixed;
    }

    /**
     * Apply duration and exclusion filters
     */
    private applyFilters(
        query: string, 
        duration?: [number, number], 
        excludeTerms: string[] = []
    ): string {
        let filteredQuery = query;

        // Add exclusion terms
        const defaultExclusions = [
            '-synthesized',
            '-artificial', 
            '-processed',
            '-music',
            '-song cover',
            '-remix',
            '-edit',
            '-sound effect',
            '-foley',
            '-fake',
            '-synthetic'
        ];

        const allExclusions = [...defaultExclusions, ...excludeTerms];
        filteredQuery += ' ' + allExclusions.join(' ');

        return filteredQuery;
    }

    /**
     * Execute individual search query
     */
    private async executeSearch(query: string): Promise<FreesoundSearchResult> {
        const params = new URLSearchParams({
            query,
            page_size: '50',
            fields: 'id,name,description,username,download,preview,tags,license,filesize,bitdepth,bitrate,samplerate,duration,channels,type,created,geotag,pack',
            filter: 'duration:[5.0 TO 120.0] samplerate:[22050 TO *]' // Quality filters
        });

        const url = `${FreesoundAPIClient.BASE_URL}/search/text/?${params}`;

        const response = await requestUrl({
            url,
            method: 'GET',
            headers: {
                'Authorization': this.accessToken ? `Bearer ${this.accessToken}` : '',
                'Content-Type': 'application/json'
            }
        });

        void this.updateRateLimit(response);

        return response.json;
    }

    /**
     * Process and validate discovered samples
     */
    private async processSamples(
        samples: FreesoundSample[], 
        query: WhaleSearchQuery
    ): Promise<SampleDiscoveryResult> {
        // Remove duplicates
        const uniqueSamples = this.removeDuplicates(samples);
        
        // Apply curation pipeline
        const validated: FreesoundSample[] = [];
        const rejected: FreesoundSample[] = [];

        for (const sample of uniqueSamples) {
            if (await this.validateSample(sample, query)) {
                void validated.push(sample);
            } else {
                void rejected.push(sample);
            }
        }

        logger.info('validation', `Validation results: ${validated.length} valid, ${rejected.length} rejected`);

        return {
            samples: uniqueSamples,
            validated,
            rejected,
            statistics: {
                totalFound: uniqueSamples.length,
                validationRate: validated.length / uniqueSamples.length,
                averageQuality: this.calculateAverageQuality(validated)
            }
        };
    }

    /**
     * Validate sample quality based on research criteria
     */
    private async validateSample(sample: FreesoundSample, query: WhaleSearchQuery): Promise<boolean> {
        // Layer 1: Metadata validation
        if (!this.validateMetadata(sample)) return false;
        
        // Layer 2: Source credibility
        if (!this.validateSource(sample.username)) return false;
        
        // Layer 3: Content analysis
        if (!this.validateContent(sample, query.species)) return false;
        
        return true;
    }

    /**
     * Validate technical metadata
     */
    private validateMetadata(sample: FreesoundSample): boolean {
        // Duration: 5-120 seconds (per plan requirements)
        if (sample.duration < 5 || sample.duration > 120) return false;
        
        // Sample rate: ≥22kHz (quality threshold)
        if (sample.samplerate < 22050) return false;
        
        // File size: reasonable range (500KB-10MB)
        if (sample.filesize < 500000 || sample.filesize > 10000000) return false;
        
        // Must be Creative Commons licensed
        if (!sample.license.toLowerCase().includes('creative commons')) return false;
        
        return true;
    }

    /**
     * Validate source credibility based on research
     */
    private validateSource(username: string): boolean {
        const TRUSTED_INSTITUTIONS = [
            'MBARI_MARS',
            'NOAA_fisheries',
            'WHOI_acoustics',
            'scripps_whale_acoustics'
        ];

        // Highest credibility: known research institutions
        if (TRUSTED_INSTITUTIONS.includes(username)) return true;
        
        // Medium credibility: users with marine/science focus in name
        const scientificIndicators = [
            'marine', 'ocean', 'whale', 'research', 'lab', 'university',
            'institute', 'acoustics', 'biology', 'scientist'
        ];
        
        return scientificIndicators.some(indicator => 
            username.toLowerCase().includes(indicator)
        );
    }

    /**
     * Validate content relevance to species
     */
    private validateContent(sample: FreesoundSample, species: WhaleSpecies): boolean {
        const text = `${sample.name} ${sample.description} ${sample.tags.join(' ')}`.toLowerCase();
        
        // Must contain whale-related terms
        const whaleTerms = ['whale', 'cetacean', 'marine mammal'];
        const hasWhaleTerms = whaleTerms.some(term => text.includes(term));
        
        // Must not contain exclusion terms
        const exclusionTerms = [
            'synthesized', 'artificial', 'processed', 'music', 
            'remix', 'edit', 'fake', 'synthetic'
        ];
        const hasExclusions = exclusionTerms.some(term => text.includes(term));
        
        return hasWhaleTerms && !hasExclusions;
    }

    /**
     * Remove duplicate samples by ID
     */
    private removeDuplicates(samples: FreesoundSample[]): FreesoundSample[] {
        const seen = new Set<number>();
        return samples.filter(sample => {
            if (seen.has(sample.id)) return false;
            void seen.add(sample.id);
            return true;
        });
    }

    /**
     * Calculate average quality score for validated samples
     */
    private calculateAverageQuality(samples: FreesoundSample[]): number {
        if (samples.length === 0) return 0;
        
        const totalScore = samples.reduce((sum, sample) => {
            // Simple quality heuristic based on technical specs
            let score = 0;
            
            // Sample rate contribution
            if (sample.samplerate >= 44100) score += 0.3;
            else if (sample.samplerate >= 22050) score += 0.2;
            
            // Duration contribution (prefer 10-60 seconds)
            if (sample.duration >= 10 && sample.duration <= 60) score += 0.3;
            else if (sample.duration >= 5 && sample.duration <= 120) score += 0.2;
            
            // Bit depth contribution
            if (sample.bitdepth >= 16) score += 0.2;
            
            // File size contribution (indicates quality)
            if (sample.filesize > 1000000) score += 0.2; // >1MB
            
            return sum + Math.min(score, 1.0);
        }, 0);
        
        return totalScore / samples.length;
    }

    /**
     * Rate limiting management
     */
    private updateRateLimit(response: Response): void {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        if (remaining) this.rateLimitRemaining = parseInt(remaining);
        if (reset) this.rateLimitReset = parseInt(reset);
    }

    private async respectRateLimit(): Promise<void> {
        if (this.rateLimitRemaining < 5) {
            const waitTime = Math.max(1000, (this.rateLimitReset - Date.now()) / 1000);
            logger.info('rate-limit', `Rate limit low, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    /**
     * OAuth2 authentication (for downloads)
     */
    async authenticate(): Promise<void> {
        if (!this.clientSecret) {
            throw new Error('Client secret required for authentication');
        }

        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
        });

        const response = await requestUrl({
            url: `${FreesoundAPIClient.BASE_URL}/oauth2/access_token/`,
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        const auth: FreesoundAuthResponse = response.json;
        this.accessToken = auth.access_token;
        
        void logger.info('auth', 'Freesound authentication successful');
    }

    /**
     * Download sample audio data
     */
    async downloadSample(sampleId: number): Promise<ArrayBuffer> {
        if (!this.accessToken) {
            await this.authenticate();
        }

        const response = await requestUrl({
            url: `${FreesoundAPIClient.BASE_URL}/sounds/${sampleId}/download/`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        return response.arrayBuffer;
    }
}