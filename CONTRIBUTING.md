# Contributing

## Development

The application is dependency-free. Serve the repository root with a static HTTP server:

```bash
python3 -m http.server 8000
```

## Tests

Use Node.js 20 or newer:

```bash
npm test
```

Before opening a pull request:

1. Run the complete test suite.
2. Verify keyboard-only operation and visible focus states.
3. Check the layout at narrow mobile and desktop widths.
4. Do not add third-party runtime requests or dependencies without documenting the privacy and security impact.
5. Preserve the MIT license and keep personal ledger data out of commits and test fixtures.
