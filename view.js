var ymt = ymt || {};

ymt.main = {
    edge_data: {
    },

    page_info: {
    },

    renderGraph: function (nodes, edges) {

        nodes = new vis.DataSet(nodes);
        edges = new vis.DataSet(edges);

        console.log(nodes);
        
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

                    //var outgoing = document.getElementById("main_url_outgoing");
                    //e.outgoing.forEach(function(url) {
                        //var b = document.createElement("li");
                        //b.innerHTML = "<a href=\"#\">" + url + "</a>";
                        //outgoing.appendChild(b);
                    //});

                    document.getElementById("main_url_title").innerHTML = "<a href=\"#\">" + p.page_title + "</a>";
                    document.getElementById("main_url_description").innerHTML = p.description;
                }
            }
            
        });
    },
}


window.addEventListener('DOMContentLoaded', function(evt) {

    var nodes = [];
    var edges = [];

    var nodes_hash = {};
    
    chrome.runtime.getBackgroundPage(function(eventPage) {
        var edge_info   = eventPage.bgraph.bg_page.data.edge;
        var page_info   = eventPage.bgraph.bg_page.data.page_info;
        var stack_info  = eventPage.bgraph.bg_page.data.stack;
        var origin_info = eventPage.bgraph.bg_page.data.origin;

        ymt.main.page_info = page_info;

        var node_type = "image";
        var icon_url  = "http://zura.vn/images/user.png";

        Object.keys(edge_info).forEach(function(k){
            var obj = edge_info[k];

            var source = obj.source;
            var target = obj.target;

            if (source.startsWith("___replaced___")) {
                var tab_id    = source.split("___replaced___")[1].split("___")[0];
                var tab_stack = stack_info["tab_stack___" + tab_id];
                source = tab_stack[tab_stack.length - 1].url;
            } else if (source === "") {
                var tab_origin = origin_info["tab_origin___" + obj.source_tab_id];
                var tab_stack = stack_info["tab_stack___" + tab_origin.openerTabId];
                source = tab_stack[tab_stack.length - 1].url;
            }

            [source, target].forEach(function (node_name) {

                if (nodes_hash[node_name] === undefined) {
                    var page = page_info[node_name];

                    if (page === undefined) {
                        var node = {
                            id     : node_name, 
                            label  : node_name.slice(0, 25), 
                            shape  : node_type,
                            image  : icon_url,
                            title  : node_name
                        };
                    } else {
                        if (page.page_title === "") {
                            var node = {
                                id      : page.page_url, 
                                label   : page.page_url.slice(0, 25), 
                                shape   : node_type,
                                image   : icon_url,
                                title   : page.page_url
                            };
                        } else {
                            var node = {
                                id      : page.page_url, 
                                label   : page.page_title.slice(0, 25), 
                                shape   : node_type,
                                image   : icon_url,
                                title   : page.page_title
                            };
                        }
                    }

                    nodes_hash[node_name] = node;
                    nodes_hash[node.id]   = node;

                    nodes.push(node);
                }
            });
            
            if (source !== target) {
                var edge_data = ymt.main.edge_data;

                var current_source   = edge_data[source] || {"incoming": [], "outgoing": []};
                current_source.outgoing.push(target);
                ymt.main.edge_data[source] = current_source;

                var current_target   = edge_data[target] || {"incoming": [], "outgoing": []};
                current_target.incoming.push(source);
                ymt.main.edge_data[target] = current_target;

                edges.push({"from": source, "to": target, "arrows": "to"});
            }
        });

        console.log(ymt.main.edge_data);

        ymt.main.renderGraph(nodes, edges);
    });
    
});

