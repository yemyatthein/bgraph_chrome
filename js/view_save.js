var ymt = ymt || {};


window.addEventListener('DOMContentLoaded', function(evt) {

    ymt.lib.isAuthenticated();

    chrome.runtime.getBackgroundPage(function(eventPage) {

        var concept_name = eventPage.bgraph.bg_page.data.concept_name;
        $("#save-concept-name").val(concept_name);

        // Set current concept name
        $(".current-concept-name").text(concept_name);

        $("#save-in-cloud").click(function(evt) {
            evt.preventDefault();

			var original_data = eventPage.bgraph.bg_page.data;
			var refined_data  = eventPage.bgraph.bg_page.refined_data;

            // Build index
            // --------------
            var inverted_index = {};

            Object.keys(original_data.page_info).forEach(function(url) {
                var page           = original_data.page_info[url];
                var indexable_data = page.page_title + page.description;
                indexable_data     = ymt.stopwords.removeStopWords(indexable_data);
                indexable_data     = indexable_data.split(" ");

                indexable_data = indexable_data
                    .filter(function(k) { 
                        return k.length > 3;
                    })
                    .map(function(k) { 
                        return k.replace(/,|\./g, "").toLowerCase(); 
                    });

                indexable_data.forEach(function(keyword) {
                    if (inverted_index[keyword] === undefined) {
                        inverted_index[keyword] = {};
                    }
                    inverted_index[keyword][url] = true;
                });
            });
            // --------------

            var concept_data = {
				name 		: $("#save-concept-name").val(),
				description	: $("#save-concept-description").val(),
				tags		: $("#save-concept-tags").val(),
				visibility	: $("input[name=save-concept-visible]:checked").val()
			};

			var form_data = {
				concept  : JSON.stringify(concept_data),
				original : JSON.stringify(original_data),
				refined  : JSON.stringify(refined_data),
                indexes  : JSON.stringify(inverted_index)
			};

            console.log("DEBUG: Submitting data to cloud.", form_data);

			$.ajax({
				type: "POST",
				url: "http://localhost:5000/save",
				data: form_data,
				success: function(response) {
					console.log("RETURNED: ", response);
				},
				dataType: "json"
			});

        });

    });
    
});

