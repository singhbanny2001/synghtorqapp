# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fleet-smoke.spec.ts >> vehicle-scoped fuel view hides the selector and shows only the selected vehicle events
- Location: tests/e2e/fleet-smoke.spec.ts:130:1

# Error details

```
Error: browserContext.newPage: Executable doesn't exist at /Users/besilke/Library/Caches/ms-playwright/ffmpeg-1011/ffmpeg-mac
╔═════════════════════════════════════════════════════════════════╗
║ Video rendering requires ffmpeg binary.                         ║
║ Downloading it will not affect any of the system-wide settings. ║
║ Please run the following command:                               ║
║                                                                 ║
║     npx playwright install ffmpeg                               ║
║                                                                 ║
║ <3 Playwright Team                                              ║
╚═════════════════════════════════════════════════════════════════╝
```