// TODO: use strict add, clean up

var ymt = ymt || {};

ymt.lib = {
    
    buildGraph: function (ds_edge, ds_page_info, ds_stack, ds_origin) {
        "use strict";

        // Temporaries

        var TAB_STACK  = "tab_stack___";
        var TAB_ORIGIN = "tab_origin___";
        var EDGE       = "edge___";
        var REPLACED   = "___replaced___";

        var constants  = {
            NODE_STATUS: {
                NO_FAULT      : "Page info exists",
                NO_PAGE_INFO  : "No page info",
                NO_PAGE_TITLE : "No page title",
            },
            CHROME_NEWTAB: "chrome://newtab/",
        }

        // Initialize result variables

        var nodes = [];
        var edges = [];

        var nodes_hash = {};
        var edges_hash = {};

        var edge_data = {};

        var nodes_with_incoming = {};

        // Constants for node types in vis js

        var NODE_TYPE = "image";
        var ICON_URL  = "http://flyosity.com/images/_blogentries/networkicon/stepfinal2.png";
        var ROOT_ICON = "https://cdn2.iconfinder.com/data/icons/Siena/256/globe.png";
        var MAX_CHAR  = 20;

        Object.keys(ds_edge).forEach(function(k){
            var obj = ds_edge[k];

            var source = obj.source;
            var target = obj.target;

            if (source.startsWith(REPLACED)) {
                
                // Internal tab replacement, get source from origin
                var tab_id    = source.split(REPLACED)[1].split("___")[0];
                var tab_stack = ds_stack[TAB_STACK + tab_id];

                // For some reason replace source tab not available, thus, ignore the source
                if (tab_stack === undefined) {
                    source = undefined;
                    console.log("DEBUG: Replaced tab stack origin (" + tab_id + ") not found.");
                } 
                else {
                    source = tab_stack[tab_stack.length - 1].url;
                }

            } 
            else if (source === "") {
                // Link with <a href...target="_blank" ..>
                
                var tab_origin = ds_origin[TAB_ORIGIN + obj.source_tab_id];
                var tab_stack  = ds_stack[TAB_STACK + tab_origin.openerTabId];
                
                if (tab_stack) {
                    source = tab_stack[tab_stack.length - 1].url;
                }
                else {
                    source = undefined;
                    console.log("DEBUG: Tab stack not found for " + tab_origin.openerTabId + ".")
                }
            }

            [source, target].forEach(function (node_name) {

                if (node_name && (nodes_hash[node_name] === undefined)) {

                    var page = ds_page_info[node_name];
                    
                    if (page === undefined) {
                        // Page info is not available, can't really do anything, so just use url
                        var node = {
                            id     : node_name, 
                            label  : node_name.slice(0, MAX_CHAR), 
                            shape  : NODE_TYPE,
                            image  : ( node_name === constants.CHROME_NEWTAB ? ROOT_ICON : ICON_URL ),
                            title  : node_name,
                            fault  : constants.NODE_STATUS.NO_PAGE_INFO
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
                                fault   : constants.NODE_STATUS.NO_PAGE_TITLE
                            };
                        } else {
                            // Page info is available for use
                            var node = {
                                id      : node_name, 
                                label   : page.page_title.slice(0, MAX_CHAR), 
                                shape   : NODE_TYPE,
                                image   : ICON_URL,
                                title   : page.page_title,
                                fault   : constants.NODE_STATUS.NO_FAULT
                            };
                        }
                    }
                    // Add to node list
                    nodes.push(node);

                    // Remember the node is already encountered
                    nodes_hash[node_name] = node;
                }
            });

            if (source && (source !== target)) {

                // Remember target as outgoing node in source's edge data
                var current_source = edge_data[source] || {"incoming": [], "outgoing": []};
                current_source.outgoing.push(target);
                edge_data[source] = current_source;

                // Remember source as incoming node in target's edge data
                var current_target   = edge_data[target] || {"incoming": [], "outgoing": []};
                current_target.incoming.push(source);
                edge_data[target] = current_target;

                if (edges_hash[source + target] === undefined) {
                    
                    // Record target is a node with at least one incoming edge
                    nodes_with_incoming[target] = true;
                    
                    edges.push({"from": source, "to": target, "arrows": "to"});
                    edges_hash[source + target] = edges[edges.length - 1];
                }
            }

        });

        // Remove faulty nodes and edges

        var nodes_to_remove = [];
        var edges_to_remove = [];

        nodes.forEach(function(node, index) {
            if ((node.fault === constants.NODE_STATUS.NO_PAGE_INFO || 
                node.fault === constants.NODE_STATUS.NO_PAGE_TITLE) && 
                node.id !== constants.CHROME_NEWTAB) {

                var edge_data_of_node = edge_data[node.id];

                if (edge_data_of_node) {
                    
                    // Consider only when there is only one incoming and outgoing link
                    if (edge_data_of_node.incoming.length > 1 || edge_data.outgoing.length > 1) {
                        return;
                    }

                    // Source and target node to/from the faulty node
                    var faulty_source = edge_data_of_node.incoming[0];
                    var faulty_target = edge_data_of_node.outgoing[0];

                    var faulty_source_edge_data = edge_data[faulty_source];

                    if (faulty_source_edge_data) {

                        // Update edge data of faulty node's incoming node
                        var new_outgoing = [];
                        faulty_source_edge_data.outgoing.forEach(function(outgoing_url) {
                            if (outgoing_url !== node.id) {
                                new_outgoing.push(outgoing_url);
                            }
                        });

                        if (faulty_target) {
                            new_outgoing.push(faulty_target);
                        }

                        edge_data[faulty_source].outgoing = new_outgoing;
                    }

                    var faulty_target_edge_data = edge_data[faulty_target];

                    if (faulty_target_edge_data) {

                        // Update edge data of faulty node's outgoing node
                        var new_incoming = [];
                        faulty_target_edge_data.incoming.forEach(function(incoming_url) {
                            if (incoming_url !== node.id) {
                                new_incoming.push(incoming_url);
                            }
                        });
                        
                        if (faulty_source) {
                            new_incoming.push(faulty_source);
                        }
                        
                        edge_data[faulty_target].incoming = new_incoming;

                        if (edge_data[faulty_target].incoming.length < 1 && 
                            faulty_target in nodes_with_incoming) {

                            delete nodes_with_incoming[faulty_target];
                        }

                        // TODO: Reconsider!
                        // Add an edge and update edges hash
                        if (edges_hash[faulty_source + faulty_target] === undefined) {
                            edges.push({"from": faulty_source, "to": faulty_target, "arrows": "to"});
                            edges_hash[faulty_source + faulty_target] = edges[edges.length - 1];
                        }

                        // Edges to be removed
                        edges_to_remove.push({ from: faulty_source, to: node.id });
                        edges_to_remove.push({ from: node.id, to: faulty_target });
                    }

                    // Nodes to be removed
                    nodes_to_remove.push({ node: node, node_index: index });

                }
            }
        });

        // Remove nodes and nodes hash
        nodes_to_remove.forEach(function(node_data) {
            delete nodes[node_data.node_index];
            delete nodes_hash[node_data.node.id];
        });

        // Remove edges

        var edges_to_remove_set = {};
        edges_to_remove.forEach(function(edge_data) {
            edges_to_remove_set[edge_data.from + edge_data.to] = true;
        });

        var edges_to_remove_ind = [];
        edges.forEach(function(edge, index) {
            if (edges_to_remove_set[edge.from + edge.to]) {
                edges_to_remove_ind.push(index);

                // Remove edges hash
                delete edges_hash[edge.from + edge.to];
            }
        });

        edges_to_remove_ind.forEach(function(k) {
            delete edges[k];
        });

        // Update nodes and edges before rendering in UI

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

        nodes = refined_nodes;
        edges = refined_edges;


        // Add edge for all orphans
        var nodes_with_no_incoming = {};
        nodes.forEach(function(node) {
            if (!(node.id in nodes_with_incoming)) {
                nodes_with_no_incoming[node.id] = node;
            }
        });

        if (Object.keys(nodes_with_no_incoming).length > 1) {
            
            // chrome:tab url
            var root = nodes_with_no_incoming[ymt.view.constants.CHROME_NEWTAB];
            
            Object.keys(nodes_with_no_incoming).forEach(function(k) {
                if (k !== ymt.view.constants.CHROME_NEWTAB) {
                    edges.push({"from": root.id, "to": k, "arrows": "to"});
                    edges_hash[root + k] = edges[edges.length - 1];
                }
            });

        }

        var return_data = {
            nodes     : nodes,
            edges     : edges,
            edge_data : edge_data,
        };

        return return_data;

    }
};

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
        "use strict";

        // Convert to vis data format
        nodes = new vis.DataSet(nodes);
        edges = new vis.DataSet(edges);

        var objref    = this;
        var container = $('#network-graph')[0];
        
        var options = {};
        var data    = {nodes: nodes, edges: edges};
        
        var network = new vis.Network(container, data, options);

        network.on("click", function (params) {
            if (params.nodes.length > 0) {
                // Clicking on a node
                
                var page = objref.page_info[params.nodes[0]];
                
                if (page) {

                    // Main url info
                    $("#main-url-title").html("<a href=\"#\">" + page.page_title + "</a>");
                    $("#main-url-description-holder").html(page.description);
                    $("#main-url-image").attr("src", page.image);

                    var incoming = $(".url-incoming-content");
                    var outgoing = $(".url-outgoing-content");
                    
                    $("no-summary-info-holder").hide();

                    $("url-summary-table").show();

                    var incoming_container = $(".main-url-incoming-holder");
                    incoming_container.show();

                    var outgoing_container = $(".main-url-outgoing-holder");
                    outgoing_container.show();
                    
                    incoming.html("");
                    outgoing.html("");

                    var edge = objref.edge_data[params.nodes[0]];

                    if (edge) {

                        // Render incoming and outgoing links

                        [[incoming,edge.incoming], [outgoing,edge.outgoing]].forEach(function(item) {
                            
                            var holder = item[0],
                                urls   = item[1];
                          
                            urls.forEach(function(url) {
                                if (url !== ymt.view.constants.CHROME_NEWTAB) {
                                    var url_row_html = "<div class=\"row row-eq-height\">" + 
                                                        "<div class=\"col-md-1\"><img src=\"" + 
                                                        (objref.page_info[url].favicon) + 
                                                        "\" width=\"16px\" height=\"16px\" />" + 
                                                        "</div><div class=\"col-md-11\">" + 
                                                        "<a href=\"#\">" + 
                                                        (objref.page_info[url].page_title || url) + 
                                                        "</a></div></div>";
                                    
                                    holder.append(url_row_html);
                                }
                            });
                        });
                        
                        // No incoming or just a root as incoming node, thus hide the incoming links section
                        if ((edge.incoming.length == 0) || (edge.incoming.length == 1 && 
                            edge.incoming[0] === ymt.view.constants.CHROME_NEWTAB)) {
                            
                            incoming_container.hide();
                        }

                        // No outgoing node, thus hide the outgoing links section
                        if (edge.outgoing.length == 0) {
                            outgoing_container.hide();
                        }
                    }
                    
                } 
                else {
                    $("#no-summary-info-holder").show();
                    $("#url-summary-table").hide();
                    $(".main-url-incoming-holder").hide();
                    $(".main-url-outgoing-holder").hide();
                }
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
}


window.addEventListener('DOMContentLoaded', function(evt) {
    
    var nodes = [];
    var edges = [];

    var nodes_with_incoming = {};

    var nodes_hash = {};
    var edges_hash = {};
    
    chrome.runtime.getBackgroundPage(function(eventPage) {
        
        // Set current concept name
        var concept_name = eventPage.bgraph.bg_page.data.concept_name;
        $(".current-concept-name").text(concept_name);
        
        // Constants for node types in vis js
        var NODE_TYPE = "image";
        var ICON_URL  = "http://flyosity.com/images/_blogentries/networkicon/stepfinal2.png";
        var ROOT_ICON = "https://cdn2.iconfinder.com/data/icons/Siena/256/globe.png";
        var MAX_CHAR  = 20;

        // Get data sources from background page
        var ds_edge         = eventPage.bgraph.bg_page.data.edge;
        var ds_page_info    = eventPage.bgraph.bg_page.data.page_info;
        var ds_stack        = eventPage.bgraph.bg_page.data.stack;
        var ds_origin       = eventPage.bgraph.bg_page.data.origin;

        ymt.view.page_info  = ds_page_info;
        
        /*
        Object.keys(ds_edge).forEach(function(k){
            var obj = ds_edge[k];

            var source = obj.source;
            var target = obj.target;

            if (source.startsWith("___replaced___")) {
                
                // Internal tab replacement, get source from origin
                var tab_id    = source.split("___replaced___")[1].split("___")[0];
                var tab_stack = ds_stack["tab_stack___" + tab_id];

                // For some reason replace source tab not available, thus, ignore the source
                if (tab_stack === undefined) {
                    source = undefined;
                    console.log("DEBUG: Replaced tab stack origin (" + tab_id + ") not found.");
                } 
                else {
                    source = tab_stack[tab_stack.length - 1].url;
                }

            } else if (source === "") {
                // Link with <a href...target="_blank" ..>
                
                var tab_origin = ds_origin["tab_origin___" + obj.source_tab_id];
                var tab_stack  = ds_stack["tab_stack___" + tab_origin.openerTabId];
                
                if (tab_stack) {
                    source = tab_stack[tab_stack.length - 1].url;
                }
                else {
                    source = undefined;
                    console.log("DEBUG: Tab stack not found for " + tab_origin.openerTabId + ".")
                }
            }

            [source, target].forEach(function (node_name) {

                if (node_name && (nodes_hash[node_name] === undefined)) {

                    var page = ds_page_info[node_name];
                    
                    if (page === undefined) {
                        // Page info is not available, can't really do anything, so just use url
                        var node = {
                            id     : node_name, 
                            label  : node_name.slice(0, MAX_CHAR), 
                            shape  : NODE_TYPE,
                            image  : ( node_name === ymt.view.constants.CHROME_NEWTAB ? ROOT_ICON : ICON_URL ),
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

            if (source && (source !== target)) {

                // Remember target as outgoing node in source's edge data
                var current_source = ymt.view.edge_data[source] || {"incoming": [], "outgoing": []};
                current_source.outgoing.push(target);
                ymt.view.edge_data[source] = current_source;

                // Remember source as incoming node in target's edge data
                var current_target   = ymt.view.edge_data[target] || {"incoming": [], "outgoing": []};
                current_target.incoming.push(source);
                ymt.view.edge_data[target] = current_target;

                if (edges_hash[source + target] === undefined) {
                    
                    // Record target is a node with at least one incoming edge
                    nodes_with_incoming[target] = true;
                    
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

                    // Source and target node to/from the faulty node
                    var faulty_source = edge_data.incoming[0];
                    var faulty_target = edge_data.outgoing[0];

                    var faulty_source_edge_data = ymt.view.edge_data[faulty_source];

                    if (faulty_source_edge_data) {

                        // Update edge data of faulty node's incoming node
                        var new_outgoing = [];
                        faulty_source_edge_data.outgoing.forEach(function(outgoing_url) {
                            if (outgoing_url !== node.id) {
                                new_outgoing.push(outgoing_url);
                            }
                        });

                        if (faulty_target) {
                            new_outgoing.push(faulty_target);
                        }

                        ymt.view.edge_data[faulty_source].outgoing = new_outgoing;
                    }

                    var faulty_target_edge_data = ymt.view.edge_data[faulty_target];

                    if (faulty_target_edge_data) {

                        // Update edge data of faulty node's outgoing node
                        var new_incoming = [];
                        faulty_target_edge_data.incoming.forEach(function(incoming_url) {
                            if (incoming_url !== node.id) {
                                new_incoming.push(incoming_url);
                            }
                        });
                        
                        if (faulty_source) {
                            new_incoming.push(faulty_source);
                        }
                        
                        ymt.view.edge_data[faulty_target].incoming = new_incoming;

                        if (ymt.view.edge_data[faulty_target].incoming.length < 1 && 
                            faulty_target in nodes_with_incoming) {

                            delete nodes_with_incoming[faulty_target];
                        }

                        // TODO: Reconsider!
                        // Add an edge and update edges hash
                        if (edges_hash[faulty_source + faulty_target] === undefined) {
                            edges.push({"from": faulty_source, "to": faulty_target, "arrows": "to"});
                            edges_hash[faulty_source + faulty_target] = edges[edges.length - 1];
                        }

                        // Edges to be removed
                        edges_to_remove.push({ from: faulty_source, to: node.id });
                        edges_to_remove.push({ from: node.id, to: faulty_target });
                    }

                    // Nodes to be removed
                    nodes_to_remove.push({ node: node, node_index: index });

                }
            }
        });
        
        // Remove nodes and nodes hash
        nodes_to_remove.forEach(function(node_data) {
            delete nodes[node_data.node_index];
            delete nodes_hash[node_data.node.id];
        });

        // Remove edges

        var edges_to_remove_set = {};
        edges_to_remove.forEach(function(edge_data) {
            edges_to_remove_set[edge_data.from + edge_data.to] = true;
        });

        var edges_to_remove_ind = [];
        edges.forEach(function(edge, index) {
            if (edges_to_remove_set[edge.from + edge.to]) {
                edges_to_remove_ind.push(index);

                // Remove edges hash
                delete edges_hash[edge.from + edge.to];
            }
        });

        edges_to_remove_ind.forEach(function(k) {
            delete edges[k];
        });

        // Update nodes and edges before rendering in UI

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

        nodes = refined_nodes;
        edges = refined_edges;


        // Add edge for all orphans
        var nodes_with_no_incoming = {};
        nodes.forEach(function(node) {
            if (!(node.id in nodes_with_incoming)) {
                nodes_with_no_incoming[node.id] = node;
            }
        });

        if (Object.keys(nodes_with_no_incoming).length > 1) {
            
            // chrome:tab url
            var root = nodes_with_no_incoming[ymt.view.constants.CHROME_NEWTAB];
            
            Object.keys(nodes_with_no_incoming).forEach(function(k) {
                if (k !== ymt.view.constants.CHROME_NEWTAB) {
                    edges.push({"from": root.id, "to": k, "arrows": "to"});
                    edges_hash[root + k] = edges[edges.length - 1];
                }
            });

        }

        */

        var data = ymt.lib.buildGraph(ds_edge, ds_page_info, ds_stack, ds_origin);

        ymt.view.edge_data = data.edge_data;

        console.log(ymt.view.edge_data);

        // Save constructed data in background page
        chrome.runtime.sendMessage({
            type : "graph_constructed",
            data : data
        });

        // Call render function
        ymt.view.renderGraph(data.nodes, data.edges);

    });
    
});

