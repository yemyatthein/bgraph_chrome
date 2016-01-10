chrome.runtime.sendMessage({
    "page_url": document.location.href,
    "page_title": document.title  
});