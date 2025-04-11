import { requestUrl, Notice } from 'obsidian';
import type { YesterdaysWeatherPlugin } from './types';
import { createOrUpdateNote, NoteCreatorSettings } from './note-creator';

interface WeatherData {
    days: Array<{
        tempmax: number;
        tempmin: number;
        temp: number;
        feelslikemax: number;
        feelslikemin: number;
        feelslike: number;
        dew: number;
        humidity: number;
        precip: number;
        preciptype?: string[];
        snow: number;
        snowdepth: number;
        windgust: number;
        windspeed: number;
        winddir: number;
        pressure: number;
        cloudcover: number;
        visibility: number;
        solarradiation: number;
        solarenergy: number;
        uvindex: number;
        severerisk: number;
        sunrise: string;
        sunset: string;
        moonphase: number;
        conditions?: string[];
        description: string;
        icon: string;
    }>;
}

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Fetch weather data for a specific date.
 * @param {YesterdaysWeatherPlugin} plugin - The plugin instance.
 * @param {Date} date - The date for which to fetch weather data.
 */
export async function fetchWeatherForDate(plugin: YesterdaysWeatherPlugin, date: Date) {
    if (!plugin.settings || !plugin.settings.apiKey || !plugin.settings.location) {
        new Notice('Please configure your API key and location in the settings.');
        return;
    }

    const dateString = getLocalDateString(date);
    const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${plugin.settings.location}/${dateString}/${dateString}?unitGroup=us&include=days&key=${plugin.settings.apiKey}&contentType=json`;

    try {
        new Notice('Fetching weather data...');
        const response = await requestUrl({ url: apiUrl });
        const weatherData = response.json;
        await updateNoteWithWeatherData(plugin, date, weatherData);
        new Notice('Weather data successfully added to note');
    } catch (error) {
        console.error("Error retrieving weather data:", error);
        new Notice('Failed to fetch weather data. Please check your API key and location.');
    }
}

/**
 * Update a note with weather data.
 * @param {YesterdaysWeatherPlugin} plugin - The plugin instance.
 * @param {Date} date - The date for which the weather data applies.
 * @param {WeatherData} data - The weather data to insert into the note.
 */
export async function updateNoteWithWeatherData(plugin: YesterdaysWeatherPlugin, date: Date, data: WeatherData) {
    if (!data || !data.days || !data.days[0]) {
        new Notice('Invalid weather data received');
        return;
    }

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

    const selectedProperties: Record<string, any> = {};
    for (const [key, value] of Object.entries(weatherProperties)) {
        if (plugin.settings.properties[key]?.enabled) {
            selectedProperties[plugin.settings.properties[key].name] = value;
        }
    }

    const noteMetadata = {
        ...selectedProperties,
        ...Object.fromEntries(
            Object.entries({
                filename: date.toISOString().split('T')[0] + '.md',
                created: new Date().toISOString(),
                location: plugin.settings.location,
            }).filter(([key]) => plugin.settings.generalProperties[key]?.enabled)
                .map(([key, value]) => [plugin.settings.generalProperties[key].name, value])
        )
    };

    const noteSettings: NoteCreatorSettings = {
        rootFolder: plugin.settings.journalRoot,
        subFolder: plugin.settings.journalSubdir,
        nameFormat: plugin.settings.journalNameFormat,
        templatePath: plugin.settings.templatePath
    };

    try {
        await createOrUpdateNote(plugin.app, date, noteSettings, noteMetadata);
    } catch (error) {
        console.error("Error creating or updating note:", error);
        new Notice('Error creating or updating note');
    }
}

/**
 * Schedule a daily run of the plugin.
 * @param {Object} plugin - The plugin instance.
 */
export function scheduleDailyRun(plugin: YesterdaysWeatherPlugin) {
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

    const timeUntilNextRun = nextRun.getTime() - now.getTime();

    plugin.dailyTimeout = setTimeout(() => {
        plugin.YesterdaysWeather();
        plugin.dailyInterval = setInterval(() => plugin.YesterdaysWeather(), 24 * 60 * 60 * 1000);
    }, timeUntilNextRun);
}