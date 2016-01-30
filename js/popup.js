var ymt = ymt || {};

ymt.popup = {
    view_bgraph: function() {
        chrome.tabs.create(
            {url: chrome.extension.getURL("pages/view.html")})
    }
}

window.addEventListener('DOMContentLoaded', function(evt) {

    $("[name='my-checkbox']").bootstrapSwitch({size: "normal", onColor: "primary"});
    
    $("#view_bgraph").click(ymt.popup.view_bgraph);
    
    $("#record_toggle").on('switchChange.bootstrapSwitch', function(event, state) {
        chrome.runtime.sendMessage({
            from    : "popup",
            actiom  : "record_toggle",
            toggle  : state
        });
    });

    $("#btn_new_topic").on("click", function() {
        $("#new_topic_ask_container").hide();
        $("#new_topic_form_container").show();
    });

    $("#btn_create_now").on("click", function() {
        //$("#new_topic_form_container").hide();
        $("#new_topic_ask_container").hide();
        $("#currently_pursuing").show();
        
        if ($("#topic_name").val()) {
            $("#current_concept_title").text($("#topic_name").val());
        }
    });
});

