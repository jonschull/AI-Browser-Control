console.log('AI Browser Control content script loaded.');

chrome.runtime.onMessage.addListener((command, sender, sendResponse) => {
  console.log('Received command in content script:', command);

  if (typeof command !== 'object' || !command.action) {
    const errorMsg = 'Invalid command format. Expected an object with an "action" property.';
    console.error(errorMsg);
    sendResponse({ status: 'Error', detail: errorMsg });
    return true; // Keep channel open
  }

  switch (command.action) {
    // The 'navigate' action is now handled by background.js, so this case is effectively deprecated,
    // but we'll keep it for now as a fallback or for future use.
    case 'navigate':
      if (command.url) {
        console.log(`Navigating to ${command.url}`);
        window.location.href = command.url;
        sendResponse({ status: 'Success', detail: `Navigating to ${command.url}` });
      } else {
        const errorMsg = 'Navigate command requires a "url" property.';
        console.error(errorMsg);
        sendResponse({ status: 'Error', detail: errorMsg });
      }
      break;

    case 'read_page':
      console.log('Reading page content...');
      const pageText = document.body.innerText;
      sendResponse({ status: 'Success', data: pageText });
      break;

    case 'list_interactive_elements':
      console.log('Listing interactive elements...');
      const interactiveElements = [];
      let elementId = 0;
      // Expanded query to include buttons, links, inputs, and text areas
      document.querySelectorAll('button, a, input, textarea, [role="button"], [role="textbox"]').forEach(element => {
        if (isElementVisible(element)) {
          // Use value for inputs, innerText for others
          const text = element.value || element.innerText;
          interactiveElements.push({
            id: elementId++,
            tag: element.tagName.toLowerCase(),
            text: text ? text.trim() : '', // Handle elements with no text/value
            selector: generateUniqueSelector(element)
          });
        }
      });
      sendResponse({ status: 'Success', data: interactiveElements });
      break;

    case 'click_element':
      if (command.selector) {
        console.log(`Attempting to click element with selector: ${command.selector}`);
        const elementToClick = document.querySelector(command.selector);
        if (elementToClick) {
          elementToClick.click();
          sendResponse({ status: 'Success', detail: `Clicked element with selector: ${command.selector}` });
        } else {
          const errorMsg = `Could not find element with selector: ${command.selector}`;
          console.error(errorMsg);
          sendResponse({ status: 'Error', detail: errorMsg });
        }
      } else {
        const errorMsg = 'Click command requires a "selector" property.';
        console.error(errorMsg);
        sendResponse({ status: 'Error', detail: errorMsg });
      }
      break;

    case 'fill_form_field':
      if (command.selector && command.value !== undefined) {
        console.log(`Attempting to fill field with selector: ${command.selector}`);
        const inputElement = document.querySelector(command.selector);
        if (inputElement) {
          inputElement.value = command.value;
          // Dispatch events to ensure frameworks like React or Vue recognize the change
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          inputElement.dispatchEvent(new Event('change', { bubbles: true }));
          sendResponse({ status: 'Success', detail: `Filled field with selector: ${command.selector}` });
        } else {
          const errorMsg = `Could not find input field with selector: ${command.selector}`;
          console.error(errorMsg);
          sendResponse({ status: 'Error', detail: errorMsg });
        }
      } else {
        const errorMsg = 'Fill command requires "selector" and "value" properties.';
        console.error(errorMsg);
        sendResponse({ status: 'Error', detail: errorMsg });
      }
      break;

    case 'scroll_page':
      window.scrollBy(0, window.innerHeight);
      sendResponse({ status: 'Success', detail: 'Scrolled down one page.' });
      break;

    case 'get_current_url':
      sendResponse({ status: 'Success', data: window.location.href });
      break;

    case 'go_back':
      window.history.back();
      sendResponse({ status: 'Success', detail: 'Navigated back.' });
      break;

    default:
      const errorMsg = `Unknown command action: ${command.action}`;
      console.error(errorMsg);
      sendResponse({ status: 'Error', detail: errorMsg });
  }

  // Return true to keep the message channel open for asynchronous responses.
  return true;
});

/**
 * Checks if an element is visible in the DOM.
 * @param {Element} elem The element to check.
 * @returns {boolean} True if the element is visible, false otherwise.
 */
function isElementVisible(elem) {
  return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
}

function generateUniqueSelector(element) {
    if (element.id) {
        // If the ID is unique, it's the best selector
        if (document.querySelectorAll(`#${element.id}`).length === 1) {
            return `#${CSS.escape(element.id)}`;
        }
    }

    let path = '';
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() !== 'body') {
        let selector = current.tagName.toLowerCase();
        const siblings = Array.from(current.parentElement.children).filter(child => child.tagName === current.tagName);
        if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `:nth-of-type(${index})`;
        }
        path = selector + (path ? ' > ' + path : '');
        
        try {
            if (document.querySelectorAll(path).length === 1) {
                return path;
            }
        } catch (e) {
            // The path might be invalid during construction, ignore
        }

        current = current.parentElement;
    }
    // Fallback to the generated path, even if not unique
    return path;
}
