import { App, PluginSettingTab, Setting, TextComponent, ButtonComponent, ToggleComponent, SearchComponent, Notice } from 'obsidian';
import { debounce, isValidTimeFormat } from './utils';
import { fetchWeatherForDate } from './weather';
import { FolderSuggest } from "./foldersuggester";
import { FileSuggest } from "./filesuggester";
import type { YesterdaysWeatherPlugin } from './types';

export class YesterdaysWeatherSettingTab extends PluginSettingTab {
    plugin: YesterdaysWeatherPlugin;
    declare containerEl: HTMLElement;

    constructor(app: App, plugin: YesterdaysWeatherPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // API Key Setting
        new Setting(containerEl)
            .setName('API key')
            .setDesc(this.createApiKeyDescription())
            .addText((text: TextComponent) => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value: string) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        // Location Setting
        new Setting(containerEl)
            .setName('Location')
            .setDesc('The address, partial address, US ZIP code or latitude,longitude location for which to retrieve weather data.')
            .addText((text: TextComponent) => text
                .setPlaceholder('Enter location (e.g., city or ZIP code)')
                .setValue(this.plugin.settings.location)
                .onChange(async (value: string) => {
                    this.plugin.settings.location = value;
                    await this.plugin.saveSettings();
                }));

        // Journal Root Setting
        new Setting(containerEl)
            .setName('Daily note location')
            .setDesc('The root folder where the daily notes can be found.')
            .addSearch((cb: SearchComponent) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder("Enter daily note root folder")
                    .setValue(this.plugin.settings.journalRoot)
                    .onChange((new_folder: string) => {
                        new_folder = new_folder.trim();
                        new_folder = new_folder.replace(/\/$/, "");

                        this.plugin.settings.journalRoot = new_folder;
                        this.plugin.saveSettings();
                    });
            });

        // Journal Subdirectory Setting
        new Setting(containerEl)
            .setName('Daily note subdirectory')
            .setDesc('The subdirectory structure using 'YMD' notation (e.g., YYYY/YYYY-MM).')
            .addText((text: TextComponent) => text
                .setPlaceholder('Enter daily note subdirectory structure')
                .setValue(this.plugin.settings.journalSubdir)
                .onChange(async (value: string) => {
                    this.plugin.settings.journalSubdir = value;
                    await this.plugin.saveSettings();
                }));

        // Journal Name Format Setting
        new Setting(containerEl)
            .setName('Daily note name format')
            .setDesc('The format for daily note names (e.g., YYYY-MM-DD_DDD).')
            .addText((text: TextComponent) => text
                .setPlaceholder('Enter daily note name format')
                .setValue(this.plugin.settings.journalNameFormat)
                .onChange(async (value: string) => {
                    this.plugin.settings.journalNameFormat = value;
                    await this.plugin.saveSettings();
                }));

        // Template Path Setting
        new Setting(containerEl)
            .setName('Template file location')
            .setDesc('Choose the file to use as a daily note template.')
            .addSearch((cb: SearchComponent) => {
                new FileSuggest(this.app, cb.inputEl);
                cb.setPlaceholder("templates/daily-note.md")
                    .setValue(this.plugin.settings.templatePath)
                    .onChange((new_path: string) => {
                        this.plugin.settings.templatePath = new_path;
                        this.plugin.saveSettings();
                    });
            });

        // Run Time Setting
        new Setting(containerEl)
            .setName('Run time')
            .setDesc('Enter the time (HH:MM) to run the plugin daily in 24-hour format (e.g., 13:30). Leave blank to run manually only.')
            .addText((text: TextComponent) => text
                .setPlaceholder('Enter run time (HH:MM)')
                .setValue(this.plugin.settings.runTime)
                .onChange(debounce(async (value: string) => {
                    if (!isValidTimeFormat(value)) {
                        new Notice('Please enter a valid time in HH:MM format (e.g., 13:30)');
                        return;
                    }
                    this.plugin.settings.runTime = value;
                    await this.plugin.saveSettings();
                    this.plugin.scheduleDailyRun(); // Reschedule the daily run
                }, 1000)));

        // Specific Date Section
        containerEl.createEl('h1', { text: 'Manually add for date' });

