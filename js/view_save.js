var ymt = ymt || {};

ymt.save = {
    refined_data: undefined,
}


window.addEventListener('DOMContentLoaded', function(evt) {

    
    chrome.runtime.getBackgroundPage(function(eventPage) {

        // Set current concept name
        var concept_name = eventPage.bgraph.bg_page.data.concept_name;
        $(".current_concept_title").text(concept_name);

        $("#save_in_cloud").click(function() {
			var original_data = eventPage.bgraph.bg_page.data;
			var refined_data  = eventPage.bgraph.bg_page.refined_data;

			var concept_data = {
				name 		: "Popular Stuffs",
				description	: "It's about the popular news searching and reading.",
				tags		: "news gadget juzforlolz",
				visibility	: "PUBLIC"
			};

			var form_data = {
				concept  : JSON.stringify(concept_data),
				original : JSON.stringify(original_data),
				refined  : JSON.stringify(refined_data)
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

