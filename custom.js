
"use strict";

/* jshint esversion: 6 */
/* jshint sub:true */
// Just to shut jsHint up (https://jshint.com/)
//let GraphLayout;

var CustomLayout = class extends GraphLayout{
	constructor(graph, springconst, repulsion)
	{
		super(graph);
		this.centralGravity = 0.2;
		this.springConstant = (undefined === springconst) ? 0.00025 : springconst; // adjustable value to control attraction of edges

		// adjustable value to control repulsion of nodes - reasonable range 50 to 1000
		this.repulsion = (undefined === repulsion) ? 200 : repulsion;

		this.levelSeparation = 400;
	}

	// https://javascript.algorithmexamples.com/web/maths/DijkstraSmallestPath.html
	shortest_paths(graph, start)
	{
		// create object to hold shortest path solutions for all nodes
		let solutions = {};
		//console.log("Adding solution for start node", start);
		solutions[start] = [];
		solutions[start].dist = 0;

		while (true)
		{
			let p = null;
			let neighbor = null;
			let dist = Infinity;

			for (let n in solutions)
			{
				let ndist = solutions[n].dist;
				// get linked nodes for node n and loop over them
				let links = graph[n];
				for (let link in links)
				{
					if (solutions[link])
					{
						//console.log("Skipping solution for", link, "already done");
						continue; // already done so continue
					}
					// compute and compare new cost/distance
					let d = links[link] + ndist;
					if (d < dist)
					{
						// new shorter path so save info
						p = solutions[n];
						neighbor = link;
						dist = d;
					}
				}
			}

			// no more solutions
			if (dist === Infinity)
				break;

			//console.log("Adding solution for", neighbor);
			// extend parent's solution path
			solutions[neighbor] = p.concat(neighbor);
			// extend parent's cost
			solutions[neighbor].dist = dist;
		}

		return solutions;
	}

	init()
	{
		// There are many ways we can position nodes but to really position well
		// we need to get quite complicated (mimimize link crossings etc...)
		// We opt for a simpler solution here that just position main nodes
		// based on the number of links and the shortest path level

		// TODO: leave commented code below for now as we may want to tweak/improve
		// in the future

		//// first create data for finding shortest paths between root node and all others
		//let nodes = this.graph.nodes;
		//let numnodes = nodes.length;
		//let graph = {};
		//for (let i = 0; i < numnodes; i++)
		//{
			//let host = this.graph.nodes[i];
			//let g = graph[host.id] = {};
			//let len = host.links.length;
			//for (let i = 0; i < len; i++)
			//{
				//let node = host.links[i];
				//g[node.id] = 1;
			//}
		//}
		////console.log(graph);
		////console.log(JSON.stringify(graph, null, 4));

		//// TODO: this only handles 1 mainsite currently!!
		//// solutions object is ordered from shortest path nodes to longest
		//let solutions = this.shortest_paths(graph, this.graph.nodes[0].mainsite);
		////console.log(JSON.stringify(solutions, null, 4));

		/*
		{
			"www.politico.com": [],
			"static.chartbeat.com": [
				"static.chartbeat.com"
			],
			"cdn.cookielaw.org": [
				"cdn.cookielaw.org"
			],
			"static.politico.com": [
				"static.politico.com"
			],
			...
			...
			"sync.crwdcntrl.net": [
				"s.amazon-adsystem.com",
				"e1.emxdgt.com",
				"sync.crwdcntrl.net"
			],
			"sync.targeting.unrulymedia.com": [
				"s.amazon-adsystem.com",
				"e1.emxdgt.com",
				"sync.targeting.unrulymedia.com"
			]
		}
		*/
		/*
		We have object of all nodes and their links
		We have object of all shortest paths for all nodes

		Can we position nodes based on shortest path (1, 2, 3 etc.) in x direction
		Then position nodes in y direction based on the number of links each node has?
		Nodes with large number at top OR bottom and rewest in middle or not positioned at all??

		*/

		// get level of farthest path node
		//let aobj = Object.entries(solutions);
		//let numlevels = aobj[aobj.length - 1][1].length + 1; // levels 0, 1, 2, 3 == 4 levels

		// if 2 levels or less then no special handling!
		//if (numlevels > 2)
		//{
			//// Create new array, one for each level in shortest paths
			//let levels = [];
			//for (let i = 0; i < numlevels; i++)
			//{
				//levels.push([]);
			//}

			//for (let s in solutions)
			//{
				//let sol = solutions[s];
				//let node = this.graph.node(s);
				//let level = levels[sol.length];
				//// We are only interested in nodes with > 5 links
				//if (node.links.length > 5)
					//level.push([s, node.links.length]);
			//}

			//// Now create new array with entries is each level sorted so nodes
			//// with the most links are at the beginning and the end
			////console.log(levels);
			//let newlevels = [];
			//for (let i = 0; i < numlevels; i++) // skip first level???
			//{
				//let level = levels[i];

				//let sortedArr = level.sort(function(a, b) {
					//return b[1] - a[1];
				//});

				////// just take top 3
				////console.log(JSON.stringify(sortedArr, null, 2));
				////sortedArr = sortedArr.slice(sortedArr.length - 3, sortedArr.length);

				////console.log(sortedArr);
				//let gaussianArr = [];
				//sortedArr.forEach(function(e, i) {
					//if (i % 2)
						//gaussianArr.push(e);
					//else
						//gaussianArr.unshift(e);
				  //});
				//newlevels.push(gaussianArr);
			//}
			//console.log(newlevels);

			//// loop thru this sorted array and position main nodes
			//for (let i = 0; i < numlevels; i++)
			//{
				//let level = newlevels[i];
				//let numnodes = level.length;
				//let dmax = (numnodes - 1) / 2 * this.levelSeparation;
				//for (let j = 0; j < numnodes; j++)
				//{
					//let node = this.graph.node(level[j][0]);
					//node.x = i * this.levelSeparation + (Math.random() * 200) - 100;
					//node._x = node.x / this.graph.distance;
					//node.fixed = true;

					//node.y = dmax;
					//node._y = node.y / this.graph.distance;
					//dmax -= this.levelSeparation;
					////console.log(node.id, node.x, node.y);
					//// TODO: we should position linked nodes in circle around this node??

					//let len = node.links.length;
					//let radius = 100;
					//for (let k = 0; k < len; k++)
					//{
						//let n = node.links[k];
						//if (n.fixed) // leave already positioned nodes alone!
							//continue;
						//let angle = 2 * Math.PI * Math.random(); // Math.random() - greater than or equal to 0 and less than 1
						//n.x = node.x + radius * Math.cos(angle);
						//n.y = node.y + radius * Math.sin(angle);
						//n._x = n.x / this.graph.distance;
						//n._y = n.y / this.graph.distance;
						////console.log(n.id, n.x, n.y);
					//}
				//}
			//} // for each level
		//} // if (numlevels > 2)

////////////////////////

		// if 2 levels or less then no special handling!
		//if (numlevels > 2)
		//{
			//// Create new array, one for each level in shortest paths
			//let levels = [];
			//for (let i = 0; i < numlevels; i++)
			//{
				//levels.push([]);
			//}

			//for (let s in solutions)
			//{
				//let sol = solutions[s];
				//let node = this.graph.node(s);
				//let level = levels[sol.length];
				//// We are only interested in nodes with > 5 links
				//if (node.links.length > 5)
					//level.push([s, node.links.length]);
			//}

			//// Now create new array with entries is each level sorted so nodes
			//// with the most links are at the beginning and the end
			//console.log(levels);
			//let newlevels = [];
			//for (let i = 0; i < numlevels; i++) // skip first level???
			//{
				//let level = levels[i];

				//let sortedArr = level.sort(function(a, b) {
					//return b[1] - a[1];
				//});
				//newlevels.push(sortedArr);
			//}
			////console.log(newlevels);

			//// loop thru this sorted array and position main nodes
			//let nperrow = 5; // max 5 nodes per row
			//let dymax = (nperrow - 1) / 2 * this.levelSeparation;
			//let dx = 0, dy = 0; // set dy === 0 for root node
			//for (let i = 0; i < numlevels; i++)
			//{
				//let level = newlevels[i];
				//let numnodes = level.length;
				//for (let j = 0; j < numnodes; j++)
				//{
					//// 0, 1, 2, 3, 4
					//// 5, 6, 7, 8, 9
					//// 10, 11, 12,13, 14
					//if (j > 0)
					//{
						//if (0 === (j % 5))
						//{
							//dx++;
							//dy = dymax;
						//}
					//}

					//let node = this.graph.node(level[j][0]);
					//node.x = dx * this.levelSeparation;
					//node._x = node.x / this.graph.distance;
					//node.fixed = true;

					//node.y = -dy;
					//node._y = node.y / this.graph.distance;
					//dy -= this.levelSeparation;
					//console.log(node.id, node.x, node.y, node.links.length);
					//// TODO: we should position linked nodes in circle around this node??

					//let len = node.links.length;
					//let radius = 100;
					//for (let k = 0; k < len; k++)
					//{
						//let n = node.links[k];
						//if (n.fixed) // leave already positioned nodes alone!
							//continue;
						//let angle = 2 * Math.PI * Math.random(); // Math.random() - greater than or equal to 0 and less than 1
						//n.x = node.x + radius * Math.cos(angle);
						//n.y = node.y + radius * Math.sin(angle);
						//n._x = n.x / this.graph.distance;
						//n._y = n.y / this.graph.distance;
						////console.log(n.id, n.x, n.y);
					//}

				//}
				//// level done so move to next
				//dx++;
				//dy = dymax;
			//} // for each level

		//} // if (numlevels > 2)

//////////////////////////

		//// if 2 levels or less then no special handling!
		//if (numlevels > 2)
		//{
			//// Create new array, one for each level in shortest paths
			//let levels = [];
			//for (let i = 0; i < numlevels; i++)
			//{
				//levels.push([]);
			//}

			//for (let s in solutions)
			//{
				//let sol = solutions[s];
				//let node = this.graph.node(s);
				//let level = levels[sol.length];
				//// We are only interested in nodes with > 5 links
				//if (node.links.length > 5)
					//level.push([s, node.links.length]);
			//}

			//// Now create new array with entries of each level sorted
			//console.log(levels);
			//let newlevels = [];
			//for (let i = 0; i < numlevels; i++)
			//{
				//let level = levels[i];

				//let sortedArr = level.sort(function(a, b) {
					//return b[1] - a[1];
				//});
				//newlevels.push(sortedArr);
			//}
			//console.log(newlevels);

			//let xnum = 7; // 4, 7, 10 best
			//// now just find top xnum nodes and we fix these
			//let alllevels = [];
			//for (let i = 0; i < numlevels; i++)
			//{
				//let level = levels[i];
				//let numnodes = level.length;
				//for (let j = 0; j < numnodes; j++)
				//{
					//alllevels.push(level[j]);
				//}
			//}
			//// now sort and keep only xnum
			//let sortedArr = alllevels.sort(function(a, b) {
				//return b[1] - a[1];
			//});
			//alllevels = sortedArr.slice(0, 7);
			//console.log(alllevels);

			//// loop thru this sorted array and position main nodes
			//let nperrow = (xnum - 1) / 2;
			//let dymax = (nperrow - 1) / 2 * this.levelSeparation;
			//let dx = 0, dy = 0; // set dy === 0 for root node
			//for (let i = 0; i < alllevels.length; i++)
			//{
				//let n = alllevels[i];
				//if (i > 0)
				//{
					//if (0 === ((i - 1) % nperrow))
					//{
						//dx++;
						//dy = dymax;
					//}
				//}

				//let node = this.graph.node(n[0]);
				//node.x = dx * this.levelSeparation + (Math.random() * 50) - 25;
				//node._x = node.x / this.graph.distance;
				//node.fixed = true;
				//// y axis is upside down here!
				//node.y = -dy + (Math.random() * 50) - 25;
				//node._y = node.y / this.graph.distance;
				//console.log(node.id, node.x, node.y, node.links.length);
				//// TODO: we should position linked nodes in circle around this node??

				//let len = node.links.length;
				//let radius = 100;
				//for (let k = 0; k < len; k++)
				//{
					//let nn = node.links[k];
					//if (nn.fixed) // leave already positioned nodes alone!
						//continue;
					//let angle = 2 * Math.PI * Math.random(); // Math.random() - greater than or equal to 0 and less than 1
					//nn.x = node.x + radius * Math.cos(angle);
					//nn.y = node.y + radius * Math.sin(angle);
					//nn._x = nn.x / this.graph.distance;
					//nn._y = nn.y / this.graph.distance;
					////consolen.log(nn.id, nn.x, nn.y);
				//}

				//dy -= this.levelSeparation;
			//} // for each node
		//} // if (numlevels > 2)




////////////////////////

		// first create data for finding shortest paths between root node and all others
		let nodes = this.graph.nodes;
		let numnodes = nodes.length;
		let graph = {};
		for (let i = 0; i < numnodes; i++)
		{
			let host = this.graph.nodes[i];
			let g = graph[host.id] = {};
			let len = host.links.length;
			for (let i = 0; i < len; i++)
			{
				let node = host.links[i];
				g[node.id] = 1;
			}
		}
		//console.log(graph);

		// TODO: this only handles 1 mainsite currently!!
		// solutions object is ordered from shortest path nodes to longest
		let ms = this.graph.nodes[0].mainsites.keys().next().value;
		let solutions = this.shortest_paths(graph, ms);
		console.log(JSON.stringify(solutions, null, 4));

		// get level of farthest path node
		let aobj = Object.entries(solutions);
		let numlevels = aobj[aobj.length - 1][1].length + 1; // levels 0, 1, 2, 3 == 4 levels

		console.log("SP Levels", numlevels);

		// if 2 levels or less then no special handling!
		if (numlevels > 2)
		{
			// Create new array of all nodes except mainsite
			let allnodes = [];
			for (let i = 0; i < numnodes; i++)
			{
				let host = this.graph.nodes[i];
				if (ms !== host.id)
					allnodes.push([host.id, host.links.length]);
			}

			// Now sort by number of links
			let sortedArr = allnodes.sort(function(a, b) {
				return b[1] - a[1];
			});
			//console.log(sortedArr);

			// We just want the nodes with the most links
			let xnum = 7; // 4, 7, 10 best
			if (numnodes > 150)
				xnum = 10;
			allnodes = sortedArr.slice(0, xnum - 1);

			// add mainsite as first in array
			let mainsite = this.graph.node(ms);
			allnodes.unshift([mainsite.id, mainsite.links.length]);

			//console.log(JSON.stringify(allnodes, null, 4));

			// loop thru and replace number of links with level
			for (let i = 0; i < allnodes.length; i++)
			{
				let n = allnodes[i];
				n[1] = solutions[n[0]].length;
			}

			// Now sort again by level
			allnodes = allnodes.sort(function(a, b) {
				return a[1] - b[1];
			});

			//console.log(JSON.stringify(allnodes, null, 4));

			// loop thru this sorted array and position main nodes
			let nperrow = 3;
			let dymax = (nperrow - 1) / 2 * this.levelSeparation;
			let dx = 0, dy = 0; // set dy === 0 for root node
			for (let i = 0; i < xnum; i++)
			{
				let n = allnodes[i];
				if (i > 0)
				{
					if (0 === ((i - 1) % nperrow))
					{
						dx++;
						dy = dymax;
					}
				}

				let node = this.graph.node(n[0]);
				node.x = dx * this.levelSeparation + (Math.random() * 50) - 25;
				node._x = node.x / this.graph.distance;
				node.fixed = true;
				// y axis is upside down here!
				node.y = -dy + (Math.random() * 50) - 25;
				node._y = node.y / this.graph.distance;
				//console.log(node.id, node.x, node.y, node.links.length);

				// We position linked nodes in circle around this node
				let len = node.links.length;
				let radius = 100;
				for (let k = 0; k < len; k++)
				{
					let nn = node.links[k];
					if (nn.fixed) // leave already positioned nodes alone!
						continue;
					let angle = 2 * Math.PI * Math.random(); // Math.random() - greater than or equal to 0 and less than 1
					nn.x = node.x + radius * Math.cos(angle);
					nn.y = node.y + radius * Math.sin(angle);
					nn._x = nn.x / this.graph.distance;
					nn._y = nn.y / this.graph.distance;
					//console.log(nn.id, nn.x, nn.y);
				}

				dy -= this.levelSeparation;
			} // for each node to position

		} // if (numlevels > 2)
	}

	_gravity(node)
	{
		// gravity is computed about graph origin
		//let dx = -node.x;
		//let dy = -node.y;
		//let distance = Math.sqrt(dx * dx + dy * dy);

		//let gravityForce = distance === 0 ? 0 : this.centralGravity / distance;
		node._vx += 20;
		//node._vy -= dy * gravityForce;
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
