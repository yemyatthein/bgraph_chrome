var ymt = {};

ymt.main = {
    _getDomainName : function(url) {
        var url_base = url.split("//")[1].split("/")[0].split(".");
        if (url_base.length > 1) {
            return url_base[1].toUpperCase();
        } else {
            return url_base[0].toUpperCase();
        }
    },
    renderGraph : function (nodes, edges) {
        // create an array with nodes
        var _nodes = new vis.DataSet([
            {id: 1, label: 'Node 1'},
            {id: 2, label: 'Node 2'},
            {id: 3, label: 'Node 3'},
            {id: 4, label: 'Node 4'},
            {id: 5, label: 'Node 5'}
        ]);

        // create an array with edges
        var _edges = new vis.DataSet([
            {from: 1, to: 3},
            {from: 1, to: 2},
            {from: 2, to: 4},
            {from: 2, to: 5}
        ]);

        // create a network
        var container = document.getElementById('mynetwork');
        var data = {
            nodes: nodes,
            edges: edges
        };
        var options = {};
        var network = new vis.Network(container, data, options);
    },
}

window.addEventListener('DOMContentLoaded', function(evt) {
    var nodes = [];
    var edges = [];

    var nodes_hash = {};

    for (var i=0; i<localStorage.length; i++) {
        var key   = localStorage.key(i);
        var valueX = localStorage.getItem(key);

        if (key.indexOf("source___") >= 0) {
            key   = key.split("source___")[1];
            var values = JSON.parse(valueX);

            console.log(values);
            
            values.forEach(function(value) {
                value = value.split("target___")[1];
                
                if (nodes_hash[key] === undefined) {
                    var source_node = {"id": key, "label": ymt.main._getDomainName(key)};
                    nodes_hash[key] = source_node;
                    nodes.push(source_node);
                }

                if (nodes_hash[value] === undefined) {
                    var target_node = {"id": value, "label": ymt.main._getDomainName(value)};
                    nodes_hash[value] = target_node;
                    nodes.push(target_node);
                }
                
                edges.push({"from": key, "to": value});
            });
        }        
    }

    //console.log(nodes, edges);

    ymt.main.renderGraph(nodes, edges);
});

