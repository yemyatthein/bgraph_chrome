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
    $("#record_toggle").on('switchChange.bootstrapSwitch', function(event, state) {
        chrome.runtime.sendMessage({
            from    : "popup___record_roggle",
            toggle  : state
        });
    });
});

