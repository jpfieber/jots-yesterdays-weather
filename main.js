'use strict';

var obsidian = require('obsidian');

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to wait before invoking the function.
 * @returns {Function} - A debounced version of the function.
 */
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        const later = () => {
            clearTimeout(timeout);
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fetch weather data for a specific date.
 * @param {Object} plugin - The plugin instance.
 * @param {Date} date - The date for which to fetch weather data.
 */
async function fetchWeatherForDate(plugin, date) {
    if (!plugin.settings || !plugin.settings.apiKey || !plugin.settings.location) {
        console.error("Settings are not properly configured.");
        return;
    }

    const dateString = date.toISOString().split('T')[0];
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${plugin.settings.location}/${dateString}/${dateString}?unitGroup=us&include=days&key=${plugin.settings.apiKey}&contentType=json`;

    try {
        const response = await obsidian.requestUrl({ url: apiUrl });
        const weatherData = response.json;
        await updateNoteWithWeatherData(plugin, date, weatherData);
    } catch (error) {
        console.error("Error retrieving weather data:", error);
    }
}

/**
 * Update a note with weather data.
 * @param {Object} plugin - The plugin instance.
 * @param {Date} date - The date for which the weather data applies.
 * @param {Object} data - The weather data to insert into the note.
 */
async function updateNoteWithWeatherData(plugin, date, data) {
    const year = date.getFullYear();
    const yearShort = String(year).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthUnpad = String(date.getMonth() + 1);
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
    const monthLong = date.toLocaleDateString('en-US', { month: 'long' });
    const day = String(date.getDate()).padStart(2, '0');
    const dayUnpad = String(date.getDate());
    const dayOfWeekShort = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayOfWeekLong = date.toLocaleDateString('en-US', { weekday: 'long' });

    const placeholders = {
        'YYYY': year,
        'YY': yearShort,
        'MMMM': monthLong,
        'MMM': monthShort,
        'MM': month,
        'M': monthUnpad,
        'DDDD': dayOfWeekLong,
        'DDD': dayOfWeekShort,
        'DD': day,
        'D': dayUnpad
    };

    const replacePlaceholders = (str) => {
        return str.replace(/YYYY|YY|MMMM|MMM|MM|M|DDDD|DDD|DD|D/g, (match) => placeholders[match]);
    };

    // Use the journal name format setting
    let noteName = replacePlaceholders(plugin.settings.journalNameFormat);

    // Ensure the note name ends with .md
    if (!noteName.endsWith('.md')) {
        noteName += '.md';
    }

    const journalSubdir = replacePlaceholders(plugin.settings.journalSubdir);

    const notePath = obsidian.normalizePath(`${plugin.settings.journalRoot}/${journalSubdir}/${noteName}`);

    const weatherProperties = {
        wtrtempmax: data.days[0].tempmax,
        wtrtempmin: data.days[0].tempmin,
        wtrtemp: data.days[0].temp,
        wtrfeelslikemax: data.days[0].feelslikemax,
        wtrfeelslikemin: data.days[0].feelslikemin,
        wtrfeelslike: data.days[0].feelslike,
        wtrdew: data.days[0].dew,
        wtrhumidity: data.days[0].humidity,
        wtrprecip: data.days[0].precip,
        wtrpreciptype: Array.isArray(data.days[0].preciptype) ? `['${data.days[0].preciptype.join("','")}']` : '',
        wtrsnow: data.days[0].snow,
        wtrsnowdepth: data.days[0].snowdepth,
        wtrwindgust: data.days[0].windgust,
        wtrwindspeed: data.days[0].windspeed,
        wtrwinddir: data.days[0].winddir,
        wtrpressure: data.days[0].pressure,
        wtrcloudcover: data.days[0].cloudcover,
        wtrvisibility: data.days[0].visibility,
        wtrsolarradiation: data.days[0].solarradiation,
        wtrsolarenergy: data.days[0].solarenergy,
        wtruvindex: data.days[0].uvindex,
        wtrsevererisk: data.days[0].severerisk,
        sunrise: data.days[0].sunrise,
        sunset: data.days[0].sunset,
        wtrmoonphase: data.days[0].moonphase,
        wtrconditions: Array.isArray(data.days[0].conditions) ? `['${data.days[0].conditions.join("','")}']` : '',
        wtrdescription: data.days[0].description,
        wtricon: data.days[0].icon,
    };

    const requiredProperties = {
        fileClass: 'Journal',
        filename: noteName,
        created: new Date().toISOString(),
        location: plugin.settings.location,
    };

    const selectedProperties = {};
    for (const [key, value] of Object.entries(weatherProperties)) {
        if (plugin.settings.properties[key] && plugin.settings.properties[key].enabled) {
            selectedProperties[plugin.settings.properties[key].name] = value;
        }
    }

    const selectedGeneralProperties = {};
    for (const [key, value] of Object.entries(requiredProperties)) {
        if (plugin.settings.generalProperties[key] && plugin.settings.generalProperties[key].enabled) {
            selectedGeneralProperties[plugin.settings.generalProperties[key].name] = value;
        }
    }

    try {
        const fileExists = await plugin.app.vault.adapter.exists(notePath);
        if (fileExists) {
            const fileContent = await plugin.app.vault.adapter.read(notePath);
            const fileLines = fileContent.split('\n');
            const yamlStartIndex = fileLines.indexOf('---');
            const yamlEndIndex = fileLines.indexOf('---', yamlStartIndex + 1);

            if (yamlStartIndex !== -1 && yamlEndIndex !== -1) {
                const yamlContent = fileLines.slice(yamlStartIndex + 1, yamlEndIndex).join('\n');
                const existingYaml = obsidian.parseYaml(yamlContent);

                if (existingYaml.wtrdescription) {
                    console.log("Weather data already exists in the note.");
                    return;
                }

                const updatedYaml = { ...existingYaml, ...selectedProperties, ...selectedGeneralProperties };

                const updatedYamlContent = obsidian.stringifyYaml(updatedYaml).trim();
                const updatedFileContent = [
                    '---',
                    updatedYamlContent,
                    '---',
                    ...fileLines.slice(yamlEndIndex + 1)
                ].join('\n');

                await plugin.app.vault.adapter.write(notePath, updatedFileContent);
                console.log("Weather data added to the existing note.");
            }
        } else {
            const requiredYaml = obsidian.stringifyYaml(selectedGeneralProperties).trim();
            const weatherYaml = obsidian.stringifyYaml(selectedProperties).trim();
            const weatherYAML = `---
${requiredYaml}
${weatherYaml}
---`;

            const title = `# ${dayOfWeekLong}, ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

            const content = `${weatherYAML}\n\n${title}`;

            await plugin.app.vault.adapter.mkdir(obsidian.normalizePath(`${plugin.settings.journalRoot}/${journalSubdir}`));
            await plugin.app.vault.create(notePath, content);
            console.log("New note created with weather data.");
        }
    } catch (error) {
        console.error("Error creating or updating note:", error);
    }
}

