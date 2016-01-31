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
    }
}

window.addEventListener('DOMContentLoaded', function(evt) {

    chrome.runtime.getBackgroundPage(function(event_page) {
        var concept_name = event_page.bgraph.bg_page.data.concept_name;
        
        console.log("DEBUG: Current concept name is " + concept_name);

        $("#view_bgraph").click(function() {
            ymt.popup.view_bgraph(event_page.bgraph.bg_page.data);
        });

        $("#end_bgraph").click(function() {
            $("#unsaved_warning").show();
        });

        $(document).click(function(e) {
            if( e.target.id !== 'unsaved_warning' && e.target.id !== "end_bgraph" && 
                e.target.id !== "unsaved_end_proceed") {
                
                $("#unsaved_warning").hide();
            }
        });

        $("#unsaved_end_proceed").click(function() {
            chrome.runtime.sendMessage({
                type : "end_concept"
            });

            $("#unsaved_warning").hide();
            $("#loading_concept").hide();
            $("#currently_pursuing").hide();
            $("#new_topic_ask_container").show();

            $("#topic_name").val("");
        });
        
        $("#btn_new_topic").on("click", function() {
            $("#new_topic_ask_container").hide();
            $("#new_topic_form_container").show();
        });

        $("#btn_create_now").on("click", function() {
            $("#loading_concept").hide();
            $("#new_topic_ask_container").hide();
            $("#currently_pursuing").show();

            var concept_name = $("#topic_name").val() || "Default Name";

            chrome.runtime.sendMessage({
                type : "new_concept",
                name : concept_name
            });
            
            $("#current_concept_title").text(concept_name);
            $("#current_concept_title_warning").text(concept_name);
        });

        if (concept_name) {
            $("#loading_concept").hide();
            $("#new_topic_ask_container").hide();
            $("#currently_pursuing").show();

            $("#current_concept_title").text(concept_name);
            $("#current_concept_title_warning").text(concept_name);
        }
        else {
            $("#loading_concept").hide();
            $("#currently_pursuing").hide();
            $("#new_topic_ask_container").show();
        }
    });

});

