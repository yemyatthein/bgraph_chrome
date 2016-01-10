var ymt = ymt || {};

ymt.main = {
    new_tab: function() {
        chrome.tabs.create(
            {url: chrome.extension.getURL("view.html")})
    }
}

window.addEventListener('DOMContentLoaded', function(evt) {
    document.getElementById("new_tab").addEventListener("click", ymt.main.new_tab);
});

