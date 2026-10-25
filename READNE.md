# CalibraTrack – Instrument Calibration Management System

CalibraTrack is a web-based project designed to manage instrument inventory and calibration history. It helps users maintain instrument details, record calibration results, monitor calibration status, and review calibration records through a simple dashboard.

## Features

- **Instrument Inventory Management:** Add, view, edit, search, and manage instrument details.
- **Calibration History:** Record and view calibration dates, results, and related calibration information.
- **Calibration Status Tracking:** Identify instrument statuses such as Valid, Due Soon, Overdue, Calibration Failed, and Review Required.
- **Dashboard:** View instrument summaries and calibration status information.
- **Data Persistence:** Store instrument and calibration history data in the browser using Local Storage.
- **CSV Export:** Export instrument data for reporting and recordkeeping.
- **Input Validation:** Validate required fields and prevent invalid entries.
- **Calibration Traceability:** Protect instruments with existing calibration history from accidental deletion.
- **Responsive Interface:** Designed to support use across desktop and smaller screens.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Browser Local Storage
- Chart.js (if included in the project)

## Project Structure

```text
CalibraTrack/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

*Note: Adjust the file names in this structure if your actual project uses different names.*

## How to Run the Project

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` using the Live Server extension, or open it directly in a browser.
4. Add instruments and create calibration records to explore the features.

## Data Storage

CalibraTrack uses browser Local Storage to retain instrument inventory and calibration history.

Data is stored locally in the browser and is not automatically synchronized between different browsers or devices. Clearing browser storage may remove the saved application data.

## Project Purpose

This project demonstrates practical front-end development skills, including DOM manipulation, form handling, CRUD operations, input validation, browser storage, dashboard updates, and data export.

It also applies concepts from instrumentation and calibration management to a practical web application.

## Future Enhancements

- Database integration for centralized data storage
- User authentication and role-based access
- Calibration due-date notifications
- Report generation and PDF export
- Cloud-based data synchronization

## Author

Rajesh

## License

This project is available for learning, practice, and portfolio demonstration. Add an open-source license if you decide to distribute it under specific reuse terms.
