var ymt = ymt || {};

ymt.save = {
    refined_data: undefined,
}


window.addEventListener('DOMContentLoaded', function(evt) {

    $.ajax({
        type: "GET",
        url: "http://localhost:5000/is_authenticated",
        success: function(response) {
            if (response.user_authenticated === false) {
                window.open(
                    "http://localhost:5000/login?referer=" 
                    + encodeURIComponent(window.location.href),
                    "_blank");
            }
        },
        dataType: "json"
    });

    chrome.runtime.getBackgroundPage(function(eventPage) {

        var concept_name = eventPage.bgraph.bg_page.data.concept_name;
        $("#save_concept_name").val(concept_name);

        // Set current concept name
        var concept_name = eventPage.bgraph.bg_page.data.concept_name;
        $(".current_concept_title").text(concept_name);

        $("#save_in_cloud").click(function() {
			var original_data = eventPage.bgraph.bg_page.data;
			var refined_data  = eventPage.bgraph.bg_page.refined_data;

            var concept_data = {
				name 		: $("#save_concept_name").val(),
				description	: $("#save_concept_description").val(),
				tags		: $("#save_concept_tags").val(),
				visibility	: $("input[name=save_concept_visible]:checked").val()
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

