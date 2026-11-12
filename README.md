# Calorie Ledger

A lightweight, private calorie ledger built with HTML, CSS, and vanilla JavaScript. It runs entirely in the browser and has no runtime dependencies, backend, account system, or third-party requests.

## Features

- Log custom food and activity amounts, plus one-tap 100 kcal entries.
- Compare a transparent estimated energy balance with a configurable daily reference.
- Apply a configurable resting-energy estimate proportionally across the local calendar day.
- Persist settings and up to 500 entries in browser local storage.
- Undo the latest entry, clear today's entries, and export a CSV.
- Handle local-day rollover and synchronize changes between tabs in the same browser.
- Responsive layout, semantic controls, keyboard focus indicators, live status messages, and reduced-motion support.
- Migrate data from the earlier `calorie-ledger.v2` browser-storage format.

## Calculation

`net energy balance = food logged − activity logged − estimated resting energy elapsed`

The deficit estimate is the negative of that balance. The resting-energy estimate accrues from local midnight using the configured daily value. Activity is logged separately and subtracted from the balance.

This is a simplified tracking model. The app does not measure food portions, exercise intensity, resting metabolism, or total daily energy expenditure. The deficit reference is a comparison value, not a prediction of weight change. Defaults are illustrative; this project is not medical or nutrition advice.

## Run locally

Serve this directory with any static web server. For example:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

A local HTTP server is recommended because the app uses JavaScript modules. No build step or package installation is needed.

## Tests

Requires Node.js 20 or newer. Run:

```bash
npm test
```

The test suite uses only Node's built-in test runner and assertion modules. GitHub Actions runs it on Node.js 20 and 22.

## Privacy and security

- All ledger data stays in this browser's local storage. The application makes no network requests.
- Data does not sync between devices or browsers. Clearing site data deletes the saved ledger.
- Do not use a shared browser profile for information you consider sensitive. Other scripts running on the same origin can access browser storage.
- The page applies a restrictive Content Security Policy and loads only local scripts and styles.
- Exported CSV files are saved by your browser; handle them as personal data.

## License

MIT. See [LICENSE](LICENSE).
