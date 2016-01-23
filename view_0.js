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

        nodes = new vis.DataSet(nodes);
        edges = new vis.DataSet(edges);

        var container = document.getElementById('mynetwork');
        
        var options = {};
        var data    = {nodes: nodes, edges: edges};
        
        var network = new vis.Network(container, data, options);

        var objref = this;
        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                var p = objref.page_info[params.nodes[0]];
                var e = objref.edge_data[params.nodes[0]];

                if (p !== undefined && e !== undefined) {
                    var incoming       = document.getElementById("main_url_incoming");
                    var outgoing       = document.getElementById("main_url_outgoing");
                    incoming.innerHTML = "";
                    outgoing.innerHTML = "";
                    
                    e.incoming.forEach(function(url) {
                        if (url !== ymt.view.constants.CHROME_NEWTAB) {
                            var b = document.createElement("li");
                            b.innerHTML = "<a href=\"#\">" + objref.page_info[url].page_title || url + "</a>";
                            incoming.appendChild(b);
                        }
                    });

                    e.outgoing.forEach(function(url) {
                        var b = document.createElement("li");
                        b.innerHTML = "<a href=\"#\">" + objref.page_info[url].page_title || url + "</a>";
                        outgoing.appendChild(b);
                    });

                    document.getElementById("main_url_title").innerHTML = "<a href=\"#\">" + p.page_title + "</a>";
                    document.getElementById("main_url_description").innerHTML = p.description;
                    document.getElementById("main_url_image").setAttribute("src", p.image);
                }
            }
            
        });
    },
}


window.addEventListener('DOMContentLoaded', function(evt) {

    var nodes = [];
    var edges = [];

    var nodes_hash = {};
    var edges_hash = {};
    
    chrome.runtime.getBackgroundPage(function(eventPage) {
        
        // Constants for node types in vis js
        var NODE_TYPE = "image";
        var ICON_URL  = "http://flyosity.com/images/_blogentries/networkicon/stepfinal2.png";
        var MAX_CHAR  = 25;

        // Get data sources from background page
        var ds_edge         = eventPage.bgraph.bg_page.data.edge;
        var ds_page_info    = eventPage.bgraph.bg_page.data.page_info;
        var ds_stack        = eventPage.bgraph.bg_page.data.stack;
        var ds_origin       = eventPage.bgraph.bg_page.data.origin;

        ymt.view.page_info  = ds_page_info;
        
        Object.keys(ds_edge).forEach(function(k){
            var obj = ds_edge[k];

            var source = obj.source;
            var target = obj.target;

            if (source.startsWith("___replaced___")) {
                // Internal tab replacement, get source from origin
                var tab_id    = source.split("___replaced___")[1].split("___")[0];
                var tab_stack = ds_stack["tab_stack___" + tab_id];
                source        = tab_stack[tab_stack.length - 1].url;
            } else if (source === "") {
                // Link with <a href...target="_blank" ..>
                var tab_origin = ds_origin["tab_origin___" + obj.source_tab_id];
                var tab_stack  = ds_stack["tab_stack___" + tab_origin.openerTabId];
                source         = tab_stack[tab_stack.length - 1].url;
            }

            [source, target].forEach(function (node_name) {

                if (nodes_hash[node_name] === undefined) {
                    var page = ds_page_info[node_name];

                    if (page === undefined) {
                        // Page info is not available, can't really do anything, so just use url
                        var node = {
                            id     : node_name, 
                            label  : node_name.slice(0, MAX_CHAR), 
                            shape  : NODE_TYPE,
                            image  : ICON_URL,
                            title  : node_name,
                            fault  : ymt.view.constants.NODE_STATUS.NO_PAGE_INFO
                        };
                    } else {
                        if (page.page_title === "") {
                            // Page info is available with no title, so just use url for label
                            var node = {
                                id      : node_name, 
                                label   : page.page_url.slice(0, MAX_CHAR), 
                                shape   : NODE_TYPE,
                                image   : ICON_URL,
                                title   : page.page_url,
                                fault   : ymt.view.constants.NODE_STATUS.NO_PAGE_TITLE
                            };
                        } else {
                            // Page info is available for use
                            var node = {
                                id      : node_name, 
                                label   : page.page_title.slice(0, MAX_CHAR), 
                                shape   : NODE_TYPE,
                                image   : ICON_URL,
                                title   : page.page_title,
                                fault   : ymt.view.constants.NODE_STATUS.NO_FAULT
                            };
                        }
                    }
                    // Add to node list
                    nodes.push(node);

                    // Remember the node is already encountered
                    nodes_hash[node_name] = node;
                }
            });
            
            if (source !== target) {
                var edge_data = ymt.view.edge_data;

                // Remember target as outgoing node in source's edge data
                var current_source   = edge_data[source] || {"incoming": [], "outgoing": []};
                current_source.outgoing.push(target);
                ymt.view.edge_data[source] = current_source;

                // Remember source as incoming node in target's edge data
                var current_target   = edge_data[target] || {"incoming": [], "outgoing": []};
                current_target.incoming.push(source);
                ymt.view.edge_data[target] = current_target;

                if (edges_hash[source + target] === undefined) {
                    edges.push({"from": source, "to": target, "arrows": "to"});
                    edges_hash[source + target] = edges[edges.length - 1];
                }
            }
        });

        
        // Remove faulty nodes and edges

        var nodes_to_remove = [];
        var edges_to_remove = [];

        nodes.forEach(function(node, index) {
            if ((node.fault === ymt.view.constants.NODE_STATUS.NO_PAGE_INFO || 
                node.fault === ymt.view.constants.NODE_STATUS.NO_PAGE_TITLE) && 
                node.id !== ymt.view.constants.CHROME_NEWTAB) {

                var edge_data = ymt.view.edge_data[node.id];

                if (edge_data) {
                    
                    // Consider only when there is only one incoming and outgoing link
                    if (edge_data.incoming.length > 1 || edge_data.outgoing.length > 1) {
                        return;
                    }
                    var faulty_source = edge_data.incoming[0];
                    var faulty_target = edge_data.outgoing[0];

                    console.log("Faulty source and target:", faulty_source, faulty_target);

                    if (edges_hash[faulty_source + faulty_target] === undefined) {
                        edges.push({"from": faulty_source, "to": faulty_target, "arrows": "to"});
                        edges_hash[faulty_source + faulty_target] = edges[edges.length - 1];
                    }

                    nodes_to_remove.push({ node: node, node_index: index });
                    edges_to_remove.push({ from: faulty_source, to: node.id });
                    edges_to_remove.push({ from: node.id, to: faulty_target });

                }
            }
        });
        
        nodes_to_remove.forEach(function(node_data) {
            delete nodes[node_data.node_index];
        });

        // FIXME: Quadratic runtime
        var edges_to_remove_ind = [];
        edges.forEach(function(edge, index) {
            edges_to_remove.forEach(function(edge_data) {
                if (edge.from === edge_data.from && edge.to === edge_data.to) {
                    edges_to_remove_ind.push(index);
                }
            });            
        });

        edges_to_remove_ind.forEach(function(k) {
            delete edges[k];
        });

        var refined_nodes = [];
        var refined_edges = [];

        nodes.forEach(function(node) {
            if (node !== undefined) {
                refined_nodes.push(node);
            }
        });

        edges.forEach(function(edge) {
            if (edge !== undefined) {
                refined_edges.push(edge);
            }
        });

        ymt.view.renderGraph(refined_nodes, refined_edges);
    });
    
});