/**
 * Schedule a daily run of the plugin.
 * @param {Object} plugin - The plugin instance.
 */
function scheduleDailyRun(plugin) {
    if (!plugin.settings.runTime) {
        console.log('Run time not set. Skipping schedule.');
        return;
    }

    const now = new Date();
    const [hours, minutes] = plugin.settings.runTime.split(':').map(Number);
    const nextRun = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
    }

    const timeUntilNextRun = nextRun - now;

    plugin.dailyTimeout = setTimeout(() => {
        plugin.YesterdaysWeather();
        plugin.dailyInterval = setInterval(() => plugin.YesterdaysWeather(), 24 * 60 * 60 * 1000);
    }, timeUntilNextRun);
}

class YesterdaysWeatherSettingTab extends obsidian.PluginSettingTab {
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
        new obsidian.Setting(containerEl)
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
        new obsidian.Setting(containerEl)
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
        new obsidian.Setting(containerEl)
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
        new obsidian.Setting(containerEl)
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
        new obsidian.Setting(containerEl)
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
        new obsidian.Setting(containerEl)
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

        new obsidian.Setting(containerEl)
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

        new obsidian.Setting(containerEl)
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
            new obsidian.Setting(containerEl)
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
                new obsidian.Setting(containerEl)
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
                    new obsidian.Setting(containerEl)
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
            new obsidian.Setting(containerEl)
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
                new obsidian.Setting(containerEl)
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
    }
}

