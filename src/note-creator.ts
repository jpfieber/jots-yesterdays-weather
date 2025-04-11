import { App, normalizePath, Notice, TFile } from 'obsidian';
import * as moment from 'moment';
import { getTimezoneOffset } from './utils';

export interface NoteCreatorSettings {
    rootFolder: string;
    subFolder: string;
    nameFormat: string;
    templatePath?: string;
}

/**
 * Process a template file with Obsidian template variables
 */
async function processTemplate(app: App, date: Date, templateContent: string): Promise<string> {
    // Use current moment for today's date/time variables
    const now = moment.default();
    // Use provided date for date/time variables
    const momentDate = moment.default(date);

    // Handle formatted target date variables like {{date:YYYY-MM-DD}}
    let content = templateContent.replace(/{{date:([^}]+)}}/g, (match, format) => {
        if (format === 'Z') {
            return getTimezoneOffset(date);
        }
        return momentDate.format(format);
    });

    // Handle formatted target time variables like {{time:HH:mm}}
    content = content.replace(/{{time:([^}]+)}}/g, (match, format) => {
        if (format === 'Z') {
            return getTimezoneOffset(date);
        }
        return momentDate.format(format);
    });

    // Handle formatted current date variables like {{tdate:YYYY-MM-DD}}
    content = content.replace(/{{tdate:([^}]+)}}/g, (match, format) => {
        if (format === 'Z') {
            return getTimezoneOffset(new Date());
        }
        return now.format(format);
    });

    // Handle formatted current time variables like {{ttime:HH:mm}}
    content = content.replace(/{{ttime:([^}]+)}}/g, (match, format) => {
        if (format === 'Z') {
            return getTimezoneOffset(new Date());
        }
        return now.format(format);
    });

    // Get the filename without extension for the title
    const fileName = momentDate.format('YYYY-MM-DD_ddd');

    return content
        .replace(/{{title}}/g, fileName)
        // Use target date for date/time variables
        .replace(/{{date}}/g, momentDate.format('MMMM D, YYYY'))
        .replace(/{{time}}/g, momentDate.format('h:mm A'))
        // Add new variables for current date/time
        .replace(/{{tdate}}/g, now.format('MMMM D, YYYY'))
        .replace(/{{ttime}}/g, now.format('h:mm A'));
}

/**
 * Get the full path for a note based on date and settings
 */
export function getNotePath(date: Date, settings: NoteCreatorSettings): { notePath: string, noteName: string } {
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
 * Create a new note with template or default content
 */
export async function createNewNote(
    app: App,
    date: Date,
    notePath: string,
    settings: NoteCreatorSettings,
    defaultContent?: string
): Promise<TFile> {
    let content: string;

    if (settings.templatePath) {
        try {
            const templateFile = app.vault.getAbstractFileByPath(settings.templatePath);
            if (templateFile && templateFile instanceof TFile) {
                const templateContent = await app.vault.read(templateFile);
                content = await processTemplate(app, date, templateContent);
            } else {
                throw new Error(`Template file not found: ${settings.templatePath}`);
            }
        } catch (error) {
            console.error("Error reading template file:", error);
            new Notice('Error reading template file');
            throw error;
        }
    } else {
        content = defaultContent || createDefaultContent(date);
    }

    // Create the file's directory if it doesn't exist
    const dirPath = notePath.substring(0, notePath.lastIndexOf('/'));
    await app.vault.adapter.mkdir(normalizePath(dirPath));

    // Create the file
    const file = await app.vault.create(notePath, content);
    new Notice(`Created new note: ${notePath}`);
    console.log(content);

    return file;
}

/**
 * Create default content for a new note
 */
function createDefaultContent(date: Date): string {
    return `# ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
}