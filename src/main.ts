import { Plugin } from 'obsidian';
import { scheduleDailyRun } from './weather.js';
import type { YesterdaysWeatherSettings } from './types.js';

const DEFAULT_SETTINGS: YesterdaysWeatherSettings = {
    apiKey: '',
    location: '',
    journalRoot: 'Journals',
    journalSubdir: 'YYYY/YYYY-MM',
    journalNameFormat: 'YYYY-MM-DD_DDD',
    runTime: '',
    specificDate: '',
    properties: {
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
    },
    generalProperties: {
        location: { enabled: true, name: 'location' },
    }
};

export default class YesterdaysWeatherPlugin extends Plugin {
    settings!: YesterdaysWeatherSettings;
    dailyTimeout?: NodeJS.Timeout;
    dailyInterval?: NodeJS.Timeout;

    async onload() {
        await this.loadSettings();

        // Register the command first for quick access
        this.addCommand({
            id: 'yesterdays-weather',
            name: 'Fetch Yesterday\'s Weather',
            callback: async () => {
                // Lazy load the weather module only when needed
                const { fetchWeatherForDate } = await import('./weather.js');
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                await fetchWeatherForDate(this, yesterdayDate);
            }
        });

        // Lazy load settings tab
        this.addSettingTab(await this.createSettingTab());

        // Schedule the daily run if configured
        if (this.settings.runTime) {
            scheduleDailyRun(this);
        }
    }

    onunload() {
        if (this.dailyTimeout) {
            clearTimeout(this.dailyTimeout);
        }
        if (this.dailyInterval) {
            clearTimeout(this.dailyInterval);
        }
    }

    private async createSettingTab() {
        const { YesterdaysWeatherSettingTab } = await import('./settings.js');
        return new YesterdaysWeatherSettingTab(this.app, this);
    }

    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

        // Ensure properties are correctly structured
        this.migratePropertySettings();
    }

    private migratePropertySettings() {
        // Migrate property settings
        for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS.properties)) {
            if (typeof this.settings.properties[key] === 'boolean') {
                this.settings.properties[key] = {
                    enabled: this.settings.properties[key],
                    name: key
                };
            } else if (typeof this.settings.properties[key] !== 'object') {
                this.settings.properties[key] = defaultValue;
            }
        }

        // Migrate general property settings
        for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS.generalProperties)) {
            if (typeof this.settings.generalProperties[key] === 'boolean') {
                this.settings.generalProperties[key] = {
                    enabled: this.settings.generalProperties[key],
                    name: key
                };
            } else if (typeof this.settings.generalProperties[key] !== 'object') {
                this.settings.generalProperties[key] = defaultValue;
            }
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}