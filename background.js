let socket = null;
const serverUrl = 'ws://localhost:8767';

function connect() {
  console.log('Attempting to connect to WebSocket server...');
  chrome.storage.local.set({ connectionStatus: 'connecting' });

  socket = new WebSocket(serverUrl);

  socket.onopen = () => {
    console.log('WebSocket connection established.');
    chrome.storage.local.set({ connectionStatus: 'connected' });
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Received message from server:', message);

    if (message.type === 'PAGE_COMMAND') {
      // Forward the command to the active tab's content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const command = message.command;
          // Use the more reliable chrome.tabs.update for navigation
          if (command.action === 'navigate') {
            chrome.tabs.update(tabs[0].id, { url: command.url });
            // We can optimistically send success back to the server
            socket.send(JSON.stringify({ status: 'Success', detail: `Navigating to ${command.url}` }));
          } else {
            // For other commands, we still need to message the content script
            chrome.tabs.sendMessage(tabs[0].id, command, function(response) {
              if (chrome.runtime.lastError) {
                console.error('Error sending message to content script:', chrome.runtime.lastError.message);
                socket.send(JSON.stringify({ status: 'Error', detail: chrome.runtime.lastError.message }));
              } else {
                console.log('Response from content script:', response);
                socket.send(JSON.stringify(response));
              }
            });
          }
        }
      });
    }
  };

  // Listen for tab updates to know when a page is fully loaded.
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Ensure the websocket is open before sending a message.
    if (changeInfo.status === 'complete' && socket && socket.readyState === WebSocket.OPEN) {
      console.log(`Tab ${tabId} finished loading: ${tab.url}`);
      socket.send(JSON.stringify({
        type: 'event',
        event: 'page_loaded',
        details: {
          tabId: tabId,
          url: tab.url
        }
      }));
    }
  });

  socket.onclose = () => {
    console.log('WebSocket connection closed. Reconnecting in 5 seconds...');
    chrome.storage.local.set({ connectionStatus: 'disconnected' });
    socket = null;
    setTimeout(connect, 5000);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    chrome.storage.local.set({ connectionStatus: 'error' });
    socket.close();
  };
}

// Initial connection attempt
connect();

console.log('Background script loaded and WebSocket connector is running.');
