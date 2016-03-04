var ymt = ymt || {};


ymt.html_builder = {

    gridItem: function (url, image, title) {
        "use strict";

        var html = "<div class=\"grid-item\" url-data=\"" + url + 
                    "\"><img src=\"" + image + "\" width=\"100%\"" +
                    "/><div><span style=\"font-size:12px;\">" + 
                    title + "</span></div></div>";
        return html;
    },

    relatedUrl: function (url_icon, page_title) {
        "use strict";

        var html = "<div class=\"row row-eq-height\">" + 
                   "<div class=\"col-md-1\"><img src=\"" + 
                   url_icon + "\" width=\"16px\" height=\"16px\" />" + 
                   "</div><div class=\"col-md-11\">" + 
                   "<a href=\"#\">" + page_title + 
                   "</a></div></div>";
        return html;   
    }

};


ymt.url_summary = {

    show: function (url, edge_data, page_info, elem_main_outer, 
                    elem_incoming_outer, elem_outgoing_outer,
                    elem_no_data_outer, elem_delete_btn) {
        "use strict";

        var page = page_info[url];
        
        if (page) {

            // Main url info
            $(".main-url-title", elem_main_outer).html("<a href=\"#\">" + page.page_title + "</a>");
            $(".main-url-description", elem_main_outer).html(page.description);
            $(".main-url-image", elem_main_outer).attr("src", page.image);

            var incoming = $(".url-incoming-content", elem_incoming_outer);
            var outgoing = $(".url-outgoing-content", elem_outgoing_outer);
            
            $(elem_no_data_outer).hide();
            $(elem_main_outer).show();

            $(elem_delete_btn).unbind("click");

            $(elem_delete_btn).click(function(evt) {
                evt.preventDefault();

                if (confirm("Are you sure want to delete \"" + 
                            page.page_title + "\"?")) {
                    
                    // Send message to event page to delete node
                    chrome.runtime.sendMessage({
                        type    : "node_deleted",
                        node_id : url
                    }, function(response) {
                        window.location.reload();
                    });
                
                }
            });

            var incoming_container = $(elem_incoming_outer);
            incoming_container.show();

            var outgoing_container = $(elem_outgoing_outer);
            outgoing_container.show();
            
            incoming.html("");
            outgoing.html("");

            var edge = edge_data[url];

            if (edge) {

                // Render incoming and outgoing links

                [[incoming, edge.incoming], [outgoing, edge.outgoing]].forEach(function(item) {
                    
                    var holder = item[0],
                        urls   = item[1];
                  
                    urls.forEach(function(url) {
                        if (url !== ymt.lib.constants.CHROME_NEWTAB) {
                            holder.append(
                                ymt.html_builder.relatedUrl(
                                    page_info[url].favicon, page_info[url].page_title || url));
                        }
                    });
                });
                
                // No incoming or just a root as incoming node, thus hide the incoming links section
                if ((edge.incoming.length == 0) || (edge.incoming.length == 1 && 
                    edge.incoming[0] === ymt.lib.constants.CHROME_NEWTAB)) {
                    
                    incoming_container.hide();
                }

                // No outgoing node, thus hide the outgoing links section
                if (edge.outgoing.length == 0) {
                    outgoing_container.hide();
                }
            }
            
        } 
        else {
            $(elem_no_data_outer).show();
            $(elem_main_outer).hide();
            $(elem_incoming_outer).hide();
            $(elem_outgoing_outer).hide();
        }
    }
};


