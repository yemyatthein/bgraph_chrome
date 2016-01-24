var ymt = ymt || {};

ymt.popup = {
    view_bgraph: function() {
        chrome.tabs.create(
            {url: chrome.extension.getURL("pages/view.html")})
    }
}

window.addEventListener('DOMContentLoaded', function(evt) {
    $("[name='my-checkbox']").bootstrapSwitch({size: "mini"});
    
    $("#view_bgraph").click(ymt.popup.view_bgraph);
    
    $("#record_toggle").on('switchChange.bootstrapSwitch', function(event, state) {
        chrome.runtime.sendMessage({
            from    : "popup",
            actiom  : "record_toggle",
            toggle  : state
        });
    });
});

