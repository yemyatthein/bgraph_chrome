var ymt = {};

ymt.main = {
    new_tab: function() {
        chrome.tabs.create(
            {url: chrome.extension.getURL("popup.html")})
    },

    renderGraph: function (nodes, edges) {
        
        var container = document.getElementById('mynetwork');
        
        var options = {};
        var data    = {nodes: nodes, edges: edges};
        
        var network = new vis.Network(container, data, options);
    },
}


window.addEventListener('DOMContentLoaded', function(evt) {

    document.getElementById("new_tab")
        .addEventListener("click", ymt.main.new_tab);

    var nodes = [];
    var edges = [];

    var nodes_hash = {};

    var updateNodeData = function(node_name) {

    };
    
    chrome.runtime.getBackgroundPage(function(eventPage) {
        var edge_info   = eventPage.bgraph.bg_page.data.edge;
        var page_info   = eventPage.bgraph.bg_page.data.page_info;
        var stack_info  = eventPage.bgraph.bg_page.data.stack;
        var origin_info = eventPage.bgraph.bg_page.data.origin;

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
                            image  : icon_url
                        };
                    } else {
                        if (page.page_title === "") {
                            var node = {
                                id      : page.page_url, 
                                label   : page.page_url.slice(0, 25), 
                                shape   : node_type,
                                image   : icon_url
                            };
                        } else {
                            var node = {
                                id      : page.page_url, 
                                label   : page.page_title.slice(0, 25), 
                                shape   : node_type,
                                image   : icon_url
                            };
                        }
                    }

                    nodes_hash[node_name] = node;
                    nodes.push(node);
                }
            });
            
            edges.push({"from": source, "to": target, "arrows": "to"});
        });

        ymt.main.renderGraph(nodes, edges);
    });
    
});

