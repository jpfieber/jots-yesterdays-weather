import { Plugin, Notice } from 'obsidian';
import { scheduleDailyRun, fetchWeatherForDate } from './weather';
import { YesterdaysWeatherSettingTab } from './settings';
import { YesterdaysWeatherSettings, DEFAULT_SETTINGS } from './types';

export default class YesterdaysWeatherPlugin extends Plugin {
    settings!: YesterdaysWeatherSettings;
    dailyTimeout?: NodeJS.Timeout;
    dailyInterval?: NodeJS.Timeout;
    private lastYesterdayDate?: Date;
    private lastRun?: Date;

    async YesterdaysWeather() {
        const now = new Date();
        // Only create new Date object if not same day
        if (!this.lastRun || this.lastRun.getDate() !== now.getDate()) {
            this.lastYesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0, 0);
            this.lastRun = now;
        }
        await fetchWeatherForDate(this, this.lastYesterdayDate!);
    }

    scheduleDailyRun() {
        scheduleDailyRun(this);
    } async onload() {
        console.log('Yesterday\'s Weather: Loading plugin');

        try {
            await this.loadSettings();

            // Register the command first for quick access
            this.addCommand({
                id: 'yesterdays-weather',
                name: 'Fetch Yesterday\'s Weather',
                callback: () => this.YesterdaysWeather()
            });

            // Add settings tab
            this.addSettingTab(new YesterdaysWeatherSettingTab(this.app, this));

            // Schedule the daily run if configured
            if (this.settings.runTime) {
                this.scheduleDailyRun();
            }
        } catch (error) {
            console.error('Yesterday\'s Weather: Error loading plugin:', error);
            new Notice('Error loading Yesterday\'s Weather plugin. Check the console for details.');
        }
    }

    onunload() {
        console.log('Yesterday\'s Weather: Unloading plugin');
        this.dailyTimeout && clearTimeout(this.dailyTimeout);
        this.dailyInterval && clearInterval(this.dailyInterval);
        this.lastYesterdayDate = undefined;
        this.lastRun = undefined;
    }

    async loadSettings() {
        const data = await this.loadData();
        this.settings = {
            ...DEFAULT_SETTINGS,
            ...data
        };
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}