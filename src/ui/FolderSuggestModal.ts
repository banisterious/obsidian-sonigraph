import { App, FuzzySuggestModal, TFolder } from 'obsidian';
import { getLogger } from '../logging';

const logger = getLogger('folder-suggest');

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
	private onChooseFolder: (folder: TFolder) => void;

	constructor(app: App, onChooseFolder: (folder: TFolder) => void) {
		super(app);
		this.onChooseFolder = onChooseFolder;
		this.setPlaceholder('Type to search folders...');
		this.setInstructions([
			{ command: '↑↓', purpose: 'to navigate' },
			{ command: '↵', purpose: 'to select folder' },
			{ command: 'esc', purpose: 'to dismiss' },
		]);
	}

	getItems(): TFolder[] {
		const folders: TFolder[] = [];
		
		// Get all folders from the vault
		this.app.vault.getAllLoadedFiles().forEach(file => {
			if (file instanceof TFolder) {
				folders.push(file);
			}
		});

		// Sort folders alphabetically by path
		return folders.sort((a, b) => a.path.localeCompare(b.path));
	}

	getItemText(folder: TFolder): string {
		return folder.path;
	}

	onChooseItem(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
		logger.debug('ui', `Folder selected: ${folder.path}`);
		this.onChooseFolder(folder);
	}
} 