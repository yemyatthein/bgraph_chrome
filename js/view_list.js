window.addEventListener('DOMContentLoaded', function(evt) {

    // Sticky div for url summary

    var stickyTop      = $('.sticky').offset().top;
    var original_width = $('.sticky').outerWidth();

    $(window).scroll(function(){
        var windowTop = $(window).scrollTop();

        if (stickyTop < windowTop) {
            $('.sticky')
                .css({ position: 'fixed', top: 0 });
        }
        else {
            $('.sticky')
                .css('position','static')
                .css("width", original_width);
        }
    });

    chrome.runtime.getBackgroundPage(function(eventPage) {

        // Set current concept name
        
        $(".current-concept-name")
            .text(eventPage.bgraph.bg_page.data.concept_name);

        // Get data sources from background page
        var ds_page_info = eventPage.bgraph.bg_page.data.page_info;
        var edge_data    = eventPage.bgraph.bg_page.refined_data.edge_data;

        var resource_list = $(".resource-list");
        
        resource_list.hide();

        Object.keys(ds_page_info).forEach(function(k){
            
            var image = ds_page_info[k].image;
            var title = ds_page_info[k].page_title;

            if (title) {
                resource_list.append(
                    ymt.html_builder.gridItem(
                        ds_page_info[k].page_url, image, title));
            }

        });

        setTimeout(function() {
            resource_list.show();

            resource_list.masonry({
                itemSelector: '.grid-item'
            });

            $(".loading-icon-container").hide();
            $("#network-graph").css("height", "100%");

        }, 500);

        var selected = undefined;

        $(".grid-item").click(function(d){
            if (selected) {
                selected.css("background", "#FFF");
            }
            selected = $(this);
            selected.css("background", "#FEE6C4");

            ymt.url_summary.show(selected.attr("url-data"), 
                                 edge_data, ds_page_info,
                                 $("#url-summary-table"),
                                 $(".main-url-incoming-holder"),
                                 $(".main-url-outgoing-holder"),
                                 $("#no-summary-info-holder"));
        });

    });
    
});

