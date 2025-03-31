import { Plugin } from 'obsidian';
import { YesterdaysWeatherSettingTab } from './settings.js';
import { fetchWeatherForDate, scheduleDailyRun } from './weather.js';

export default class YesterdaysWeatherPlugin extends Plugin {
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