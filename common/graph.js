/*
Original Code from
https://www.clips.uantwerpen.be/pages/pattern-graph
https://www.clips.uantwerpen.be/media/pattern-graph/random/
https://www.clips.uantwerpen.be/media/pattern-graph/random/graph.js

Modified to suit and linted with https://jshint.com/

NOTE: original code has been converted from python and maybe some other language
so some of comments are still implying python code...


TODO:
Center, zoom, unzoom btns like vis.js ??
Edge colors - grey ???

For small graphs things are way too big (zoomed) (<2 0 nodes)
Current setting are for larger graphs (> 100 nodes)

*/

"use strict";

/* jshint esversion: 6 */
/* jshint multistr: true */
// Just to shut jsHint up (https://jshint.com/)
//let CustomLayout;

// global constant for determining iff we should use requestAnimationFrame or setInterval
const g_animate_frame = true; // setInterval uses slightly less cpu when idle but not much diff

const g_HICLR = "#0000FF";

const g_BACKCLR = "#EEEEEE";

let g_ls = localStorage;

// local storage only supports strings so...
Storage.prototype.setObj = function(key, obj)
{	return this.setItem(key, JSON.stringify(obj));	};

Storage.prototype.getObj = function(key)
{	return JSON.parse(this.getItem(key));	};

Array.sum = function(array)
{
	let sum = 0;
	for (let i = 0; i < array.length; sum += array[i++]) {}
	return sum;
};

Array.index = function(array, v)
{
	for (let i = 0; i < array.length; i++)
	{
		if (array[i] === v)
			return i;
	}
	return -1;
};

Math.degrees = function(radians) { return radians * 180 / Math.PI; };

Math.radians = function(degrees) { return degrees / 180 * Math.PI; };

Math.coordinates = function(x, y, distance, angle)
{
	return [x + distance * Math.cos(Math.radians(angle)),
		y + distance * Math.sin(Math.radians(angle))];
};

var __MOUSE__ = {
	x: 0,
	y: 0,
	_x0: 0, // mousedown startpos x
	_y0: 0,	// mousedown startpos y
	dx: 0,
	dy: 0,
	pressed: false,
	dragged: false,
	relative: function(element)
	{
		let dx = 0;
		let dy = 0;
		if (element.offsetParent)
		{
			do
			{
				dx += element.offsetLeft;
				dy += element.offsetTop;
				element = element.offsetParent;
			} while (element);
		}
		return {
			x: __MOUSE__.x - dx,
			y: __MOUSE__.y - dy
		};
	}
};

