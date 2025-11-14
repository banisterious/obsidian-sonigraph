import { Modal, App } from 'obsidian';
import * as d3 from 'd3';
import { getLogger } from '../logging';

const logger = getLogger('graph-demo-modal');

interface DemoNode {
	id: string;
	name: string;
	type: 'note' | 'image';
	creationDate: Date;
	radius: number;
	textLength: number;
	linkCount: number;
	x?: number;
	y?: number;
	fx?: number | null;
	fy?: number | null;
}

interface DemoLink {
	source: string | DemoNode;
	target: string | DemoNode;
}

export class GraphDemoModal extends Modal {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private svg: any | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private simulation: any | null = null;
	private nodes: DemoNode[] = [];
	private links: DemoLink[] = [];
	private showLabels: boolean = false;
	private visibleNodes: Set<string> = new Set();
	private visibleLinks: Set<string> = new Set();

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Create modal header
		contentEl.createEl('h2', { text: 'D3-Force Animation Demo' });
		contentEl.createEl('p', { text: 'A simple demonstration of temporal graph animation' });

		// Create container for the graph
		const graphContainer = contentEl.createDiv('sonigraph-demo-container');

		// Create sample data
		this.createSampleData();

		// Initialize D3 visualization
		this.initializeVisualization(graphContainer);

