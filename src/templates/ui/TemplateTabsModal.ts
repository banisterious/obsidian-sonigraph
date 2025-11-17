/**
 * TemplateTabsModal
 * 
 * A reusable template for creating tabbed modals following the HubModal pattern.
 * This template provides the basic structure with dummy content that can be
 * easily customized for specific use cases.
 * 
 * Usage:
 * 1. Copy this file and rename it (e.g., YourCustomModal.ts)
 * 2. Update the class name and constructor
 * 3. Replace dummy tab names and content with your actual functionality
 * 4. Update CSS class prefixes if needed
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import { getLogger } from '../../logging';

// Example interfaces - replace with your actual types
interface TemplateSettings {
    enableFeatureA: boolean;
    selectedOption: string;
    customText: string;
    numericValue: number;
}

interface TemplateItem {
    id: string;
    name: string;
    description: string;
    category: string;
}

export class TemplateTabsModal extends Modal {
    private tabsContainer: HTMLElement;
    private contentContainer: HTMLElement;
    private selectedTab: string | null = null;
    private logger = getLogger('TemplateTabsModal');
    
    // Example state properties - replace with your actual state
    private settings: TemplateSettings = {
        enableFeatureA: true,
        selectedOption: 'option1',
        customText: 'Sample text',
        numericValue: 42
    };
    
    private isProcessing: boolean = false;
    private items: TemplateItem[] = [
        { id: '1', name: 'Sample Item 1', description: 'This is a sample item', category: 'Category A' },
        { id: '2', name: 'Sample Item 2', description: 'Another sample item', category: 'Category B' },
        { id: '3', name: 'Sample Item 3', description: 'Yet another sample', category: 'Category A' }
    ];
    
    constructor(app: App) {
        super(app);
    }
    
    onOpen() {
        try {
            const { contentEl } = this;
            void contentEl.empty();
            void contentEl.addClass('template-tabs-modal');
            
            // Create header
            contentEl.createEl('h1', { 
                text: 'Template tabs modal', 
                cls: 'template-tabs-header' 
            });
            
            // Create description
            contentEl.createEl('p', {
                text: 'This is a template modal with tabbed interface. replace this with your modal description.',
                cls: 'template-tabs-description'
            });
            
            // Create two-column layout
            const modalContainer = contentEl.createDiv({ 
                cls: 'template-tabs-container' 
            });
            
            this.tabsContainer = modalContainer.createDiv({ 
                cls: 'template-tabs-sidebar' 
            });
            
            this.contentContainer = modalContainer.createDiv({ 
                cls: 'template-tabs-content' 
            });
            
            // Build tabs
            void this.createTabs();
            
            // Select Dashboard tab by default
            void this.selectTab('dashboard');
            
        } catch (error) {
            this.logger.error('Error opening template tabs modal', (error as Error).message);
        }
    }
    
    onClose() {
        const { contentEl } = this;
        void contentEl.empty();
    }
    
    // Create all tabs
    private createTabs() {
        // Main functional tabs
        void this.createDashboardTab();
        void this.createDataTab();
        void this.createSettingsTab();
        void this.createToolsTab();
        
        // Category groups (example of grouped tabs)
        this.createTabGroup('Category A Items', this.getItemsByCategory('Category A'));
        this.createTabGroup('Category B Items', this.getItemsByCategory('Category B'));
        
        // Additional tabs
        void this.createHelpTab();
    }
    
    // Create Dashboard tab
    private createDashboardTab() {
        const dashboardTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item template-tab-nav-item',
            attr: { 'data-tab-id': 'dashboard' }
        });
        
        dashboardTab.createDiv({ 
            text: 'Dashboard', 
            cls: 'template-tab-label' 
        });
        
        dashboardTab.addEventListener('click', () => {
            void this.selectTab('dashboard');
        });
    }
    
    // Create Data tab
    private createDataTab() {
        const dataTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item template-tab-nav-item',
            attr: { 'data-tab-id': 'data' }
        });
        
        dataTab.createDiv({ 
            text: 'Data management', 
            cls: 'template-tab-label' 
        });
        
        dataTab.addEventListener('click', () => {
            void this.selectTab('data');
        });
    }
    
    // Create Settings tab
    private createSettingsTab() {
        const settingsTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item template-tab-nav-item',
            attr: { 'data-tab-id': 'settings' }
        });
        
        settingsTab.createDiv({ 
            text: 'Settings', 
            cls: 'template-tab-label' 
        });
        
        settingsTab.addEventListener('click', () => {
            void this.selectTab('settings');
        });
    }
    
    // Create Tools tab
    private createToolsTab() {
        const toolsTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item template-tab-nav-item',
            attr: { 'data-tab-id': 'tools' }
        });
        
        toolsTab.createDiv({ 
            text: 'Tools & utilities', 
            cls: 'template-tab-label' 
        });
        
        toolsTab.addEventListener('click', () => {
            void this.selectTab('tools');
        });
    }
    
    // Create Help tab
    private createHelpTab() {
        const helpTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item template-tab-nav-item',
            attr: { 'data-tab-id': 'help' }
        });
        
        helpTab.createDiv({ 
            text: 'Help & documentation', 
            cls: 'template-tab-label' 
        });
        
        helpTab.addEventListener('click', () => {
            void this.selectTab('help');
        });
    }
    
    // Helper to create a group of tabs
    private createTabGroup(groupName: string, items: TemplateItem[]) {
        // Create group header
        this.tabsContainer.createDiv({
            text: groupName,
            cls: 'vertical-tab-header-group-title template-tab-group-title'
        });
        
        // Create tabs for items in this group
        items.forEach(item => {
            this.createItemTab(item);
        });
    }
    
    // Create a tab for an individual item
    private createItemTab(item: TemplateItem) {
        const itemTab = this.tabsContainer.createDiv({
            cls: 'vertical-tab-nav-item template-tab-nav-item',
            attr: { 'data-tab-id': `item-${item.id}` }
        });
        
        itemTab.createDiv({ 
            text: item.name, 
            cls: 'template-tab-label' 
        });
        
        itemTab.addEventListener('click', () => {
            this.selectTab(`item-${item.id}`);
        });
    }
    
    // Main tab selection logic
    public selectTab(tabId: string) {
        // Clear previous selection
        this.tabsContainer.querySelectorAll('.vertical-tab-nav-item').forEach(el => {
            void el.removeClass('is-active');
        });
        
        // Mark selected tab
        const selectedEl = this.tabsContainer.querySelector(`[data-tab-id="${tabId}"]`);
        if (selectedEl) {
            void selectedEl.addClass('is-active');
        }
        
        // Load appropriate content
        if (tabId === 'dashboard') {
            void this.loadDashboardContent();
        } else if (tabId === 'data') {
            void this.loadDataContent();
        } else if (tabId === 'settings') {
            void this.loadSettingsContent();
        } else if (tabId === 'tools') {
            void this.loadToolsContent();
        } else if (tabId === 'help') {
            void this.loadHelpContent();
        } else if (tabId.startsWith('item-')) {
            const itemId = tabId.replace('item-', '');
            const item = this.items.find(i => i.id === itemId);
            if (item) {
                void this.loadItemContent(item);
            }
        }
        
        this.selectedTab = tabId;
    }
    
    // Dashboard content
    private loadDashboardContent() {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: 'Dashboard overview', 
            cls: 'template-content-header' 
        });
        
        this.contentContainer.createEl('p', {
            text: 'Welcome to the template dashboard! this is where you would show overview information, statistics, or quick actions.',
            cls: 'template-content-description'
        });
        
        // Sample dashboard widgets
        const statsContainer = this.contentContainer.createDiv({ cls: 'template-dashboard-stats' });
        
        this.createStatWidget(statsContainer, 'Total Items', this.items.length.toString());
        void this.createStatWidget(statsContainer, 'Processing Status', this.isProcessing ? 'Active' : 'Idle');
        void this.createStatWidget(statsContainer, 'Current Setting', this.settings.selectedOption);
        
        // Quick actions
        const actionsContainer = this.contentContainer.createDiv({ cls: 'template-dashboard-actions' });
        actionsContainer.createEl('h3', { text: 'Quick actions' });
        
        this.createActionButton(actionsContainer, 'Process Data', 'gear', () => {
            void this.handleProcessData();
        });
        
        this.createActionButton(actionsContainer, 'Export Items', 'download', () => {
            void this.handleExportItems();
        });
        
        this.createActionButton(actionsContainer, 'Reset Settings', 'refresh-cw', () => {
            void this.handleResetSettings();
        });
    }
    
    // Data content
    private loadDataContent() {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: 'Data management', 
            cls: 'template-content-header' 
        });
        
        this.contentContainer.createEl('p', {
            text: 'Manage your data items here. this is an example of a data management interface.',
            cls: 'template-content-description'
        });
        
        // Data table
        const tableContainer = this.contentContainer.createDiv({ cls: 'template-data-table' });
        const table = tableContainer.createEl('table');
        
        // Header
        const header = table.createEl('thead').createEl('tr');
        header.createEl('th', { text: 'ID' });
        header.createEl('th', { text: 'Name' });
        header.createEl('th', { text: 'Description' });
        header.createEl('th', { text: 'Category' });
        header.createEl('th', { text: 'Actions' });
        
        // Data rows
        const tbody = table.createEl('tbody');
        this.items.forEach(item => {
            const row = tbody.createEl('tr');
            row.createEl('td', { text: item.id });
            row.createEl('td', { text: item.name });
            row.createEl('td', { text: item.description });
            row.createEl('td', { text: item.category });
            
            const actionsCell = row.createEl('td');
            const editBtn = actionsCell.createEl('button', { text: 'Edit', cls: 'mod-cta' });
            editBtn.onclick = () => this.handleEditItem(item);
            
            const deleteBtn = actionsCell.createEl('button', { text: 'Delete', cls: 'mod-warning' });
            deleteBtn.onclick = () => this.handleDeleteItem(item);
        });
        
        // Add new item button
        const addButton = this.contentContainer.createEl('button', { 
            text: 'Add new item', 
            cls: 'mod-cta template-add-button' 
        });
        addButton.onclick = () => this.handleAddItem();
    }
    
    // Settings content
    private loadSettingsContent() {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: 'Settings', 
            cls: 'template-content-header' 
        });
        
        this.contentContainer.createEl('p', {
            text: 'Configure your preferences and options here.',
            cls: 'template-content-description'
        });
        
        // Feature toggle
        new Setting(this.contentContainer)
            .setName('Enable feature a')
            .setDesc('Toggle this feature on or off')
            .addToggle(toggle => toggle
                .setValue(this.settings.enableFeatureA)
                .onChange(value => {
                    this.settings.enableFeatureA = value;
                    void this.saveSettings();
                }));
        
        // Dropdown selection
        new Setting(this.contentContainer)
            .setName('Selected option')
            .setDesc('Choose from available options')
            .addDropdown(dropdown => dropdown
                .addOption('option1', 'Option 1')
                .addOption('option2', 'Option 2')
                .addOption('option3', 'Option 3')
                .setValue(this.settings.selectedOption)
                .onChange(value => {
                    this.settings.selectedOption = value;
                    void this.saveSettings();
                }));
        
        // Text input
        new Setting(this.contentContainer)
            .setName('Custom text')
            .setDesc('Enter custom text value')
            .addText(text => text
                .setPlaceholder('Enter text...')
                .setValue(this.settings.customText)
                .onChange(value => {
                    this.settings.customText = value;
                    void this.saveSettings();
                }));
        
        // Numeric input
        new Setting(this.contentContainer)
            .setName('Numeric value')
            .setDesc('Enter a numeric value')
            .addSlider(slider => slider
                .setLimits(0, 100, 1)
                .setValue(this.settings.numericValue)
                .setDynamicTooltip()
                .onChange(value => {
                    this.settings.numericValue = value;
                    void this.saveSettings();
                }));
    }
    
    // Tools content
    private loadToolsContent() {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: 'Tools & utilities', 
            cls: 'template-content-header' 
        });
        
        this.contentContainer.createEl('p', {
            text: 'Access various tools and utilities for advanced operations.',
            cls: 'template-content-description'
        });
        
        // Tool categories
        const toolsContainer = this.contentContainer.createDiv({ cls: 'template-tools-container' });
        
        // Analysis tools
        const analysisSection = toolsContainer.createDiv({ cls: 'template-tool-section' });
        analysisSection.createEl('h3', { text: 'Analysis tools' });
        
        this.createToolButton(analysisSection, 'Generate Report', 'file-text', () => {
            new Notice('Generating report...');
        });
        
        this.createToolButton(analysisSection, 'Analyze Data', 'bar-chart', () => {
            new Notice('Starting data analysis...');
        });
        
        // Maintenance tools
        const maintenanceSection = toolsContainer.createDiv({ cls: 'template-tool-section' });
        maintenanceSection.createEl('h3', { text: 'Maintenance tools' });
        
        this.createToolButton(maintenanceSection, 'Clean Cache', 'trash-2', () => {
            new Notice('Cache cleaned!');
        });
        
        this.createToolButton(maintenanceSection, 'Optimize Database', 'database', () => {
            new Notice('Database optimized!');
        });
        
        // Import/Export tools
        const importExportSection = toolsContainer.createDiv({ cls: 'template-tool-section' });
        importExportSection.createEl('h3', { text: 'Import/export' });
        
        this.createToolButton(importExportSection, 'Import Data', 'upload', () => {
            new Notice('Import functionality would go here');
        });
        
        this.createToolButton(importExportSection, 'Export Data', 'download', () => {
            new Notice('Export functionality would go here');
        });
    }
    
    // Help content
    private loadHelpContent() {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: 'Help & documentation', 
            cls: 'template-content-header' 
        });
        
        const helpContent = `
## Getting Started

This template provides a foundation for creating tabbed modals in Obsidian plugins. 

### Key Features

- **Tabbed Interface**: Clean vertical tab navigation
- **Responsive Layout**: Two-column layout that adapts to content
- **Reusable Components**: Standardized buttons, settings, and content areas
- **Extensible**: Easy to add new tabs and functionality

### Customization Guide

1. **Rename the Class**: Change \`TemplateTabsModal\` to your desired name
2. **Update Tab Names**: Modify tab creation methods with your actual tabs
3. **Replace Content**: Update content loading methods with your functionality
4. **Customize Styling**: Update CSS classes and add custom styles
5. **Add State Management**: Include your actual data models and state

### CSS Classes

The template uses consistent CSS class naming:
- \`.template-tabs-modal\` - Main modal container
- \`.template-tabs-sidebar\` - Left sidebar for tabs
- \`.template-tabs-content\` - Right content area
- \`.template-tab-nav-item\` - Individual tab items
- \`.template-content-header\` - Content area headers

### Best Practices

- Keep tab switching logic in the \`selectTab\` method
- Use consistent naming conventions for tab IDs
- Implement proper cleanup in \`onClose\`
- Add loading states for async operations
- Provide clear user feedback for actions
        `;
        
        const helpDiv = this.contentContainer.createDiv({ cls: 'template-help-content' });
        
        // Simple markdown-like rendering for the help content
        const lines = helpContent.trim().split('\n');
        let currentList: HTMLElement | null = null;
        
        lines.forEach(line => {
            if (line.startsWith('## ')) {
                helpDiv.createEl('h3', { text: line.substring(3) });
                currentList = null;
            } else if (line.startsWith('### ')) {
                helpDiv.createEl('h4', { text: line.substring(4) });
                currentList = null;
            } else if (line.startsWith('- ')) {
                if (!currentList) {
                    currentList = helpDiv.createEl('ul');
                }
                currentList.createEl('li', { text: line.substring(2) });
            } else if (line.trim() === '') {
                currentList = null;
            } else if (line.startsWith('`') && line.endsWith('`')) {
                helpDiv.createEl('code', { text: line.slice(1, -1) });
            } else if (line.trim()) {
                helpDiv.createEl('p', { text: line });
                currentList = null;
            }
        });
    }
    
    // Item content
    private loadItemContent(item: TemplateItem) {
        this.contentContainer.empty();
        
        this.contentContainer.createEl('h2', { 
            text: item.name, 
            cls: 'template-content-header' 
        });
        
        this.contentContainer.createEl('p', {
            text: item.description,
            cls: 'template-content-description'
        });
        
        // Item details
        const detailsContainer = this.contentContainer.createDiv({ cls: 'template-item-details' });
        
        new Setting(detailsContainer)
            .setName('Item ID')
            .setDesc('Unique identifier for this item')
            .addText(text => text
                .setValue(item.id)
                .setDisabled(true));
        
        new Setting(detailsContainer)
            .setName('Category')
            .setDesc('Item category classification')
            .addText(text => text
                .setValue(item.category)
                .setDisabled(true));
        
        // Action buttons
        const actionsContainer = this.contentContainer.createDiv({ cls: 'template-item-actions' });
        
        const editButton = actionsContainer.createEl('button', { 
            text: 'Edit item', 
            cls: 'mod-cta' 
        });
        editButton.onclick = () => this.handleEditItem(item);
        
        const duplicateButton = actionsContainer.createEl('button', { 
            text: 'Duplicate item' 
        });
        duplicateButton.onclick = () => this.handleDuplicateItem(item);
        
        const deleteButton = actionsContainer.createEl('button', { 
            text: 'Delete item', 
            cls: 'mod-warning' 
        });
        deleteButton.onclick = () => this.handleDeleteItem(item);
    }
    
    // Helper methods for creating UI components
    private createStatWidget(container: HTMLElement, label: string, value: string) {
        const widget = container.createDiv({ cls: 'template-stat-widget' });
        widget.createDiv({ text: label, cls: 'template-stat-label' });
        widget.createDiv({ text: value, cls: 'template-stat-value' });
    }
    
    private createActionButton(container: HTMLElement, label: string, icon: string, callback: () => void) {
        const button = container.createEl('button', { 
            text: label, 
            cls: 'template-action-button mod-cta' 
        });
        button.onclick = callback;
    }
    
    private createToolButton(container: HTMLElement, label: string, icon: string, callback: () => void) {
        const button = container.createEl('button', { 
            text: label, 
            cls: 'template-tool-button' 
        });
        button.onclick = callback;
    }
    
    // Data helper methods
    private getItemsByCategory(category: string): TemplateItem[] {
        return this.items.filter(item => item.category === category);
    }
    
    // Event handlers (replace with your actual functionality)
    private handleProcessData() {
        this.isProcessing = true;
        new Notice('Processing data...');
        
        // Simulate processing
        setTimeout(() => {
            this.isProcessing = false;
            new Notice('Data processing complete!');
            // Refresh dashboard if currently selected
            if (this.selectedTab === 'dashboard') {
                void this.loadDashboardContent();
            }
        }, 2000);
    }
    
    private handleExportItems() {
        const data = JSON.stringify(this.items, null, 2);
        void navigator.clipboard.writeText(data);
        new Notice('Items exported to clipboard!');
    }
    
    private handleResetSettings() {
        this.settings = {
            enableFeatureA: true,
            selectedOption: 'option1',
            customText: 'Sample text',
            numericValue: 42
        };
        void this.saveSettings();
        new Notice('Settings reset to defaults!');
        
        // Refresh settings tab if currently selected
        if (this.selectedTab === 'settings') {
            void this.loadSettingsContent();
        }
    }
    
    private handleAddItem() {
        const newItem: TemplateItem = {
            id: (this.items.length + 1).toString(),
            name: `New Item ${this.items.length + 1}`,
            description: 'A newly created item',
            category: 'Category A'
        };
        
        this.items.push(newItem);
        new Notice('New item added!');
        
        // Refresh data tab if currently selected
        if (this.selectedTab === 'data') {
            void this.loadDataContent();
        }
        
        // Recreate tabs to include new item
        void this.createTabs();
    }
    
    private handleEditItem(item: TemplateItem) {
        new Notice(`Edit functionality for ${item.name} would go here`);
    }
    
    private handleDuplicateItem(item: TemplateItem) {
        const duplicatedItem: TemplateItem = {
            ...item,
            id: (this.items.length + 1).toString(),
            name: `${item.name} (Copy)`
        };
        
        this.items.push(duplicatedItem);
        new Notice(`${item.name} duplicated!`);
        
        // Refresh current view
        if (this.selectedTab === 'data') {
            void this.loadDataContent();
        }
        
        // Recreate tabs to include duplicated item
        void this.createTabs();
    }
    
    private handleDeleteItem(item: TemplateItem) {
        const index = this.items.findIndex(i => i.id === item.id);
        if (index >= 0) {
            this.items.splice(index, 1);
            new Notice(`${item.name} deleted!`);
            
            // If we're currently viewing the deleted item, switch to dashboard
            if (this.selectedTab === `item-${item.id}`) {
                void this.selectTab('dashboard');
            }
            
            // Refresh data tab if currently selected
            if (this.selectedTab === 'data') {
                void this.loadDataContent();
            }
            
            // Recreate tabs to remove deleted item
            void this.createTabs();
        }
    }
    
    private saveSettings() {
        // Implement your settings persistence logic here
        this.logger.debug('Settings saved', JSON.stringify(this.settings));
    }
} 