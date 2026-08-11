# siwiimporter

## Repository visibility

This repo is hosted on GitHub Pages from the `docs/` folder on a **free** plan, which requires the repo to be **public**. Treat everything committed as world-readable, permanently (git history included).

## PII rule — never commit personal data

Real attendee/participant data (names, emails, DOB, addresses, phone numbers, etc.) must never enter git history.

- `examples/`, `test/`, and `documentation/` are tracked in git. Anything placed under them must be synthetic/anonymized — if real attendee data ever needs to be dropped in `examples/` for local investigation, anonymize it before it's staged, and never `git add -f` a real export.
- Before staging or committing anything, check new/changed files for embedded personal data (sample rows pasted into docs, hardcoded test fixtures, screenshots, log output, etc.).
- Test fixtures must be synthetic/anonymized data, not real exports. If a test needs a realistic file, generate a fake one instead of trimming a real one.
- If PII is ever accidentally committed, stop and flag it to the user before pushing — it needs history rewriting (not just a follow-up commit), which is a destructive operation requiring explicit confirmation.

## Asking questions

If the VSCode extension's question tool (AskUserQuestion) is available, always use it to ask the user questions rather than asking inline in text.
