import { Plugin } from 'obsidian';

interface PropertySettings {
    enabled: boolean;
    name: string;
}

export interface YesterdaysWeatherSettings {
    apiKey: string;
    location: string;
    journalRoot: string;
    journalSubdir: string;
    journalNameFormat: string;
    runTime: string;
    specificDate: string;
    templatePath: string;
    properties: {
        [key: string]: PropertySettings;
    };
    generalProperties: {
        [key: string]: PropertySettings;
    };
}

export interface YesterdaysWeatherPlugin extends Plugin {
    settings: YesterdaysWeatherSettings;
    saveSettings(): Promise<void>;
    dailyTimeout?: NodeJS.Timeout;
    dailyInterval?: NodeJS.Timer;
    YesterdaysWeather(): Promise<void>;
    scheduleDailyRun(): void;
}

export const DEFAULT_SETTINGS: YesterdaysWeatherSettings = {
    apiKey: '',
    location: '',
    journalRoot: 'Journals',
    journalSubdir: 'YYYY/YYYY-MM',
    journalNameFormat: 'YYYY-MM-DD_DDD',
    runTime: '',
    specificDate: '',
    templatePath: '',
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