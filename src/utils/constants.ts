export interface InstrumentSettings {
	enabled: boolean;
	volume: number;
	maxVoices: number;
	effects: {
		reverb: ReverbSettings;
		chorus: ChorusSettings;
		filter: FilterSettings;
	};
}

export interface ReverbSettings {
	enabled: boolean;
	params: {
		decay: number;
		preDelay: number;
		wet: number;
	};
}

export interface ChorusSettings {
	enabled: boolean;
	params: {
		frequency: number;
		depth: number;
		delayTime: number;
		feedback: number;
	};
}

export interface FilterSettings {
	enabled: boolean;
	params: {
		frequency: number;
		Q: number;
		type: 'lowpass' | 'highpass' | 'bandpass';
	};
}

// Legacy interface for backward compatibility (if needed)
export interface EffectSettings {
	enabled: boolean;
	params: {
		[key: string]: number | string;
	};
}

// Phase 3.5: Enhanced Effect Routing Architecture
export interface EffectNode {
	id: string;
	type: 'reverb' | 'chorus' | 'filter' | 'delay' | 'distortion' | 'compressor';
	enabled: boolean;
	order: number;
	settings: ReverbSettings | ChorusSettings | FilterSettings | DelaySettings | DistortionSettings | CompressorSettings;
	bypass: boolean; // For A/B testing
}

export interface EffectChain {
	instrumentName: string;
	routing: 'serial' | 'parallel' | 'custom';
	nodes: EffectNode[];
	wetDryMix?: number; // For parallel routing
	sendLevels?: Map<string, number>; // Send levels to buses
}

export interface SendBus {
	id: string;
	name: string;
	type: 'reverb' | 'delay' | 'custom';
	effects: EffectNode[];
	returnLevel: number;
	prePost: 'pre' | 'post'; // Pre or post-fader send
}

export interface ReturnBus {
	id: string;
	name: string;
	inputLevel: number;
	effects: EffectNode[];
	panPosition: number; // -1 (left) to 1 (right)
}

export interface InstrumentGroup {
	id: string;
	name: string;
	instruments: string[];
	groupEffects: EffectNode[];
	groupVolume: number;
	groupMute: boolean;
	groupSolo: boolean;
}

export interface MasterEffects {
	reverb: MasterReverbSettings;
	eq: MasterEQSettings;
	compressor: MasterCompressorSettings;
	limiter: MasterLimiterSettings;
	enabled: boolean;
}

export interface MasterReverbSettings extends ReverbSettings {
	roomSize: number;
	damping: number;
}

export interface MasterEQSettings {
	enabled: boolean;
	params: {
		lowGain: number;
		midGain: number;
		highGain: number;
		lowFreq: number;
		midFreq: number;
		highFreq: number;
	};
}

export interface MasterCompressorSettings {
	enabled: boolean;
	params: {
		threshold: number;
		ratio: number;
		attack: number;
		release: number;
		makeupGain: number;
	};
}

export interface MasterLimiterSettings {
	enabled: boolean;
	params: {
		threshold: number;
		lookAhead: number;
		release: number;
	};
}

// Additional effect types for enhanced routing
export interface DelaySettings {
	enabled: boolean;
	params: {
		delayTime: number;
		feedback: number;
		wet: number;
		maxDelay: number;
	};
}

export interface DistortionSettings {
	enabled: boolean;
	params: {
		distortion: number;
		oversample: '2x' | '4x' | 'none';
		wet: number;
	};
}

export interface CompressorSettings {
	enabled: boolean;
	params: {
		threshold: number;
		ratio: number;
		attack: number;
		release: number;
		knee: number;
	};
}

export interface EffectAutomation {
	effectId: string;
	parameter: string;
	modulation: 'lfo' | 'envelope' | 'random' | 'expression';
	amount: number;
	rate?: number; // For LFO modulation
	shape?: 'sine' | 'triangle' | 'square' | 'sawtooth'; // For LFO
	sync?: boolean; // Sync to tempo
}

export interface RoutingMatrix {
	sends: Map<string, SendBus[]>; // instrument -> send buses
	returns: Map<string, ReturnBus>; // bus name -> return bus
	groups: Map<string, InstrumentGroup>; // group name -> instruments
	masterEffects: MasterEffects;
	automations: EffectAutomation[];
}

export interface SonigraphSettings {
	tempo: number;
	volume: number;
	scale: string;
	rootNote: string;
	traversalMethod: string;
	isEnabled: boolean;
	audioFormat: 'mp3' | 'wav';
	instruments: {
		piano: InstrumentSettings;
		organ: InstrumentSettings;
		strings: InstrumentSettings;
		choir: InstrumentSettings;
		vocalPads: InstrumentSettings;
		pad: InstrumentSettings;
		flute: InstrumentSettings;
		clarinet: InstrumentSettings;
		saxophone: InstrumentSettings;
		soprano: InstrumentSettings;
		alto: InstrumentSettings;
		tenor: InstrumentSettings;
		bass: InstrumentSettings;
		// Phase 6B: Extended Keyboard Family
		electricPiano: InstrumentSettings;
		harpsichord: InstrumentSettings;
		accordion: InstrumentSettings;
		celesta: InstrumentSettings;
		// Phase 7: Strings & Brass Completion
		violin: InstrumentSettings;
		cello: InstrumentSettings;
		guitar: InstrumentSettings;
		harp: InstrumentSettings;
		trumpet: InstrumentSettings;
		frenchHorn: InstrumentSettings;
		trombone: InstrumentSettings;
		tuba: InstrumentSettings;
		// Phase 8: Percussion & Electronic Finale (8 instruments → 33/33 total)
		oboe: InstrumentSettings;
		timpani: InstrumentSettings;
		xylophone: InstrumentSettings;
		vibraphone: InstrumentSettings;
		gongs: InstrumentSettings;
		leadSynth: InstrumentSettings;
		bassSynth: InstrumentSettings;
		arpSynth: InstrumentSettings;
		// Phase 8B: Environmental & Natural Sounds
		whaleHumpback: InstrumentSettings;
	};
	voiceAssignmentStrategy: 'frequency' | 'round-robin' | 'connection-based';
	// Phase 3.5: Enhanced Effect Routing
	enhancedRouting?: {
		enabled: boolean;
		effectChains: Map<string, EffectChain>; // instrument -> effect chain
		routingMatrix: RoutingMatrix;
		version: string; // For migration compatibility
	};
}

