var ymt = {};

ymt.main = {
    renderGraph : function (nodes, edges) {
        
        var nodeHash = {};
        for (x in nodes) {
            nodeHash[nodes[x].id] = nodes[x];
        };
        for (x in edges) {
            edges[x].weight = parseInt(edges[x].weight);
            edges[x].source = nodeHash[edges[x].source];
            edges[x].target = nodeHash[edges[x].target];
        };
        var weightScale = d3.scale.linear()
            .domain(d3.extent(edges, function(d) {return d.weight;}))
            .range([.1,1]);
        var force = d3.layout.force().charge(-1500)
            .size([500,500])
            .nodes(nodes)
            .links(edges)
            .on("tick", function () {
                d3.selectAll("line.link")
                    .attr("x1", function (d) {return d.source.x;})
                    .attr("x2", function (d) {return d.target.x;})
                    .attr("y1", function (d) {return d.source.y;})
                    .attr("y2", function (d) {return d.target.y;});
                d3.selectAll("g.node")
                    .attr("transform", function (d) {
                        return "translate("+d.x+","+d.y+")";
                    });
            });

        d3.select("svg").selectAll("line.link")
           .data(edges, function (d) {return d.source.id + "-" + d.target.id;})
           .enter()
           .append("line")
           .attr("class", "link")
           .style("stroke", "black")
           .style("opacity", 0.5);
           //.style("stroke-width", function(d) {return d.weight});
        var nodeEnter = d3.select("svg").selectAll("g.node")
           .data(nodes, function (d) {return d.id})
           .enter()
           .append("g")
           .attr("class", "node");
        nodeEnter.append("circle")
           .attr("r", 5)
           .style("fill", "Bisque")
           .style("stroke", "black")
           .style("stroke-width", "1px");
        nodeEnter.append("text")
           .style("text-anchor", "middle")
           .attr("y", 15)
           .text(function(d) {return d.id;});
        force.start();

        var marker = d3.select("svg").append('defs')
            .append('marker')
            .attr("id", "Triangle")
            .attr("refX", 12)
            .attr("refY", 6)
            .attr("markerUnits", 'userSpaceOnUse')
            .attr("markerWidth", 12)
            .attr("markerHeight", 18)
            .attr("orient", 'auto')
            .append('path')
            .attr("d", 'M 0 0 12 6 0 12 3 6');

        d3.selectAll("line").attr("marker-end", "url(#Triangle)");
        d3.selectAll("g.node").call(force.drag());
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
                    var source_node = {"id": key};
                    nodes_hash[key] = source_node;
                    nodes.push(source_node);
                }

                if (nodes_hash[value] === undefined) {
                    var target_node = {"id": value};
                    nodes_hash[value] = target_node;
                    nodes.push(target_node);
                }
                
                edges.push({"source": key, "target": value});
            });
        }        
    }

    console.log(nodes, edges);

    ymt.main.renderGraph(nodes, edges);
});

