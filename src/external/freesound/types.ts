/**
 * Freesound.org API types and interfaces
 * Based on whale sample research and API documentation
 */

export interface FreesoundSample {
    id: number;
    name: string;
    description: string;
    username: string;
    download: string;
    preview: string;
    tags: string[];
    license: string;
    filesize: number;
    bitdepth: number;
    bitrate: number;
    samplerate: number;
    duration: number;
    channels: number;
    type: string;
    created: string;
    geotag?: {
        lat: number;
        lon: number;
    };
    pack?: {
        id: number;
        name: string;
    };
}

export interface FreesoundSearchResult {
    count: number;
    next: string | null;
    previous: string | null;
    results: FreesoundSample[];
}

export interface WhaleSearchQuery {
    species: WhaleSpecies;
    duration?: [number, number];
    quality: QualityThreshold;
    excludeTerms: string[];
    licenseFilter?: 'cc' | 'cc0' | 'attribution';
    trustedSources?: boolean;
}

export interface SampleValidation {
    acousticMatch: boolean;
    sourceCredibility: number;  // 1-10 rating
    communityVotes: number;
    expertReview: boolean;
    speciesConfidence: number;  // 0-1 confidence
    qualityScore: number;       // 0-1 overall quality
}

export interface ValidationResult {
    isValid: boolean;
    score: number;
    reasons: string[];
    metadata: {
        frequencyRange: [number, number];
        duration: number;
        signalToNoise: number;
        source: string;
    };
}

export interface SampleDiscoveryResult {
    samples: FreesoundSample[];
    validated: FreesoundSample[];
    rejected: FreesoundSample[];
    statistics: {
        totalFound: number;
        validationRate: number;
        averageQuality: number;
    };
}

export type WhaleSpecies = 
    | 'humpback' 
    | 'blue' 
    | 'orca' 
    | 'gray' 
    | 'sperm' 
    | 'minke' 
    | 'fin' 
    | 'right'     // North Atlantic right whale (critically endangered)
    | 'sei'       // Sei whale  
    | 'pilot'     // Pilot whale (toothed whale)
    | 'mixed';

export type QualityThreshold = 'strict' | 'medium' | 'permissive';

export interface WhaleAcousticSignature {
    fundamentalFrequency: {
        humpback: [number, number];    // [20, 4000] Hz
        blue: [number, number];        // [10, 40] Hz
        orca: [number, number];        // [500, 25000] Hz
        gray: [number, number];        // [100, 2000] Hz
        sperm: [number, number];       // [100, 30000] Hz
        minke: [number, number];       // [35, 50] Hz
        fin: [number, number];         // [15, 30] Hz
        right: [number, number];       // [50, 500] Hz (upcalls)
        sei: [number, number];         // [200, 600] Hz (downsweeps)
        pilot: [number, number];       // [300, 8000] Hz (toothed whale)
    };
    harmonicPattern: number[];
    temporalPattern: 'sustained' | 'pulsed' | 'sweep' | 'complex';
    backgroundAmbient: 'ocean' | 'hydrophone' | 'clean' | 'noisy';
    signalToNoise: number;
}

export interface WhaleIntegrationSettings {
    useWhaleExternal: boolean;
    autoDiscovery: boolean;
    discoveryFrequency: 'never' | 'weekly' | 'monthly';
    qualityThreshold: QualityThreshold;
    allowBackgroundFetch: boolean;
    speciesPreference: WhaleSpecies;
    sampleUrls: string[];
    trustedInstitutions: string[];
    lastDiscovery?: string;
    maxSamples: number;
}

export interface TrustedSource {
    username: string;
    institution: string;
    credibilityScore: number;
    specializations: WhaleSpecies[];
    verificationDate: string;
}

// API Response types
export interface FreesoundApiError {
    detail: string;
    status: number;
}

export interface FreesoundAuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}