export const DEFAULT_SETTINGS: SonigraphSettings = {
	tempo: 120,
	volume: 0.5,
	scale: 'major',
	rootNote: 'C',
	traversalMethod: 'breadth-first',
	isEnabled: true,
	audioFormat: 'mp3',
	instruments: {
		piano: { 
			enabled: true, 
			volume: 0.8, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 1.8, 
						preDelay: 0.02, 
						wet: 0.25 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.8, 
						depth: 0.5, 
						delayTime: 4.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 3500, 
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		organ: { 
			enabled: false, 
			volume: 0.7, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: false, 
					params: { 
						decay: 2.2, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.8, 
						depth: 0.5, 
						delayTime: 4.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 4000, 
						Q: 0.6, 
						type: 'lowpass' 
					} 
				}
			}
		},
		strings: { 
			enabled: true, 
			volume: 0.6, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.8, 
						preDelay: 0.04, 
						wet: 0.45 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.3, 
						delayTime: 3.0, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 3500, 
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		choir: { 
			enabled: false, 
			volume: 0.7, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.2, 
						preDelay: 0.05, 
						wet: 0.6 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.4, 
						depth: 0.6, 
						delayTime: 5.0, 
						feedback: 0.08 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 2000, 
						Q: 0.7, 
						type: 'lowpass' 
					} 
				}
			}
		},
		vocalPads: { 
			enabled: false, 
			volume: 0.5, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 4.0, 
						preDelay: 0.06, 
						wet: 0.7 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.3, 
						depth: 0.4, 
						delayTime: 6.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 1500, 
						Q: 1.2, 
						type: 'lowpass' 
					} 
				}
			}
		},
		pad: { 
			enabled: false, 
			volume: 0.4, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.5, 
						preDelay: 0.08, 
						wet: 0.8 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.2, 
						depth: 0.7, 
						delayTime: 8.0, 
						feedback: 0.1 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 1200, 
						Q: 1.5, 
						type: 'lowpass' 
					} 
				}
			}
		},
		flute: { 
			enabled: true, 
			volume: 0.6, 
			maxVoices: 6,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.2, 
						preDelay: 0.02, 
						wet: 0.4 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.8, 
						depth: 0.2, 
						delayTime: 2.0, 
						feedback: 0.02 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 6000, 
						Q: 0.5, 
						type: 'lowpass' 
					} 
				}
			}
		},
		clarinet: { 
			enabled: true, 
			volume: 0.5, 
			maxVoices: 6,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.5, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.5, 
						depth: 0.25, 
						delayTime: 2.5, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 4500, 
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		saxophone: { 
			enabled: false, 
			volume: 0.7, 
			maxVoices: 6,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.8, 
						preDelay: 0.04, 
						wet: 0.45 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.6, 
						depth: 0.4, 
						delayTime: 3.5, 
						feedback: 0.06 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 3000, 
						Q: 0.9, 
						type: 'lowpass' 
					} 
				}
			}
		},
		soprano: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 4,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.8, 
						preDelay: 0.03, 
						wet: 0.5 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.8, 
						depth: 0.3, 
						delayTime: 2.5, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 4000,
						Q: 1.2, 
						type: 'lowpass' 
					} 
				}
			}
		},
		alto: { 
			enabled: false,
			volume: 0.5, 
			maxVoices: 4,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.0, 
						preDelay: 0.04, 
						wet: 0.55 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.6, 
						depth: 0.35, 
						delayTime: 3.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 3200,
						Q: 1.0, 
						type: 'lowpass' 
					} 
				}
			}
		},
		tenor: { 
			enabled: false,
			volume: 0.5, 
			maxVoices: 4,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.5, 
						preDelay: 0.03, 
						wet: 0.45 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.7, 
						depth: 0.25, 
						delayTime: 2.8, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 2800,
						Q: 0.9, 
						type: 'lowpass' 
					} 
				}
			}
		},
		bass: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 4,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.5, 
						preDelay: 0.05, 
						wet: 0.6 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.4, 
						depth: 0.4, 
						delayTime: 4.0, 
						feedback: 0.06 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 1500,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		// Phase 6B: Extended Keyboard Family
		electricPiano: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.0, 
						preDelay: 0.025, 
						wet: 0.3 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 1.2, 
						depth: 0.4, 
						delayTime: 3.0, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 5000,
						Q: 0.7, 
						type: 'lowpass' 
					} 
				}
			}
		},
		harpsichord: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 1.5, 
						preDelay: 0.02, 
						wet: 0.25 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.2, 
						delayTime: 2.0, 
						feedback: 0.02 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 4500,
						Q: 1.0, 
						type: 'lowpass' 
					} 
				}
			}
		},
		accordion: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.2, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.8, 
						depth: 0.5, 
						delayTime: 4.0, 
						feedback: 0.06 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 3500,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		celesta: { 
			enabled: false,
			volume: 0.5, 
			maxVoices: 6,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.0, 
						preDelay: 0.04, 
						wet: 0.5 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.4, 
						depth: 0.3, 
						delayTime: 3.5, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 6000,
						Q: 0.6, 
						type: 'lowpass' 
					} 
				}
			}
		},
		// Phase 7: Strings & Brass Completion
		violin: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 6,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.5, 
						preDelay: 0.03, 
						wet: 0.4 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.3, 
						delayTime: 2.5, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 5000,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		cello: { 
			enabled: false,
			volume: 0.8, 
			maxVoices: 6,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.2, 
						preDelay: 0.04, 
						wet: 0.5 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.4, 
						depth: 0.4, 
						delayTime: 3.5, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 3000,
						Q: 0.9, 
						type: 'lowpass' 
					} 
				}
			}
		},
		guitar: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 8,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.0, 
						preDelay: 0.02, 
						wet: 0.3 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.8, 
						depth: 0.3, 
						delayTime: 2.0, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 4000,
						Q: 0.7, 
						type: 'lowpass' 
					} 
				}
			}
		},
		harp: { 
			enabled: false,
			volume: 0.5, 
			maxVoices: 12,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 4.0, 
						preDelay: 0.05, 
						wet: 0.6 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.3, 
						depth: 0.2, 
						delayTime: 4.0, 
						feedback: 0.02 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 6000,
						Q: 0.5, 
						type: 'lowpass' 
					} 
				}
			}
		},
		trumpet: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 4,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.2, 
						preDelay: 0.03, 
						wet: 0.35 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.7, 
						depth: 0.2, 
						delayTime: 2.5, 
						feedback: 0.03 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 4500,
						Q: 1.0, 
						type: 'lowpass' 
					} 
				}
			}
		},
		frenchHorn: { 
			enabled: false,
			volume: 0.6, 
			maxVoices: 4,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.8, 
						preDelay: 0.04, 
						wet: 0.45 
					} 
				},
				chorus: { 
					enabled: true, 
					params: { 
						frequency: 0.5, 
						depth: 0.3, 
						delayTime: 3.0, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 3500,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		trombone: { 
			enabled: false,
			volume: 0.7, 
			maxVoices: 4,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 2.5, 
						preDelay: 0.03, 
						wet: 0.4 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.6, 
						depth: 0.3, 
						delayTime: 3.0, 
						feedback: 0.04 
					} 
				},
				filter: { 
					enabled: true, 
					params: { 
						frequency: 2500,
						Q: 0.9, 
						type: 'lowpass' 
					} 
				}
			}
		},
		tuba: { 
			enabled: false,
			volume: 0.8, 
			maxVoices: 3,
			effects: {
				reverb: { 
					enabled: true, 
					params: { 
						decay: 3.5, 
						preDelay: 0.05, 
						wet: 0.5 
					} 
				},
				chorus: { 
					enabled: false, 
					params: { 
						frequency: 0.3, 
						depth: 0.4, 
						delayTime: 4.0, 
						feedback: 0.05 
					} 
				},
				filter: { 
					enabled: false, 
					params: { 
						frequency: 1500,
						Q: 0.8, 
						type: 'lowpass' 
					} 
				}
			}
		},
		// Phase 8: Percussion & Electronic Finale (8 instruments → 33/33 total)
		oboe: {
			enabled: false,
			volume: 0.7,
			maxVoices: 4,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 2.5,
						preDelay: 0.03,
						wet: 0.35
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 1.2,
						depth: 0.3,
						delayTime: 2.5,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 2500,
						Q: 1.2,
						type: 'bandpass'
					}
				}
			}
		},
		timpani: {
			enabled: false,
			volume: 0.9,
			maxVoices: 2,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 6.0,
						preDelay: 0.08,
						wet: 0.6
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 0.1,
						depth: 0.2,
						delayTime: 8.0,
						feedback: 0.02
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 800,
						Q: 0.5,
						type: 'highpass'
					}
				}
			}
		},
		xylophone: {
			enabled: false,
			volume: 0.8,
			maxVoices: 6,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 2.0,
						preDelay: 0.02,
						wet: 0.3
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 2.0,
						depth: 0.2,
						delayTime: 1.5,
						feedback: 0.05
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 8000,
						Q: 0.8,
						type: 'lowpass'
					}
				}
			}
		},
		vibraphone: {
			enabled: false,
			volume: 0.7,
			maxVoices: 4,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 4.5,
						preDelay: 0.04,
						wet: 0.4
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 6.0,
						depth: 0.3,
						delayTime: 2.0,
						feedback: 0.08
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 4000,
						Q: 1.0,
						type: 'lowpass'
					}
				}
			}
		},
		gongs: {
			enabled: false,
			volume: 0.9,
			maxVoices: 2,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 12.0,
						preDelay: 0.1,
						wet: 0.7
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 0.05,
						depth: 0.4,
						delayTime: 15.0,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 200,
						Q: 2.0,
						type: 'bandpass'
					}
				}
			}
		},
		leadSynth: {
			enabled: false,
			volume: 0.6,
			maxVoices: 4,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 1.5,
						preDelay: 0.02,
						wet: 0.2
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 1.5,
						depth: 0.3,
						delayTime: 3.0,
						feedback: 0.1
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 2000,
						Q: 4.0,
						type: 'lowpass'
					}
				}
			}
		},
		bassSynth: {
			enabled: false,
			volume: 0.8,
			maxVoices: 2,
			effects: {
				reverb: {
					enabled: false,
					params: {
						decay: 1.0,
						preDelay: 0.01,
						wet: 0.1
					}
				},
				chorus: {
					enabled: false,
					params: {
						frequency: 0.8,
						depth: 0.2,
						delayTime: 4.0,
						feedback: 0.05
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 300,
						Q: 1.5,
						type: 'lowpass'
					}
				}
			}
		},
		arpSynth: {
			enabled: false,
			volume: 0.6,
			maxVoices: 8,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 1.8,
						preDelay: 0.02,
						wet: 0.25
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 2.0,
						depth: 0.2,
						delayTime: 2.0,
						feedback: 0.06
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 3000,
						Q: 1.2,
						type: 'lowpass'
					}
				}
			}
		},
		// Phase 8B: Environmental & Natural Sounds
		whaleHumpback: {
			enabled: false,
			volume: 0.7,
			maxVoices: 4,
			effects: {
				reverb: {
					enabled: true,
					params: {
						decay: 8.0,
						preDelay: 0.15,
						wet: 0.85
					}
				},
				chorus: {
					enabled: true,
					params: {
						frequency: 0.1,
						depth: 0.8,
						delayTime: 12.0,
						feedback: 0.15
					}
				},
				filter: {
					enabled: true,
					params: {
						frequency: 800,
						Q: 0.4,
						type: 'lowpass'
					}
				}
			}
		}
	},
	voiceAssignmentStrategy: 'frequency',
	// Phase 3.5: Enhanced Effect Routing (disabled by default for backward compatibility)
	enhancedRouting: {
		enabled: false,
		effectChains: new Map(),
		routingMatrix: {
			sends: new Map(),
			returns: new Map(),
			groups: new Map(),
			masterEffects: {
				reverb: {
					enabled: false,
					roomSize: 0.8,
					damping: 0.5,
					params: {
						decay: 3.0,
						preDelay: 0.05,
						wet: 0.3
					}
				},
				eq: {
					enabled: false,
					params: {
						lowGain: 0,
						midGain: 0,
						highGain: 0,
						lowFreq: 100,
						midFreq: 1000,
						highFreq: 8000
					}
				},
				compressor: {
					enabled: false,
					params: {
						threshold: -18,
						ratio: 4,
						attack: 0.003,
						release: 0.1,
						makeupGain: 2
					}
				},
				limiter: {
					enabled: false,
					params: {
						threshold: -0.5,
						lookAhead: 0.005,
						release: 0.01
					}
				},
				enabled: false
			},
			automations: []
		},
		version: '3.5.0'
	}
};

