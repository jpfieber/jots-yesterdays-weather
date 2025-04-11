# Yesterday's Weather

Capture yesterday's weather to yesterday's daily journal.

I like to use my daily journals not only to capture my thoughts and actions for a day, but to also capture some context of that day. Weather plays a part in this, so I wrote a plugin to 'archive' the weather conditions as properties on my journal pages. The weather data comes from [Visual Crossing](https://www.visualcrossing.com/weather-api), and is available via their API for free if you sign up for an account. With the weather data in my journal properties, I can just reference a single days weather by viewing that note, or I could use a different plugin to create a report or chart to view the weather over time.

<a href="https://www.buymeacoffee.com/jpfieber" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60"></a>

## Usage

You configure the plugin with your API key, your location, how to find your journals, and a time of day to run, and the plugin grabs yesterdays weather and either creates a new daily journal, or adds it to an existing daily journal.  If you missed a day, there is a feature to add the date, and immediately fetch the weather for that day and create/modify the appropriate journal.

## Configuration

The main settings are in the Plugin Settings section:
- **API Key** Enter your Visual Crossing API Key, which you can get by signing up at their website https://www.visualcrossing.com/weather-api
- **Template File Path** Enter the path to the template you use to generate your Journal files. If no journal file exists when weather is being fetched for a date, a new journal will be created based on this template. Variables that work include:
    - `{{title}}`
    - `{{date}}`
    - `{{time}}`
    - Basic Templater date commands like `<% moment(tp.file.title,'YYYY-MM-DD_ddd').format("dddd, MMMM D, YYYY") %>`
- **Location** Enter your location. Zipcode works as well as city names. You can test them at https://visualcrossing.com/weather-data to find the right one
- **Journal Root** Enter the path to the root of your Journals. If you keep them all in a folder called "Journals" that resides in the root of your vault, you'd just enter `Journals`. If it's not at the root level, a path like `Content/Journals` works.
- **Journal Subdirectory** If you divide your journals up by date, enter the pattern for your subdirectory structure. The default is YYYY/YYYY-MM, but you can use any combination of Y/M/D notation (YY/YYYY/M/MM/MMM/MMMM/D/DD/DDD/DDDD are all recognized).
- **Journal Name Format** Use the same Y/M/D notation to describe how you name your journals. The default is YYYY-MM-DD_DDD (e.g. 2024-12-27_Fri).
- **Run Time** Leave blank if you only intend to run this plugin on demand using the `Fetch Yesterday's Weather` command. Enter a time in HH:MM format if you want it to run automatically every day (requires Obsidian be open at the time with Internet access).

## JOTS

While this plugin works on it's own in most any vault, it is part of a larger system called <a href="https://jots.life">JOTS: Joe's Obsidian Tracking System</a>. Learn more about it <a href="https://jots.life">here</a>.

![JOTS-Logo-64](https://github.com/user-attachments/assets/e29ba5d7-8bdd-4cd9-8336-5fa35b7b593e)

## Support My Work

If this plugin helped you and you wish to contribute:

<a href="https://www.buymeacoffee.com/jpfieber" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60"></a>

- <a href="https://github.com/sponsors/jpfieber">GitHub Sponsor</a>
- <a href="https://www.paypal.com/paypalme/jpfieber">PayPal</a>

Your support helps maintain and improve this project. Thank you!
