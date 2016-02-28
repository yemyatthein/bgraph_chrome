var ymt = ymt || {};


ymt.view = {

    // Render graph in vis js given graph data. Register event
    // handlers for clicking on nodes as well.
    // 
    renderGraph: function (nodes, edges, edge_data, page_info) {
        "use strict";

        // Convert to vis data format
        nodes = new vis.DataSet(nodes);
        edges = new vis.DataSet(edges);

        // HTML element in which graph is shown
        var container = $('#network-graph')[0];
        
        // Data for vis js
        var options = {};
        var data    = {nodes: nodes, edges: edges};
        
        var network = new vis.Network(container, data, options);

        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                // Clicking on a node

                ymt.url_summary.show(params.nodes[0], 
                                     edge_data, page_info,
                                     $("#url-summary-table"),
                                     $(".main-url-incoming-holder"),
                                     $(".main-url-outgoing-holder"),
                                     $("#no-summary-info-holder"));
            } 
            else {
                // Clicking on no node, hide summary info

                $("#no-summary-info-holder").show();
                $("#url-summary-table").hide();
                $(".main-url-incoming-holder").hide();
                $(".main-url-outgoing-holder").hide();
            }
            
        });
    },
};


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
        ymt.view.renderGraph(data.nodes, data.edges, data.edge_data, ds_page_info);

    });
    
});

