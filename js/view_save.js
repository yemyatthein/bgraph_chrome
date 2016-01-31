var ymt = ymt || {};

ymt.save = {
    refined_data: undefined,
}


window.addEventListener('DOMContentLoaded', function(evt) {

    
    chrome.runtime.getBackgroundPage(function(eventPage) {

        // Set current concept name
        var concept_name = eventPage.bgraph.bg_page.data.concept_name;
        $(".current_concept_title").text(concept_name);

    });
    
});