document.addEventListener("mousemove", function(evt)
{
	if (0 !== evt.button) // We are only interested in left mouse button!
		return;
	__MOUSE__.x = evt.pageX || (evt.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
	__MOUSE__.y = evt.pageY || (evt.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
	if (__MOUSE__.pressed)
	{
		__MOUSE__.dragged = true;
		__MOUSE__.dx = __MOUSE__.x - __MOUSE__._x0;
		__MOUSE__.dy = __MOUSE__.y - __MOUSE__._y0;
	}
});

document.addEventListener("mousedown", function(evt)
{
	if (0 !== evt.button) // We are only interested in left mouse button!
		return;
	__MOUSE__.pressed = true;
	__MOUSE__._x0 = __MOUSE__.x;
	__MOUSE__._y0 = __MOUSE__.y;
});

document.addEventListener("mouseup", function(evt)
{
	// Do no matter what button is up!
	__MOUSE__.pressed = false;
	__MOUSE__.dragged = false;
	__MOUSE__.dx = 0;
	__MOUSE__.dy = 0;
});


function g_parseRGBA(clr)
{
	if (clr && clr.rgba && clr._get)
		return clr._get();
	if (clr instanceof Array)
	{
		let r = Math.round(clr[0] * 255);
		let g = Math.round(clr[1] * 255);
		let b = Math.round(clr[2] * 255);
		return "rgba(" + r + "," + g + "," + b + "," + clr[3] + ")";
	}
	if (clr === null)
		return "rgba(0,0,0,0)";

	return clr;
}

var g_GRAPH_FILL1 = null;
var g_GRAPH_FILL2 = null;
function g_ctx_graph_fillStyle(clr, ctx)
{
	clr = g_parseRGBA(clr);
	if (clr === undefined)
		clr = "rgba(0,0,0,0)";

	if (g_GRAPH_FILL1 != clr || g_GRAPH_FILL2 != ctx.fillStyle)
	{
		g_GRAPH_FILL1 = ctx.fillStyle = clr;
		g_GRAPH_FILL2 = ctx.fillStyle;
	}
}

var g_GRAPH_STROKE1 = null;
var g_GRAPH_STROKE2 = null;
function g_ctx_graph_strokeStyle(clr, ctx)
{
	clr = g_parseRGBA(clr);
	if (clr === undefined)
		clr = "rgba(0,0,0,1)";

	if (g_GRAPH_STROKE1 != clr || g_GRAPH_STROKE2 != ctx.strokeStyle)
	{
		g_GRAPH_STROKE1 = ctx.strokeStyle = clr;
		g_GRAPH_STROKE2 = ctx.strokeStyle;
	}
}


/*
A Node is an element with a unique id (a string or int) in a graph. A graph is a
network of nodes and edges (connections between nodes). For example, the World
Wide Web (WWW) can be represented as a vast graph with websites as nodes, website
URLs as node id's, and hyperlinks as edges. Graph analysis can then be used to
find important nodes (i.e., popular websites) and the shortest path between them.

A Node takes a number of optional parameters used to style the graph visualization
of the graph: radius (node size), text, fill and stroke (colors; each a tuple of
RGBA values between 0.0-1.0), strokewidth, font, fontsize and fontweight.
node = Node(id="", **kwargs)
node.graph                     # Parent Graph.
node.id                        # Unique string or int.
node.links                     # List of Node objects.
node.links.edges               # List of Edge objects.
node.x                         # 2D horizontal offset.
node.y                         # 2D vertical offset.
node.radius                    # Default: 10
node.fixed                     # Is the point fixed??
node.fill                      # Default: None
node.stroke                    # Default: (0,0,0,1)
node.strokewidth               # Default: undefined
node.weight                    # Modifier
node.centrality                # Betweenness centrality (0.0-1.0).

A well-known task in graph analysis is measuring how important or central each node
in the graph is.

Node.centrality is the node's betweenness centrality (= passing traffic) as a value
between 0.0-1.0. Nodes that occur more frequently in paths between other nodes have
a higher betweenness. They are often found at the intersection of different clusters
of nodes (e.g., like a broker or a bridge).
*/
var gNode = class {
	constructor(id, a)
	{
		this.graph = null;
		this.id = id;
		this.links = new NodeLinks();
		this.x = 0;		// x coord relative to center of canvas
		this.y = 0;		// y coord relative to center of canvas
		this._vx = 0;	// 'virtual' x point used to compute repulsion/attraction
		this._vy = 0;	// 'virtual' y point used to compute repulsion/attraction
		this.reinit(a);
	}

	reinit(a)
	{
		if (a === undefined) a = {};
		if (a.x === undefined) a.x = 0;
		if (a.y === undefined) a.y = 0;
		if (a.radius === undefined) a.radius = 10;
		if (a.fixed === undefined) a.fixed = false;
		if (a.showtext === undefined) a.showtext = true;
		this._x = a.x;	// usual range +-(this.graph.canvas.width / 2) / this.graph.distance
		this._y = a.y;	// usual range +-(this.graph.canvas.height / 2) / this.graph.distance
		this.radius = a.radius; 			// radius of node circle as drawn
		this.radius2 = this.radius * this.radius; // just to speed up contains fcn
		this.fixed = a.fixed;				// is point fixed???
		this.fill = a.fill;					// circle fill colour
		this.stroke = a.stroke;				// circle outline colour
		this.strokewidth = a.strokewidth;	// circle outline line width, can be 0 for nodes
		this.mass = a.mass || 1;			// measure of the influence of a node in the network.
		this.centrality = a.centrality || 0; // measure of centrality in a graph based on shortest path
		this.hidden = a.hidden;
		this.hifill = undefined; // iff valid colour then this is used instead of fill
		this.showtext = a.showtext;
		// text for label and tooltips
		let dotext = (a.text === undefined) ? true : (a.text === true);
		this.text = dotext ? (a.label || this.id) : null;
		this.textfont = null;
		if (a.font)
		{
			let fontWeight = (a.fontweight) ? a.fontweight + " " : "";
			let fontSize = (a.fontsize) ? a.fontsize + "px " : "";
			this.textfont = fontWeight + fontSize + a.font;
		}
		else
			this.textfont = "14px sans-serif";
		this.textcolor = (typeof(a.color) == "string") ? a.color : null;
		// tooltip
		this.tip = (a.tip === undefined) ? (a.label || this.id) : a.tip;
	}

	draw(weighted, hidetext)
	{
		if (this.hidden)
			return;

		let ctx = this.graph._ctx;
		// iff we call 'graph.betweennessCentrality' and pass weighted argument in call to graph.loop fcn
		// we highlight nodes with highest traffic
		if (weighted && weighted !== false && this.centrality > ((weighted === true) ? -1 : weighted))
		{
			let w = this.centrality * 35;
			g_ctx_graph_fillStyle("rgba(255,0,0,0.15)", ctx);
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.radius + w, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.fill();
		}
		ctx.lineWidth = this.strokewidth || 1; // can be undefined
		g_ctx_graph_strokeStyle(this.stroke, ctx);

		g_ctx_graph_fillStyle(this.hifill || this.fill, ctx);

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		if (this.text && (this.showtext && !hidetext))  // TODO: should this.showtext override graph setting passed in?
		{
			// Just paint text
			ctx.fillStyle = this.textcolor ? this.textcolor : "#000000";
			ctx.font = this.textfont;
			ctx.textBaseline = "top";
			let tm = ctx.measureText(this.text);
			ctx.fillText(this.text, this.x - tm.width / 2, this.y + this.radius / 2 + 10);
		}
	}

	contains(x, y, scale)
	{
		// scale should be adjusted already so never > 1.0
		console.assert(scale <= 1.0, "scale ! <= 1.0");
		let adx = (this.x - x) * scale;
		let ady = (this.y - y) * scale;
		return ((adx * adx) + (ady * ady)) < this.radius2;
	}
};


var NodeLinks = class {
	constructor()
	{
		this.edges = {};
		this.length = 0;
	}

	append(node, edge)
	{
		if (!this.edges[node.id])
		{
			this[this.length] = node;
			this.length += 1;
		}
		this.edges[node.id] = edge;
	}

	remove(node)
	{
		let i = Array.index(this, node);
		if (i >= 0)
		{
			for (let j = i; j < this.length; j++)
				this[j] = this[j + 1];
			this.length -= 1;
			delete this.edges[node.id];
		}
	}

	edge(node)
	{
		return this.edges[(node instanceof gNode) ? node.id : node] || null;
	}
};


/*
An Edge is a connection between two nodes.

An Edge takes optional parameters stroke (a tuple of RGBA values between 0.0-1.0) and strokewidth,
which can be used to style the graph visualization.
edge = Edge(node1, node2, length=1.0, type=None, **kwargs)
edge.node1                     # Node (sender).
edge.node2                     # Node (receiver).
edge.elength                   # Length modifier for the visualization. Default: 1
edge.stroke                    # Default: "#222222"
edge.strokewidth               # Default: undefined

directed graph

An edge can be traversed in both directions: from node1 → node2, and from node2 → node1. The
Graph.betweenness_centrality() methods have a directed parameter
which can be set to True, so that edges are only traversed from node1 → node2.

Two nodes can be connected by at most two edges (one in each direction). Otherwise,
Graph.add_edge() simply returns the edge that already exists between the given nodes.
*/
var gEdge = class {
	constructor(node1, node2, a)
	{
		if (a === undefined) a = {};
		if (a.elength === undefined) a.elength = 1.0;
		if (a.stroke === undefined) a.stroke = "#222222";
		if (a.dash === undefined) a.dash = false;
		this.node1 = node1;
		this.node2 = node2;
		this.elength = a.elength;
		this.stroke = a.stroke;
		this.strokewidth = a.strokewidth;
		this.dash = a.dash;
		this.hidden = a.hidden;
		this.histroke = undefined; // iff valid colour then this is used instead of stroke
	}

	draw(weighted, directed)
	{
		if (this.hidden)
			return;

		let ctx = this.node1.graph._ctx;

		let swidth = this.strokewidth || 1; // can be undefined
		ctx.lineWidth = this.histroke ? swidth + 2 : swidth;
		g_ctx_graph_strokeStyle(this.histroke || this.stroke, ctx);

		if (this.dash)
			ctx.setLineDash([10, 10]); // should be good for line widths 1 to 10
		ctx.beginPath();
		ctx.moveTo(this.node1.x, this.node1.y);
		ctx.lineTo(this.node2.x, this.node2.y);
		ctx.stroke();
		// reset dash back as we do not save/restore context!
		if (this.dash)
			ctx.setLineDash([]);
		if (directed)
			this.drawArrow(this.strokewidth);
	}

	drawArrow(strokewidth)
	{
		let s = (strokewidth === undefined) ? 1 : strokewidth;
		let x0 = this.node1.x;
		let y0 = this.node1.y;
		let x1 = this.node2.x;
		let y1 = this.node2.y;
		let a = Math.degrees(Math.atan2(y1 - y0, x1 - x0));
		let d = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
		let r = Math.max(s * 4, 8);
		let p1 = Math.coordinates(x0, y0, d - this.node2.radius - 1, a);
		let p2 = Math.coordinates(p1[0], p1[1], -r, a - 20);
		let p3 = Math.coordinates(p1[0], p1[1], -r, a + 20);
		let ctx = this.node1.graph._ctx;
		g_ctx_graph_fillStyle(ctx.strokeStyle, ctx);
		ctx.beginPath();
		ctx.moveTo(p1[0], p1[1]);
		ctx.lineTo(p2[0], p2[1]);
		ctx.lineTo(p3[0], p3[1]);
		ctx.fill();
	}
};


/*
A Graph is a network of nodes connected by edges, with methods for finding paths between (indirectly) connected nodes.

graph[id]                      # Node with given id
graph.nodes                    # List of Node objects.
graph.edges                    # List of Edge objects.
graph.layout                   # GraphSpringLayout.
graph.add_node(id)             # Creates + returns new Node.
graph.add_edge(id1, id2)       # Creates + returns new Edge.
graph.remove(node)             # Removes given Node + edges.
graph.remove(edge)             # Removes given Edge.
graph.prune(depth=0)           # Removes nodes + edges if len(node.links) <= depth.
graph.node(id)                 # Returns node with given id.
graph.edge(id1, id2)           # Returns edge connecting the given nodes.
graph.betweenness_centrality() # Updates all Node.centrality values.
graph.update(iterations)

    Graph.add_node() takes an id + any optional parameter of Node.
    Graph.add_edge() takes two id's + any optional parameter of Edge.

    Graph.prune() removes all nodes with less or equal (undirected) connections than depth.

    The optional heuristic function takes two node id's and returns a penalty (0.0-1.0) for traversing
    their edges. With directed=True, edges are only traversable in one direction.

*/
var Graph = class {
	constructor(canvas, layouttype, textcallback, distance, scale, tooltips, hidetext, autosizeonload)
	{
		// TODO: can only have one graph per html page this way - need name/id or something!
		// TODO: Try to break storage related code!!!
		this.defaults = g_ls.getObj("graph_defaults");
		if (null === this.defaults)
			this.reset_defaults();

		this.graph_options = g_ls.getObj("graph_options");
		if (null === this.graph_options)
			this.reset_graph_options();

		if (distance === undefined) distance = this.defaults.distance;
		if (scale === undefined) scale = this.defaults.scale;
		if (tooltips === undefined) tooltips = this.defaults.tooltips;
		if (hidetext === undefined) hidetext = !this.defaults.labels;
		if (autosizeonload === undefined) autosizeonload = this.defaults.autosize;
		if (layouttype === undefined) layouttype = this.defaults.layouttype;

		this.canvas = canvas;
		// TODO: with alpha === false we get black bg by default - can this be changed so no flicker??
		//this._ctx = this.canvas ? this.canvas.getContext("2d", { alpha: false }) : null;
		this._ctx = this.canvas ? this.canvas.getContext("2d") : null;
		this.nodeset = {};
		this.nodes = [];
		this.edges = [];
		this.mouse = __MOUSE__;
		this.distance = distance;
		this.scale = scale;
		this.dragged = null;

		// Force controls the speed at which we stabilize, large values stabilize faster
		// but may oscillate, small values stabilize slower but with less oscillation
		// 'limit' used in layout update fcns also effects the same things (they are closely related)
		this.force = this.defaults.ilf;
		this.mforce = this.force; // used to increase/reduce force level depending on stabilization stage

		this.hidetext = hidetext;
		this.autosizeonload = autosizeonload;

		// mouse wheel zoom
		this.canvas.addEventListener("wheel", this.handleMouseWheel.bind(this));

		// panning support
		this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
		this.b_onMouseMove = this.onMouseMove.bind(this);
		this.b_onMouseUp = this.onMouseUp.bind(this);
		this.isPanning = false;
		this.panStart = { x: 0, y: 0 };
		this.cameraOffset = { x: 0, y: 0 };

		// tooltips
		this.ttid = 0;
		this.tipwin = undefined;
		this.b_showtooltip = this.showtooltip.bind(this);
		this.settooltips(tooltips);

		this.unhilight_id = undefined; // setTimeout id for unhilighting nodes/edges

		this.gdone = new Event("gdone"); // event to listen to when graph loop fcn is done

		this.popup = new Popup(this, layouttype); // graph options dialog
		this.help = new Help(this); // help dialog, F1 to show
		this.graphText = new graphText(this, textcallback); // text input control for finding nodes/hilighting

		this.setlayout(layouttype);

		// text for graph - used in settext fcn
		this.text = undefined; // text (multiline \n separated)
		this.font = "bold 20px Arial"; // font to use
		this.textcolor = "#000000";
		this.textx = 0; // x pos from top left
		this.texty = 0; // y pos from top left

		this.lastbounds = [+Infinity, +Infinity, -Infinity, -Infinity]; // minx, miny, maxx, maxy

		document.addEventListener("keydown", this.onKeydown.bind(this));
	}

	reset_defaults()
	{
		this.defaults = {layouttype: "GraphSpring", ilf: 0.001, scale: 1.0, distance: 25,
				tooltips: true, labels: true, autosize: true};
		g_ls.setObj("graph_defaults", this.defaults);
	}

	reset_graph_options()
	{
		this.graph_options = {GraphSpring: {repulsion: 40, sp_const: 4.0},
			Repulsion: {repulsion: 200, sp_const: 0.0005},
			BHut: {repulsion: 200000, sp_const: 0.0005},
			Custom: {repulsion: 200, sp_const: 0.00025}};
		g_ls.setObj("graph_options", this.graph_options);
	}

	onKeydown(evt)
	{
		if ("F1" !== evt.key)
			return;
		this.help.showex();
		// TODO: should we also support keydown for mouse ops in mousedown
		// and ctrl, shift, alt - may be hard to find simple key combos that firefox does not already use!
	}

	unhilight(self)
	{
		// reset all nodes and edges so no hilight colour
		let nodes = self.nodes;
		for (let i = 0; i < nodes.length; i++)
		{
			nodes[i].hifill = undefined;
		}
		let edges = self.edges;
		for (let i = 0; i < edges.length; i++)
		{
			edges[i].histroke = undefined;
		}
		self.unhilight_id = undefined;
		self.redraw();
	}

	clear_unhilight_timer()
	{
		if (undefined === this.unhilight_id)
			return;
		this.unhilight_id = clearTimeout(this.unhilight_id);
		this.unhilight_id = undefined;
	}

	set_unhilight_timer()
	{
		if (!this.unhilight_id)
			this.unhilight_id = setTimeout(this.unhilight, 250, this);
	}

	onMouseDown(evt)
	{
		if (0 !== evt.button) // we only pan on left mouse button down!
			return;

		if (evt.ctrlKey)
		{
			this.autosize = false; // disable autosize
			// iff ctrl key down then just recenter viewpoint for panning
			// Barnes-Hut is not centered so get bounds and adjust viewpoint (not really required for other layouts)
			let bounds = this.layout.bounds(); // min.x, min.y, max.x, max.y
			this.cameraOffset.x = -(bounds[2] + bounds[0]) / 2;
			this.cameraOffset.y = -(bounds[3] + bounds[1]) / 2;

			this.redraw();
			return;
		}
		else if (evt.altKey)
		{
			this.autosize = false; // disable autosize
			// iff alt key down then just set scale back to 1 and reset panning
			this.scale = 1.0;
			// Barnes-Hut is not centered so get bounds and adjust viewpoint (not really required for other layouts)
			let bounds = this.layout.bounds();
			this.cameraOffset.x = -(bounds[2] + bounds[0]) / 2;
			this.cameraOffset.y = -(bounds[3] + bounds[1]) / 2;

			if (this.popup.visible)
				this.popup.update_ctrls();
			this.redraw();
			return;
		}
		else if (evt.shiftKey)
		{
			this.autosize = true;
			// iff shift key down then center graph by adjusting cameraOffset
			// then adjust scale so almost full size
			let bounds = this.layout.bounds();
			this.cameraOffset.x = -(bounds[2] + bounds[0]) / 2;
			this.cameraOffset.y = -(bounds[3] + bounds[1]) / 2;
			// use slight fudge factor so fringe nodes are more visible...
			let newscalex = this.canvas.width / (bounds[2] - bounds[0] + 100);
			let newscaley = this.canvas.height / (bounds[3] - bounds[1] + 100);
			let newscale = Math.min(newscalex, newscaley);

			this.scale = newscale;
			if (this.popup.visible)
				this.popup.update_ctrls();
			this.animate(); // we do want to anumate here!
			return;
		}

		let pt = this.mouse.relative && this.mouse.relative(this.canvas) || {
				x: this.mouse.x, y: this.mouse.y }; // this point is relative to top left corner of canvas, unscaled
		// convert to our scaled coords with panning support
		pt.x = (pt.x - this.canvas.width / 2) / this.scale - this.cameraOffset.x;
		pt.y = (pt.y - this.canvas.height / 2) / this.scale - this.cameraOffset.y;

		// We start panning if not over a node!!
		let pnode = this.nodeAt(pt.x, pt.y, this.scale);
		if (undefined === pnode)
		{
			this.clear_unhilight_timer();
			this.autosize = false; // disable autosize
			// not over a visible node so pan!
			this.isPanning = true;
			this.panStart.x = evt.clientX / this.scale - this.cameraOffset.x;
			this.panStart.y = evt.clientY / this.scale - this.cameraOffset.y;
			document.addEventListener("mousemove", this.b_onMouseMove);
			document.addEventListener("mouseup", this.b_onMouseUp);
			document.addEventListener("mouseleave", this.b_onMouseUp);
			this.set_unhilight_timer();
		}

	}

	onMouseUp(evt)
	{
		this.isPanning = false;
		document.removeEventListener("mousemove", this.b_onMouseMove);
		document.removeEventListener("mouseup", this.b_onMouseUp);
		document.removeEventListener("mouseleave", this.b_onMouseUp);
	}

	onMouseMove(evt)
	{
		this.clear_unhilight_timer();
		this.cameraOffset.x = evt.clientX / this.scale - this.panStart.x;
		this.cameraOffset.y = evt.clientY / this.scale - this.panStart.y;
		this.redraw();
	}

	handleMouseWheel(evt)
	{
		this.autosize = false; // disable autosize
		// adjust camera position so we scale on current mouse position!
		let rect = evt.target.getBoundingClientRect();
		let x = evt.clientX - rect.left;
		let y = evt.clientY - rect.top;

		let x1 = (x - this.canvas.width / 2) / this.scale - this.cameraOffset.x;
		let y1 = (y - this.canvas.height / 2) / this.scale - this.cameraOffset.y;

		var dscale = evt.deltaY < 0 ? 0.05 : -0.05;
		this.scale += dscale; // graph scale ranges from 0.1 to 5 !
		if (this.scale < 0.1)
			this.scale = 0.1;
		else if (this.scale > 5)
			this.scale = 5;

		// update new camera position
		this.cameraOffset.x = (x - this.canvas.width / 2) / this.scale - x1;
		this.cameraOffset.y = (y - this.canvas.height / 2) / this.scale - y1;

		this.redraw();
		if (this.popup.visible)
			this.popup.update_ctrls();
	}

	hidetextlabels(bhide)
	{
		this.hidetext = bhide;
		this.defaults.labels = !this.hidetext;
		g_ls.setObj("graph_defaults", this.defaults);
	}

	setlayout(layouttype)
	{
		// Save old values
		if (this.layouttype && this.layout)
		{
			this.graph_options[this.layouttype] = {repulsion: this.layout.repulsion, sp_const: this.layout.springConstant};
			g_ls.setObj("graph_options", this.graph_options);
		}

		/*
		When we change from custom to other we must reset nodes fixed and positions?
		When we change to custom we must call init in CustomLayout class
		In these cases we should redo from scratch!!
		*/
		let bok = false;
		if (typeof CustomLayout !== "undefined")
		{
			if (("Custom" === layouttype) || ("Custom" === this.layouttype))
			{
				for (let i = 0; i < this.nodes.length; i++)
					this.nodes[i].fixed = false;
			}
		}

		if ("GraphSpring" === layouttype)
		{
			this.layouttype = "GraphSpring";
			this.layout = new GraphSpringLayout(this, this.graph_options[this.layouttype].sp_const,
				this.graph_options[this.layouttype].repulsion);
			bok = true;
		}
		else if ("Repulsion" === layouttype)
		{
			this.layouttype = "Repulsion";
			this.layout = new RepulsionLayout(this, this.graph_options[this.layouttype].sp_const,
				this.graph_options[this.layouttype].repulsion);
			bok = true;
		}
		else if ("BHut" === layouttype)
		{
			this.layouttype = "BHut";
			this.layout = new BHutLayout(this, this.graph_options[this.layouttype].sp_const,
				this.graph_options[this.layouttype].repulsion);
			bok = true;
		}
		else if ("Custom" === layouttype)
		{
			if (typeof CustomLayout !== "undefined")
			{
				this.layouttype = "Custom";
				this.layout = new CustomLayout(this, this.graph_options[this.layouttype].sp_const,
					this.graph_options[this.layouttype].repulsion);
				if (this.nodes.length > 0)
					this.layout.init();
				bok = true;
			}
		}
		if (!bok)
		{
			alert("Invalid graph type!");
			this.layouttype = "GraphSpring";
			this.layout = new GraphSpringLayout(this, this.graph_options[this.layouttype].sp_const,
				this.graph_options[this.layouttype].repulsion);
			this.popup.selectList.selectedIndex = 0;
		}

		this.defaults.layouttype = this.layouttype;
		g_ls.setObj("graph_defaults", this.defaults);

		this.popup.update_layout();
		if (this.nodes.length > 0)
		{
			this.autosize = this.autosizeonload; // reset this before we animate
			this.animate();
		}
	}

	setdistance(distance)
	{
		this.distance = Number(distance); // range value is a string! (How stupid!)
		if (this.popup.visible)
			this.popup.update_ctrls();
	}

	setautosize(autosizeonload)
	{
		this.autosizeonload = autosizeonload;
		this.defaults.autosize = this.autosizeonload;
		g_ls.setObj("graph_defaults", this.defaults);
	}

	setrepulsion(repulsion)
	{
		this.layout.repulsion = repulsion;
		if (this.popup.visible)
			this.popup.update_ctrls();
	}

	settooltips(tooltips)
	{
		this.tooltips = tooltips;
		if (this.tooltips)
		{
			this.canvas.addEventListener("mousemove", this.b_showtooltip);
			this.canvas.addEventListener("mouseleave", this.b_showtooltip);
		}
		else
		{
			this.cancelTip(); // must do first!
			this.canvas.removeEventListener("mousemove", this.b_showtooltip);
			this.canvas.removeEventListener("mouseleave", this.b_showtooltip);
		}
		this.defaults.tooltips = this.tooltips;
		g_ls.setObj("graph_defaults", this.defaults);
	}

	append(base, a)
	{
		if (base == gNode) return this.addNode(a.id, a);
		if (base == gEdge) return this.addEdge(a.id1, a.id2, a);
	}

	add(id, id1, a, b)
	{
		this.addNode(id, a);
		this.addEdge(id1, id, b);
	}

	addNode(id, a)
	{
		let n = this.nodeset[id];
		if (n) // does it already exist?
		{
			if (undefined !== a) // iff we provided params then reinit
			{
				//console.warn("Node Already Exists!!", id);
				n.reinit(a); // already existed so update!
			}
		}
		else
		{
			// node did not already exist so create new
			n = new gNode(id, a);
			this.nodes.push(n);
			this.nodeset[n.id] = n;
			n.graph = this;
		}
		// return either existing node or new node created
		return n;
	}

	addEdge(id1, id2, a)
	{
		// TODO: Code for Debug - eventually comment
		if (id1 === id2)
			console.warn("Adding edge to same Node???", id1, id2);

		let nt = this.nodeset[id1];
		if (undefined === nt)
			console.log("addEdge, Node1 does not exist!", id1, "Node2", id2);
		nt = this.nodeset[id2];
		if (undefined === nt)
			console.log("addEdge, Node2 does not exist!", id2, "Node1", id1);

		// check iff edge already exists from id1 to id2
		let n1 = this.addNode(id1);
		let n2 = this.addNode(id2);
		let e1 = n1.links.edge(n2);
		//if (e1) // debug code - log warning iff edge in other direction already exists!
		//{
		//	if (e1.node1 == n2 && e1.node2 == n1)
		//		console.warn("Reverse Edge Already Exists!!", id1, id2);
		//}
		if (e1 && e1.node1 == n1 && e1.node2 == n2)
		{
			console.warn("Edge Already Exists!!", id1, id2);
			return e1; // just return existing edge
		}

		let e2 = new gEdge(n1, n2, a);
		this.edges.push(e2);
		n1.links.append(n2, e2);
		n2.links.append(n1, e1 || e2);
		return e2; // return newly created edge
	}

	remove(x)
	{
		if (x instanceof gNode && this.nodeset[x.id])
		{
			delete this.nodeset[x.id];
			this.nodes.splice(Array.index(this.nodes, x), 1);
			x.graph = null;
			let a = [];
			for (let i = 0; i < this.edges.length; i++)
			{
				let e = this.edges[i];
				if (x == e.node1 || x == e.node2)
				{
					if (x == e.node2) e.node1.links.remove(x);
					if (x == e.node1) e.node2.links.remove(x);
				}
				else
					a.push(e);
			}
			this.edges = a;
		}
		if (x instanceof gEdge)
			this.edges.splice(Array.index(this.edges, x), 1);
	}

	node(id)
	{
		if (id instanceof gNode && id.graph == this)
			return id;
		return this.nodeset[id] || null;
	}

	edge(id1, id2)
	{
		// returns edge that connects id1 and id2 in EITHER DIRECTION!!!
		if (id1 instanceof gNode && id1.graph == this)
			id1 = id1.id;
		if (id2 instanceof gNode && id2.graph == this)
			id2 = id2.id;
		return (this.nodeset[id1] && this.nodeset[id2]) ? this.nodeset[id1].links.edge(id2) : null;
	}

	betweennessCentrality(graph, a)
	{
		let bc = Graph.brandesBetweennessCentrality(this, a);
		let r = {};
		for (let id in bc)
		{
			let n = this.nodeset[id];
			n.centrality = bc[id];
			r[n] = n.centrality;
		}
		return r;
	}

	prune(depth)
	{
		if (depth === undefined) depth = 0;
		let m = {};
		for (let i = 0; i < this.nodes.length; i++)
			m[this.nodes[i].id] = 0;

		for (let i = 0; i < this.edges.length; i++)
		{
			m[this.edges[i].node1.id] += 1;
			m[this.edges[i].node2.id] += 1;
		}
		for (let id in m)
		{
			if (m[id] <= depth)
				this.remove(this.nodeset[id]);
		}
	}

	update(iterations)
	{
		//console.log("Graph::update");
		if (iterations === undefined)
			iterations = 2;

		for (let i = 0; i < iterations; i++)
		{
			this.layout.update();
		}
		if (this.autosize && !this.dragged) // Do not do when dragging with mouse or we can get instability!
		{
			let newscale = 2.0;
			let dmax = 0.0;
			if (this.nodes.length > 5) // TODO: number of nodes??
			{
				// adjust cameraOffset so graph is centered and adjust scale so almost full size
				let bounds = this.layout.bounds(); // min.x, min.y, max.x, max.y
				this.cameraOffset.x = -(bounds[2] + bounds[0]) / 2;
				this.cameraOffset.y = -(bounds[3] + bounds[1]) / 2;
				// use slight fudge factor so fringe nodes are more visible...
				let newscalex = this.canvas.width / (bounds[2] - bounds[0] + 50);
				let newscaley = this.canvas.height / (bounds[3] - bounds[1] + 50);
				newscale = Math.min(5, Math.min(newscalex, newscaley)); // max 5 scale factor
				newscale = Math.max(0.1, newscale); // min 0.1 scale factor

				let dminx = Math.abs(this.lastbounds[0] - bounds[0]);
				let dminy = Math.abs(this.lastbounds[1] - bounds[1]);
				let dmaxx = Math.abs(this.lastbounds[2] - bounds[2]);
				let dmaxy = Math.abs(this.lastbounds[3] - bounds[3]);
				dmax = Math.max(Math.max(dminx, dminy), Math.max(dmaxx, dmaxy));

				this.lastbounds = bounds;
			}
			if (this.scale !== newscale)
			{
				if (Math.abs(this.scale - newscale) < 0.0001) // 0.00005
				{
					this.mforce *= 0.95;
					this._frames += 10;
					if (dmax < 0.001)
					{
						//console.log("dscale", Math.abs(this.scale - newscale), "dmax", dmax,
						//	"QUITTING Remaining it: " , this._frames - this._i, "scale", newscale);

						this.mforce = this.force;
						this._i = this._frames;
					}
				}
				else
				{
					if (this._frames - this._i < 10)
						this._frames += 10;
				}
			}
			this.scale = newscale;
		}
	}

	settext(text, font, color, tx, ty)
	{
		this.text = text; // text (multiline \n separated)
		this.font = font; // font to use
		this.color = color;
		this.textx = tx; // x pos from top left
		this.texty = ty; // y pos from top left
	}

	fillTextMultiLine(text, font, color, x, y)
	{
		let ctx = this._ctx;
		ctx.font = font;
		ctx.fillStyle = color;
		ctx.textBaseline = "top";
		let lineHeight = ctx.measureText("M").width * 1.2;
		let lines = text.split("\n");
		for (let i = 0; i < lines.length; i++)
		{
			ctx.fillText(lines[i], x, y);
			y += lineHeight;
		}
	}

	redraw()
	{	this.draw(0.5);	} // TODO: weighted == 0.5?

	draw(weighted, directed)
	{
		if (undefined === weighted)
			console.assert(undefined !== weighted, "undefined !== weighted");
		let ctx = this._ctx;

		ctx.save();

		ctx.fillStyle = g_BACKCLR;
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

		// Add scaling if using
		if (1 != this.scale)
			ctx.scale(this.scale, this.scale);

		// panning support
		ctx.translate(this.cameraOffset.x, this.cameraOffset.y);

		let edges = this.edges;
		for (let i = 0; i < edges.length; i++)
			edges[i].draw(weighted, directed);

		// Draw nodes backwards as main site node is usually first (important nodes first)
		// This ensures node label of important nodes is not obscured!!
		let nodes = this.nodes;
		for (let i = nodes.length - 1; i >= 0 ; i--)
			nodes[i].draw(weighted, this.hidetext);

		if (this.text)
		{
			// panning support
			ctx.translate(-this.cameraOffset.x, -this.cameraOffset.y);
			// make sure scale is 1:1
			if (1 != this.scale)
				ctx.scale(1 / this.scale, 1 / this.scale); // undoes scaling!
			this.fillTextMultiLine(this.text, this.font, this.color, -this.canvas.width / 2 + this.textx,
				-this.canvas.height / 2 + this.texty);
		}

		ctx.restore();
	}

	drag(mouse)
	{
		if (!mouse.pressed) // we are not interested if mouse is not down!!
		{
			this.dragged = null;
			return;
		}

		let pt = mouse.relative && mouse.relative(this.canvas) || {
			x: mouse.x, y: mouse.y }; // this point is relative to top left corner of canvas, unscaled
		// convert to our scaled coords with  panning support
		pt.x = (pt.x - this.canvas.width / 2) / this.scale - this.cameraOffset.x;
		pt.y = (pt.y - this.canvas.height / 2) / this.scale - this.cameraOffset.y;

		if (!mouse.dragged && !this.dragged) // iff initial mousedown and not moved
		{
			this.dragged = this.nodeAt(pt.x, pt.y, this.scale);
			if (this.dragged)
			{
				// Save offset here so point does not jump if we did not click at exact center!
				this.offx = pt.x - this.dragged.x;
				this.offy = pt.y - this.dragged.y;

				this.unhilight(this); // unhilight all

				this.dragged.hifill = g_HICLR;
				// Also connecting edges
				let edges = this.dragged.links.edges;
				for (let edge in edges)
				{
					// Only if edges[edge].stroke is not transparent
					if ("transparent" !== edges[edge].stroke)
						edges[edge].histroke = g_HICLR;
				}
				this.canvas.dispatchEvent(new CustomEvent("node_selected", { detail: this.dragged }));

				this.autosize = false; // disable autosize
				// Just redraw once!
				this.draw(this._weighted, this._directed);
			}
		}

		if (this.dragged && !this.dragged.fixed) // iff we are dragging and node is not fixed, then animate!
		{
			// include original offset in position here to avoid jump
			this.dragged._x = (pt.x - this.offx) / this.distance;
			this.dragged._y = (pt.y - this.offy) / this.distance;

			this.mforce = this.force; // always reset this
			this._i = 0;
			// reduce number of frames to reduce further animation
			this._frames = 50; // TODO: should we be able to set this number via menu?????
		}
	}

	animate()
	{
		if (0 === this.nodes.length)
			return;

		this.mforce = this.force; // always reset this
		// Standard loop we run when we change paramaters via menu
		this.loop({frames:100, fps:30, ipf:5, weighted:0.5}); // TODO: weighted
	}

	ranimate()
	{
		if (this._i < this._frames)
		{
			this.update(this._ipf); // pass iterations per frame
			this.draw(this._weighted, this._directed);
			this._i++;
			//if (this._i === this._frames)
			//	console.log("ranimate loop done");
		}
		else
			this.autosize = false; // turn autosize off!

		// Only update if autosizing and menu is visible!!
		if (this.popup.visible && this.autosize)
			this.canvas.dispatchEvent(this.gdone);
		this.drag(this.mouse);

		// request another loop of animation iff applicable
		if (this._animation)
			requestAnimationFrame(this._ranimatebound);
	}

	stabilize(a)
	{
		// a is arguments too pass to loop fcn such as
		// {frames: 300, fps: 30, ipf: 5, directed: false, weighted: 0.5});

		if ("Custom" === this.layouttype)
			this.layout.init();
		else
		{
			// dispatch event so 'owner' can position nodes if they wish!
			this.canvas.dispatchEvent(new CustomEvent("position_nodes", { detail: this.nodes }));
		}

		this.loop(a);
	}

	loop(a)
	{
		// call graph.betweennessCentrality fcn before calling this fcn and pass
		// a.weighted argument (0 to 1.0) to highlight nodes with high traffic!
		if (a === undefined) a = {};
		if (a.frames === undefined) a.frames = 500;
		if (a.ipf === undefined) a.ipf = 2; // iterations per frame

		this._ipf = a.ipf;
		this._weighted = a.weighted;
		this._directed = a.directed;
		this._frames = a.frames;
		this._i = 0;

		if (a.fps === undefined) a.fps = 30; // Only Applies to setInterval

		// TODO: we want to stop current animation IMMEDIATELY when we start new
		// With a large number of nodes
		if (this._animation)
			return;

		this.autosize = this.autosizeonload;
		// First time thru we do no show immediately but run iterations
		// so we are closer to stable positions before we show!
		// NOTE: Comment for Debug
		// TODO: commented for debug
		this.mforce = this.force * 3;
		for (let i = 0; i < 100; i++)
			this.update(5); // pass iterations per frame
		this.mforce = this.force / 4;

		if (this._i >= this._frames) // This can happen if we stabilize quickly!!
			this._i = this._frames - 1; // Make sure we draw at least once!!!

		// DEBUG: Check initial positions
		//this._frames = 1;
		//this.update(1); // pass iterations per frame
		//this.draw(this._weighted, this._directed);
		//return;

		if (g_animate_frame) // global constant for determining iff we should use requestAnimationFrame or setInterval
		{
			// setup for requestAnimationFrame...
			this._ranimatebound = this.ranimate.bind(this);
			this._animation = true;
			this.ranimate();
		}
		else
		{
			// now start our interval/loop
			this._animation = setInterval(function(self)
			{
				if (self._i < self._frames)
				{
					self.update(self._ipf); // pass iterations per frame
					self.draw(self._weighted, self._directed);
					self._i++;
					//if (self._i === self._frames)
					//	console.log("setInterval animate loop done");
				}
				else
					self.autosize = false; // turn autosize off!

				// Only update if autosizing and menu is visible!!
				if (self.popup.visible && self.autosize)
					self.canvas.dispatchEvent(self.gdone);
				self.drag(self.mouse);
			}, 1000 / a.fps, this);
		}
	}

	stop()
	{
		if (!g_animate_frame)
			clearInterval(this._animation);
		this._animation = null;
	}

	nodeAt(x, y, scale)
	{
		scale = Math.min(scale, 1.0); // only add fudge factor iff scale < 1
		let nodes = this.nodes;
		let n;
		for (let i = 0; i < nodes.length; i++)
		{
			n = nodes[i];
			if (n.contains(x, y, scale) && !n.hidden) // skip hidden nodes
				return n;
		}
	}

	showtooltip(evt)
	{
		if (this._i < this._frames) // no tips when animating to save cpu!!
		{
			this.cancelTip();
			return;
		}

		let rect = evt.target.getBoundingClientRect();
		let x = evt.clientX - rect.left;
		let y = evt.clientY - rect.top;
		let stip = null;

		// loop thru tips!
		x = (x - this.canvas.width / 2) / this.scale - this.cameraOffset.x;
		y = (y - this.canvas.height / 2) / this.scale - this.cameraOffset.y;
		let tipnode = this.nodeAt(x, y, this.scale);
		if (undefined !== tipnode)
			stip = tipnode.tip ? tipnode.tip : tipnode.text ? tipnode.text : tipnode.id;

		if (null === stip)
			this.cancelTip();
		else
		{
			if (0 !== this.ttid)
			{
				window.clearTimeout(this.ttid);
				this.ttid = 0;
			}
			this.ttid = setTimeout(() => { this.createTip(evt.pageX, evt.pageY, stip); }, 150);
		}
	}

	createTip(x, y, stip)
	{
		if (undefined !== this.tipwin)
			return;

		x += 20;
		y += 50;
		this.tipwin = document.createElement("div"); // creates div
		// check for newlines in tip
		let tips = stip.split("\n");
		for (let i = 0; i < tips.length; i ++)
		{
			let tn = document.createTextNode(tips[i]);
			this.tipwin.appendChild(tn);
			if ((tips.length > 1) && (i < tips.length - 1))
				this.tipwin.appendChild(document.createElement("br"));
		}
		let stylestr = "position: absolute; background: #3388DD; max-width: 1000px; border-radius: 6px; \
			padding: 6px 12px; font-family: arial; font-size: 20px; color: #FFFFFF; \
			transition: transform .15s ease-out; transform: translateY(-100%) scale(0); transform-origin: top left;";

		this.tipwin.setAttribute("style", stylestr + " top: " + y + "px; left: " + x + "px;");
		document.body.insertBefore(this.tipwin, document.body.childNodes[0]);
		// To get proper size of tip it MUST already be inserted into the DOM!!!!!

		// reposition if off screen!
		// top is actually the bottom because of transform!
		let repos = false;
		if (y > window.pageYOffset + document.documentElement.clientHeight - 20)
		{
			y = window.pageYOffset + document.documentElement.clientHeight - 20;
			repos = true;
		}
		// Top position is very difficult to limit as depends on size of tip...
		if (y < this.tipwin.clientHeight + 40)
		{
			y = this.tipwin.clientHeight + 40;
			repos = true;
		}

		if (x + this.tipwin.clientWidth + 50 > window.pageXOffset + document.documentElement.clientWidth)
		{
			x = window.pageXOffset + document.documentElement.clientWidth - this.tipwin.clientWidth - 50;
			repos = true;
		}
		if (repos)
		{
			// We MUST reset whole style!
			this.tipwin.setAttribute("style", stylestr + " top: " + y + "px; left: " + x + "px;");
		}
		setTimeout(() => { if (undefined !== this.tipwin) { this.tipwin.style.transform = "translateY(-100%) scale(1)"; }}, 100);
		// Make sure we remove after timeout as well - under some conditions it could be permanent otherwise!
		let tid = this.tipwin;
		setTimeout(() => { if (tid === this.tipwin) {this.cancelTip(); }}, 3000);
	}

	cancelTip()
	{
		if (0 !== this.ttid)
		{
			window.clearTimeout(this.ttid);
			this.ttid = 0;
		}
		if (undefined !== this.tipwin)
		{
			document.body.removeChild(this.tipwin);
			this.tipwin = undefined;
		}
	}

	clear()
	{
		this.stop();
		if (this.canvas && this._ctx)
		{
			// filling better if we set alpha false when we getContext
			this._ctx.fillStyle = g_BACKCLR;
			this._ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}

		this.mforce = this.force;

		this.nodeset = {};
		this.nodes = [];
		this.edges = [];
		this.text = null;
		this.scale = 1.0;
		// panning support
		this.isPanning = false;
		this.panStart = { x: 0, y: 0 };
		this.cameraOffset = { x: 0, y: 0 };
	}

};


/*
A GraphLayout updates node positions (Node.x, Node.y) iteratively each time
GraphLayout.update() is called.
GraphSpringLayout uses a force-based algorithm where
edges are regarded as springs. Connected nodes are pulled closer together
(attraction) while other nodes are pushed further apart (repulsion).
layout = GraphSpringLayout(graph)
layout.graph                    # Graph owner.
*/

var GraphLayout = class {
	constructor(graph)
	{
		this.graph = graph;
	}

	reset()
	{
		let nodes = this.graph.nodes;
		for (let i = 0; i < nodes.length; i++)
		{
			let n = nodes[i];
			n._x = 0;
			n._y = 0;
			n._vx = 0;
			n._vy = 0;
		}
	}

	bounds()
	{
		let minx = +Infinity, miny = +Infinity, maxx = -Infinity, maxy = -Infinity;
		let nodes = this.graph.nodes;
		for (let i = 0; i < nodes.length; i++)
		{
			let n = nodes[i];
			if (n.x < minx) minx = n.x;
			if (n.y < miny) miny = n.y;
			if (n.x > maxx) maxx = n.x;
			if (n.y > maxy)	maxy = n.y;
		}
		return [minx, miny, maxx, maxy];
	}
};


var GraphSpringLayout = class extends GraphLayout{
	constructor(graph, springconst, repulsion)
	{
		super(graph);
		this.springConstant = (undefined === springconst) ? 4.0 : springconst; // 2 min, 4 seems good, 10 max? quasi spring constant???
		this.springConstant2 = this.springConstant * this.springConstant;

		// layout.repulsion - Maximum repulsion radius
		this.repulsion = (undefined === repulsion) ? 40 : repulsion; // Resonable range 2 to 100
	}

	_distance(node1, node2)
	{
		let dx = node2._x - node1._x;
		let dy = node2._y - node1._y;
		let d2 = dx * dx + dy * dy;
		if (d2 < 0.01)
		{
			dx = Math.random() * 0.1 + 0.1;
			dy = Math.random() * 0.1 + 0.1;
			d2 = dx * dx + dy * dy;
		}
		return [dx, dy, Math.sqrt(d2), d2]; // dx, dy, distance, distance * distance
	}

	_repulse(node1, node2)
	{
		let a = this._distance(node1, node2);
		if (a[2] < this.repulsion)
		{
			// Include node mass (default is 1)
			let f = (node1.mass * node2.mass * this.springConstant2) / a[3];
			let fx = f * a[0];
			let fy = f * a[1];
			node2._vx += fx;
			node2._vy += fy;
			node1._vx -= fx;
			node1._vy -= fy;
		}
	}

	_attract(node1, node2, elength)
	{
		let a = this._distance(node1, node2);
		// elength is length modifier for spring (0.0 to 1.0), default should be 1.0
		let f = (a[3] - this.springConstant2) / (this.springConstant * elength);
		f /= Math.min(a[2], this.repulsion);
		let fx = f * a[0];
		let fy = f * a[1];
		node2._vx -= fx;
		node2._vy -= fy;
		node1._vx += fx;
		node1._vy += fy;
	}

	update()
	{
		// TODO: increase/decrease limit??
		let limit = 0.5;

		let graph = this.graph;
		let nodes = graph.nodes;
		let n1;
		for (let i = 0; i < nodes.length - 1; i++)
		{
			n1 = nodes[i];
			for (let j = i + 1; j < nodes.length; j++)
			{
				this._repulse(n1, nodes[j]);
			}
		}
		let e;
		for (let i = 0; i < graph.edges.length; i++)
		{
			e = graph.edges[i];
			this._attract(e.node1, e.node2, e.elength);
		}

		// adjust n._vx, n._vy for canvas size to make better usage of space!!
		let fx = graph.mforce * graph.canvas.width / graph.canvas.height;
		let fy = graph.mforce * graph.canvas.height / graph.canvas.width;
		//console.log(graph.canvas.width / graph.canvas.height, graph.canvas.height / graph.canvas.width);
		// typically 2.2 0.45 for 1920x1080 screen
		let n;
		let distance = graph.distance;
		for (let i = 0; i < nodes.length; i++)
		{
			n = nodes[i];
			if (!n.fixed)
			{
				n._x += Math.max(-limit, Math.min(n._vx * fx, limit));
				n._y += Math.max(-limit, Math.min(n._vy * fy, limit));
				n.x = n._x * distance; // this is what we actually draw (scaled/translated etc...)
				n.y = n._y * distance;
			}
			n._vx = 0;
			n._vy = 0;
		}
	}
};


var Heap = class {
	constructor()
	{
		this.k = [];
		this.w = [];
		this.length = 0;
	}

	push(key, weight)
	{
		let i = 0;
		while (i <= this.w.length && weight < (this.w[i] || Infinity))
			i++;
		this.k.splice(i, 0, key);
		this.w.splice(i, 0, weight);
		this.length += 1;
		return true;
	}

	pop()
	{
		this.length -= 1;
		this.w.pop();
		return this.k.pop();
	}
};


Graph.adjacency = function(graph, a)
{
	if (a === undefined) a = {};
	if (a.directed === undefined) a.directed = false;
	if (a.reversed === undefined) a.reversed = false;
	if (a.stochastic === undefined) a.stochastic = false;
	let map = {};
	let nodes = graph.nodes;
	for (let i = 0; i < nodes.length; i++)
		map[nodes[i].id] = {};
	let edges = graph.edges;
	for (let i = 0; i < edges.length; i++)
	{
		let e = edges[i];
		let id1 = e[(a.reversed) ? "node2" : "node1"].id;
		let id2 = e[(a.reversed) ? "node1" : "node2"].id;
		map[id1][id2] = 1.0 - e.weight * 0.5;
		if (a.heuristic)
			map[id1][id2] += a.heuristic(id1, id2);
		if (!a.directed)
			map[id2][id1] = map[id1][id2];
	}
	if (a.stochastic)
	{
		for (let id1 in map)
		{
			let n = Array.sum(Object.values(map[id1]));
			for (let id2 in map[id1])
				map[id1][id2] /= n;
		}
	}
	return map;
};


Graph.brandesBetweennessCentrality = function(graph, a)
{
	if (a === undefined) a = {};
	if (a.normalized === undefined) a.normalized = true;
	if (a.directed === undefined) a.directed = false;
	let W = Graph.adjacency(graph, a);
	let b = {};
	for (let n in graph.nodeset)
		b[n] = 0.0;
	for (let id in graph.nodeset)
	{
		let Q = new Heap();
		let D = {};
		let P = {};
		for (let n in graph.nodeset)
			P[n] = [];
		let seen = {id: 0};
		Q.push([0, id, id], 0);
		let S = [];
		let E = {};
		for (let n in graph.nodeset)
			E[n] = 0;
		E[id] = 1.0;
		while (Q.length)
		{
			let q = Q.pop();
			let dist = q[0];
			let pred = q[1];
			let v = q[2];
			if (v in D)
				continue;
			D[v] = dist;
			S.push(v);
			E[v] += E[pred];
			for (let w in W[v])
			{
				let vw_dist = D[v] + W[v][w];
				if (!(w in D) && (!(w in seen) || vw_dist < seen[w]))
				{
					seen[w] = vw_dist;
					Q.push([vw_dist, v, w], vw_dist);
					P[w] = [v];
					E[w] = 0.0;
				}
				else if (vw_dist == seen[w])
				{
					P[w].push(v);
					E[w] = E[w] + E[v];
				}
			}
		}
		let d = {};
		for (let v in graph.nodeset)
			d[v] = 0;
		while (S.length)
		{
			let w = S.pop();
			for (let i = 0; i < P[w].length; i++)
			{
				let v = P[w][i];
				d[v] += (1 + d[w]) * E[v] / E[w];
			}
			if (w != id) {
				b[w] += d[w];
			}
		}
	}
	let m = a.normalized ? Math.max.apply(Math, Object.values(b)) || 1 : 1;
	for (let id in b)
		b[id] = b[id] / m;
	return b;
};


// Basic Dragable dialog for help and options
var Dialog = class {
	constructor(graph)
	{
		this.graph = graph;
		this.visible = false;

		this.dialog = document.createElement("div");
		this.dialog.style.cssText = "padding: 5px; display: none; position: absolute; \
			background-color: rgba(240,240,240,0.9); min-width: 550px; \
			box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.4); border-radius: 10px; z-index: 1;";

		let headdiv = document.createElement("div");
		// padding top right bottom left
		headdiv.style.cssText = "padding: 5px 5px 5px 15px; background-color: #4499EE; color: #FFFFFF; border-radius: 5px;";
		this.titlespan = document.createElement("span");
		this.titlespan.style.cssText = "font-weight: bold; cursor: default;";
		this.titlespan.textContent = "Title Goes Here!";
		headdiv.appendChild(this.titlespan);

		// Close Btn
		let closespan = document.createElement("span");
		closespan.textContent = "X";
		closespan.style.cssText = "color: white; float: right; font-weight: bold; cursor: pointer;";
		headdiv.appendChild(closespan);
		closespan.addEventListener("click", () => {
			this.show(false);
		});
		this.dialog.appendChild(headdiv);


		// Add Dialog node to DOM as sibling of canvas
		this.graph.canvas.parentElement.appendChild(this.dialog);

		// we can drag dialog around by header div
		this.lastx = 0;
		this.lasty = 0;
		this.b_onMousedown = this.onMousedown.bind(this);
		this.b_onMouseup = this.onMouseup.bind(this);
		this.b_onMousemove = this.onMousemove.bind(this);
		headdiv.addEventListener("mousedown", this.b_onMousedown);
	}

	showex()
	{
		this.visible = true;
		this.dialog.style.display = "block";
		this.dialog.style.left = (window.innerWidth - this.dialog.clientWidth) / 2 + "px";
		this.dialog.style.top = "100px";
	}

	show(bshow, evt)
	{
		if (bshow)
		{
			this.visible = true;
			this.dialog.style.display = "block";

			let left = evt.clientX;
			let leftmax = window.innerWidth - this.dialog.clientWidth - 25; // 25 === fudge factor - scrollbar!
			if (left > leftmax)
				left = leftmax;
			this.dialog.style.left = (left - 10 + window.pageXOffset) + "px";

			let top = evt.clientY;
			let topmax = window.innerHeight - this.dialog.clientHeight - 20; // 20 === fudge factor
			if (top > topmax)
				top = topmax;
			this.dialog.style.top = (top - 10 + window.pageYOffset) + "px";
		}
		else
		{
			this.visible = false;
			this.dialog.style.display = "none";
		}
	}

	onMousedown(evt)
	{
		if (0 !== evt.button) // we only drag on left mouse button down!
			return;

		evt.preventDefault();
		// get the initial mouse cursor position on mouse down
		this.lastx = evt.clientX;
		this.lasty = evt.clientY;
		document.addEventListener("mouseup", this.b_onMouseup);
		document.addEventListener("mousemove", this.b_onMousemove);
	}

	onMousemove(evt)
	{
		evt.preventDefault();
		// calculate the change in cursor position and save new pos
		let dx = this.lastx - evt.clientX;
		let dy = this.lasty - evt.clientY;
		this.lastx = evt.clientX;
		this.lasty = evt.clientY;
		// set the element's new position:
		this.dialog.style.left = (this.dialog.offsetLeft - dx) + "px";
		this.dialog.style.top = (this.dialog.offsetTop - dy) + "px";
	}

	onMouseup()
	{
		// done so remove listeners added in onMousedown
		document.removeEventListener("mouseup", this.b_onMouseup);
		document.removeEventListener("mousemove", this.b_onMousemove);
	}

};


// Simple help dialog to explain functionality - will never remember how eveything works!
var Help = class extends Dialog{
	constructor(graph)
	{
		super(graph);
		this.titlespan.textContent = "Help";

		// TODO: finish help
		let div = document.createElement("div");
		div.style.cssText = "padding: 2px 2px 2px 2px;";
		//div.textContent = "Explain Here!!\nExplain Here!!\nExplain Here!!";
		div.innerHTML = "NOTES:<br> \
For options dialog: right click (context menu) on canvas.<br> \
To pan the view: left click and drag on empty portion of canvas.<br>  \
To move/drag a node: left click and drag on node.<br> \
To scale graph: Use mousewheel or options dialog.<br> \
To autosize graph: left click on canvas with shift key down.<br> \
&nbsp;&nbsp Autosize can be set by default in the options dialog. <br> \
To reset panning: left click on canvas with CTRL key down.<br> \
To reset panning and scale: left click on canvas with ALT key down.<br> \
<br>More notes on this to come!!";

		this.dialog.appendChild(div);

		// Hide when we click on canvas or keep visible???
		//this.graph.canvas.addEventListener("click", () => { this.show(false); });
	}
};


// Basic Options Dialog for graph
var Popup = class extends Dialog{
	constructor(graph, layouttype)
	{
		super(graph);
		this.titlespan.textContent = "Graphing Options";

		// Combo for graph type
		let div = document.createElement("div");
		div.style.cssText = "padding: 4px 0px 2px 4px;"; // top, right, bottom, left
		let array = ["GraphSpring", "Repulsion", "BHut", "Custom"];
		let varray = ["GraphSpring", "Repulsion", "BHut", "Custom"];

		if (typeof CustomLayout === "undefined")
		{
			array = array.filter(e => e !== "Custom");
			varray = varray.filter(e => e !== "Custom");
		}

		let selectList = this.selectList = document.createElement("select");
		// Make as small as possible by changing style
		selectList.style.cssText = "box-sizing: border-box; border: 1px #AAAAAA solid; place-self: center;";
		for (let i = 0; i < array.length; i++)
		{
			let option = document.createElement("option");
			option.value = varray[i];
			option.text = array[i];
			selectList.appendChild(option);
		}
		for (let i = 0; i < selectList.options.length; i++)
		{
			if (selectList.options[i].value === layouttype)
			{
				selectList.selectedIndex = i;
				break;
			}
		}

		let label = document.createElement("label");
		label.style.cssText = "align-self: center; padding-right: 10px;";
		label.setAttribute("title", "Select graph type");
		label.appendChild(document.createTextNode("Graph type"));
		div.appendChild(label);
		div.appendChild(selectList);
		this.dialog.appendChild(div);

		selectList.addEventListener("change", (evt) => {
			this.graph.setlayout(evt.target.value);
		});

		// Button for resetting all to defaults!
		let btn = document.createElement("button");
		let t = document.createTextNode("Reset Defaults");
		btn.style.cssText = "float: right;";
		btn.appendChild(t);
		div.appendChild(btn);
		btn.addEventListener("click", (evt) => {
			this.graph.reset_defaults();
			this.graph.reset_graph_options();
			this.update_ctrls();
		});


		// Control for changing graph Repulsion
		div = document.createElement("div");
		let rslider = this.rslider = this.create_slider(div, "Repulsion:", "Repulsion",
			10, 200, 40); // values do not matter
		let rval = this.rval = document.createElement("span");
		rval.style.cssText = "padding: 0px 10px 0px 10px;";
		div.appendChild(rval);
		// update_layout is called after this class is created by Graph class!

		rslider.addEventListener("input", (evt) => {
			//console.log("rslider input event");
			let repulsion = evt.target.value;
			rval.textContent = repulsion;
			this.graph.layout.repulsion = repulsion;

			this.graph.graph_options[this.graph.layouttype] = {repulsion: this.graph.layout.repulsion,
				sp_const: this.graph.layout.springConstant};
			g_ls.setObj("graph_options", this.graph.graph_options);

			this.graph.animate();
		});
		this.dialog.appendChild(div);


		// Control for changing graph spring constant
		div = document.createElement("div");
		let spslider = this.spslider = this.create_slider(div, "Spring Constant:", "Spring Constant",
			10, 200, 40); // values do not matter
		let spval = this.spval = document.createElement("span");
		spval.style.cssText = "padding: 0px 10px 0px 10px;";
		div.appendChild(spval);
		// update_layout is called after this class is created by Graph class!

		spslider.addEventListener("input", (evt) => {
			let k = evt.target.value;
			spval.textContent = k;
			this.graph.layout.springConstant = k;
			if ("GraphSpring" === this.graph.layouttype)
				this.graph.layout.springConstant2 = k * k;

			this.graph.graph_options[this.graph.layouttype] = {repulsion: this.graph.layout.repulsion,
				sp_const: this.graph.layout.springConstant};
			g_ls.setObj("graph_options", this.graph.graph_options);

			this.graph.animate();
		});
		this.dialog.appendChild(div);


		// Control for changing graph layout force - this affects the speed at which graph stabilizes
		div = document.createElement("div");
		// want range 0.0005 to 0.005, best approx 0.001
		let fslider = this.fslider = this.create_slider(div, "Initial Layout Force:", "Initial Layout Force",
			5, 50, this.graph.force / 0.0001);
		let fval = this.fval = document.createElement("span");
		fval.textContent = (fslider.value * 0.0001).toFixed(4);
		fval.style.cssText = "padding: 0px 10px 0px 10px;";
		div.appendChild(fval);

		fslider.addEventListener("input", (evt) => {
			let force = 0.0001 * evt.target.value;
			this.graph.force = force;
			fval.textContent = force.toFixed(4);

			this.graph.defaults.ilf = this.graph.force;
			g_ls.setObj("graph_defaults", this.graph.defaults);

			this.graph.animate();
		});
		this.dialog.appendChild(div);


		// Control for changing graph scale
		div = document.createElement("div");
		let sslider = this.sslider = this.create_slider(div, "Scale:", "Scale",
			1, 50, this.graph.scale * 10);
		sslider.step = 0.5;
		let sval = this.sval = document.createElement("span");
		sval.textContent = sslider.value / 10;
		sval.style.cssText = "padding: 0px 10px 0px 10px;";
		div.appendChild(sval);

		sslider.addEventListener("input", (evt) => {
			this.graph.autosize = false; // disable autosize otherwise we end up fighting scale changes
			this.graph.scale = evt.target.value / 10;
			sval.textContent = this.graph.scale.toFixed(2);

			this.graph.defaults.scale = this.graph.scale;
			g_ls.setObj("graph_defaults", this.graph.defaults);

			this.graph.redraw(); //animate();
		});
		this.dialog.appendChild(div);

		// Control for changing graph distance
		div = document.createElement("div");
		let dslider = this.dslider = this.create_slider(div, "Distance:", "Graph Distance",
			2, 100, this.graph.distance);
		let dval = this.dval = document.createElement("span");
		dval.textContent = dslider.value;
		dval.style.cssText = "padding: 0px 10px 0px 10px;";
		div.appendChild(dval);

		dslider.addEventListener("input", (evt) => {
			//console.log("dslider input event");
			dval.textContent = evt.target.value;
			this.graph.setdistance(evt.target.value);

			this.graph.defaults.distance = this.graph.distance;
			g_ls.setObj("graph_defaults", this.graph.defaults);

			this.graph.animate();
		});
		this.dialog.appendChild(div);


		// Control for showing/hiding tooltips
		div = document.createElement("div");
		div.style.cssText = "padding: 2px 0px 2px 0px;";

		let tcheckbox = this.tcheckbox = this.create_checkbox(div, "tcheckbox", "Show tooltips",
			"Show tooltips", this.graph.tooltips);
		tcheckbox.addEventListener("click", (evt) => {
			this.graph.settooltips(evt.target.checked);
			// storage update handled in graph.settooltips
		});

		// Control for showing/hiding labels for nodes. Same div as show/hide tips
		let hcheckbox = this.hcheckbox = this.create_checkbox(div, "hcheckbox", "Show Labels",
			"Show Labels", !this.graph.hidetext);
		hcheckbox.addEventListener("click", (evt) => {
			this.graph.hidetextlabels(!evt.target.checked);
			this.graph.redraw(); //animate();
			// storage update handled in graph.hidetextlabels
		});

		this.dialog.appendChild(div);


		// Control for autosizing graph
		div = document.createElement("div");
		div.style.cssText = "padding: 2px 0px 2px 0px;";

		let autocb = this.autocb = this.create_checkbox(div, "autocb", "Auto Size on load",
			"Auto Size on load", this.graph.autosizeonload);
		autocb.addEventListener("click", (evt) => {
			this.graph.setautosize(evt.target.checked);
			this.graph.redraw(); //animate();
			// storage update handled in graph.setautosize
		});

		this.dialog.appendChild(div);

		// Setup event listeners
		this.graph.canvas.addEventListener("contextmenu", (evt) => { this.show(true, evt); evt.preventDefault();});
		this.graph.canvas.addEventListener("click", () => { this.show(false);});
		this.graph.canvas.addEventListener("gdone", this.update_ctrls.bind(this));
	}

	create_checkbox(div, id, text, tip, checked)
	{
		let checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.setAttribute("title", tip);
		checkbox.checked = checked;
		checkbox.id = id;
		div.appendChild(checkbox);

		let label = document.createElement("label");
		// padding top right bottom left
		label.style.cssText = "margin-left: 6px; padding: 2px 8px 2px 2px;";
		label.setAttribute("title", tip);
		label.htmlFor = checkbox.id;
		label.appendChild(document.createTextNode(text));
		div.appendChild(label);
		return checkbox;
	}

	create_slider(div, text, tip, min, max, value)
	{
		let s = document.createElement("input");
		s.type = "range";
		s.setAttribute("title", tip);
		s.min = min;
		s.max = max;
		s.value = value;
		s.style.cssText = "padding: 0px 10px 0px 10px; vertical-align: middle;";
		div.appendChild(s);

		let span = document.createElement("span");
		span.textContent = text;
		span.style.cssText = "padding: 0px 10px 0px 10px;";
		div.appendChild(span);
		return s;
	}

	update_layout()
	{
		/*
		Repulsion Values depend on layout type
			GraphSpring Resonable range 5 to 400
			Repulsion Resonable range 50 to 1000
			BHut Resonable range 10000 to 500000
			Custom ???
		Spring Constant Values depend on layout type
			GraphSpring Resonable range 2 to 10 ???
			Repulsion Resonable range 0.0001 to 0.001 ???
			BHut Resonable range 0.0001 to 0.001 ???
			Custom ???
		*/
		if ("GraphSpring" === this.graph.layouttype)
		{
			this.rslider.min = 5;
			this.rslider.max = 400;
			this.rslider.step = 5;

			this.spslider.min = 2;
			this.spslider.max = 10;
			this.spslider.step = 0.5;
		}
		else if ("Repulsion" === this.graph.layouttype)
		{
			this.rslider.min = 50;
			this.rslider.max = 1000;
			this.rslider.step = 25;

			this.spslider.min = 0.0001;
			this.spslider.max = 0.001;
			this.spslider.step = 0.00005;
		}
		else if ("BHut" === this.graph.layouttype)
		{
			this.rslider.min = 10000;
			this.rslider.max = 500000;
			this.rslider.step = 10000;

			this.spslider.min = 0.0001;
			this.spslider.max = 0.001;
			this.spslider.step = 0.00005;
		}
		else if ("Custom" === this.graph.layouttype)
		{
			// TODO: ???
			this.rslider.min = 50;
			this.rslider.max = 1000;
			this.rslider.step = 25;

			this.spslider.min = 0.0001;
			this.spslider.max = 0.001;
			this.spslider.step = 0.00005;
		}
		// repulsion
		this.rslider.value = this.graph.layout.repulsion;
		this.rval.textContent = this.rslider.value;
		// spring constant
		this.spslider.value = this.graph.layout.springConstant;
		this.spval.textContent = this.spslider.value;
	}

	update_ctrls()
	{
		//console.log("update_ctrls");
		// repulsion
		this.rslider.value = this.graph.layout.repulsion;
		this.rval.textContent = this.rslider.value;
		// spring constant
		this.spslider.value = this.graph.layout.springConstant;
		this.spval.textContent = this.spslider.value;
		// layout force
		this.fslider.value = this.graph.force / 0.0001;
		this.fval.textContent = this.graph.force.toFixed(4);
		// Update scale
		this.sslider.value = this.graph.scale * 10;
		this.sval.textContent = (this.sslider.value / 10).toFixed(2);
		// Update Distance!!
		this.dslider.value = this.graph.distance;
		this.dval.textContent = this.dslider.value;
		// show tooltips
		this.tcheckbox.checked = this.graph.tooltips;
		// hide textlabels
		this.hcheckbox.checked = !this.graph.hidetext;
		// autosizing
		this.autocb.checked = this.graph.autosizeonload;
	}

	show(bshow, evt)
	{
		if (bshow)
			this.update_ctrls(); // update slider iff required before we show!

		// pass on to base class for the rest...
		super.show(bshow, evt);
	}
};


var graphText = class {
	constructor(graph, callback)
	{
		this.graph = graph;
		this.callback = callback;
		this.visible = false;

		this.text = document.createElement("div");
		this.text.style.cssText = "padding: 3px; display: none; position: absolute; top: 50px; \
			left: 10px; background-color: rgba(0,0,0,0); \
			box-shadow: 0px 4px 8px 0px rgba(0,0,0,0.2); z-index: 10;";

		this.textbox = document.createElement("input");
		this.textbox.type = "text";
		this.textbox.id = "graphText";
		this.textbox.style.cssText = "background: transparent;";

		this.text.appendChild(this.textbox);

		this.textbox.addEventListener("keyup", this.keyup.bind(this));

		// We must reposition when window sized
		window.addEventListener("resize", this.resizewindow.bind(this));

		// Add node to DOM as sibling of canvas
		this.graph.canvas.parentElement.appendChild(this.text);
	}

	keyup(evt)
	{
		if (evt.keyCode !== 13)
			return;

		this.graph.unhilight(this.graph);

		//console.log(evt.target.value);

		// Call callback for special handling
		let nodes = [];
		let bhandled = false;
		if (undefined !== this.callback)
			bhandled = this.callback(evt.target.value, this.graph.nodes, nodes);

		if (!bhandled && (0 !== evt.target.value.length))
		{
			let gnodes = this.graph.nodes;
			let numnodes = gnodes.length;
			for (let i = 0; i < numnodes; i++)
			{
				let host = gnodes[i];
				if (host.id.includes(evt.target.value))
					nodes.push(host);
			}
		}
		else if (0 === evt.target.value.length)
		{
			// reshow all labels!!
			let gnodes = this.graph.nodes;
			let numnodes = gnodes.length;
			for (let i = 0; i < numnodes; i++)
			{
				nodes.push(gnodes[i]);
			}
		}

		for (let i = 0; i < nodes.length; i++)
		{
			nodes[i].showtext = true;
			if (0 !== evt.target.value.length)
			{
				nodes[i].hifill = g_HICLR;
				// Also connecting edges
				let edges = nodes[i].links.edges;
				for (let edge in edges)
				{
					// Only if edges[edge].stroke is not transparent
					if ("transparent" !== edges[edge].stroke)
						edges[edge].histroke = g_HICLR;
				}
			}
		}
		this.graph.redraw();
	}

	set_text(text)
	{	this.textbox.value = text;	}

	resizewindow(evt)
	{
		if (this.visible)
			this.show(true);
	}

	show(bshow)
	{
		if (bshow)
		{
			this.visible = true;
			this.text.style.display = "block";

			this.text.style.left = this.graph.canvas.clientWidth - 295 + "px";
			this.text.style.top = this.graph.canvas.offsetTop + 2 + "px";
		}
		else
		{
			this.visible = false;
			this.text.style.display = "none";
		}
	}
};


// Code hacked from vis-network.js (version 9.1.2 2022-03-28T20:17:35.342Z)
var RepulsionLayout = class extends GraphLayout{
	constructor(graph, springconst, repulsion)
	{
		super(graph);
		this.centralGravity = 0.2;
		this.springConstant = (undefined === springconst) ? 0.0005 : springconst; // adjustable value to control attraction of edges

		// adjustable value to control repulsion of nodes - reasonable range 50 to 1000
		this.repulsion = (undefined === repulsion) ? 200 : repulsion;
	}

	_gravity(node)
	{
		// gravity is computed about graph origin
		let dx = -node.x;
		let dy = -node.y;
		let distance = Math.sqrt(dx * dx + dy * dy);

		let gravityForce = distance === 0 ? 0 : this.centralGravity / distance;
		node._vx -= dx * gravityForce;
		node._vy -= dy * gravityForce;
	}

	_repulse(node1, node2)
	{
		let dx = node2.x - node1.x;
		let dy = node2.y - node1.y;
		// Getting rid of square root IS measurably faster!
		//let distance = Math.sqrt(dx * dx + dy * dy);
		let distance = dx * dx + dy * dy;

		if (distance === 0)
		{
			//distance = Math.random() * 0.1; // avg === 0.5 * 0.1 = 0.05 (.05 *.05 = .0025)
			//dx = distance;
			//dy = distance;
			distance = Math.random() * 0.001; // avg === 0.5 * 0.005 = .0025
			dx = distance * 20;
			dy = distance * 20;
		}

		// normal/default node mass is 1, for less repulsion we make mass < 1
		// and for greater repulsion we make > 1
		// repulsion decreases with distance and increases with mass
		//let repulsingForce = this.repulsion * (node1.mass * node2.mass) / (distance * distance);
		let repulsingForce = this.repulsion * (node1.mass * node2.mass) / distance;

		let fx = dx * repulsingForce;
		let fy = dy * repulsingForce;
		//console.log("repulse", fx, fy);
		node2._vx += fx;
		node2._vy += fy;
		node1._vx -= fx;
		node1._vy -= fy;
	}

	_spring(node1, node2, elength)
	{
		let dx = node2.x - node1.x;
		let dy = node2.y - node1.y;
		let distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);

		// spring force increases with distance, elength is length modifier for spring (0.0 to 1.0)
		// elength default should be 1.0
		let springForce = this.springConstant * distance / elength;
		let fx = dx * springForce;
		let fy = dy * springForce;

		//console.log("spring", fx, fy);
		node2._vx -= fx;
		node2._vy -= fy;
		node1._vx += fx;
		node1._vy += fy;
	}

	update()
	{
		// gravity, repulse, spring
		let limit = 0.5;

		let graph = this.graph;
		let nodes = graph.nodes;
		// NOTE: Ignore gravity for now - slower and we could incorporate into repulse loop??
		//for (let i = 0; i < nodes.length; i++)
		//{
			//this._gravity(nodes[i]);
		//}

		// we loop from i over all but the last entry in the array
		// j loops from i+1 to the last. This way we do not double count any of the indices, nor i === j
		for (let i = 0; i < nodes.length - 1; i++)
		{
			for (let j = i + 1; j < nodes.length; j++)
			{
				this._repulse(nodes[i], nodes[j]);
			}
		}
		let e;
		let edges = graph.edges;
		for (let i = 0; i < edges.length; i++)
		{
			e = edges[i];
			this._spring(e.node1, e.node2, e.elength);
		}

		// adjust n._vx, n._vy for canvas size to make better usage of space!!
		let fx = graph.mforce * graph.canvas.width / graph.canvas.height;
		let fy = graph.mforce * graph.canvas.height / graph.canvas.width;
		let n;
		let distance = graph.distance;
		for (let i = 0; i < nodes.length; i++)
		{
			n = nodes[i];
			if (!n.fixed)
			{
				n._x += Math.max(-limit, Math.min(n._vx * fx, limit));
				n._y += Math.max(-limit, Math.min(n._vy * fy, limit));
				n.x = n._x * distance; // this is what we actually draw (scaled/translated etc...)
				n.y = n._y * distance;
			}
			n._vx = 0;
			n._vy = 0;
		}
	}
};

// The barnesHut physics model (which is enabled by default) is based on an inverted gravity model.
//
// Node mass (default 1)
//		By increasing the mass of a node, you increase it's repulsion. Values between 0 and 1 are not recommended.
//		Negative or zero values are not allowed. These will generate a console error and will be set to 1.
// Theta (default 0.5)
//		This parameter determines the boundary between consolidated long range forces and individual short
//		range forces. To oversimplify higher values are faster but generate more errors, lower values are
//		slower but with less errors.
// repulsion
//		If you want the repulsion to be stronger, increase the value.


// Code hacked from vis-network.js (version 9.1.2 2022-03-28T20:17:35.342Z)
var BHutLayout = class extends GraphLayout{
	constructor(graph, springconst, repulsion)
	{
		super(graph);

		this.centralGravity = 0.2;
		this.springConstant = (undefined === springconst) ? 0.0005 : springconst; // adjustable value to control attraction of edges

		// Barnes-Hut
		this.theta = 0.5;
		this.thetaInversed = 1 / this.theta;
		this.repulsion = (undefined === repulsion) ? 200000 : repulsion; // adjustable value to control repulsion, Resonable range 10000 to 500000
	}

	_gravity(node)
	{
		// gravity is computed about graph origin
		let dx = -node.x;
		let dy = -node.y;
		let distance = Math.sqrt(dx * dx + dy * dy);

		var gravityForce = distance === 0 ? 0 : this.centralGravity / distance;
		node._vx -= dx * gravityForce;
		node._vy -= dy * gravityForce;
	}

	_spring(node1, node2, elength)
	{
		let dx = node2.x - node1.x;
		let dy = node2.y - node1.y;
		let distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);

		// spring force increases with distance, elength is length modifier for spring (0.0 to 1.0)
		// elength default should be 1.0
		let springForce = this.springConstant * distance / elength;
		let fx = dx * springForce;
		let fy = dy * springForce;

		//console.log("spring", fx, fy);
		node2._vx -= fx;
		node2._vy -= fy;
		node1._vx += fx;
		node1._vy += fy;
	}

	// actually place the node in a region (or branch)
	_placeInRegion(parentBranch, node, region)
	{
		var children = parentBranch.children[region];

		switch (children.childrenCount)
		{
			case 0:
				// place node here
				children.children.data = node;
				children.childrenCount = 1;
				this._updateBranchMass(children, node);
				break;

			case 1:
				// convert into children
				// if there are two nodes exactly overlapping (on init, on opening of cluster etc.)
				// we move one node a little bit and we do not put it in the tree.
				if (children.children.data.x === node.x && children.children.data.y === node.y)
				{
					node.x += Math.random();
					node.y += Math.random();
				}
				else
				{
					this._splitBranch(children);
					this._placeInTree(children, node);
				}
				break;

			case 4:
				// place in branch
				this._placeInTree(children, node);

				break;
		}
	}

	// this updates the mass of a branch. this is increased by adding a node.
	_updateBranchMass(parentBranch, node)
	{
		var centerOfMass = parentBranch.centerOfMass;
		var totalMass = parentBranch.mass + node.mass;
		var totalMassInv = 1 / totalMass;
		centerOfMass.x = centerOfMass.x * parentBranch.mass + node.x * node.mass;
		centerOfMass.x *= totalMassInv;
		centerOfMass.y = centerOfMass.y * parentBranch.mass + node.y * node.mass;
		centerOfMass.y *= totalMassInv;
		parentBranch.mass = totalMass;
		var biggestSize = Math.max(Math.max(node.height, node.radius), node.width);
		parentBranch.maxWidth = parentBranch.maxWidth < biggestSize ? biggestSize : parentBranch.maxWidth;
	}

	// determine in which branch the node will be placed.
	_placeInTree(parentBranch, node, skipMassUpdate)
	{
		if (skipMassUpdate != true || skipMassUpdate === undefined)
		{
			// update the mass of the branch.
			this._updateBranchMass(parentBranch, node);
		}

		var range = parentBranch.children.NW.range;
		var region;

		if (range.maxX > node.x)
		{
			// in NW or SW
			if (range.maxY > node.y)
				region = "NW";
			else
				region = "SW";
		}
		else
		{
			// in NE or SE
			if (range.maxY > node.y)
				region = "NE";
			else
				region = "SE";
		}

		this._placeInRegion(parentBranch, node, region);
	}

	// This function subdivides the region into four new segments.
	// Specifically, this inserts a single new segment.
	// It fills the children section of the parentBranch
	_insertRegion(parentBranch, region)
	{
		var minX, maxX, minY, maxY;
		var childSize = 0.5 * parentBranch.size;

		switch (region)
		{
			case "NW":
				minX = parentBranch.range.minX;
				maxX = parentBranch.range.minX + childSize;
				minY = parentBranch.range.minY;
				maxY = parentBranch.range.minY + childSize;
				break;

			case "NE":
				minX = parentBranch.range.minX + childSize;
				maxX = parentBranch.range.maxX;
				minY = parentBranch.range.minY;
				maxY = parentBranch.range.minY + childSize;
				break;

			case "SW":
				minX = parentBranch.range.minX;
				maxX = parentBranch.range.minX + childSize;
				minY = parentBranch.range.minY + childSize;
				maxY = parentBranch.range.maxY;
				break;

			case "SE":
				minX = parentBranch.range.minX + childSize;
				maxX = parentBranch.range.maxX;
				minY = parentBranch.range.minY + childSize;
				maxY = parentBranch.range.maxY;
				break;
		}

		parentBranch.children[region] = {
			centerOfMass: {
				x: 0,
				y: 0
			},
			mass: 0,
			range: {
				minX: minX,
				maxX: maxX,
				minY: minY,
				maxY: maxY
			},
			size: 0.5 * parentBranch.size,
			calcSize: 2 * parentBranch.calcSize,
			children: {
				data: null
			},
			maxWidth: 0,
			level: parentBranch.level + 1,
			childrenCount: 0
		};
	}

	// This function splits a branch into 4 sub branches. If the branch contained a node, we place it in the subbranch
	// after the split is complete.
	_splitBranch(parentBranch)
	{
		// if the branch is shaded with a node, replace the node in the new subset.
		var containedNode = null;

		if (parentBranch.childrenCount === 1)
		{
			containedNode = parentBranch.children.data;
			parentBranch.mass = 0;
			parentBranch.centerOfMass.x = 0;
			parentBranch.centerOfMass.y = 0;
		}

		parentBranch.childrenCount = 4;
		parentBranch.children.data = null;

		this._insertRegion(parentBranch, "NW");
		this._insertRegion(parentBranch, "NE");
		this._insertRegion(parentBranch, "SW");
		this._insertRegion(parentBranch, "SE");

		if (containedNode != null)
			this._placeInTree(parentBranch, containedNode);
	}

	// This function constructs the barnesHut tree recursively. It creates the root, splits it and starts placing the nodes.
	_formBarnesHutTree(nodes)
	{
		var nodeCount = nodes.length;
		var minX = nodes[0].x;
		var minY = nodes[0].y;
		var maxX = nodes[0].x;
		var maxY = nodes[0].y; // get the range of the nodes

		for (var i = 1; i < nodeCount; i++)
		{
			var _node = nodes[i];
			var x = _node.x;
			var y = _node.y;

			if (_node.mass > 0)
			{
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		} // make the range a square

		var sizeDiff = Math.abs(maxX - minX) - Math.abs(maxY - minY); // difference between X and Y

		if (sizeDiff > 0)
		{
			minY -= 0.5 * sizeDiff;
			maxY += 0.5 * sizeDiff;
		} // xSize > ySize
		else
		{
			minX += 0.5 * sizeDiff;
			maxX -= 0.5 * sizeDiff;
		} // xSize < ySize


		var minimumTreeSize = 1e-5;
		var rootSize = Math.max(minimumTreeSize, Math.abs(maxX - minX));
		var halfRootSize = 0.5 * rootSize;
		var centerX = 0.5 * (minX + maxX),
		centerY = 0.5 * (minY + maxY);

		// construct the barnesHutTree
		var barnesHutTree = {
			root: {
				centerOfMass: {
					x: 0,
					y: 0
				},
				mass: 0,
				range: {
					minX: centerX - halfRootSize,
					maxX: centerX + halfRootSize,
					minY: centerY - halfRootSize,
					maxY: centerY + halfRootSize
				},
				size: rootSize,
				calcSize: 1 / rootSize,
				children: {
					data: null
				},
				maxWidth: 0,
				level: 0,
				childrenCount: 4
			}
		};

		this._splitBranch(barnesHutTree.root); // place the nodes one by one recursively

		var node;
		for (var _i = 0; _i < nodeCount; _i++)
		{
			node = nodes[_i];
			if (node.mass > 0)
				this._placeInTree(barnesHutTree.root, node);
		} // make global

		return barnesHutTree;
	}


	// Calculate the forces based on the distance.
	_calculateForces(distance, dx, dy, node, parentBranch)
	{
		if (distance === 0)
		{
			distance = 0.1;
			dx = distance;
		}

		// the dividing by the distance cubed instead of squared allows us to get the fx and fy components without sines and cosines
		// it is shorthand for gravityforce with distance squared and fx = dx/distance * gravityForce
		var gravityForce = this.repulsion * parentBranch.mass * node.mass / Math.pow(distance, 3);
		var fx = dx * gravityForce;
		var fy = dy * gravityForce;

		node._vx -= fx;
		node._vy -= fy;
	}

	// This function traverses the barnesHutTree. It checks when it can approximate distant nodes with their center of mass.
	// If a region contains a single node, we check if it is not itself, then we apply the force.
	_getForceContribution(parentBranch, node)
	{
		// we get no force contribution from an empty region
		if (parentBranch.childrenCount > 0)
		{
			// get the distance from the center of mass to the node.
			var dx = parentBranch.centerOfMass.x - node.x;
			var dy = parentBranch.centerOfMass.y - node.y;
			var distance = Math.sqrt(dx * dx + dy * dy); // BarnesHutSolver condition
			// original condition : s/d < theta = passed  ===  d/s > 1/theta = passed
			// calcSize = 1/s --> d * 1/s > 1/theta = passed

			if (distance * parentBranch.calcSize > this.thetaInversed)
				this._calculateForces(distance, dx, dy, node, parentBranch);
			else
			{
				// Did not pass the condition, go into children if available
				if (parentBranch.childrenCount === 4)
					this._getForceContributions(parentBranch, node);
				else
				{
					// parentBranch must have only one node, if it was empty we wouldnt be here
					if (parentBranch.children.data.id != node.id)
					{
						// if it is not self
						this._calculateForces(distance, dx, dy, node, parentBranch);
					}
				}
			}
		}
	}

	_getForceContributions(parentBranch, node)
	{
		this._getForceContribution(parentBranch.children.NW, node);
		this._getForceContribution(parentBranch.children.NE, node);
		this._getForceContribution(parentBranch.children.SW, node);
		this._getForceContribution(parentBranch.children.SE, node);
	}

	update()
	{
		// gravity, barnes-hut repulsion, spring
		let limit = 0.5;

		let graph = this.graph;
		let nodes = graph.nodes;

		// NOTE: Ignore gravity for now - slower and we could incorporate into repulse loop??
		//for (let i = 0; i < nodes.length; i++)
		//{
		//	this._gravity(nodes[i]);
		//}

		// Now Barnes-Hut
		if (0 === nodes.length)
			return;

		let barnesHutTree = this._formBarnesHutTree(nodes);

		let nodeCount = nodes.length;
		let node;
		for (let i = 0; i < nodeCount; i++)
		{
			node = nodes[i];
			console.assert(node.mass > 0, "node.mass !> 0 ??");
			if (node.mass > 0)
			{
				// starting with root is irrelevant, it never passes the BarnesHutSolver condition
				this._getForceContributions(barnesHutTree.root, node);
			}
		}
		let e;
		let edges = graph.edges;
		for (let i = 0; i < edges.length; i++)
		{
			e = edges[i];
			this._spring(e.node1, e.node2, e.elength);
		}

		// adjust n._vx, n._vy for canvas size to make better usage of space!!
		let fx = graph.mforce * graph.canvas.width / graph.canvas.height;
		let fy = graph.mforce * graph.canvas.height / graph.canvas.width;
		let n;
		let distance = graph.distance;
		for (let i = 0; i < nodes.length; i++)
		{
			n = nodes[i];
			if (!n.fixed)
			{
				n._x += Math.max(-limit, Math.min(n._vx * fx, limit));
				n._y += Math.max(-limit, Math.min(n._vy * fy, limit));
				n.x = n._x * distance; // this is what we actually draw (scaled/translated etc...)
				n.y = n._y * distance;
			}
			n._vx = 0;
			n._vy = 0;
		}
	}
};