		// Add controls
		this.addControls(contentEl);
	}

	private createSampleData() {
		// Create sample nodes representing notes and images over time
		const baseDate = new Date('2024-01-01');
		
		// Function to calculate radius based on text length and link count
		const calculateRadius = (textLength: number, linkCount: number) => {
			const baseSize = 8;
			const textFactor = Math.min(textLength / 100, 3); // Max 3x for text
			const linkFactor = Math.min(linkCount * 2, 6); // Max 6 for links
			return baseSize + textFactor + linkFactor;
		};
		
		this.nodes = [
			{
				id: 'note1',
				name: 'First Note',
				type: 'note',
				creationDate: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000),
				textLength: 150,
				linkCount: 1,
				radius: 0 // Will be calculated below
			},
			{
				id: 'note2',
				name: 'Second Note',
				type: 'note',
				creationDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
				textLength: 300,
				linkCount: 3,
				radius: 0
			},
			{
				id: 'image1',
				name: 'Screenshot',
				type: 'image',
				creationDate: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000),
				textLength: 50,
				linkCount: 1,
				radius: 0
			},
			{
				id: 'note3',
				name: 'Third Note',
				type: 'note',
				creationDate: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000),
				textLength: 500,
				linkCount: 2,
				radius: 0
			},
			{
				id: 'image2',
				name: 'Diagram',
				type: 'image',
				creationDate: new Date(baseDate.getTime() + 20 * 24 * 60 * 60 * 1000),
				textLength: 25,
				linkCount: 1,
				radius: 0
			}
		];

		// Calculate radii based on content and connections
		this.nodes.forEach(node => {
			node.radius = calculateRadius(node.textLength, node.linkCount);
		});

		// Create sample links
		this.links = [
			{ source: 'note1', target: 'note2' },
			{ source: 'note2', target: 'image1' },
			{ source: 'note2', target: 'note3' },
			{ source: 'note3', target: 'image2' }
		];
	}

	private initializeVisualization(container: HTMLElement) {
		const width = 800;
		const height = 500;

		// Create SVG
		this.svg = d3.select(container)
			.append('svg')
			.attr('class', 'sonigraph-temporal-svg')
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', `0 0 ${width} ${height}`);

		// Create force simulation
		 
		this.simulation = d3.forceSimulation(this.nodes)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.force('link', d3.forceLink(this.links).id((d: any) => d.id).distance(80))
			.force('charge', d3.forceManyBody().strength(-300))
			.force('center', d3.forceCenter(width / 2, height / 2))
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.force('collision', d3.forceCollide().radius((d: any) => d.radius + 5));

		// Create links
		const linkGroup = this.svg.append('g')
			.attr('class', 'sonigraph-temporal-links')
			.selectAll('line')
			.data(this.links)
			.enter()
			.append('line');

		// Create nodes
		const nodeGroup = this.svg.append('g')
			.attr('class', 'sonigraph-temporal-nodes')
			.selectAll('g')
			.data(this.nodes)
			.enter()
			.append('g')
			.attr('class', 'sonigraph-temporal-node');

		// Add circles for nodes
		nodeGroup.append('circle')
			.attr('r', (d: DemoNode) => d.radius)
			.attr('class', (d: DemoNode) => `${d.type}-node`);

		// Add labels (hidden by default, shown on hover)
		nodeGroup.append('text')
			.text((d: DemoNode) => d.name)
			.attr('font-size', '12px')
			.attr('font-family', 'var(--font-interface)')
			.attr('fill', 'var(--text-normal)')
			.attr('text-anchor', 'middle')
			.attr('dy', (d: DemoNode) => d.radius + 16)
			.style('pointer-events', 'none')
			.style('opacity', 0)
			.style('transition', 'opacity 0.2s');

		// Add hover effects
		 
		nodeGroup
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('mouseenter', function(event: any, d: DemoNode) {
				d3.select(this).select('text').style('opacity', 1);
				d3.select(this).select('circle').style('stroke-width', 3);
			})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('mouseleave', function(event: any, d: DemoNode) {
				if (!this.showLabels) {
					d3.select(this).select('text').style('opacity', 0);
				}
				d3.select(this).select('circle').style('stroke-width', 2);
			}.bind(this));

		// Add drag behavior
		 
		const drag = d3.drag<SVGGElement, DemoNode>()
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('start', (event: any, d: DemoNode) => {
				if (!event.active && this.simulation) this.simulation.alphaTarget(0.3).restart();
				d.fx = d.x;
				d.fy = d.y;
			})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('drag', (event: any, d: DemoNode) => {
				d.fx = event.x;
				d.fy = event.y;
			})
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.on('end', (event: any, d: DemoNode) => {
				if (!event.active && this.simulation) this.simulation.alphaTarget(0);
				d.fx = null;
				d.fy = null;
			});

		nodeGroup.call(drag);

		// Update positions on each tick
		this.simulation.on('tick', () => {
			 
			linkGroup
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('x1', (d: any) => (d.source).x)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('y1', (d: any) => (d.source).y)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('x2', (d: any) => (d.target).x)
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.attr('y2', (d: any) => (d.target).y);

			nodeGroup
				.attr('transform', (d: DemoNode) => `translate(${d.x},${d.y})`);
		});
	}

	private addControls(container: HTMLElement) {
		const controlsContainer = container.createDiv('sonigraph-demo-controls');

		// Restart animation button
		const restartBtn = controlsContainer.createEl('button', { text: 'Restart Animation' });
		restartBtn.classList.add('mod-cta');
		restartBtn.onclick = () => {
			if (this.simulation) {
				this.simulation.alpha(1).restart();
			}
		};

		// Temporal animation button
		const temporalBtn = controlsContainer.createEl('button', { text: 'Show Temporal Animation' });
		temporalBtn.onclick = () => this.startTemporalAnimation();

		// Toggle labels button
		const labelsBtn = controlsContainer.createEl('button', { text: 'Toggle Labels' });
		labelsBtn.onclick = () => this.toggleLabels();

		// Reset view button
		const resetBtn = controlsContainer.createEl('button', { text: 'Reset View' });
		resetBtn.onclick = () => this.resetView();

		// Info text
		const infoText = controlsContainer.createDiv('info-text');
		infoText.appendText('Blue = Notes, Orange = Images');
		infoText.createEl('br');
		infoText.appendText('Node size = text length + connections');
	}

	private startTemporalAnimation() {
		if (!this.svg || !this.simulation) return;

		// Reset visibility tracking
		this.visibleNodes.clear();
		this.visibleLinks.clear();

		// Hide all nodes and links initially
		this.svg.selectAll('.node').style('opacity', 0);
		this.svg.selectAll('.links line').style('opacity', 0);

		// Sort nodes by creation date
		const sortedNodes = [...this.nodes].sort((a, b) => 
			a.creationDate.getTime() - b.creationDate.getTime()
		);

		// Animate nodes appearing over time
		sortedNodes.forEach((node, index) => {
			setTimeout(() => {
				// Show the node
				this.visibleNodes.add(node.id);
				if (!this.svg) return;
				 
				this.svg.selectAll('.node')
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.filter((d: any) => d.id === node.id)
					.transition()
					.duration(500)
					.style('opacity', 1);

				// Show links that connect to visible nodes
				this.updateVisibleLinks();

				// Play a note for this node
				this.playNodeSound(node);

				// Restart simulation to settle new node
				if (this.simulation) {
					this.simulation.alpha(0.3).restart();
				}
			}, index * 1000); // 1 second delay between each node
		});
	}

	private updateVisibleLinks() {
		this.links.forEach(link => {
			const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
			const targetId = typeof link.target === 'string' ? link.target : link.target.id;
			
			if (this.visibleNodes.has(sourceId) && this.visibleNodes.has(targetId)) {
				const linkKey = `${sourceId}-${targetId}`;
				if (!this.visibleLinks.has(linkKey)) {
					this.visibleLinks.add(linkKey);

					// Show the link with animation
					if (!this.svg) return;
					 
					this.svg.selectAll('.links line')
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						.filter((d: any) => {
							const dSourceId = typeof d.source === 'string' ? d.source : d.source.id;
							const dTargetId = typeof d.target === 'string' ? d.target : d.target.id;
							return (dSourceId === sourceId && dTargetId === targetId) ||
								   (dSourceId === targetId && dTargetId === sourceId);
						})
						.transition()
						.duration(300)
						.style('opacity', 0.6);
				}
			}
		});
	}

	private playNodeSound(node: DemoNode) {
		// Create a simple audio context for demonstration
		try {
			interface WindowWithWebkit extends Window {
				webkitAudioContext: typeof AudioContext;
			}
			const AudioContextClass = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
			const audioContext = new AudioContextClass();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			
			// Different frequencies for different node types
			const baseFreq = node.type === 'note' ? 440 : 330; // A4 for notes, E4 for images
			const sizeMultiplier = 1 + (node.radius - 8) * 0.1; // Larger nodes = higher pitch
			oscillator.frequency.setValueAtTime(baseFreq * sizeMultiplier, audioContext.currentTime);
			
			// Short, pleasant tone
			oscillator.type = node.type === 'note' ? 'sine' : 'triangle';
			gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
			
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			
			oscillator.start(audioContext.currentTime);
			oscillator.stop(audioContext.currentTime + 0.3);
		} catch (error) {
			// Fallback if audio context fails
			logger.info('audio-fallback', `♪ ${node.name} (${node.type})`);
		}
	}

	private toggleLabels() {
		this.showLabels = !this.showLabels;
		if (this.svg) {
			this.svg.selectAll('.node text')
				.style('opacity', this.showLabels ? 1 : 0);
		}
	}

	private resetView() {
		// Show all nodes and links
		this.visibleNodes.clear();
		this.visibleLinks.clear();
		this.nodes.forEach(node => this.visibleNodes.add(node.id));
		
		if (this.svg) {
			this.svg.selectAll('.node').style('opacity', 1);
			this.svg.selectAll('.links line').style('opacity', 0.6);
			
			if (this.simulation) {
				this.simulation.alpha(1).restart();
			}
		}
	}

	onClose() {
		if (this.simulation) {
			this.simulation.stop();
		}
		const { contentEl } = this;
		contentEl.empty();
	}
} 