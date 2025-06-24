# AI-Browser-Control: A Framework for AI-Driven Web Automation

This project establishes a robust framework for an AI assistant (like Cascade) to control a web browser, enabling complex, interactive web automation tasks. It moves beyond simple scripting to create a system where the AI can perceive, act upon, and validate changes on a webpage, much like a human user.

## Vision

The core vision is not to build a standalone, autonomous agent, but to empower an AI collaborator with a set of reliable "peripherals" for browser interaction. The AI acts as the central intelligence, using the tools provided by this framework to perform tasks requested by a human user. The emphasis is on a tight, interactive loop of **Perception-Action-Validation**.

## Architecture

The system consists of two main components that communicate in real-time:

1.  **Python Backend Server (`server.py`):**
    *   A **WebSocket server** maintains a persistent, two-way communication channel with the browser extension.
    *   An **HTTP server** exposes an endpoint (`/command`) for the AI to send commands (e.g., navigate, click, read page content).
    *   A `/status` endpoint allows for a quick health check to ensure the extension is connected before sending commands.
    *   The server is fully asynchronous, built with `asyncio`, `websockets`, and `aiohttp`.

2.  **Chrome Extension:**
    *   A **background script (`background.js`)** manages the WebSocket connection and forwards commands to the appropriate browser tab.
    *   A **content script (`content.js`)** injects into web pages to execute commands directly. It can read page content, identify interactive elements, and perform actions like clicks.

## Core Interaction Loop: Perception-Action-Validation

Every operation follows a three-step process to ensure reliability:

1.  **Perception:** The AI uses a command like `list_interactive_elements` to get a structured list of all clickable elements on the current page, each with a unique and stable CSS selector.
2.  **Action:** The AI sends a command like `click_element`, using one of the selectors from the perception step to target a specific element.
3.  **Validation:** The AI follows up with a command like `read_page` to get the updated state of the page and verify that the action had the intended effect (e.g., new content appeared, a form was submitted, etc.).

## Getting Started

### Prerequisites

*   Python 3.7+
*   Google Chrome

### 1. Install Dependencies

Clone the repository and install the required Python packages:

```bash
pip install -r requirements.txt
```

### 2. Run the Server

The project includes a convenience script to manage the server process.

```bash
./start.sh
```

This will stop any old server instances and start a new one in the background. The WebSocket server runs on `ws://localhost:8767` and the HTTP server on `http://localhost:8766`.

### 3. Load the Chrome Extension

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** using the toggle in the top-right corner.
3.  Click **"Load unpacked"**.
4.  Select the project directory (`AI-Browser-Control`).

The extension will be installed and will automatically connect to the WebSocket server. **Remember to click the refresh icon on the extension card whenever you make changes to the extension's code (`.js` files).**

## Current Status

*   **Stable Two-Way Communication:** The connection between the server and extension is robust and has been tested across multiple sites.
*   **Core Commands Implemented:**
    *   `navigate`: Go to a specific URL.
    *   `list_interactive_elements`: Perceive all interactive elements, including links, buttons, and input fields.
    *   `click_element`: Act on a specific item.
    *   `fill_form_field`: Type text into an input field or textarea.
    *   `scroll_page`: Scroll the page down by one viewport height.
    *   `get_current_url`: Return the current URL of the page.
    *   `go_back`: Navigate to the previous page in the browser history.
    *   `read_page`: Read the full text content of the page for validation.
*   **Perception-Action-Validation Loop:** The full loop has been successfully demonstrated and validated.

## Next Steps

With a robust set of core commands implemented, the next steps will focus on tackling more complex challenges:

*   **Complex Task Automation:** Attempt multi-step tasks like logging into websites, filling out multi-page forms, or navigating e-commerce checkout flows.
*   **Advanced Perception:** Enhance perception to understand not just elements, but also their context and state (e.g., is a checkbox checked? which dropdown option is selected?).
*   **Multi-Agent System:** Explore the original Nanobrowser vision of a multi-agent system (Planner, Navigator, Validator) for more autonomous and resilient task execution.