export const MUSICAL_SCALES = {
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
	pentatonic: [0, 2, 4, 7, 9],
	chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

export const ROOT_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const TRAVERSAL_METHODS = ['breadth-first', 'depth-first', 'sequential'];

export const VOICE_ASSIGNMENT_STRATEGIES = {
	frequency: 'Frequency-Based (Automatic)',
	'round-robin': 'Round-Robin (Cycling)',
	'connection-based': 'Connection-Based (Graph)'
};

export const INSTRUMENT_INFO = {
	piano: {
		name: 'Piano',
		icon: '🎹',
		description: 'Triangle waves with quick attack/decay for percussive clarity',
		defaultFrequencyRange: 'Very High (>1400Hz)'
	},
	organ: {
		name: 'Organ', 
		icon: '🎛️',
		description: 'FM synthesis with chorus effect for rich, sustained tones',
		defaultFrequencyRange: 'Medium (400-800Hz)'
	},
	strings: {
		name: 'Strings',
		icon: '🎻',
		description: 'AM synthesis with filtering for warm, flowing sounds',
		defaultFrequencyRange: 'Very Low (<200Hz)'
	},
	choir: {
		name: 'Choir',
		icon: '🎤',
		description: 'Additive synthesis with formant filtering for ethereal human voices',
		defaultFrequencyRange: 'High (1000-1400Hz)'
	},
	vocalPads: {
		name: 'Vocal Pads',
		icon: '🌊',
		description: 'Multi-layer sine waves with formant filtering for atmospheric textures',
		defaultFrequencyRange: 'Mid-High (600-1000Hz)'
	},
	pad: {
		name: 'Pad',
		icon: '🎛️',
		description: 'Multi-oscillator synthesis with filter sweeps for ambient foundations',
		defaultFrequencyRange: 'Low-Mid (200-400Hz)'
	},
	flute: {
		name: 'Flute',
		icon: '🎺',
		description: 'Pure sine waves with breath noise for airy, crystalline tones',
		defaultFrequencyRange: 'Ultra High (>1600Hz)'
	},
	clarinet: {
		name: 'Clarinet',
		icon: '🎵',
		description: 'Square wave harmonics for warm, hollow woodwind character',
		defaultFrequencyRange: 'High-Mid (800-1200Hz)'
	},
	saxophone: {
		name: 'Saxophone',
		icon: '🎷',
		description: 'Sawtooth waves with reedy harmonics for rich, expressive tone',
		defaultFrequencyRange: 'Mid (300-600Hz)'
	},
	// Phase 6B: Extended Keyboard Family
	electricPiano: {
		name: 'Electric Piano',
		icon: '🎹',
		description: 'AM synthesis with tremolo for vintage Rhodes/Wurlitzer character',
		defaultFrequencyRange: 'Mid-Low (200-400Hz)'
	},
	harpsichord: {
		name: 'Harpsichord',
		icon: '🎼',
		description: 'Sharp envelope with filtering for baroque plucked attack',
		defaultFrequencyRange: 'Low-Mid (300-600Hz)'
	},
	accordion: {
		name: 'Accordion',
		icon: '🪗',
		description: 'AM synthesis with vibrato for bellows breath simulation',
		defaultFrequencyRange: 'Mid (400-800Hz)'
	},
	celesta: {
		name: 'Celesta',
		icon: '🔔',
		description: 'Triangle waves with decay for bell-like ethereal tones',
		defaultFrequencyRange: 'Very High (1400-1600Hz)'
	},
	// Phase 7: Strings & Brass Completion
	violin: {
		name: 'Violin',
		icon: '🎻',
		description: 'Sawtooth waves with filter sweeps and vibrato for expressive bowing',
		defaultFrequencyRange: 'High-Mid (800-1200Hz)'
	},
	cello: {
		name: 'Cello',
		icon: '🎻',
		description: 'Complex harmonics with bow noise for rich low register character',
		defaultFrequencyRange: 'Mid-Low (200-400Hz)'
	},
	guitar: {
		name: 'Guitar',
		icon: '🎸',
		description: 'Karplus-Strong synthesis for authentic plucked string physics',
		defaultFrequencyRange: 'Mid-High (600-1000Hz)'
	},
	harp: {
		name: 'Harp',
		icon: '🪄',
		description: 'Sharp pluck envelope with long decay for cascading arpeggios',
		defaultFrequencyRange: 'Low (100-200Hz)'
	},
	trumpet: {
		name: 'Trumpet',
		icon: '🎺',
		description: 'Square waves with brass formants for bright metallic timbre',
		defaultFrequencyRange: 'Low-Mid (300-600Hz)'
	},
	frenchHorn: {
		name: 'French Horn',
		icon: '🎯',
		description: 'Sine waves with slight distortion for warm middle register',
		defaultFrequencyRange: 'Mid (400-800Hz)'
	},
	trombone: {
		name: 'Trombone',
		icon: '🎺',
		description: 'Sawtooth waves with portamento for characteristic sliding pitch',
		defaultFrequencyRange: 'Mid-Low (200-400Hz)'
	},
	tuba: {
		name: 'Tuba',
		icon: '🎺',
		description: 'Sub-bass frequencies with breath noise for deep foundation',
		defaultFrequencyRange: 'Very Low (<100Hz)'
	},
	// Phase 8: Percussion & Electronic Finale
	oboe: {
		name: 'Oboe',
		icon: '🎼',
		description: 'Nasal quality with double reed simulation and formant filtering',
		defaultFrequencyRange: 'High-Mid (800-1200Hz)'
	},
	timpani: {
		name: 'Timpani',
		icon: '🥁',
		description: 'Tuned drums with pitch bending and hall acoustics',
		defaultFrequencyRange: 'Low (100-200Hz)'
	},
	xylophone: {
		name: 'Xylophone',
		icon: '🎵',
		description: 'Bright mallet percussion with wooden resonance',
		defaultFrequencyRange: 'Very High (1400-1600Hz)'
	},
	vibraphone: {
		name: 'Vibraphone',
		icon: '🎼',
		description: 'Metallic shimmer with tremolo motor and long sustain',
		defaultFrequencyRange: 'High (1000-1400Hz)'
	},
	gongs: {
		name: 'Gongs',
		icon: '🥁',
		description: 'Sustained crash with metallic resonance and massive reverb',
		defaultFrequencyRange: 'Very Low (<100Hz)'
	},
	leadSynth: {
		name: 'Lead Synth',
		icon: '🎛️',
		description: 'Cutting synth lead with filter modulation and resonance',
		defaultFrequencyRange: 'Variable (200-8000Hz)'
	},
	bassSynth: {
		name: 'Bass Synth',
		icon: '🎛️',
		description: 'Electronic foundation with sub-oscillator and tight filtering',
		defaultFrequencyRange: 'Low (100-200Hz)'
	},
	arpSynth: {
		name: 'Arp Synth',
		icon: '🎛️',
		description: 'Sequenced patterns with graph-sync capability and delay',
		defaultFrequencyRange: 'Variable (Pattern-dependent)'
	},
	// Phase 6A: Individual Vocal Sections
	soprano: {
		name: 'Soprano',
		icon: '👩‍🎤',
		description: 'High female voice with formant filtering and vowel morphing',
		defaultFrequencyRange: 'High-Mid (800-1200Hz)'
	},
	alto: {
		name: 'Alto',
		icon: '🎙️',
		description: 'Lower female voice with rich harmonics and breath noise modeling',
		defaultFrequencyRange: 'High (1000-1400Hz)'
	},
	tenor: {
		name: 'Tenor',
		icon: '🧑‍🎤',
		description: 'High male voice with vocal expression and characteristics',
		defaultFrequencyRange: 'Mid-High (600-1000Hz)'
	},
	bass: {
		name: 'Bass',
		icon: '🎤',
		description: 'Low male voice with chest resonance and sub-harmonics',
		defaultFrequencyRange: 'Very Low (<100Hz)'
	},
	// Phase 8B: Environmental & Natural Sounds
	whaleHumpback: {
		name: 'Humpback Whale',
		icon: '🐋',
		description: 'Authentic whale song recordings with oceanic processing and deep resonance',
		defaultFrequencyRange: 'Low-Mid (20-1000Hz)'
	}
};

// Effect Presets System
export interface EffectPreset {
	name: string;
	description: string;
	category: 'venue' | 'genre' | 'instrument' | 'custom';
	effects: {
		reverb: ReverbSettings;
		chorus: ChorusSettings;
		filter: FilterSettings;
	};
}

export const EFFECT_PRESETS: { [key: string]: EffectPreset } = {
	// Venue-based presets
	'concert-hall': {
		name: 'Concert Hall',
		description: 'Large reverberant space with natural acoustics',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 3.5, preDelay: 0.08, wet: 0.6 } },
			chorus: { enabled: false, params: { frequency: 0.5, depth: 0.3, delayTime: 3.0, feedback: 0.03 } },
			filter: { enabled: true, params: { frequency: 6000, Q: 0.5, type: 'lowpass' } }
		}
	},
	'cathedral': {
		name: 'Cathedral',
		description: 'Massive stone space with long, ethereal reverb',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 8.0, preDelay: 0.15, wet: 0.8 } },
			chorus: { enabled: true, params: { frequency: 0.3, depth: 0.4, delayTime: 6.0, feedback: 0.08 } },
			filter: { enabled: true, params: { frequency: 4000, Q: 0.6, type: 'lowpass' } }
		}
	},
	'studio': {
		name: 'Studio',
		description: 'Clean, controlled recording environment',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 1.2, preDelay: 0.01, wet: 0.25 } },
			chorus: { enabled: false, params: { frequency: 0.8, depth: 0.2, delayTime: 2.0, feedback: 0.02 } },
			filter: { enabled: false, params: { frequency: 8000, Q: 0.7, type: 'lowpass' } }
		}
	},
	'jazz-club': {
		name: 'Jazz Club',
		description: 'Intimate, warm venue with subtle ambience',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 2.0, preDelay: 0.03, wet: 0.35 } },
			chorus: { enabled: true, params: { frequency: 0.6, depth: 0.3, delayTime: 3.5, feedback: 0.05 } },
			filter: { enabled: true, params: { frequency: 5000, Q: 0.8, type: 'lowpass' } }
		}
	},
	'arena': {
		name: 'Arena',
		description: 'Large venue with powerful, booming acoustics',
		category: 'venue',
		effects: {
			reverb: { enabled: true, params: { decay: 4.5, preDelay: 0.12, wet: 0.7 } },
			chorus: { enabled: true, params: { frequency: 0.4, depth: 0.5, delayTime: 4.0, feedback: 0.06 } },
			filter: { enabled: true, params: { frequency: 3500, Q: 1.0, type: 'lowpass' } }
		}
	},

	// Genre-based presets
	'ambient': {
		name: 'Ambient',
		description: 'Spacious, ethereal soundscape',
		category: 'genre',
		effects: {
			reverb: { enabled: true, params: { decay: 6.0, preDelay: 0.10, wet: 0.75 } },
			chorus: { enabled: true, params: { frequency: 0.2, depth: 0.6, delayTime: 8.0, feedback: 0.1 } },
			filter: { enabled: true, params: { frequency: 2500, Q: 1.2, type: 'lowpass' } }
		}
	},
	'classical': {
		name: 'Classical',
		description: 'Natural, balanced orchestral sound',
		category: 'genre',
		effects: {
			reverb: { enabled: true, params: { decay: 2.8, preDelay: 0.06, wet: 0.5 } },
			chorus: { enabled: false, params: { frequency: 0.5, depth: 0.3, delayTime: 3.0, feedback: 0.03 } },
			filter: { enabled: true, params: { frequency: 7000, Q: 0.6, type: 'lowpass' } }
		}
	},
	'electronic': {
		name: 'Electronic',
		description: 'Clean, precise digital processing',
		category: 'genre',
		effects: {
			reverb: { enabled: true, params: { decay: 1.5, preDelay: 0.02, wet: 0.3 } },
			chorus: { enabled: true, params: { frequency: 1.2, depth: 0.4, delayTime: 2.5, feedback: 0.04 } },
			filter: { enabled: true, params: { frequency: 8000, Q: 1.5, type: 'lowpass' } }
		}
	},
	'cinematic': {
		name: 'Cinematic',
		description: 'Epic, dramatic film score atmosphere',
		category: 'genre',
		effects: {
			reverb: { enabled: true, params: { decay: 5.0, preDelay: 0.09, wet: 0.65 } },
			chorus: { enabled: true, params: { frequency: 0.3, depth: 0.5, delayTime: 5.0, feedback: 0.07 } },
			filter: { enabled: true, params: { frequency: 4500, Q: 0.9, type: 'lowpass' } }
		}
	},

	// Special presets
	'dry': {
		name: 'Dry',
		description: 'Minimal effects for clarity',
		category: 'instrument',
		effects: {
			reverb: { enabled: false, params: { decay: 1.0, preDelay: 0.01, wet: 0.1 } },
			chorus: { enabled: false, params: { frequency: 0.5, depth: 0.2, delayTime: 2.0, feedback: 0.02 } },
			filter: { enabled: false, params: { frequency: 8000, Q: 0.7, type: 'lowpass' } }
		}
	},
	'lush': {
		name: 'Lush',
		description: 'Rich, full processing with all effects',
		category: 'instrument',
		effects: {
			reverb: { enabled: true, params: { decay: 4.0, preDelay: 0.07, wet: 0.6 } },
			chorus: { enabled: true, params: { frequency: 0.5, depth: 0.5, delayTime: 4.0, feedback: 0.06 } },
			filter: { enabled: true, params: { frequency: 6000, Q: 0.8, type: 'lowpass' } }
		}
	}
};

