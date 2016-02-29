window.addEventListener('DOMContentLoaded', function(evt) {
    
    // Get background/event page
    chrome.runtime.getBackgroundPage(function(eventPage) {
        
        // Set current concept name
        $(".current-concept-name").text(eventPage.bgraph.bg_page.data.concept_name);
        
        // Get data sources from background page
        var ds_edge      = eventPage.bgraph.bg_page.data.edge;
        var ds_page_info = eventPage.bgraph.bg_page.data.page_info;
        var ds_stack     = eventPage.bgraph.bg_page.data.stack;
        var ds_origin    = eventPage.bgraph.bg_page.data.origin;

        // Build the graph from captured data
        var data = ymt.lib.buildGraph(ds_edge, ds_page_info, ds_stack, ds_origin);

        // Save constructed data in background page
        chrome.runtime.sendMessage({
            type : "graph_constructed",
            data : data
        });

        // Call render function
        ymt.lib.renderGraph(data.nodes, data.edges, data.edge_data, ds_page_info);

    });
    
});

