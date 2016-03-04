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
        var ds_deleted   = eventPage.bgraph.bg_page.data.deleted;

        // Build the graph from captured data
        var data = ymt.lib.buildGraph(ds_edge, ds_page_info, ds_stack, ds_origin, ds_deleted);

        // Save constructed data in background page
        chrome.runtime.sendMessage({
            type : "graph_constructed",
            data : data
        });

        var nodes = ymt.lib.getValues(data.nodes);
        var edges = ymt.lib.getValues(data.edges);

        // Call render function
        ymt.lib.renderGraph(nodes, edges, data.edge_data, ds_page_info);

    });
    
});