// Smart Parameter Ranges System
export interface ParameterRange {
	min: number;
	max: number;
	step: number;
	defaultValue: number;
	musicalContext: string;
	suggestions?: { value: number; label: string }[];
}

export interface SmartRanges {
	reverb: {
		decay: ParameterRange;
		preDelay: ParameterRange;
		wet: ParameterRange;
	};
	chorus: {
		frequency: ParameterRange;
		depth: ParameterRange;
		delayTime: ParameterRange;
		feedback: ParameterRange;
	};
	filter: {
		frequency: ParameterRange;
		Q: ParameterRange;
	};
}

// Instrument-specific smart parameter ranges
export const INSTRUMENT_SMART_RANGES: { [instrument: string]: SmartRanges } = {
	piano: {
		reverb: {
			decay: {
				min: 0.5, max: 6.0, step: 0.1, defaultValue: 1.8,
				musicalContext: 'Piano benefits from shorter, cleaner reverb tails',
				suggestions: [
					{ value: 1.2, label: 'Intimate' },
					{ value: 1.8, label: 'Studio' },
					{ value: 3.0, label: 'Concert Hall' }
				]
			},
			preDelay: {
				min: 0.005, max: 0.08, step: 0.005, defaultValue: 0.02,
				musicalContext: 'Short pre-delay maintains piano clarity and attack'
			},
			wet: {
				min: 0.1, max: 0.6, step: 0.05, defaultValue: 0.25,
				musicalContext: 'Moderate reverb preserves piano definition'
			}
		},
		chorus: {
			frequency: {
				min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Subtle modulation enhances piano warmth without wobble'
			},
			depth: {
				min: 0.1, max: 0.6, step: 0.05, defaultValue: 0.3,
				musicalContext: 'Light chorus depth maintains piano naturalness'
			},
			delayTime: {
				min: 2.0, max: 8.0, step: 0.5, defaultValue: 4.0,
				musicalContext: 'Medium delay times work best for piano chorus'
			},
			feedback: {
				min: 0.01, max: 0.15, step: 0.01, defaultValue: 0.05,
				musicalContext: 'Low feedback prevents chorus from overwhelming piano tone'
			}
		},
		filter: {
			frequency: {
				min: 2000, max: 8000, step: 100, defaultValue: 3500,
				musicalContext: 'Piano harmonics extend well into higher frequencies',
				suggestions: [
					{ value: 2500, label: 'Warm' },
					{ value: 3500, label: 'Natural' },
					{ value: 5000, label: 'Bright' }
				]
			},
			Q: {
				min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Moderate Q maintains piano frequency balance'
			}
		}
	},
	strings: {
		reverb: {
			decay: {
				min: 1.5, max: 10.0, step: 0.2, defaultValue: 2.8,
				musicalContext: 'Strings thrive with longer, lush reverb tails',
				suggestions: [
					{ value: 2.0, label: 'Chamber' },
					{ value: 2.8, label: 'Orchestral' },
					{ value: 5.0, label: 'Cathedral' }
				]
			},
			preDelay: {
				min: 0.02, max: 0.12, step: 0.01, defaultValue: 0.04,
				musicalContext: 'Longer pre-delay creates spacious string sections'
			},
			wet: {
				min: 0.2, max: 0.8, step: 0.05, defaultValue: 0.45,
				musicalContext: 'Strings can handle more reverb for lush soundscapes'
			}
		},
		chorus: {
			frequency: {
				min: 0.2, max: 1.2, step: 0.05, defaultValue: 0.6,
				musicalContext: 'Slower modulation creates organic string ensemble feel'
			},
			depth: {
				min: 0.1, max: 0.5, step: 0.05, defaultValue: 0.3,
				musicalContext: 'Gentle chorus depth adds string section width'
			},
			delayTime: {
				min: 2.0, max: 6.0, step: 0.5, defaultValue: 3.0,
				musicalContext: 'Shorter delays work better for string textures'
			},
			feedback: {
				min: 0.01, max: 0.08, step: 0.01, defaultValue: 0.03,
				musicalContext: 'Minimal feedback prevents string muddiness'
			}
		},
		filter: {
			frequency: {
				min: 1500, max: 6000, step: 100, defaultValue: 3500,
				musicalContext: 'String frequencies focus in the mid-high range',
				suggestions: [
					{ value: 2000, label: 'Mellow' },
					{ value: 3500, label: 'Balanced' },
					{ value: 4500, label: 'Articulate' }
				]
			},
			Q: {
				min: 0.4, max: 1.5, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Gentle filtering preserves string harmonic richness'
			}
		}
	},
	organ: {
		reverb: {
			decay: {
				min: 2.0, max: 12.0, step: 0.3, defaultValue: 2.2,
				musicalContext: 'Organ reverb simulates large church acoustics',
				suggestions: [
					{ value: 2.2, label: 'Chapel' },
					{ value: 4.0, label: 'Church' },
					{ value: 8.0, label: 'Cathedral' }
				]
			},
			preDelay: {
				min: 0.02, max: 0.15, step: 0.01, defaultValue: 0.03,
				musicalContext: 'Organ pre-delay mimics architectural space'
			},
			wet: {
				min: 0.3, max: 0.9, step: 0.05, defaultValue: 0.35,
				musicalContext: 'Organ traditionally played in reverberant spaces'
			}
		},
		chorus: {
			frequency: {
				min: 0.2, max: 1.5, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Classic organ chorus creates that Hammond-style swirl'
			},
			depth: {
				min: 0.2, max: 0.8, step: 0.05, defaultValue: 0.5,
				musicalContext: 'Rich chorus depth for classic organ character'
			},
			delayTime: {
				min: 3.0, max: 8.0, step: 0.5, defaultValue: 4.0,
				musicalContext: 'Medium-long delays for organ chorus character'
			},
			feedback: {
				min: 0.02, max: 0.12, step: 0.01, defaultValue: 0.05,
				musicalContext: 'Moderate feedback for organ warmth without mud'
			}
		},
		filter: {
			frequency: {
				min: 2000, max: 8000, step: 150, defaultValue: 4000,
				musicalContext: 'Organ harmonics are rich and extend high',
				suggestions: [
					{ value: 3000, label: 'Warm' },
					{ value: 4000, label: 'Classic' },
					{ value: 6000, label: 'Bright' }
				]
			},
			Q: {
				min: 0.3, max: 1.2, step: 0.1, defaultValue: 0.6,
				musicalContext: 'Gentle Q maintains organ harmonic complexity'
			}
		}
	},
	flute: {
		reverb: {
			decay: {
				min: 1.0, max: 8.0, step: 0.2, defaultValue: 2.2,
				musicalContext: 'Flute needs airy, light reverb for natural sound',
				suggestions: [
					{ value: 1.5, label: 'Intimate' },
					{ value: 2.2, label: 'Recital Hall' },
					{ value: 4.0, label: 'Concert Hall' }
				]
			},
			preDelay: {
				min: 0.005, max: 0.06, step: 0.005, defaultValue: 0.02,
				musicalContext: 'Short pre-delay preserves flute attack and breath'
			},
			wet: {
				min: 0.15, max: 0.65, step: 0.05, defaultValue: 0.4,
				musicalContext: 'Moderate reverb enhances flute airiness'
			}
		},
		chorus: {
			frequency: {
				min: 0.4, max: 1.5, step: 0.1, defaultValue: 0.8,
				musicalContext: 'Light, fast modulation for flute shimmer'
			},
			depth: {
				min: 0.05, max: 0.3, step: 0.05, defaultValue: 0.2,
				musicalContext: 'Subtle chorus preserves flute purity'
			},
			delayTime: {
				min: 1.5, max: 4.0, step: 0.5, defaultValue: 2.0,
				musicalContext: 'Short delays work best for wind instruments'
			},
			feedback: {
				min: 0.005, max: 0.05, step: 0.005, defaultValue: 0.02,
				musicalContext: 'Minimal feedback maintains flute clarity'
			}
		},
		filter: {
			frequency: {
				min: 3000, max: 12000, step: 200, defaultValue: 6000,
				musicalContext: 'Flute has strong high-frequency content and harmonics',
				suggestions: [
					{ value: 4000, label: 'Mellow' },
					{ value: 6000, label: 'Natural' },
					{ value: 8000, label: 'Brilliant' }
				]
			},
			Q: {
				min: 0.2, max: 1.0, step: 0.1, defaultValue: 0.5,
				musicalContext: 'Gentle filtering preserves flute breath and harmonics'
			}
		}
	}
};