        new Setting(containerEl)
            .setName('Specific Date')
            .setDesc('The date to fetch the weather.')
            .addText((text: TextComponent) => {
                text.inputEl.type = 'date'; // Use a date picker
                text.setValue(this.plugin.settings.specificDate)
                    .onChange(async (value: string) => {
                        this.plugin.settings.specificDate = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Fetch weather for specific date')
            .setDesc('Click the button to fetch weather for the specified date.')
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Fetch Weather')
                    .setCta()
                    .onClick(async () => {
                        // Create the date using local date components to avoid timezone issues
                        const [year, month, day] = this.plugin.settings.specificDate.split('-').map(Number);
                        const date = new Date(year, month - 1, day, 12, 0, 0, 0); // month is 0-based in JS

                        if (date.toString() === 'Invalid Date') {
                            console.error("Invalid date format.");
                            return;
                        }
                        await fetchWeatherForDate(this.plugin, date);
                    });
            });

        // General Properties Section
        containerEl.createEl('h1', { text: 'General properties' });

        for (const [key, value] of Object.entries(this.plugin.settings.generalProperties)) {
            new Setting(containerEl)
                .setName(key)
                .setDesc(`Include ${key} property in the note`)
                .addToggle((toggle: ToggleComponent) => toggle
                    .setValue(value.enabled)
                    .onChange(async (enabled: boolean) => {
                        this.plugin.settings.generalProperties[key].enabled = enabled;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings display
                    }));

            if (value.enabled) {
                new Setting(containerEl)
                    .setName(`${key} Name`)
                    .setDesc(`Set the property name for ${key}`)
                    .addText((text: TextComponent) => text
                        .setPlaceholder(`Enter property name for ${key}`)
                        .setValue(value.name)
                        .onChange(async (name: string) => {
                            this.plugin.settings.generalProperties[key].name = name;
                            await this.plugin.saveSettings();
                        }));

            }
        }

        // Weather Properties Section
        containerEl.createEl('h1', { text: 'Weather properties' });

        for (const [key, value] of Object.entries(this.plugin.settings.properties)) {
            new Setting(containerEl)
                .setName(key)
                .setDesc(`Include ${key} property in the note`)
                .addToggle((toggle: ToggleComponent) => toggle
                    .setValue(value.enabled)
                    .onChange(async (enabled: boolean) => {
                        this.plugin.settings.properties[key].enabled = enabled;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings display
                    }));

            if (value.enabled) {
                new Setting(containerEl)
                    .setName(`${key} Name`)
                    .setDesc(`Set the property name for ${key}`)
                    .addText((text: TextComponent) => text
                        .setPlaceholder(`Enter property name for ${key}`)
                        .setValue(value.name)
                        .onChange(async (name: string) => {
                            this.plugin.settings.properties[key].name = name;
                            await this.plugin.saveSettings();
                        }));
            }
        }

        containerEl.createEl('hr');
        this.addWebsiteSection(containerEl);
        this.addCoffeeSection(containerEl);
    }

    private createApiKeyDescription(): DocumentFragment {
        const fragment = document.createDocumentFragment();
        const text = fragment.createSpan();
        text.setText('Enter your ');

        const link = text.createEl('a', {
            text: 'Visual Crossing API Key',
            href: 'https://www.visualcrossing.com/weather-api'
        });
        link.setAttribute('target', '_blank');
        link.addClass('external-link');

        text.appendText('.');

        return fragment;
    }

    private addWebsiteSection(containerEl: HTMLElement) {
        const websiteDiv = containerEl.createEl('div', { cls: 'website-section' });

        const logoLink = websiteDiv.createEl('a', {
            href: 'https://jots.life',
        });
        logoLink.setAttribute('target', '_blank');

        logoLink.createEl('img', {
            attr: {
                src: 'https://jots.life/jots-logo-512/',
                alt: 'JOTS Logo',
            },
        });

        const descriptionDiv = websiteDiv.createEl('div', { cls: 'website-description' });

        const text = descriptionDiv.createSpan();
        text.setText('While this plugin works on its own, it is part of a system called ');

        const jotsLink = text.createEl('a', {
            text: 'JOTS',
            href: 'https://jots.life',
        });
        jotsLink.setAttribute('target', '_blank');

        text.appendText(' that helps capture, organize, and visualize your life\'s details.');
    }

    private addCoffeeSection(containerEl: HTMLElement) {
        const coffeeDiv = containerEl.createEl('div', { cls: 'buy-me-a-coffee' });

        const coffeeLink = coffeeDiv.createEl('a', {
            href: 'https://www.buymeacoffee.com/jpfieber',
        });
        coffeeLink.setAttribute('target', '_blank');

        coffeeLink.createEl('img', {
            attr: {
                src: 'https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png',
                alt: 'Buy Me A Coffee'
            },
            cls: 'bmc-button'
        });
    }
}