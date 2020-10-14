var width = 960,
    height = 500,
    radius = 230;

// var color = d3.scale.category20c();
var color = d3.scaleOrdinal(d3.schemeCategory20);

var partition = d3.partition()
    .size([2 * Math.PI, radius]);
// .value(function(d) { return d.size; });

var arc = d3.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return d.y; })
    .outerRadius(function(d) { return d.y + d.dy; });

var svg = d3.select("#canvas").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

d3.json("./static/d3/data.json", function(error, data) {
    if (error) throw error;
    console.log(JSON.stringify(data));
    path = svg.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
        .on("click", magnify)
        .each(stash);
});

// Distort the specified node to 80% of its parent.
function magnify(node) {
    if (parent = node.parent) {
        var parent,
            x = parent.x,
            k = .8;
        parent.children.forEach(function(sibling) {
            x += reposition(sibling, x, sibling === node ?
                parent.dx * k / node.value :
                parent.dx * (1 - k) / (parent.value - node.value));
        });
    } else {
        reposition(node, 0, node.dx / node.value);
    }

    path.transition()
        .duration(750)
        .attrTween("d", arcTween);
}

// Recursively reposition the node at position x with scale k.
function reposition(node, x, k) {
    node.x = x;
    if (node.children && (n = node.children.length)) {
        var i = -1,
            n;
        while (++i < n) x += reposition(node.children[i], x, k);
    }
    return node.dx = node.value * k;
}

// Stash the old values for transition.
function stash(d) {
    d.x0 = d.x;
    d.dx0 = d.dx;
}

// Interpolate the arcs in data space.
function arcTween(a) {
    var i = d3.interpolate({ x: a.x0, dx: a.dx0 }, a);
    return function(t) {
        var b = i(t);
        a.x0 = b.x;
        a.dx0 = b.dx;
        return arc(b);
    };
}