ymt.lib = {

    // Constants used in multiple places
    // 
    constants: {
        NODE_STATUS: {
            NO_FAULT      : "Page info exists",
            NO_PAGE_INFO  : "No page info",
            NO_PAGE_TITLE : "No page title",
        },
        DATA_PREFIX: {
            TAB_STACK  : "tab_stack___",
            TAB_ORIGIN : "tab_origin___",
            REPLACED   : "___replaced___"
        },
        CHROME_NEWTAB: "chrome://newtab/",
    },

    // Get values of first level key of object
    //
    getValues : function (obj) {
        var values = [];
        Object.keys(obj).forEach(function (key) {
            values.push(obj[key]);
        });
        return values;
    },

    // Transform an array of nodes to object key being node id
    // and value being node value.
    // 
    nodesToNodesHash : function (nodes, excludes) {
        var nodes_hash = {};

        nodes.forEach(function(node){
            if (excludes[node.id] !== undefined) {
                return;
            }
            nodes_hash[node.id] = node;
        });

        return nodes_hash;
    },

    // Transform an array of edges to object key being "from+to"
    // and value being edge value.
    // 
    edgesToEdgesHash : function (edges, excludes) {
        var edges_hash = {};

        edges.forEach(function(edge){
            edges_hash[edge.from + edge.to] = edge;
        });

        return edges_hash;
    },

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
                                     $("#no-summary-info-holder"),
                                     $("#main-url-delete-btn"));
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

    // Check if user is logged in
    // 
    isAuthenticated: function () {
        "use strict";

        $.ajax({
            type: "GET",
            url: "http://localhost:5000/is_authenticated",
            success: function(response) {
                if (response.user_authenticated === false) {
                    window.open(
                        "http://localhost:5000/login",
                        "_blank");
                }
            },
            dataType: "json"
        });
    },
    
    // Build a browsing graph from data captured by background/event page
    // 
    buildGraph: function (ds_edge, ds_page_info, ds_stack, ds_origin, 
                          ds_deleted) {
        "use strict";

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

            if (source.startsWith(ymt.lib.constants.DATA_PREFIX.REPLACED)) {
                
                // Internal tab replacement, get source from origin
                var tab_id    = source.split(ymt.lib.constants.DATA_PREFIX.REPLACED)[1].split("___")[0];
                var tab_stack = ds_stack[ymt.lib.constants.DATA_PREFIX.TAB_STACK + tab_id];

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
                
                var tab_origin = ds_origin[ymt.lib.constants.DATA_PREFIX.TAB_ORIGIN + obj.source_tab_id];
                var tab_stack  = ds_stack[ymt.lib.constants.DATA_PREFIX.TAB_STACK + tab_origin.openerTabId];
                
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
                            image  : ( node_name === ymt.lib.constants.CHROME_NEWTAB ? ROOT_ICON : ICON_URL ),
                            title  : node_name,
                            fault  : ymt.lib.constants.NODE_STATUS.NO_PAGE_INFO
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
                                fault   : ymt.lib.constants.NODE_STATUS.NO_PAGE_TITLE
                            };
                        } else {
                            // Page info is available for use
                            var node = {
                                id      : node_name, 
                                label   : page.page_title.slice(0, MAX_CHAR), 
                                shape   : NODE_TYPE,
                                image   : ICON_URL,
                                title   : page.page_title,
                                fault   : ymt.lib.constants.NODE_STATUS.NO_FAULT
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
            if ((node.fault === ymt.lib.constants.NODE_STATUS.NO_PAGE_INFO || 
                node.fault === ymt.lib.constants.NODE_STATUS.NO_PAGE_TITLE) && 
                node.id !== ymt.lib.constants.CHROME_NEWTAB) {

                var edge_data_of_node = edge_data[node.id];

                if (edge_data_of_node) {
                    
                    // Consider only when there is only one incoming and outgoing link
                    if (edge_data_of_node.incoming.length > 1 || edge_data_of_node.outgoing.length > 1) {
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
            var root = nodes_with_no_incoming[ymt.lib.constants.CHROME_NEWTAB];
            
            Object.keys(nodes_with_no_incoming).forEach(function(k) {
                if (k !== ymt.lib.constants.CHROME_NEWTAB) {
                    edges.push({"from": root.id, "to": k, "arrows": "to"});
                    edges_hash[root + k] = edges[edges.length - 1];
                }
            });

        }

        var return_data = {
            nodes     : ymt.lib.nodesToNodesHash(nodes, ds_deleted),
            edges     : ymt.lib.edgesToEdgesHash(edges, ds_deleted),
            edge_data : edge_data,
        };

        return return_data;

    }
};