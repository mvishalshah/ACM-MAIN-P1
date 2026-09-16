
# Weighted Attendance Tracker

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

## Privacy and Backups

- Application data is stored locally in the browser using `localStorage`; it is not sent to a project server by the app.
- Use the backup feature to download your current data and restore it later when needed.
- The project is designed to help coordinators, teachers, and teams manage attendance.

## Contact

- Instagram: [@newvishal](https://instagram.com/newvishal)
- Email: [vishal.shah.main@gmail.com](mailto:vishal.shah.main@gmail.com)
