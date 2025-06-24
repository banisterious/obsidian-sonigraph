import { App, FuzzySuggestModal, TFile } from 'obsidian';
import { getLogger } from '../logging';

const logger = getLogger('file-suggest');

export class FileSuggestModal extends FuzzySuggestModal<TFile> {
	private onChooseFile: (file: TFile) => void;

	constructor(app: App, onChooseFile: (file: TFile) => void) {
		super(app);
		this.onChooseFile = onChooseFile;
		this.setPlaceholder('Type to search files...');
		this.setInstructions([
			{ command: '↑↓', purpose: 'to navigate' },
			{ command: '↵', purpose: 'to select file' },
			{ command: 'esc', purpose: 'to dismiss' },
		]);
	}

	getItems(): TFile[] {
		const files: TFile[] = [];
		
		// Get all files from the vault
		this.app.vault.getAllLoadedFiles().forEach(file => {
			if (file instanceof TFile) {
				files.push(file);
			}
		});

		// Sort files alphabetically by path
		return files.sort((a, b) => a.path.localeCompare(b.path));
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent): void {
		logger.debug('ui', `File selected: ${file.path}`);
		this.onChooseFile(file);
	}
} 