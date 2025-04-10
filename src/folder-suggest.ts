import { App, TFolder } from 'obsidian';

export class FolderSuggest {
    private app: App;
    private inputEl: HTMLInputElement;
    private dropdown: HTMLDivElement | null = null;
    private allFolders: string[] = [];
    private onSelect: (folder: string) => void;
    private dropdownContent: HTMLDivElement | null = null;
    private selectedIndex: number = -1;
    private suggestedFolders: string[] = [];

    constructor(app: App, inputEl: HTMLInputElement, onSelect: (folder: string) => void) {
        this.app = app;
        this.inputEl = inputEl;
        this.onSelect = onSelect;

        this.allFolders = this.getFolders();

        this.inputEl.addEventListener('focus', () => this.showSuggestions());
        this.inputEl.addEventListener('input', () => this.updateSuggestions());
        this.inputEl.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 200);
        });
        this.inputEl.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    private getFolders(): string[] {
        const folders: string[] = [];
        const rootFolder = this.app.vault.getRoot();
        this.collectFolders(rootFolder, folders);
        return folders;
    }

    private collectFolders(folder: TFolder, folders: string[]) {
        folders.push(folder.path);
        for (const child of folder.children) {
            if (child instanceof TFolder) {
                this.collectFolders(child, folders);
            }
        }
    }

    private showSuggestions() {
        if (this.dropdown) {
            this.dropdown.remove();
        }

        // Create container
        this.dropdown = document.createElement('div');
        this.dropdown.addClass('jots-folder-suggestion-container'); // Changed class name
        
        // Create dropdown
        this.dropdownContent = document.createElement('div');
        this.dropdownContent.addClass('jots-folder-suggestion-dropdown'); // Changed class name
        
        const rect = this.inputEl.getBoundingClientRect();
        this.dropdownContent.style.top = `${rect.bottom}px`;
        this.dropdownContent.style.left = `${rect.left}px`;
        this.dropdownContent.style.width = `${Math.max(rect.width, 300)}px`;
        
        this.dropdown.appendChild(this.dropdownContent);
        document.body.appendChild(this.dropdown);
        
        this.updateSuggestions();
    }

    private updateSuggestions() {
        if (!this.dropdownContent) return;
        
        this.dropdownContent.empty();
        const query = this.inputEl.value.toLowerCase();
        this.suggestedFolders = this.allFolders.filter(folder => 
            folder.toLowerCase().includes(query)
        );

        if (this.suggestedFolders.length === 0) {
            const item = this.dropdownContent.createDiv('jots-folder-suggestion-item'); // Changed class name
            item.setText('No folders found');
            return;
        }

        this.selectedIndex = 0;
        this.suggestedFolders.forEach((folder, index) => {
            const item = this.dropdownContent.createDiv('jots-folder-suggestion-item'); // Changed class name
            item.setText(folder);

            if (index === this.selectedIndex) {
                item.addClass('is-selected');
            }

            item.onmousedown = (event: MouseEvent) => {
                event.preventDefault();
                this.selectSuggestion(folder);
            };

            item.onmouseenter = () => {
                this.selectedIndex = index;
                this.updateHighlight();
            };
        });
    }
        
    private updateHighlight() {
        if (!this.dropdown) return;
        
        this.dropdown.findAll('.suggestion-item').forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.addClass('is-selected');
            } else {
                item.removeClass('is-selected');
            }
        });
    }

    private selectSuggestion(folder: string) {
        this.inputEl.value = folder;
        this.onSelect(folder);
        this.hideSuggestions();
    }

    private handleKeydown(e: KeyboardEvent) {
        if (!this.dropdown || this.suggestedFolders.length === 0) return;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = ((this.selectedIndex - 1) + this.suggestedFolders.length) % this.suggestedFolders.length;
                this.updateHighlight();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % this.suggestedFolders.length;
                this.updateHighlight();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectSuggestion(this.suggestedFolders[this.selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.hideSuggestions();
                break;
        }
    }

    private hideSuggestions() {
        if (this.dropdown) {
            this.dropdown.remove();
            this.dropdown = null;
        }
    }
}