// Universal smart ranges for instruments not specifically defined
export const DEFAULT_SMART_RANGES: SmartRanges = {
	reverb: {
		decay: {
			min: 0.5, max: 8.0, step: 0.2, defaultValue: 2.5,
			musicalContext: 'General purpose reverb settings'
		},
		preDelay: {
			min: 0.01, max: 0.1, step: 0.005, defaultValue: 0.03,
			musicalContext: 'Balanced pre-delay for most instruments'
		},
		wet: {
			min: 0.1, max: 0.7, step: 0.05, defaultValue: 0.4,
			musicalContext: 'Moderate reverb mix for versatility'
		}
	},
	chorus: {
		frequency: {
			min: 0.2, max: 2.0, step: 0.1, defaultValue: 0.6,
			musicalContext: 'Universal chorus modulation rate'
		},
		depth: {
			min: 0.1, max: 0.6, step: 0.05, defaultValue: 0.3,
			musicalContext: 'Balanced chorus intensity'
		},
		delayTime: {
			min: 2.0, max: 6.0, step: 0.5, defaultValue: 3.5,
			musicalContext: 'Medium delay for general chorus effect'
		},
		feedback: {
			min: 0.01, max: 0.1, step: 0.01, defaultValue: 0.04,
			musicalContext: 'Safe feedback levels for most applications'
		}
	},
	filter: {
		frequency: {
			min: 500, max: 10000, step: 100, defaultValue: 4000,
			musicalContext: 'Wide frequency range for various instruments'
		},
		Q: {
			min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8,
			musicalContext: 'Moderate Q factor for musical filtering'
		}
	}
};

