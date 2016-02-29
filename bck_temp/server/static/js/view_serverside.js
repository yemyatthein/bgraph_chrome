var ymt = ymt || {};

ymt.view = {

    constants: {
        NODE_STATUS: {
            NO_FAULT      : "Page info exists",
            NO_PAGE_INFO  : "No page info",
            NO_PAGE_TITLE : "No page title",
        },
        CHROME_NEWTAB: "chrome://newtab/",
    },

    edge_data: {},

    page_info: {},

    renderGraph: function (nodes, edges) {

        // Convert to vis data format
        nodes = new vis.DataSet(nodes);
        edges = new vis.DataSet(edges);

        var objref    = this;
        var container = document.getElementById('mynetwork');
        
        var options = {};
        var data    = {nodes: nodes, edges: edges};
        
        var network = new vis.Network(container, data, options);

        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                // Clicking on a node
                
                var p = objref.page_info[params.nodes[0]];
                
                if (p) {

                    // Main url info
                    document.getElementById("main_url_title").innerHTML = "<a href=\"#\">" + p.page_title + "</a>";
                    document.getElementById("main_url_description").innerHTML = p.description;
                    document.getElementById("main_url_image").setAttribute("src", p.image);

                    var incoming = document.getElementById("main_url_incoming");
                    var outgoing = document.getElementById("main_url_outgoing");
                    
                    var no_summary_container = document.getElementById("no_summary_info_container");
                    no_summary_container.style.display = "none";

                    var summary_container = document.getElementById("url_summary_table");
                    summary_container.style.display = null;

                    var incoming_container = document.getElementById("main_url_incoming_container");
                    incoming_container.style.display = null;

                    var outgoing_container = document.getElementById("main_url_outgoing_container");
                    outgoing_container.style.display = null;
                    
                    incoming.innerHTML = "";
                    outgoing.innerHTML = "";

                    var e = objref.edge_data[params.nodes[0]];

                    console.log(e, params.nodes[0]);

                    if (e) {

                        // Render incoming links

                        e.incoming.forEach(function(url) {
                            if (url !== ymt.view.constants.CHROME_NEWTAB) {
                                var div  = document.createElement("div");
                                var attr = document.createAttribute("class");
                                attr.value = "container rel_link_container";
                                div.setAttributeNode(attr);
                                
                                div.innerHTML = "<div class=\"row\"><div class=\"col-md-1\" style=\"padding-left:5px; " + 
                                                "padding-right:0px; padding-top:0px;\"><img src=\"" + 
                                                (objref.page_info[url].favicon) + "\" width=\"16px\" height=\"16px\" />" + 
                                                "</div><div class=\"col-md-11\" style=\"padding-left:0px; padding-right:" + 
                                                "0px;\"><a href=\"#\">" + (objref.page_info[url].page_title || url) + 
                                                "</a></div></div>";
                                
                                incoming.appendChild(div);
                            }
                        });

                        // Render outgoing links

                        e.outgoing.forEach(function(url) {
                            var div  = document.createElement("div");
                            var attr = document.createAttribute("class");
                            attr.value = "container rel_link_container";
                            div.setAttributeNode(attr);
                            
                            div.innerHTML = "<div class=\"row\"><div class=\"col-md-1\" style=\"padding-left:5px; " + 
                                            "padding-right:0px; padding-top:0px;\"><img src=\"" + 
                                            (objref.page_info[url].favicon) + "\" width=\"16px\" height=\"16px\" />" + 
                                            "</div><div class=\"col-md-11\" style=\"padding-left:0px; padding-right:" + 
                                            "0px;\"><a href=\"#\">" + (objref.page_info[url].page_title || url) + 
                                            "</a></div></div>";
                            
                            outgoing.appendChild(div);
                        });

                        // No incoming or just a root as incoming node, thus hide the incoming links section
                        if ((e.incoming.length == 0) || (e.incoming.length == 1 && 
                            e.incoming[0] === ymt.view.constants.CHROME_NEWTAB)) {
                            
                            incoming_container.style.display = "none";
                        }

                        // No outgoing node, thus hide the outgoing links section
                        if (e.outgoing.length == 0) {
                            outgoing_container.style.display = "none";
                        }
                    }
                    
                } 
                else {
                    var summary_container = document.getElementById("url_summary_table");
                    summary_container.style.display = "none";

                    var no_summary_container = document.getElementById("no_summary_info_container");
                    no_summary_container.style.display = null;

                    var incoming_container = document.getElementById("main_url_incoming_container");
                    incoming_container.style.display = "none";

                    var outgoing_container = document.getElementById("main_url_outgoing_container");
                    outgoing_container.style.display = "none";
                }
            } 
            else {
                // Clicking on no node, hide summary info

                var no_summary_container = document.getElementById("no_summary_info_container");
                no_summary_container.style.display = null;

                var summary_container = document.getElementById("url_summary_table");
                summary_container.style.display = "none";

                var incoming_container = document.getElementById("main_url_incoming_container");
                incoming_container.style.display = "none";

                var outgoing_container = document.getElementById("main_url_outgoing_container");
                outgoing_container.style.display = "none";
            }
            
        });
    },
}


window.addEventListener('DOMContentLoaded', function(evt) {

    var nodes = [];
    var edges = [];

    var data_original_val = $("#data_original").val();
    var data_original = JSON.parse(decodeURIComponent(
        window.atob(data_original_val)));

    var data_refined_val = $("#data_refined").val();
    var data_refined = JSON.parse(decodeURIComponent(
        window.atob(data_refined_val)));

    ymt.view.edge_data = data_refined.edge_data;
    ymt.view.page_info = data_original.page_info;

    // Call render function
    ymt.view.renderGraph(data_refined.nodes, data_refined.edges);
    
});

