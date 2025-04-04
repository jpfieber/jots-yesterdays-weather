import { PluginSettingTab, Setting } from 'obsidian';
import { debounce } from './utils.ts';
import { fetchWeatherForDate } from './weather.ts';

export class YesterdaysWeatherSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty(); // Clear the container before rendering

        // Plugin Settings Header
        containerEl.createEl('h1', { text: 'Plugin Settings' });

        // API Key Setting
        new Setting(containerEl)
            .setName('API Key')
            .setDesc('Enter your [Visual Crossing API Key](https://www.visualcrossing.com/weather-api).')
            .addText(text => text
                .setPlaceholder('Enter API key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        // Location Setting
        new Setting(containerEl)
            .setName('Location')
            .setDesc('Enter the location for which you want to fetch the weather.')
            .addText(text => text
                .setPlaceholder('Enter location (e.g., city or zip code)')
                .setValue(this.plugin.settings.location)
                .onChange(async (value) => {
                    this.plugin.settings.location = value;
                    await this.plugin.saveSettings();
                }));

        // Journal Root Setting
        new Setting(containerEl)
            .setName('Journal Root')
            .setDesc('Enter the root folder where the journal entries should be saved.')
            .addText(text => text
                .setPlaceholder('Enter journal root folder')
                .setValue(this.plugin.settings.journalRoot)
                .onChange(async (value) => {
                    this.plugin.settings.journalRoot = value;
                    await this.plugin.saveSettings();
                }));

        // Journal Subdirectory Setting
        new Setting(containerEl)
            .setName('Journal Subdirectory')
            .setDesc('Enter the subdirectory structure using YYYY and YYYY-MM as placeholders for year and month (e.g., YYYY/YYYY-MM).')
            .addText(text => text
                .setPlaceholder('Enter journal subdirectory structure')
                .setValue(this.plugin.settings.journalSubdir)
                .onChange(async (value) => {
                    this.plugin.settings.journalSubdir = value;
                    await this.plugin.saveSettings();
                }));

        // Journal Name Format Setting
        new Setting(containerEl)
            .setName('Journal Name Format')
            .setDesc('Enter the format for journal names (e.g., YYYY-MM-DD_DDD).')
            .addText(text => text
                .setPlaceholder('Enter journal name format')
                .setValue(this.plugin.settings.journalNameFormat)
                .onChange(async (value) => {
                    this.plugin.settings.journalNameFormat = value;
                    await this.plugin.saveSettings();
                }));

        // Run Time Setting
        new Setting(containerEl)
            .setName('Run Time')
            .setDesc('Enter the time (HH:MM) to run the plugin daily (leave blank if you only want to run it manually as a Command).')
            .addText(text => text
                .setPlaceholder('Enter run time (HH:MM)')
                .setValue(this.plugin.settings.runTime)
                .onChange(debounce(async (value) => {
                    this.plugin.settings.runTime = value;
                    await this.plugin.saveSettings();
                    this.plugin.scheduleDailyRun(); // Reschedule the daily run
                }, 1000)));

        // Specific Date Section
        containerEl.createEl('h1', { text: 'Manually Add for Date' });

        new Setting(containerEl)
            .setName('Specific Date')
            .setDesc('Enter a specific date to fetch the weather.')
            .addText(text => {
                text.inputEl.type = 'date'; // Use a date picker
                text.setValue(this.plugin.settings.specificDate)
                    .onChange(async (value) => {
                        this.plugin.settings.specificDate = value;
                        await this.plugin.saveSettings();
                    });
                });

        new Setting(containerEl)
            .setName('Fetch Weather for Specific Date')
            .setDesc('Click the button to fetch weather for the specified date.')
            .addButton(button => {
                button.setButtonText('Fetch Weather')
                    .setCta()
                    .onClick(async () => {
                        const date = new Date(this.plugin.settings.specificDate + 'T00:00:00');
                        if (isNaN(date)) {
                            console.error("Invalid date format.");
                            return;
                        }
                        await fetchWeatherForDate(this.plugin, date); // Pass the plugin instance
                    });
            });

        // General Properties Section
        containerEl.createEl('h1', { text: 'General Properties' });

        for (const [key, value] of Object.entries(this.plugin.settings.generalProperties)) {
            new Setting(containerEl)
                .setName(key)
                .setDesc(`Include ${key} property in the note`)
                .addToggle(toggle => toggle
                    .setValue(value.enabled)
                    .onChange(async (enabled) => {
                        this.plugin.settings.generalProperties[key].enabled = enabled;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings display
                    }));

            if (value.enabled) {
                new Setting(containerEl)
                    .setName(`${key} Name`)
                    .setDesc(`Set the property name for ${key}`)
                    .addText(text => text
                        .setPlaceholder(`Enter property name for ${key}`)
                        .setValue(value.name)
                        .onChange(async (name) => {
                            this.plugin.settings.generalProperties[key].name = name;
                            await this.plugin.saveSettings();
                        }));

                if (key === 'fileClass') {
                    new Setting(containerEl)
                        .setName(`${key} Value`)
                        .setDesc(`Set the value for ${key}`)
                        .addText(text => text
                            .setPlaceholder(`Enter value for ${key}`)
                            .setValue(value.value)
                            .onChange(async (val) => {
                                this.plugin.settings.generalProperties[key].value = val;
                                await this.plugin.saveSettings();
                            }));
                }
            }
        }

        // Weather Properties Section
        containerEl.createEl('h1', { text: 'Weather Properties' });

        for (const [key, value] of Object.entries(this.plugin.settings.properties)) {
            new Setting(containerEl)
                .setName(key)
                .setDesc(`Include ${key} property in the note`)
                .addToggle(toggle => toggle
                    .setValue(value.enabled)
                    .onChange(async (enabled) => {
                        this.plugin.settings.properties[key].enabled = enabled;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh the settings display
                    }));

            if (value.enabled) {
                new Setting(containerEl)
                    .setName(`${key} Name`)
                    .setDesc(`Set the property name for ${key}`)
                    .addText(text => text
                        .setPlaceholder(`Enter property name for ${key}`)
                        .setValue(value.name)
                        .onChange(async (name) => {
                            this.plugin.settings.properties[key].name = name;
                            await this.plugin.saveSettings();
                        }));
            }
        }

        containerEl.createEl('hr');
        this.addWebsiteSection(containerEl);
        this.addCoffeeSection(containerEl);
    }

    private addWebsiteSection(containerEl: HTMLElement) {
        const websiteDiv = containerEl.createEl('div', { cls: 'website-section' });
        websiteDiv.style.display = 'flex';
        websiteDiv.style.alignItems = 'center';
        websiteDiv.style.marginTop = '20px';
        websiteDiv.style.marginBottom = '20px';
        websiteDiv.style.padding = '0.5rem';
        websiteDiv.style.opacity = '0.75';

        const logoLink = websiteDiv.createEl('a', {
            href: 'https://jots.life',
            target: '_blank',
        });
        const logoImg = logoLink.createEl('img', {
            attr: {
                src: 'https://jots.life/jots-logo-512/',
                alt: 'JOTS Logo',
            },
        });
        logoImg.style.width = '64px';
        logoImg.style.height = '64px';
        logoImg.style.marginRight = '15px';

        websiteDiv.appendChild(logoLink);

        const descriptionDiv = websiteDiv.createEl('div', { cls: 'website-description' });
        descriptionDiv.innerHTML = `
            While Yesterday's Weather works on its own, it is part of a system called 
            <a href="https://jots.life" target="_blank">JOTS</a> that helps capture, organize, 
            and visualize your life's details.
        `;
        descriptionDiv.style.fontSize = '14px';
        descriptionDiv.style.lineHeight = '1.5';
        descriptionDiv.style.color = '#555';

        websiteDiv.appendChild(descriptionDiv);
        containerEl.appendChild(websiteDiv);
    }

    private addCoffeeSection(containerEl: HTMLElement) {
        const coffeeDiv = containerEl.createEl('div', { cls: 'buy-me-a-coffee' });
        coffeeDiv.style.marginTop = '20px';
        coffeeDiv.style.textAlign = 'center';

        coffeeDiv.innerHTML = `
            <a href="https://www.buymeacoffee.com/jpfieber" target="_blank">
                <img 
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                    alt="Buy Me A Coffee" 
                    style="height: 60px; width: 217px;"
                />
            </a>
        `;

        containerEl.appendChild(coffeeDiv);
    }
}