// Utility function to get smart ranges for any instrument
export function getSmartRanges(instrumentName: string): SmartRanges {
	return INSTRUMENT_SMART_RANGES[instrumentName] || DEFAULT_SMART_RANGES;
}

// Utility function to get parameter range for a specific effect and parameter
export function getParameterRange(instrumentName: string, effectName: keyof SmartRanges, paramName: string): ParameterRange | null {
	const ranges = getSmartRanges(instrumentName);
	const effectRanges = ranges[effectName];
	
	if (effectRanges && paramName in effectRanges) {
		return effectRanges[paramName as keyof typeof effectRanges];
	}
	
	return null;
}

// Phase 3.5: Enhanced Effect Routing utility functions
export function createDefaultEffectChain(instrumentName: string): EffectChain {
	const instrumentSettings = DEFAULT_SETTINGS.instruments[instrumentName as keyof typeof DEFAULT_SETTINGS.instruments];
	
	const nodes: EffectNode[] = [
		{
			id: `${instrumentName}-reverb`,
			type: 'reverb',
			enabled: instrumentSettings.effects.reverb.enabled,
			order: 0,
			settings: instrumentSettings.effects.reverb,
			bypass: false
		},
		{
			id: `${instrumentName}-chorus`,
			type: 'chorus',
			enabled: instrumentSettings.effects.chorus.enabled,
			order: 1,
			settings: instrumentSettings.effects.chorus,
			bypass: false
		},
		{
			id: `${instrumentName}-filter`,
			type: 'filter',
			enabled: instrumentSettings.effects.filter.enabled,
			order: 2,
			settings: instrumentSettings.effects.filter,
			bypass: false
		}
	];
	
	return {
		instrumentName,
		routing: 'serial',
		nodes,
		sendLevels: new Map()
	};
}

