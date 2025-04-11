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