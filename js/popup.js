var ymt = ymt || {};

ymt.popup = {
    
    view_bgraph: function(data) {
        data = {
            concept_name : undefined,
            stack        : {},
            origin       : {},
            page_info    : {},
            edge         : {}
        };

        chrome.tabs.create(
            {url: chrome.extension.getURL("pages/view.html")})
    },

    save_bgraph: function(data) {
        chrome.tabs.create(
            {url: chrome.extension.getURL("pages/view_save.html")})  
    }
}

window.addEventListener('DOMContentLoaded', function(evt) {

    chrome.runtime.getBackgroundPage(function(event_page) {
        var concept_name = event_page.bgraph.bg_page.data.concept_name;
        
        console.log("DEBUG: Current concept name is " + concept_name);

        $("#view-bgraph").click(function() {
            ymt.popup.view_bgraph(event_page.bgraph.bg_page.data);
        });

        $("#end-bgraph").click(function() {
            $("#unsaved-warning-display").show();
        });

        $("#new-bgraph").click(function() {
            $("#unsaved-warning-display").show();
        });

        $(".save-bgraph").click(function() {
            var form_data = {};
            ymt.popup.save_bgraph(form_data);
        });

        $("#close-warning-btn").click(function(e) {
            $("#unsaved-warning-display").hide();
        });

        $("#unsaved-end-proceed").click(function() {
            chrome.runtime.sendMessage({
                type : "end_concept"
            });

            $("#unsaved-warning-display").hide();
            $("#loading-concept").hide();
            $("#currently-pursuing").hide();
            $("#new-topic-ask-container").show();

            $("#topic-name").val("");
        });
        
        $("#btn-new-topic").on("click", function() {
            $("#new-topic-ask-container").hide();
            $("#new-topic-form-container").show();
        });

        $("#btn-create-now").on("click", function() {
            $("#loading-concept").hide();
            $("#new-topic-ask-container").hide();
            $("#currently-pursuing").show();

            var concept_name = $("#topic-name").val() || "Default Name";

            chrome.runtime.sendMessage({
                type : "new_concept",
                name : concept_name
            });
            
            $("#current-concept-title").text(concept_name);
            $("#current-concept-title-warning").text(concept_name);
        });

        if (concept_name) {
            $("#loading-concept").hide();
            $("#new-topic-ask-container").hide();
            $("#currently-pursuing").show();

            $("#current-concept-title").text(concept_name);
            $("#current-concept-title-warning").text(concept_name);
        }
        else {
            $("#loading-concept").hide();
            $("#currently-pursuing").hide();
            $("#new-topic-ask-container").show();
        }
    });

});

