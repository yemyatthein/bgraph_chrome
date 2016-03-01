var ymt = ymt || {};


window.addEventListener('DOMContentLoaded', function(evt) {

    $(".each-concept-holder").click(function(e) {
        var uid = $(e.currentTarget).attr("data-id");
        window.location.href = "view/" + uid;
    });
    
});

