# Calorie Ledger

A lightweight calorie-balance tracker built with HTML, CSS, and vanilla JavaScript. It runs in your browser without dependencies or a build step.

## Features
- Log food intake and exercise in 100 kcal increments.
- Estimate resting energy over elapsed time using a configurable daily estimate.
- Compare the estimated energy balance with a configurable daily reference.
- Persist settings and entries in browser local storage.
- Undo the latest entry and reset the current tracking session.
- Responsive layout, keyboard-accessible controls, and reduced-motion support.

## Calculation and limitations
The displayed estimate is calculated as:

`food logged − exercise logged − estimated resting energy elapsed`

The resting-energy rate is a simplified user-configured estimate, not measured expenditure. The app does not measure metabolism, food portions, exercise intensity, or total daily energy expenditure. The deficit reference is a comparison target, not a prediction of weight loss. This tool is educational and is not medical or nutrition advice.

## Run locally
Open `index.html` in a modern browser. Alternatively, run `python3 -m http.server 8000` from this directory and visit [http://localhost:8000](http://localhost:8000).

No package manager, account, server, or external service is required.

## Privacy
Data is stored in this browser's local storage and is not sent to a server. Clearing browser site data removes saved entries. Data does not automatically sync between browsers or devices.

## License
Apache License 2.0. See [LICENSE](LICENSE).
