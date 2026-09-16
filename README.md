# Weighted Attendance Tracker

## Run in VS Code
1. Extract this folder.
2. Open the folder in VS Code.
3. Install the **Live Server** extension.
4. Right-click `index.html` → **Open with Live Server**.
5. The app opens in your browser.

You can also serve the folder with any simple local HTTP server.

## Features
- Weekly timetable
- Add/delete subjects
- Subject weights
- Individual class attendance
- Weighted overall attendance
- Subject-wise statistics
- Target percentage guidance: classes that can be missed or classes that need to be attended
- Monthly calendar
- Attendance charts using Chart.js
- India public holidays through Nager.Date
- Local persistence using browser localStorage
- Responsive dark UI

## Nager.Date
The app requests:
`https://date.nager.at/api/v3/PublicHolidays/{YEAR}/IN`

If the browser blocks the request in a particular environment, run through Live Server rather than opening the HTML with `file://`.
