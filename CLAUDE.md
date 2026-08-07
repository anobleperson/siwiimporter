# siwiimporter

## Repository visibility

This repo is hosted on GitHub Pages from the `docs/` folder on a **free** plan, which requires the repo to be **public**. Treat everything committed as world-readable, permanently (git history included).

## PII rule — never commit personal data

Real attendee/participant data (names, emails, DOB, addresses, phone numbers, etc.) must never enter git history.

- `examples/` is gitignored specifically because it holds real attendee exports (CSV/XML) with PII. Never remove it from `.gitignore`, never `git add -f` anything under it, and never copy its contents into a tracked file (docs, tests, fixtures, commit messages).
- Before staging or committing anything, check new/changed files for embedded personal data (sample rows pasted into docs, hardcoded test fixtures, screenshots, log output, etc.) — not just the `examples/` folder.
- Test fixtures must be synthetic/anonymized data, not real exports. If a test needs a realistic file, generate a fake one instead of trimming a real one.
- If PII is ever accidentally committed, stop and flag it to the user before pushing — it needs history rewriting (not just a follow-up commit), which is a destructive operation requiring explicit confirmation.
