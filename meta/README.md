# AI Browser Control

This is a Chrome extension that acts as a bridge for an AI assistant (like Cascade) to control and automate web tasks, inspired by the [Nanobrowser](https://github.com/nanobrowser/nanobrowser) project.

## Architecture

The system consists of two main parts:
1.  **A Python WebSocket Server (`server.py`):** This is the control center. The AI sends commands to this server.
2.  **A Chrome Extension:** This extension connects to the WebSocket server, listens for commands, and executes them on the active web page.

This architecture allows the AI to have direct, real-time control over the browser.

## How to Set Up and Run

### 1. Install the Chrome Extension

1.  Clone or download this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle switch in the top-right corner.
4.  Click the "Load unpacked" button in the top-left corner.
5.  Select the `AI-Browser-Control` directory where you saved these files.

The extension icon should now appear in your Chrome toolbar.

### 2. Run the WebSocket Server

1.  Make sure you have Python installed.
2.  Open a terminal in the `AI-Browser-Control` directory.
3.  Install the required dependencies:
    ```sh
    pip install -r requirements.txt
    ```
    This installs both `websockets` (for the extension connection) and `aiohttp` (for the AI command endpoint).
    ```
4.  Start the server:
    ```sh
    python server.py
    ```

### 3. Verify the Connection

1.  With the server running, click the extension's icon in your Chrome toolbar.
2.  The popup should show **Status: Connected** in green.
3.  You should also see "Browser extension connected." in the terminal where the server is running.
