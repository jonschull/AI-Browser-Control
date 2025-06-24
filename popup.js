function updateStatus() {
  const statusSpan = document.getElementById('status');
  chrome.storage.local.get('connectionStatus', (result) => {
    let statusText = 'Unknown';
    let color = 'grey';
    switch (result.connectionStatus) {
      case 'connected':
        statusText = 'Connected';
        color = '#4CAF50';
        break;
      case 'connecting':
        statusText = 'Connecting...';
        color = 'orange';
        break;
      case 'disconnected':
        statusText = 'Disconnected';
        color = 'red';
        break;
      case 'error':
        statusText = 'Error';
        color = 'red';
        break;
    }
    statusSpan.textContent = statusText;
    statusSpan.style.color = color;
    statusSpan.style.fontWeight = 'bold';
  });
}

document.addEventListener('DOMContentLoaded', updateStatus);
chrome.storage.onChanged.addListener(updateStatus);