export function createDefaultSendBus(id: string, name: string, type: 'reverb' | 'delay' | 'custom'): SendBus {
	return {
		id,
		name,
		type,
		effects: [],
		returnLevel: 0.5,
		prePost: 'post'
	};
}

export function createDefaultReturnBus(id: string, name: string): ReturnBus {
	return {
		id,
		name,
		inputLevel: 1.0,
		effects: [],
		panPosition: 0
	};
}

export function createDefaultInstrumentGroup(id: string, name: string, instruments: string[]): InstrumentGroup {
	return {
		id,
		name,
		instruments,
		groupEffects: [],
		groupVolume: 1.0,
		groupMute: false,
		groupSolo: false
	};
}

export function migrateToEnhancedRouting(settings: SonigraphSettings): SonigraphSettings {
	if (settings.enhancedRouting?.enabled) {
		return settings; // Already migrated
	}

	// Create effect chains from existing per-instrument settings
	const effectChains = new Map<string, EffectChain>();
	const instrumentNames = Object.keys(settings.instruments) as (keyof typeof settings.instruments)[];
	
	for (const instrumentName of instrumentNames) {
		effectChains.set(instrumentName, createDefaultEffectChain(instrumentName));
	}

	// Create default routing matrix
	const routingMatrix: RoutingMatrix = {
		sends: new Map(),
		returns: new Map(),
		groups: new Map(),
		masterEffects: DEFAULT_SETTINGS.enhancedRouting!.routingMatrix.masterEffects,
		automations: []
	};

	return {
		...settings,
		enhancedRouting: {
			enabled: false, // User must explicitly enable
			effectChains,
			routingMatrix,
			version: '3.5.0'
		}
	};
} 