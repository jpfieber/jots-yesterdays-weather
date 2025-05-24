# Yesterday's Weather

Capture yesterday's weather to yesterday's daily note.

I like to use my daily notes not only to capture my thoughts and actions for a day, but to also capture some context of that day. Weather plays a part in this, so I wrote a plugin to 'archive' the weather conditions as properties on my daily notes. The weather data comes from [Visual Crossing](https://www.visualcrossing.com/weather-api), and is available via their API for free if you sign up for an account. With the weather data in my journal properties, I can just reference a single days weather by viewing that note, or I could use a different plugin to create a report or chart to view the weather over time.

## Usage

You configure the plugin with your API key, your location, how to find your daily notes, and a time of day to run, and the plugin grabs yesterday's weather and either creates a new daily note, or adds it to an existing daily note.  If you missed a day, there is a feature to add the date, and immediately fetch the weather for that day and create/modify the appropriate daily note.

## Configuration

The main settings are in the Plugin Settings section:
- **API Key**:  Enter your Visual Crossing API Key, which you can get by signing up at their website https://www.visualcrossing.com/weather-api
- **Location**:  Enter your location. Use an address, partial address or latitude,longitude location for which to retrieve weather data. You can also use US ZIP Codes. You can test them at https://visualcrossing.com/weather-data to find the right one.
- **Daily note location**:  Enter the path to the root of your daily notes. If you keep them all in a folder called "Journals" that resides in the root of your vault, you'd just enter `Journals`. If it's not at the root level, a path like `Content/Journals` works.
- **Daily note subdirectory**:  If you divide your daily notes up by date, enter the pattern for your subdirectory structure. The default is YYYY/YYYY-MM, but you can use any combination of Y/M/D notation (YY/YYYY/M/MM/MMM/MMMM/D/DD/DDD/DDDD are all recognized).
- **Daily note name format**:  Use the same Y/M/D notation to describe how you name your daily notes. The default is YYYY-MM-DD_DDD (e.g. 2024-12-27_Fri).
- **Template file location**:  Enter the path to the template you use to generate your daily notes. If no daily note exists when weather is being fetched for a date, a new daily note will be created based on this template. Variables that work include:
    - `{{title}}`
    - `{{date}}`
    - `{{time}}`
    - Basic Templater date commands like `<% moment(tp.file.title,'YYYY-MM-DD_ddd').format("dddd, MMMM D, YYYY") %>`
    - Note that the above date/time variables will be based on the date the weather is being fetched for.  If you want today's date/time use {{tdate}} or {{ttime}}, which may be more useful for properties like 'created' or 'updated'.
    - If you need other variables, let me know and I'll see what I can do (no promises).
- **Run Time**:  Leave blank if you only intend to run this plugin on demand using the `Fetch Yesterday's Weather` command, or if you use a plugin like Cron to run it. Enter a time in HH:MM format if you want it to run automatically every day (requires Obsidian be open at the time with Internet access).

- **Manually add for date**:  If you miss a date, maybe you didn't have Obsidian open so it couldn't run, pick a date and click 'Fetch Weather' and it will run for that specific date.

- **General properties/Location**:  Do you want to include a property in your frontmatter that shows the location the weather data was gathered for (the location you set at the top of the settings tab)? Enable and then set the name you'd like to use for the property. The default is 'location'.

- **Weather properties**: This is a list of every type of data that will be fetched from Visual Crossing.  You can see more information about each <a href="https://www.visualcrossing.com/resources/documentation/weather-api/timeline-weather-api/#response-elements">here</a>. Enable and set the property name to include that data in your daily note. The default names mostly start with 'wtr' to avoid colliding with other properties you may use (except for sunrise and sunset which seem pretty safe), but you can set them to anything you need.

## Support

- If you want to report a bug, it would be best to start an **Issue** on the [GitHub page](https://github.com/jpfieber/jots-yesterdays-weather/issues).
- If you'd like to discuss how the plugin works, the best place would be the [JOTS SubReddit](https://www.reddit.com/r/Jots/)

## JOTS

While this plugin works on it's own in most any vault, it is part of a larger system called <a href="https://jots.life">JOTS: Joe's Obsidian Tracking System</a>. Learn more about it <a href="https://jots.life">here</a>.

![JOTS-Logo-64](https://github.com/user-attachments/assets/e29ba5d7-8bdd-4cd9-8336-5fa35b7b593e)

## Support My Work

If this plugin helped you and you wish to contribute:

<a href="https://www.buymeacoffee.com/jpfieber" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60"></a>

- <a href="https://github.com/sponsors/jpfieber">GitHub Sponsor</a>
- <a href="https://www.paypal.com/paypalme/jpfieber">PayPal</a>

Your support helps maintain and improve this project. Thank you!