class YesterdaysWeatherPlugin extends obsidian.Plugin {
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new YesterdaysWeatherSettingTab(this.app, this));

        this.addCommand({
            id: 'yesterdays-weather',
            name: 'Fetch Yesterday\'s Weather',
            callback: () => this.YesterdaysWeather()
        });

        scheduleDailyRun(this);
    }

    onunload() {
        console.log('Unloading plugin');
        if (this.dailyTimeout) {
            clearTimeout(this.dailyTimeout);
        }
        if (this.dailyInterval) {
            clearInterval(this.dailyInterval);
        }
    }

    async loadSettings() {
        const data = await this.loadData();
        const defaultProperties = {
            wtrtempmax: { enabled: true, name: 'wtrtempmax' },
            wtrtempmin: { enabled: true, name: 'wtrtempmin' },
            wtrtemp: { enabled: true, name: 'wtrtemp' },
            wtrfeelslikemax: { enabled: true, name: 'wtrfeelslikemax' },
            wtrfeelslikemin: { enabled: true, name: 'wtrfeelslikemin' },
            wtrfeelslike: { enabled: true, name: 'wtrfeelslike' },
            wtrdew: { enabled: true, name: 'wtrdew' },
            wtrhumidity: { enabled: true, name: 'wtrhumidity' },
            wtrprecip: { enabled: true, name: 'wtrprecip' },
            wtrpreciptype: { enabled: true, name: 'wtrpreciptype' },
            wtrsnow: { enabled: true, name: 'wtrsnow' },
            wtrsnowdepth: { enabled: true, name: 'wtrsnowdepth' },
            wtrwindgust: { enabled: true, name: 'wtrwindgust' },
            wtrwindspeed: { enabled: true, name: 'wtrwindspeed' },
            wtrwinddir: { enabled: true, name: 'wtrwinddir' },
            wtrpressure: { enabled: true, name: 'wtrpressure' },
            wtrcloudcover: { enabled: true, name: 'wtrcloudcover' },
            wtrvisibility: { enabled: true, name: 'wtrvisibility' },
            wtrsolarradiation: { enabled: true, name: 'wtrsolarradiation' },
            wtrsolarenergy: { enabled: true, name: 'wtrsolarenergy' },
            wtruvindex: { enabled: true, name: 'wtruvindex' },
            wtrsevererisk: { enabled: true, name: 'wtrsevererisk' },
            sunrise: { enabled: true, name: 'sunrise' },
            sunset: { enabled: true, name: 'sunset' },
            wtrmoonphase: { enabled: true, name: 'wtrmoonphase' },
            wtrconditions: { enabled: true, name: 'wtrconditions' },
            wtrdescription: { enabled: true, name: 'wtrdescription' },
            wtricon: { enabled: true, name: 'wtricon' },
        };

        const defaultGeneralProperties = {
            fileClass: { enabled: true, name: 'fileClass', value: 'Journal' },
            filename: { enabled: true, name: 'filename' },
            location: { enabled: true, name: 'location' },
        };

        this.settings = Object.assign({}, {
            apiKey: '',
            location: '',
            journalRoot: 'Journals',
            journalSubdir: 'YYYY/YYYY-MM',
            journalNameFormat: 'YYYY-MM-DD_DDD',
            runTime: '',
            specificDate: '',
            properties: defaultProperties,
            generalProperties: defaultGeneralProperties
        }, data);

        // Ensure properties are correctly structured
        for (const key in defaultProperties) {
            if (typeof this.settings.properties[key] === 'boolean') {
                this.settings.properties[key] = {
                    enabled: this.settings.properties[key],
                    name: key
                };
            } else if (typeof this.settings.properties[key] !== 'object') {
                this.settings.properties[key] = defaultProperties[key];
            }
        }

        // Ensure general properties are correctly structured
        for (const key in defaultGeneralProperties) {
            if (typeof this.settings.generalProperties[key] === 'boolean') {
                this.settings.generalProperties[key] = {
                    enabled: this.settings.generalProperties[key],
                    name: key
                };
            } else if (typeof this.settings.generalProperties[key] !== 'object') {
                this.settings.generalProperties[key] = defaultGeneralProperties[key];
            }
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async YesterdaysWeather() {
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        await fetchWeatherForDate(this, yesterdayDate);
    }
}

module.exports = YesterdaysWeatherPlugin;
