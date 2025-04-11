import { App, normalizePath, parseYaml, stringifyYaml, Notice } from 'obsidian';
import * as moment from 'moment';

export interface NoteCreatorSettings {
    rootFolder: string;
    subFolder: string;
    nameFormat: string;
    templatePath?: string;
}

export interface NoteMetadata {
    [key: string]: any;
}

/**
 * Process a template file with Obsidian template variables
 */
export async function processTemplate(app: App, date: Date, templateContent: string): Promise<string> {
    // Use current moment for template variables
    const now = moment.default();
    
    // Handle formatted date variables like {{date:YYYY-MM-DD}}
    const dateContent = templateContent.replace(/{{date:([^}]+)}}/g, (match, format) => {
        return now.format(format);
    });

    // Handle formatted time variables like {{time:HH:mm}}
    const timeContent = dateContent.replace(/{{time:([^}]+)}}/g, (match, format) => {
        return now.format(format);
    });

    // Get the filename without extension for the title
    const momentDate = moment.default(date);
    const fileName = momentDate.format('YYYY-MM-DD_ddd');

    return timeContent
        .replace(/{{title}}/g, fileName)
        // Use current time for unformatted date/time variables
        .replace(/{{date}}/g, now.format('MMMM D, YYYY'))
        .replace(/{{time}}/g, now.format('h:mm A'));
}

/**
 * Get timezone offset in ISO format (e.g., '+05:00' or '-05:00')
 */
function getTimezoneOffset(date: Date): string {
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    return `${sign}${hours}:${minutes}`;
}

/**
 * Create or update a note with provided metadata
 */
export async function createOrUpdateNote(
    app: App,
    date: Date,
    settings: NoteCreatorSettings,
    metadata: NoteMetadata,
    updateExisting: boolean = true,
    defaultContent?: string
): Promise<void> {
    const { notePath, noteName } = getNotePath(date, settings);

    try {
        const fileExists = await app.vault.adapter.exists(notePath);
        if (fileExists && updateExisting) {
            await updateExistingNote(app, notePath, metadata);
        } else if (!fileExists) {
            await createNewNote(app, date, notePath, settings, metadata, defaultContent);
        }
    } catch (error) {
        console.error("Error creating or updating note:", error);
        throw error;
    }
}

/**
 * Get the full path for a note based on date and settings
 */
function getNotePath(date: Date, settings: NoteCreatorSettings): { notePath: string, noteName: string } {
    const placeholders = createDatePlaceholders(date);
    const noteName = replacePlaceholders(settings.nameFormat, placeholders) + (!settings.nameFormat.endsWith('.md') ? '.md' : '');
    const subFolder = replacePlaceholders(settings.subFolder, placeholders);
    const notePath = normalizePath(`${settings.rootFolder}/${subFolder}/${noteName}`);
    return { notePath, noteName };
}

/**
 * Create date-based placeholders for file naming
 */
function createDatePlaceholders(date: Date) {
    return {
        'YYYY': date.getFullYear(),
        'YY': String(date.getFullYear()).slice(-2),
        'MMMM': date.toLocaleDateString('en-US', { month: 'long' }),
        'MMM': date.toLocaleDateString('en-US', { month: 'short' }),
        'MM': String(date.getMonth() + 1).padStart(2, '0'),
        'M': String(date.getMonth() + 1),
        'DDDD': date.toLocaleDateString('en-US', { weekday: 'long' }),
        'DDD': date.toLocaleDateString('en-US', { weekday: 'short' }),
        'DD': String(date.getDate()).padStart(2, '0'),
        'D': String(date.getDate())
    };
}

/**
 * Replace date placeholders in a string
 */
function replacePlaceholders(str: string, placeholders: Record<string, string | number>): string {
    return str.replace(/YYYY|YY|MMMM|MMM|MM|M|DDDD|DDD|DD|D/g, 
        (match: string) => String(placeholders[match] || match)
    );
}

/**
 * Update an existing note with new metadata
 */
async function updateExistingNote(app: App, notePath: string, metadata: NoteMetadata): Promise<void> {
    const fileContent = await app.vault.adapter.read(notePath);
    const fileLines = fileContent.split('\n');
    const yamlStartIndex = fileLines.indexOf('---');
    const yamlEndIndex = fileLines.indexOf('---', yamlStartIndex + 1);

    if (yamlStartIndex !== -1 && yamlEndIndex !== -1) {
        const yamlContent = fileLines.slice(yamlStartIndex + 1, yamlEndIndex).join('\n');
        const existingYaml = parseYaml(yamlContent);
        const updatedYaml = { ...existingYaml, ...metadata };
        const updatedYamlContent = stringifyYaml(updatedYaml).trim();

        const updatedContent = [
            '---',
            updatedYamlContent,
            '---',
            ...fileLines.slice(yamlEndIndex + 1)
        ].join('\n');

        await app.vault.adapter.write(notePath, updatedContent);
        new Notice(`Updated existing note: ${notePath}`);
    }
}

/**
 * Create a new note with template or default content
 */
async function createNewNote(
    app: App,
    date: Date,
    notePath: string,
    settings: NoteCreatorSettings,
    metadata: NoteMetadata,
    defaultContent?: string
): Promise<void> {
    let content: string | undefined;

    if (settings.templatePath) {
        try {
            const templateExists = await app.vault.adapter.exists(settings.templatePath);
            if (templateExists) {
                const templateContent = await app.vault.adapter.read(settings.templatePath);
                content = await processTemplate(app, date, templateContent);
                
                // Add metadata to template
                if (content.includes('---')) {
                    content = updateTemplateYaml(content, metadata);
                } else {
                    content = addYamlToContent(content, metadata);
                }
            } else {
                new Notice(`Template file not found: ${settings.templatePath}`);
            }
        } catch (error) {
            console.error("Error reading template file:", error);
            new Notice('Error reading template file');
        }
    }

    if (!content) {
        content = defaultContent || createDefaultContent(date, metadata);
    }

    const dirPath = notePath.substring(0, notePath.lastIndexOf('/'));
    await app.vault.adapter.mkdir(normalizePath(dirPath));
    await app.vault.create(notePath, content);
    new Notice(`Created new note: ${notePath}`);
}

/**
 * Update YAML frontmatter in template content
 */
function updateTemplateYaml(content: string, metadata: NoteMetadata): string {
    const lines = content.split('\n');
    const firstYamlIndex = lines.indexOf('---');
    const secondYamlIndex = lines.indexOf('---', firstYamlIndex + 1);
    
    if (firstYamlIndex !== -1 && secondYamlIndex !== -1) {
        const yamlContent = lines.slice(firstYamlIndex + 1, secondYamlIndex).join('\n');
        const existingYaml = parseYaml(yamlContent);
        const updatedYaml = { ...existingYaml, ...metadata };
        const updatedYamlContent = stringifyYaml(updatedYaml).trim();
        
        return [
            '---',
            updatedYamlContent,
            '---',
            ...lines.slice(secondYamlIndex + 1)
        ].join('\n');
    }
    
    return content;
}

/**
 * Add YAML frontmatter to content that doesn't have it
 */
function addYamlToContent(content: string, metadata: NoteMetadata): string {
    const yaml = `---\n${stringifyYaml(metadata).trim()}\n---\n`;
    return yaml + content;
}

/**
 * Create default content for a new note
 */
function createDefaultContent(date: Date, metadata: NoteMetadata): string {
    const yaml = stringifyYaml(metadata).trim();
    const title = `# ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
    return `---\n${yaml}\n---\n\n${title}`;
}