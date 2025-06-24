# Nanobrowser-inspired Chrome Extension Plan

## Notes
- User wants to emulate Nanobrowser, an open-source Chrome extension for AI-powered web automation.
- Nanobrowser uses a multi-agent system (Planner, Navigator, Validator) and allows users to connect their own LLM API keys.
- Core features: multi-agent collaboration, privacy (runs locally), flexible LLM support, intuitive chat UI, task automation.
- Project will start with a simplified version and incrementally add features.
- User clarified: The AI (me) should be the main interface, interpreting user intentions and controlling the browser via the extension/tools as needed, not via a limited popup UI.
- Architectural shift: Plan to use a local WebSocket server for communication between AI and the browser extension, enabling direct, flexible control.
- WebSocket server and extension connection are now implemented and working; next is enabling command input via HTTP endpoint.
- HTTP endpoint for command input is now implemented and tested.
- Added robust server management: created `start.sh` script to kill old server processes and launch the server as a persistent background process.
- `/status` endpoint implemented for robust connection detection and race-free workflow.
- Race condition root cause: extension was connecting twice, server now closes old connection before accepting new one.
- Asyncio event loop bug discovered: response queue must be initialized within the main async function to avoid cross-loop errors; this is now fixed.
- Need to ensure extension reload timing is coordinated with server startup for reliable connection.
- Chrome extension async messaging bug: Fixed. Communication between background.js and content.js now correctly passes command objects and responses, resolving silent failures after first command.
- Robust, stable two-way communication validated across multiple sites (Google, LinkedIn).

## Task List
- [x] Research Nanobrowser's architecture and features (done)
- [x] Set up basic Chrome extension file structure (manifest.json, popup UI, background/content scripts)
- [x] Implement communication channel (e.g., local WebSocket server) between AI and browser extension
- [x] Modify extension to connect to local server and receive commands from AI
- [x] Add HTTP endpoint to server for command input
- [x] Add robust server process management and reliable browser navigation (automated via start.sh)
- [x] Add two-way communication: extension can read and return page content
- [x] Implement `/status` endpoint for robust connection detection
- [x] Implement logic to wait for extension connection before sending commands
- [x] Debug and stabilize extension async message handling
- [x] Validate robust, stable two-way communication across multiple sites
- [ ] Implement a single agent that can analyze a webpage and generate action plans using LLM
- [ ] Enable the extension to execute actions on the webpage (click, fill forms, etc.)
- [ ] Expand to multi-agent system (Planner, Navigator, Validator)
- [ ] Add support for user-supplied LLM API keys and model selection
- [ ] Add conversation history and advanced UI features

## Current Goal
Begin implementation of the first agent (agent.py)