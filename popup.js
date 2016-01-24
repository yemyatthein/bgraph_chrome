var ymt = ymt || {};

ymt.popup = {
    view_bgraph: function() {
        chrome.tabs.create(
            {url: chrome.extension.getURL("view.html")})
    }
}

window.addEventListener('DOMContentLoaded', function(evt) {
    $("[name='my-checkbox']").bootstrapSwitch({size: "mini"});
    document.getElementById("view_bgraph").addEventListener("click", ymt.popup.view_bgraph);
});

