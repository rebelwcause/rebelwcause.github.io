// Script for har.html
// https://w3c.github.io/web-performance/specs/HAR/Overview.html

"use strict";

/* jshint esversion: 6 */
/* jshint sub:true */
// Just to shut jsHint up (https://jshint.com/)
//let g_trackers, cname_trackers, g_ddgtrackers, Graph, Progress, refresh_sortables, do_sortable, do_filter;

/*

https://pagexray.fouanalytics.com/q/www.usatoday.com?f=
pagexray uses a bot to visit website so some sites that do recognize this show ads
others that do recognize bot do not show ads!!
Because of this pagexray can give much less ad/tracking related stuff iff site recognizes bot!!

https://www.webpagetest.org/result/230106_BiDc5V_4AQ/

https://csi-cop.eu/wp-content/uploads/2022/09/CSI-COP-MOOC_All-Steps_v2_final.pdf

https://requestmap.webperf.tools/
https://visjs.github.io/vis-network/examples/
https://visjs.org/
https://webbkoll.dataskydd.net/en

https://privacyscore.org/faq/

https://gitlab.com/chikl/lightbeam/

www.npr.com
https://webbkoll.dataskydd.net/en/results?url=http%3A%2F%2Fwww.npr.com
https://pagexray.fouanalytics.com/q/www.npr.org?f=
https://privacyscore.org/site/18618/
https://themarkup.org/blacklight?url=www.npr.com

https://privacy-test-pages.glitch.me/

TODO

	optimize / condense - should be avble to improve populate_requests - time!!!

	graph sizing - not within container <div id="graph" class="tabcontent">
	can we do simple node hide/show - bypass drawing node and connected edges??
	can we strip content text - huge har files and we generally do not need (say > 1000 bytes) !!!


Ad Exchange Hubs - cookie syncing...
	widgets.outbrain.com
	ads.pubmatic.com
	eb2.3lift.com
	eus.rubiconproject.com
	ssum-sec.casalemedia.com
	cdn.krxd.net
	ads.yieldmo.com
	g2.gumgum.com
	rtb.gumgum.com
	onetag-sys.com
	public.servenobid.com
	contextual.media.net
	pagead2.googlesyndication.com
	72ac0fdd3f57608f41d982fd13dc2013.safeframe.googlesyndication.com
	googleads.g.doubleclick.net
	u.openx.net
	hde.tynt.com
	e1.emxdgt.com
	sync-amz.ads.yieldmo.com



Test sites:
https://www.speedtest.net
https://www.wired.com/
https://www.merriam-webster.com/
https://www.theweathernetwork.com/ca
https://www.cbc.ca/
https://www.pcmag.com/
https://www.canadiantire.ca/en.html
https://www.huffpost.com/
https://www.hgtv.com

polluted??
	https://www.mymedic.com
	https://www.buzzfeed.com/ca
	https://www.foxnews.com/
	https://www.history.ca/
	https://www.nytimes.com/
	https://www.billboard.com/
	https://www.politico.com/
	https://www.thebay.com/
	https://www.dailymail.co.uk/ushome/index.html
	https://www.salon.com/
	https://www.usatoday.com/

*/

/*
NOTES:
The Element.before() method inserts a set of Node or string objects in the children list of this
Element's parent, just before this Element
	before(param1)
	before(param1, param2)
	before(param1, param2, … , paramN)

The Element.after() method inserts a set of Node or string objects in the children list of the
Element's parent, just after the Element
	after(node1)
	after(node1, node2)
	after(node1, node2, … , nodeN)

The Element.append() method inserts a set of Node objects or string objects after the last child of the Element
	append(param1)
	append(param1, param2)
	append(param1, param2, … , paramN)

The insertBefore() method of the Node interface inserts a node before a reference node as a child
of a specified parent node.
	insertBefore(newNode, referenceNode)

The appendChild() method of the Node interface adds a node to the end of the list of children of
a specified parent node. If the given child is a reference to an existing node in the document,
appendChild() moves it from its current position to the new position.
	appendChild(aChild)

The insertAdjacentElement() method of the Element interface inserts a given element node at a given position
relative to the element it is invoked upon.
	insertAdjacentElement(position, element)

*/
////////////////////////////////////////////////////////////////////

let g_rawdata = [];

let g_allhosts = {};

let g_alldomains = {};
let g_domains = []; // array of main domains so we can connect together on graph

let g_totsize = 0;
let g_redirects = 0;
let g_rblocked = 0;

let g_hostrequests = 0;
let g_hostblocked = 0;

let g_trequests = 0; // number of tracking requests

let g_hide_trackers = false;

let g_cinfo = {};
//let g_csyncers = {};

let g_lowmem = false; // set to true for moms box so just graphing...

let g_redact = false;	// set to true to filter har files and remove large amount
						// of content we do not want!
						// Files are saved to ff download directory

// types with charset etc. stripped off end
let g_types = {
	" ": "unknown",
	"text/javascript": "javascript",
	"application/javascript": "javascript",
	"application/x-javascript": "javascript",

	"text/css": "css",
	"text/html": "html",
	"text/plain": "plain",
	"text/json": "json",

	"application/x-font-otf": "otf",
	"font/woff": "woff",
	"application/font-woff": "woff",
	"application/x-font-woff": "woff",
	"font/woff2": "woff2",
	"application/font-woff2": "woff2",
	"application/x-font-woff2": "woff2",
	"font/ttf": "ttf",

	"application/json": "json",
	"app/json": "json",

	"application/xml": "xml",

	"application/x-binary": "binary",
	"application/octet-stream": "octet-stream",
	"binary/octet-stream": "octet-stream",

	"application/x-mpegurl": "mpegurl",
	"application/x-protobuf": "protobuf",

	"application/dash+xml": "dash+xml",
	"application/json+protobuf": "json+protobuf",
	"application/rss+xml": "rss+xml",

	"image/avif": "avif",
	"image/gif": "gif",
	"image/jpeg": "jpeg",
	"image/jpg": "jpeg",
	"image/png": "png",
	"image/svg+xml": "svg+xml",
	"image/x-icon": "icon",
	"image/vnd.microsoft.icon": "icon",
	"image/webp": "webp",

	"text/vtt": "vtt",
	"text/xml": "xml",
	"video/mp4": "mp4",
	"video/mp2t": "mp2t",


};

////////////////////////////////////////////////////////////////////
function getbasedomain(hostname)
{
	// websitename.com --> websitename.com
	// www.websitename.com --> websitename.com
	// www.sdc.websitename.com --> websitename.com
	// www.sdc.abc.websitename.com --> websitename.com
	// www.abc.co.uk --> abc.co.uk
	// 0c3879ab4...b350ab8.safeframe.googlesyndication.com -> googlesyndication.com
	// googleads.g.doubleclick.net -> doubleclick.net
	// about:addons --> about:addons
	// -->
	// file:///home/bossman/Programs/Web/local_test file:///home/bossman/Programs/Web/local_test
	// TODO: Fails for id.hadron.ad.gt -> hadron.ad.gt and 44.228.85.26 -> 228.85.26
	// Does not always work - assuming length of 2 for second to last may fail!!

	let domain = hostname;
	if (hostname.startsWith("file:"))
		return domain;

	let splitArr = hostname.split(".");
	let arrLen = splitArr.length;
	if (arrLen > 2)
	{
		domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
		// check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".co.uk")
		if ((arrLen > 3) && (splitArr[arrLen - 2].length == 2) && (splitArr[arrLen - 1].length == 2))
		{
			domain = splitArr[arrLen - 3] + '.' + domain;
			if (!domain.endsWith(".co.uk"))
				console.log(hostname, domain);
		}
	}
	return domain;
}

////////////////////////////////////////////////////////////////////
function init_hosts_table()
{
	g_hostrequests = 0;
	g_hostblocked = 0;
	let tbody = document.getElementById("hoststbody");
	let tfoot = document.getElementById("hoststfoot");
	tbody.textContent = "";
	tfoot.textContent = "";

	tfoot.style.cssText = "background-color: #3388DD; color: #FFFFFF; font-weight: bold;";
}

////////////////////////////////////////////////////////////////////
function finalize_hosts_table(hide_blocked)
{
	// populate hosts table here before we complete footer
	populate_hosts_table(hide_blocked);

	let tbody = document.getElementById("hoststbody");
	let tfoot = document.getElementById("hoststfoot");

	let tr = document.createElement("tr");
	tfoot.appendChild(tr);

	let td = document.createElement("td");
	let numhosts = tbody.getElementsByTagName("tr").length;
	td.textContent = "# Hosts: " + numhosts;
	tr.appendChild(td);

	// IP Address
	//tr.appendChild(document.createElement("td"));

	td = document.createElement("td");
	td.textContent = "# Requests: " + g_hostrequests;
	tr.appendChild(td);

	td = document.createElement("td");
	td.textContent = "# Blocked: " + g_hostblocked;
	tr.appendChild(td);

	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
}

////////////////////////////////////////////////////////////////////
function combine_hosts(hosts, mainsite, hide_blocked)
{
	//console.time("combine_hosts");
	let graph_domains = document.getElementById("graph-domains").checked;
	let domains = {}; // local just for graphing domains iff applicable

	if (graph_domains)
		g_domains.push(getbasedomain(mainsite));

	let maxcount = 0;
	for (let host in hosts)
	{
		/*
		{
		  "count": 1,
		  "blocked": 0,
		  "tracker": "Advertising, Analytics",
		  "cntracker": undefined,
		  "tdomain": "playground.xyz",
		  "referers": {
			"ads.pubmatic.com": {
			  "count": 1
			}
		  },
		  "tp": 1,
		  "pcsync": 1,
		  "dcsync": 1
		}
		*/

		let thehost = hosts[host];
		if (thehost.count > maxcount)
			maxcount = thehost.count;
		//console.log(thehost);

		// here we combine passed in hosts into g_allhosts
		let ehost = g_allhosts[host];
		if (undefined === ehost)
		{
			g_allhosts[host] = {count: thehost.count, blocked: thehost.blocked,
				tracker: thehost.tracker, cntracker: thehost.cntracker, tdomain: thehost.tdomain,
				referers: thehost.referers,
				tp: thehost.tp,
				pcsync: thehost.pcsync, // possible
				dcsync: thehost.dcsync}; // definite
				//IP: thehost.IP}; // IP Address
		}
		else
		{
			ehost.count += thehost.count;
			ehost.blocked += thehost.blocked;
			ehost.tp += thehost.tp;
			ehost.pcsync += thehost.pcsync;
			ehost.dcsync += thehost.dcsync;

			//console.assert(ehost.tracker === thehost.tracker, "ehost.tracker === thehost.tracker failed?");
			//console.assert(ehost.cntracker === thehost.cntracker, "ehost.cntracker === thehost.cntracker failed?");
			//console.assert(ehost.tdomain === thehost.tdomain, "ehost.tdomain === thehost.tdomain failed?");

			// loop over NEW referers and check if in existing hosts referers
			let ereferers = ehost.referers;
			for (let referer in thehost.referers) // loop over new referers
			{
				let r = ereferers[referer];
				if (undefined === r)
					ereferers[referer] = {count: thehost.referers[referer].count};
				else
					r.count += thehost.referers[referer].count;
			}
		}

		// Now process domains and populate g_alldomains
		let domain = getbasedomain(host);
		let d = g_alldomains[domain];
		if (undefined === d)
		{
			// If host was a cname tracker we do NOT pass on to domain!
			g_alldomains[domain] = {count: thehost.count, blocked: thehost.blocked,
				tracker: thehost.tracker, cntracker: undefined,
				tdomain: thehost.tracker ? thehost.tdomain : undefined,
				referers: {},
				tp: thehost.tp,
				pcsync: thehost.pcsync,
				dcsync: thehost.dcsync};

			let ereferers = g_alldomains[domain].referers;
			for (let referer in thehost.referers) // loop over new referers
			{
				let refererd = getbasedomain(referer);
				ereferers[refererd] = {count: thehost.referers[referer].count};
			}
		}
		else
		{
			d.count += thehost.count;
			d.blocked += thehost.blocked;
			d.tp += thehost.tp;
			d.pcsync += thehost.pcsync;
			d.dcsync += thehost.dcsync;

			//console.assert(d.tracker === thehost.tracker, "d.tracker === thehost.tracker failed?");
			//console.assert(d.cntracker === thehost.cntracker, d.cntracker + " === " + thehost.cntracker + " failed?");
			//console.assert(d.tdomain === thehost.tdomain, d.tdomain + " === " + thehost.tdomain + " failed?");

			// loop over NEW referers and check if in existing hosts referers
			let ereferers = d.referers;
			for (let referer in thehost.referers) // loop over new referers
			{
				let refererd = getbasedomain(referer);
				let r = ereferers[refererd];
				if (undefined === r)
					ereferers[refererd] = {count: thehost.referers[referer].count};
				else
					r.count += thehost.referers[referer].count;
			}
		}

		if (graph_domains) // iff checked then create domain data to graph!
		{
			d = domains[domain];
			if (undefined === d)
			{
				// If host was a cname tracker we do NOT pass on to domain!
				domains[domain] = {count: thehost.count, blocked: thehost.blocked,
					tracker: thehost.tracker, cntracker: undefined, tdomain: undefined, referers: {},
					tp: thehost.tp,
					pcsync: thehost.pcsync,
					dcsync: thehost.dcsync};

				let ereferers = domains[domain].referers;
				for (let referer in thehost.referers) // loop over new referers
				{
					let refererd = getbasedomain(referer);
					ereferers[refererd] = {count: thehost.referers[referer].count};
				}
			}
			else
			{
				d.count += thehost.count;
				d.blocked += thehost.blocked;
				d.tp += thehost.tp;
				d.pcsync += thehost.pcsync;
				d.dcsync += thehost.dcsync;

				//console.assert(d.tracker === thehost.tracker, "d.tracker === thehost.tracker failed?");
				//console.assert(d.cntracker === thehost.cntracker, d.cntracker + " === " + thehost.cntracker + " failed?");
				//console.assert(d.tdomain === thehost.tdomain, d.tdomain + " === " + thehost.tdomain + " failed?");

				// loop over NEW referers and check if in existing hosts referers
				let ereferers = d.referers;
				for (let referer in thehost.referers) // loop over new referers
				{
					let refererd = getbasedomain(referer);
					let r = ereferers[refererd];
					if (undefined === r)
						ereferers[refererd] = {count: thehost.referers[referer].count};
					else
						r.count += thehost.referers[referer].count;
				}
			}
		}
	}

	if (graph_domains)
	{
		let maindomain = getbasedomain(mainsite);
		graph_items(domains, maindomain, hide_blocked, maxcount);
	}
	else
		graph_items(hosts, mainsite, hide_blocked, maxcount);

	//console.timeEnd("combine_hosts");
}

////////////////////////////////////////////////////////////////////
function add_comment(thobj, tritem, ccomment)
{
	// thobj is either a hosts, domain, or entry object
	if (undefined !== thobj.tracker)
	{
		tritem.classList.add("stracker");

		let tspan = document.createElement("span");
		tspan.textContent = "  [" + thobj.tracker + "] ";
		ccomment.appendChild(tspan);

		let a = document.createElement('a');
		//a.setAttribute('href', "https://better.fyi/trackers/" + thobj.tdomain);
		a.setAttribute('href', "https://slayterdev.github.io/tracker-radar-wiki/domains/" + thobj.tdomain + ".html");
		a.innerHTML = " Click for information. ";
		a.setAttribute('target', "_blank");
		tspan.appendChild(a);

		let image = document.createElement("img");
		image.src = "i16.png";
		image.style.cssText = "padding: 2px 5px; vertical-align: middle;"; // top/bot, left,right
		ccomment.appendChild(image);
	}
	else
	{
		if (undefined !== thobj.cntracker)
		{
			tritem.classList.add("cntracker");

			let tspan = document.createElement("span");
			tspan.textContent = "  [CNAME tracker: " + thobj.cntracker + "] ";
			ccomment.appendChild(tspan);

			if (undefined !== thobj.tdomain)
			{
				let ah = document.createElement('a');
				//ah.setAttribute('href', "https://better.fyi/trackers/" + thobj.tdomain);
				ah.setAttribute('href', "https://slayterdev.github.io/tracker-radar-wiki/domains/" + thobj.tdomain + ".html");
				ah.setAttribute('target', "_blank");
				ah.innerHTML = " Click for information. ";
				tspan.appendChild(ah);
			}

			let image = document.createElement("img");
			image.src = "i16.png";
			image.style.cssText = "padding: 2px 5px; vertical-align: middle;"; // top/bot, left,right
			ccomment.appendChild(image);
		}
		else
			tritem.classList.add("srequest");
	}
}

////////////////////////////////////////////////////////////////////
function init_domains_table()
{
	let tbody = document.getElementById("domainstbody");
	let tfoot = document.getElementById("domainstfoot");
	tbody.textContent = "";
	tfoot.textContent = "";

	tfoot.style.cssText = "background-color: #3388DD; color: #FFFFFF; font-weight: bold;";
}

////////////////////////////////////////////////////////////////////
function finalize_domains_table(hide_blocked)
{
	// populate domains table here before we complete footer
	populate_domains_table(hide_blocked);

	let tbody = document.getElementById("domainstbody");
	let tfoot = document.getElementById("domainstfoot");

	let tr = document.createElement("tr");
	tfoot.appendChild(tr);

	let td = document.createElement("td");
	let numhosts = tbody.getElementsByTagName("tr").length;
	td.textContent = "# Domains: " + numhosts;
	tr.appendChild(td);

	td = document.createElement("td");
	td.textContent = "# Requests: " + g_hostrequests;
	tr.appendChild(td);

	td = document.createElement("td");
	td.textContent = "# Blocked: " + g_hostblocked;
	tr.appendChild(td);

	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));

	// To keep nodes in the center of the canvas we want to connect each main domain with an
	// invisible edge and iff more than 2 also connect last back to first
	let graph_domains = document.getElementById("graph-domains").checked;
	if (graph_domains)
	{
		for (let i = 1; i < g_domains.length; i++)
		{
			g_graph.addEdge(g_domains[i], g_domains[i - 1], {strokewidth: 0, stroke: "transparent", length: 2});
		}
		if (g_domains.length > 2)
			g_graph.addEdge(g_domains[g_domains.length - 1], g_domains[0], {strokewidth: 0, stroke: "transparent", length: 2});
	}
}

////////////////////////////////////////////////////////////////////
function populate_domains_table(hide_blocked)
{
	let tbody = document.getElementById("domainstbody");
	// We use global domains object here to populate table
	for (let dname in g_alldomains)
	{
		// { count: , blocked: , cntracker: , tracker: , tdomain: , referers: {} }
		let thedomain = g_alldomains[dname];
		if (hide_blocked && (thedomain.count == thedomain.blocked))
			continue;

		if (g_hide_trackers && ((undefined !== thedomain.tracker) || (undefined !== thedomain.cntracker)))
			continue;

		let item = document.createElement("tr");
		let chost = document.createElement("td");
		chost.style.cssText = "max-width: 400px; overflow-wrap: break-word;";
		let crequests = document.createElement("td");
		let cblocked = document.createElement("td");
		let ctp = document.createElement("td");
		let ctpc = document.createElement("td");
		let pcsync = document.createElement("td");
		let dcsync = document.createElement("td");
		let creferers = document.createElement("td");
		creferers.style.cssText = "max-width: 400px; overflow-wrap: break-word;";
		let ccomment = document.createElement("td");

		chost.textContent = dname;
		crequests.textContent = thedomain.count;
		cblocked.textContent = thedomain.blocked;
		ctp.textContent = thedomain.tp;

		let dd = g_cinfo[dname];
		if (undefined === dd)
			ctpc.textContent = 0; // Not in cookies info
		else
		{
			let fp = dd.sites[dname];
			if (undefined !== fp)
			{
				// if in main sites object then must be first party
				console.assert("fp" === fp, "'fp' === fp failed ??");
				ctpc.textContent = 0;
			}
			else
			{
				// dd.sites is main sites object so if not in it then third party!
				ctpc.textContent = Object.keys(dd.cookies).length;
			}
		}
		pcsync.textContent = thedomain.pcsync;
		dcsync.textContent = thedomain.dcsync;

		let referers = thedomain.referers;
		let srefs = "";
		for (let parent in referers)
		{
			srefs += parent + ": " + referers[parent].count + ", ";
		}
		creferers.textContent = srefs;

		add_comment(thedomain, item, ccomment);

		item.appendChild(chost);
		item.appendChild(crequests);
		item.appendChild(cblocked);
		item.appendChild(ctp);
		item.appendChild(ctpc);
		item.appendChild(pcsync);
		item.appendChild(dcsync);
		item.appendChild(creferers);
		item.appendChild(ccomment);

		tbody.appendChild(item);
	}
}

////////////////////////////////////////////////////////////////////
function populate_hosts_table(hide_blocked)
{
	let tbody = document.getElementById("hoststbody");
	// We use global hosts object here to populate table
	for (let host in g_allhosts)
	{
		// { count: , blocked: , cntracker: , tracker: , tdomain: , referers: {} }
		let thehost = g_allhosts[host];
		if (hide_blocked && (thehost.count == thehost.blocked))
			continue;

		if (g_hide_trackers && ((undefined !== thehost.tracker) || (undefined !== thehost.cntracker)))
			continue;

		g_hostrequests += thehost.count;
		g_hostblocked += thehost.blocked;

		let item = document.createElement("tr");
		let chost = document.createElement("td");
		chost.style.cssText = "max-width: 400px; overflow-wrap: break-word;";
		// IP Address
		//let cip = document.createElement("td");
		let crequests = document.createElement("td");
		let cblocked = document.createElement("td");
		let ctp = document.createElement("td");
		let pcsync = document.createElement("td");
		let dcsync = document.createElement("td");
		let creferers = document.createElement("td");
		creferers.style.cssText = "max-width: 400px; overflow-wrap: break-word;";
		let ccomment = document.createElement("td");

		chost.textContent = host;
		// IP Address
		//cip.textContent = thehost.IP ? thehost.IP : "";
		crequests.textContent = thehost.count;
		cblocked.textContent = thehost.blocked;
		ctp.textContent = thehost.tp;
		pcsync.textContent = thehost.pcsync;
		dcsync.textContent = thehost.dcsync;

		let referers = thehost.referers;
		let srefs = "";
		for (let parent in referers)
		{
			srefs += parent + ": " + referers[parent].count + ", ";
		}
		creferers.textContent = srefs;

		add_comment(thehost, item, ccomment);

		item.appendChild(chost);
		// IP Address
		//item.appendChild(cip);
		item.appendChild(crequests);
		item.appendChild(cblocked);
		item.appendChild(ctp);
		item.appendChild(pcsync);
		item.appendChild(dcsync);
		item.appendChild(creferers);
		item.appendChild(ccomment);

		tbody.appendChild(item);
	}
}

////////////////////////////////////////////////////////////////////
function init_requests_table()
{
	g_totsize = 0;
	g_redirects = 0;
	g_rblocked = 0;
	let tbody = document.getElementById("requeststbody");
	let tfoot = document.getElementById("requeststfoot");
	tbody.textContent = "";
	tfoot.textContent = "";

	tfoot.style.cssText = "background-color: #3388DD; color: #FFFFFF; font-weight: bold;";
}

////////////////////////////////////////////////////////////////////
function finalize_requests_table()
{
	let tbody = document.getElementById("requeststbody");
	let tfoot = document.getElementById("requeststfoot");

	let tr = document.createElement("tr");
	tfoot.appendChild(tr);

	let td = document.createElement("td");
	let numrequests = tbody.getElementsByTagName("tr").length;
	td.textContent = "# Requests: " + numrequests;
	tr.appendChild(td);

	tr.appendChild(document.createElement("td"));

	tr.appendChild(document.createElement("td"));

	tr.appendChild(document.createElement("td"));

	td = document.createElement("td");
	td.textContent = "# Blocked: " + g_rblocked;
	tr.appendChild(td);

	td = document.createElement("td");
	tr.appendChild(td);

	tr.appendChild(document.createElement("td"));

	td = document.createElement("td");
	td.textContent = "Total Resp. Size: " + g_totsize;
	tr.appendChild(td);

	td = document.createElement("td");
	td.textContent = "# Redirects: " + g_redirects;
	tr.appendChild(td);

	tr.appendChild(document.createElement("td"));

	addRowHandlers();
}

////////////////////////////////////////////////////////////////////
//function add_csyncer(hostname, rdhostname)
//{
	//let csyncer = g_csyncers[hostname];
	//if (undefined === csyncer)
	//{
		//g_csyncers[hostname] = {count: 0, partners: {}};
		//g_csyncers[hostname].partners[rdhostname] = {count: 1};
	//}
	//else
	//{
		//let partners = csyncer.partners;
		//let found = partners[rdhostname];
		//if (undefined === found)
			//partners[rdhostname] = {count: 1};
		//else
			//found.count++;
	//}
	//g_csyncers[hostname].count++;

	//csyncer = g_csyncers[rdhostname];
	//if (undefined === csyncer)
	//{
		//g_csyncers[rdhostname] = {count: 0, partners: {}};
		//g_csyncers[rdhostname].partners[hostname] = {count: 1};
	//}
	//else
	//{
		//let partners = csyncer.partners;
		//let found = partners[hostname];
		//if (undefined === found)
			//partners[hostname] = {count: 1};
		//else
			//found.count++;
	//}
	//g_csyncers[rdhostname].count++;
//}

////////////////////////////////////////////////////////////////////
function populate_requests_table(entries, mainsite, hide_blocked, hosts)
{
	//console.time("populate_requests_table");

	// TODO: Test - try to look for redundant requests - cookie sync seems to be a mess and
	// may be lots (waste of bandwidth slower page load etc...)
	//let requests = {};

	let tbody = document.getElementById("requeststbody");
	for (let i = 0; i < entries.length; i++)
	{
		let entry = entries[i];

		// TODO: Test - try to look for redundant requests - cookie sync seems to be a mess and
		// may be lots (waste of bandwidth slower page load etc...)
		//let nrequest = requests[entry.request.url];
		//if (undefined === nrequest)
		//	requests[entry.request.url] = {count: 1};
		//else
		//	requests[entry.request.url].count++; // duplicate???

		if (hide_blocked && entry.blocked)
			continue;

		if (g_hide_trackers && ((undefined !== entry.tracker) || (undefined !== entry.cntracker)))
			continue;

		if (entry.tracker || entry.cntracker)
			g_trequests++;

		let bs = entry.response.bodySize;
		if (bs > 0) // can be undefined ???
			g_totsize += bs;
		else
			bs = 0;

		let hs = entry.response.headersSize;
		if (hs > 0) // can be undefined ???
			g_totsize += hs;
		else
			hs = 0;

		let item = document.createElement("tr");
		let curl = document.createElement("td");
		let chost = document.createElement("td");
		let cmethod = document.createElement("td");
		let cstatus = document.createElement("td");
		let cblocked = document.createElement("td");
		let ccookies = document.createElement("td");
		let ctype = document.createElement("td");
		let csize = document.createElement("td");
		let crd = document.createElement("td");
		let ccomment = document.createElement("td");
		// limit width of url column!
		curl.style.cssText = "max-width: 300px; overflow-wrap: break-word;";

		if (entry.blocked)
		{
			g_rblocked++;
			cblocked.textContent = "yes";
		}

		let hurl = entry.request.url;
		let btip = false;
		if (hurl.length > 100)
		{
			btip = true;
			hurl = hurl.slice(0, 50) + "..." + hurl.slice(hurl.length - 50);
		}

		// Add tooltips for long hosts
		curl.textContent = hurl;
		if (btip)
		{
			curl.classList.add("CellWithTT");
			let ttspan = document.createElement("span");
			ttspan.classList.add("CellTT");
			ttspan.textContent = entry.request.url;
			curl.appendChild(ttspan);
		}
		btip = false;

		chost.textContent = entry.hostname;
		chost.style.cssText = "max-width: 300px; overflow-wrap: break-word;";

		cmethod.textContent = entry.request.method;
		cstatus.textContent = entry.response.status + ", " + entry.response.statusText;

		// get type and size
		let type = entry.response.content.mimeType;
		let size = entry.response.content.size;
		let str = "";
		if ((undefined !== type) && (type.length > 0))
		{
			// parse and lookup in our global g_types object so more human readable
			let semi = type.indexOf(";");
			if (-1 === semi)
				semi = type.length;
			let ntype = type.substring(0, semi).toLowerCase();
			str = g_types[ntype];
			if (undefined === str)
			{
				str = "unknown";
				//console.log("Unknown type", type, ntype);
			}
		}
		else
		{
			// If we get here it is usually a cookie sync type request but not always!
			// Note that many cookie sync's have a valid type such as gif, html etc...
			str = "unknown";
		}

		if (undefined !== size)
			str += " " + size;

		if (str.length > 0)
		{
			ctype.textContent = str;
			ctype.style.cssText = "max-width: 150px; overflow-wrap: break-word;";
			// Assume Most tracking pixels are 200 bytes or less!
			if ((size < 200) && type && (type.includes("image/")))
			{
				// We also should have some query string and or cookies
				if (entry.request.queryString.length > 0)
				{
					ctype.style.cssText += " background-color: #FFAAAA;";
					ctype.textContent += " TP?";
					hosts[entry.hostname].tp++;
				}
				else if ((entry.request.cookies.length > 0) || (entry.response.cookies.length > 0))
				{
					ctype.style.cssText += " background-color: #FFAAAA;";
					ctype.textContent += " TP?";
					hosts[entry.hostname].tp++;
				}
				//else
				//	console.log("Skipping possible tracking pixel", entry);
				/*
				TODO: this misses stuff like the following that MUST be tracking pixels!!
				1x1 image confirmed!!!
				https://bcp.crwdcntrl.net/5/c=10204/camp_int=Advertiser_RC-$…B3035656549%7D%5ELineItem_RC-$%7B6140082913%7D%5Eimpressions"
				​​https://ade.googlesyndication.com/ddm/activity/dc_oe=ChMIyN_…h34JQyl;met=1;&timestamp=1672436243315;eid1=2;ecn1=0;etm1=11;"
​​
				*/
			}
		}

		// Suspicious looking stuff
		if (type && type.includes("image/"))
		{
			if (0 === (bs + hs))  // images of 0 size??
				csize.style.cssText = "background-color: #FFAAAA;";
			else if (entry.request.cookies.length > 0) // images and cookies
				ccookies.style.cssText = "background-color: #FFAAAA;";
		}

		// Cookies
		let ctip = "";
		for (let i = 0; i < entry.request.cookies.length; i++)
		{
			let cookie = entry.request.cookies[i];
			// _ga _gid	__gads			common google tracking cookies to identify
			if (("_ga" === cookie.name) || ("_gid" === cookie.name) || ("__gads" === cookie.name)) // Google Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF8888;";
				ccookies.textContent += "G ";
				ctip += "Google tracking cookie: " + cookie.name + "<br>";
			}
			if ("IDE" === cookie.name) // Google Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF8888;";
				ccookies.textContent += "G ";
				ctip += "Google tracking cookie: " + cookie.name + "<br>";
			}
			if (cookie.name.includes("@AdobeOrg") || ("demdex" === cookie.name)) // Adobe Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF8800;";
				ccookies.textContent += "A ";
				ctip += "Adobe tracking cookie: " + cookie.name + "<br>";
			}
			if ("_fbp" === cookie.name) // Facebook Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "F ";
				ctip += "Facebook tracking cookie: " + cookie.name + "<br>";
			}
			if ("CMID" === cookie.name) // Casale Media Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "C ";
				ctip += "Casale Media tracking cookie: " + cookie.name + "<br>";
			}
			if ("_cc_id" === cookie.name) // crwdcntrl.net (Lotame) Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "CC ";
				ctip += "Lotame (crwdcntrl.net) tracking cookie: " + cookie.name + "<br>";
			}
			if ("mc" === cookie.name) // quantserve Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "Q ";
				ctip += "Quantserve tracking cookie: " + cookie.name + "<br>";
			}
			if ("TapAd_DID" === cookie.name) // tapad.com Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "T ";
				ctip += "Tapad tracking cookie: " + cookie.name + "<br>";
			}
			if ("ad-id" === cookie.name) // Amazon Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "AM ";
				ctip += "Amazon tracking cookie: " + cookie.name + "<br>";
			}
			if ("khaos" === cookie.name) // Rubiconproject Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "R ";
				ctip += "Rubicon tracking cookie: " + cookie.name + "<br>";
			}
			if ("obuid" === cookie.name) // outbrain Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "O ";
				ctip += "Outbrain tracking cookie: " + cookie.name + "<br>";
			}
			if ("vst" === cookie.name) // gumgum suspected Tracking ID...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "GG ";
				ctip += "Gumgum tracking cookie: " + cookie.name + "<br>";
			}
			if ("KADUSERCOOKIE" === cookie.name) // pubmatic.com Tracking ID...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "P ";
				ctip += "Pubmatic tracking cookie: " + cookie.name + "<br>";
			}
			if ("_ttp" === cookie.name) // tiktok Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "TK ";
				ctip += "Tiktok tracking cookie: " + cookie.name + "<br>";
			}
			if ("t_gid" === cookie.name) // taboola Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "TB ";
				ctip += "Taboola tracking cookie: " + cookie.name + "<br>";
			}
			if ("TDID" === cookie.name) // adsrvr.org Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "ADS ";
				ctip += "The Trade Desk tracking cookie: " + cookie.name + "<br>";
			}
			if ("tuuid" === cookie.name) // bidswitch.net Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "BS ";
				ctip += "bidswitch.net tracking cookie: " + cookie.name + "<br>";
			}
			if ("uuid2" === cookie.name) // adnxs.com Tracking crap...
			{
				ccookies.style.cssText = "background-color: #FF00FF;";
				ccookies.textContent += "ADN ";
				ctip += "adnxs.com tracking cookie: " + cookie.name + "<br>";
			}
			// NOTE: can be many more!!!
		}

		if (entry.request.queryString.length > 0)
		{
			for (let i = 0; i < entry.request.queryString.length; i++)
			{
				let qs = entry.request.queryString[i];
				// real time bidding for showing adds - google_push leaks info all over???
				if (("google_gid" === qs.name) || ("google_push" === qs.name))
				{
					ccookies.style.cssText = "background-color: #FF0088;";
					break;
				}
			}
		}

		if (0 === ccookies.textContent.length)
		{
			let cookies = (entry.response.cookies.length > 0) || (entry.request.cookies.length > 0);
			ccookies.textContent = cookies ? " yes" : " no";
		}
		// Third party cookies
		let hostbd = getbasedomain(entry.hostname);
		let mainbd = getbasedomain(mainsite);
		if ((entry.response.cookies.length > 0) && (hostbd !== mainbd))
		{
			ccookies.textContent += " ThP";
			ctip += "Set Third Party Cookie<br>";
			if (0 === ccookies.style.cssText.length)
				ccookies.style.cssText = "background-color: #FFAAAA;";
		}

		if ("" !== ctip)
		{
			ccookies.classList.add("CellWithTT");
			let ttspan = document.createElement("span");
			ttspan.classList.add("CellTT");
			ttspan.innerHTML = ctip;
			ccookies.appendChild(ttspan);
		}

		/*
		Some cookie values are always changing so I would assume they are used in the syncing
		process. Some never change after assigned
		Compile all cookies and assign to hosts then check for cookie in
		redirect URL string

		Build global cookie list - we must assume all cookies are of domain scope as we do not know
		for most!!!
		*/
		if ((entry.request.cookies.length > 0) || (entry.response.cookies.length > 0)
			/* || (entry.request.queryString.length > 0) */)
		{
			let c = g_cinfo[hostbd];
			if (undefined == c)
				g_cinfo[hostbd] = {sites: {}, cookies: {}};

			let csites = g_cinfo[hostbd].sites;
			let site = csites[mainbd];
			if (undefined === site)
				csites[mainbd] = (mainbd === hostbd) ? "fp" : "tp";
			else
			{
				// NOTE: same site can possibly be first party and third
				// never upgrade from third to first party but downgrade!
				let type = csites[mainbd];
				if (("fp" === type) && (mainbd !== hostbd))
					csites[mainbd] = "tp";
			}


			// request cookies
			let cc = g_cinfo[hostbd].cookies;
			let cookies = entry.request.cookies;
			for (let i = 0; i < cookies.length; i++)
			{
				let ccc = cc[cookies[i].name];
				if (undefined === ccc)
				{
					cc[cookies[i].name] = {value: cookies[i].value, count: 0, changes: 0};
					//console.log(entry.hostname, "'", cookies[i].name, "''", cookies[i].value, "''", cc[cookies[i].name].value, "'");
				}
				if (cookies[i].value !== cc[cookies[i].name].value)
				{
					//console.log(entry.hostname, "'", cookies[i].name, "''", cookies[i].value, "''", cc[cookies[i].name].value, "'");
					cc[cookies[i].name].value = cookies[i].value;
					cc[cookies[i].name].changes++;
				}
				cc[cookies[i].name].count++;
			}
			// response cookies
			cookies = entry.response.cookies;
			for (let i = 0; i < cookies.length; i++)
			{
				let ccc = cc[cookies[i].name];
				if (undefined === ccc)
				{
					cc[cookies[i].name] = {value: cookies[i].value, count: 0, changes: 0};
					//console.log(entry.hostname, "'", cookies[i].name, "''", cookies[i].value, "''", cc[cookies[i].name].value, "'");
				}
				if (cookies[i].value !== cc[cookies[i].name].value)
				{
					//console.log(entry.hostname, "'", cookies[i].name, "''", cookies[i].value, "''", cc[cookies[i].name].value, "'");
					cc[cookies[i].name].value = cookies[i].value;
					cc[cookies[i].name].changes++;
				}
				cc[cookies[i].name].count++;
			}
		}

		csize.textContent = bs + hs;

		// Redirects - commonly used for cookie syncing...
		crd.style.cssText = "max-width: 300px; overflow-wrap: break-word;";
		let rdurl = entry.response.redirectURL;
		if (rdurl.length > 0)
		{
			g_redirects++;
			if (rdurl.length > 100)
			{
				btip = true;
				rdurl = rdurl.slice(0, 50) + "..." + rdurl.slice(rdurl.length - 50);
			}

			let rurl = new URL(entry.response.redirectURL, entry.request.url);

			// check for definite cookie syncing - plaintext ID Sharing
			// doubleclick seems to encrypt ID's during syncing so does not work for this!
			let dcsync = false;
			let rdstr = entry.response.redirectURL;
			// special handling for google!
			// google_push Indicates that this request is initiating the Pixel Matching workflow. The value must be
			// returned through the corresponding parameter in the bidder's redirect response.
			let googlesync = "//cm.g.doubleclick.net/pixel?google_nid=";

			if (entry.request.url.includes(googlesync))
			{
				dcsync = true;
				//console.log("We HAVE A PROBLEM GOOGLE REQUEST!", entry.hostname, rurl.hostname);
				//add_csyncer(entry.hostname, rurl.hostname);

				hosts[entry.hostname].dcsync++;
				// Also add redirect as it is too!!
				if (undefined !== hosts[rurl.hostname])
					hosts[rurl.hostname].dcsync++;
			}
			else if (rdstr.includes(googlesync))
			{
				dcsync = true;
				//console.log("We HAVE A PROBLEM GOOGLE REDIRECT!", entry.hostname, rurl.hostname);
				//add_csyncer(entry.hostname, rurl.hostname);

				hosts[entry.hostname].dcsync++;
				// Also add redirect as it is too!!
				if (undefined !== hosts[rurl.hostname])
					hosts[rurl.hostname].dcsync++;
			}
			else if ((entry.request.cookies.length > 0) || (entry.response.cookies.length > 0))
			{
				// Parse redirect for parameters
				if (entry.hostname != rurl.hostname) // only interested in stuff that appears in 2 different domains!!
				{
					// NEW METHOD just looking for cookie in redirect URL!!!
					// parsing redirect URL does not work well - this works better!
					for (let cname in g_cinfo[hostbd].cookies)
					{
						let info = g_cinfo[hostbd].cookies[cname];
						let value = info.value;
						if (value.length < 8) // assume anything less is useless to identify
							continue;
						if (rdstr.includes(value))
						{
							dcsync = true;
							//console.log("We HAVE A PROBLEM HOUSTON!", cname, value, entry.hostname, rurl.hostname);
							//add_csyncer(entry.hostname, rurl.hostname);

							hosts[entry.hostname].dcsync++;
							// Also add redirect as it is too!!
							if (undefined !== hosts[rurl.hostname])
								hosts[rurl.hostname].dcsync++;
							break; // Only do this once!!

						}
					}
				}
			}

			let refbd = getbasedomain(rurl.hostname);
			let pcsync = false;
			//if (!dcsync)
			//{
				// possible cookie syncing
				if (hostbd === mainbd)
				{
					//console.log("Not sync redirect, Entry First party", entry.hostname, rurl.hostname, mainsite);
				}
				else if (refbd === mainbd)
				{
					//console.log("Not sync redirect, Redirect First party", entry.hostname, rurl.hostname, mainsite);
				}
				//else if (hostbd === refbd)
				//{
				//	console.log("Not sync redirect, Same domain", entry.hostname, rurl.hostname, mainsite);
				//}
				// sync redirects always seem to be image type (tracking pixel) OR contain cookies
				// but not necesarrily both??
				else if (type && !type.includes("image/") && (0 === entry.response.cookies.length) &&
					(0 === entry.request.cookies.length) && (0 == entry.request.queryString.length))
				{
					//console.log("Not sync redirect, No Image/cookies or querystring", entry.hostname, rurl.hostname, mainsite, entry);
				}
				else
				{
					// sync, match, google, id=, gdpr usually in one of the urls
					if (entry.request.url.toLowerCase().includes("sync") || entry.response.redirectURL.toLowerCase().includes("sync") ||
						entry.request.url.includes("match") || entry.response.redirectURL.includes("match") ||
						entry.request.url.includes("google_") || entry.response.redirectURL.includes("google_") ||
						entry.request.url.includes("id=") || entry.response.redirectURL.includes("id=") ||
						entry.request.url.includes("gdpr") || entry.response.redirectURL.includes("gdpr") ||
						entry.request.url.includes("piggybackCookie") || entry.response.redirectURL.includes("piggybackCookie")
						)
					{
					}
					else
					{
						//console.log("Not sync redirect, NO sync, match", entry.request.url, entry.response.redirectURL);
					}

					hosts[entry.hostname].pcsync++; // should always be ok!
					// Also add redirect as it is too!!
					if (undefined !== hosts[rurl.hostname])
						hosts[rurl.hostname].pcsync++;

					pcsync = true;
				}
			//} // if (!dcsync)

			// check iff redirect is a tracker, possibly cname?
			let tracker = false;
			let trackdomain = refbd;
			let strtracker = g_trackers[trackdomain];
			if (undefined !== strtracker)
				tracker = true;
			else
			{
				let cntracker = cname_trackers[rurl.hostname];
				if (undefined !== cntracker)
					tracker = true;
			}
			//if (pcsync && !dcsync)
			//	console.warn("pcsync && !dcsync", entry.request.url);

			if (dcsync)
				crd.style.cssText += " background-color: #FF6600;";
			else if (pcsync)
				crd.style.cssText += " background-color: #FFAA66;";
			else if (tracker)
				crd.style.cssText += " background-color: #FFAAAA;";
		} // if (rdurl.length > 0)

		crd.textContent = rdurl;

		// Add tooltips for long referers
		if (btip)
		{
			crd.classList.add("CellWithTT");
			let ttspan = document.createElement("span");
			ttspan.classList.add("CellTT");
			ttspan.textContent = entry.response.redirectURL;
			crd.appendChild(ttspan);
		}
		btip = false;

		add_comment(entry, item, ccomment);

		item.appendChild(curl);
		item.appendChild(chost);
		item.appendChild(cmethod);
		item.appendChild(cstatus);
		item.appendChild(cblocked);
		item.appendChild(ccookies);
		item.appendChild(ctype);
		item.appendChild(csize);
		item.appendChild(crd);
		item.appendChild(ccomment);
		tbody.appendChild(item);

		// Add entry object!!
		item.harentry = entry;
		//console.log(item);

	} // for (let i = 0; i < entries.length; i++)

	//console.log(requests);

	//console.timeEnd("populate_requests_table");
}

////////////////////////////////////////////////////////////////////
function populate_sites_table(sites)
{
	let tbody = document.getElementById("sitestbody");
	tbody.textContent = "";

	// {browser: browser, title: title, startedDateTime: DateTime, pageTimings: pt};

	for (let site in sites)
	{
		let item = document.createElement("tr");
		let cbrowser = document.createElement("td");
		let ctitle = document.createElement("td");
		let cts = document.createElement("td");
		let crequests = document.createElement("td");
		let ccl = document.createElement("td");
		let cl = document.createElement("td");

		let s = sites[site];

		cbrowser.innerHTML = s.browser;
		ctitle.innerHTML = s.title;
		cts.innerHTML = s.startedDateTime;
		crequests.innerHTML = s.requests;
		ccl.innerHTML = s.pageTimings.onContentLoad;
		cl.innerHTML = s.pageTimings.onLoad;

		item.appendChild(cbrowser);
		item.appendChild(ctitle);
		item.appendChild(cts);
		item.appendChild(crequests);
		item.appendChild(ccl);
		item.appendChild(cl);

		item.classList.add("srequest");
		tbody.appendChild(item);
	}
}

////////////////////////////////////////////////////////////////////
function populate_cookies_table()
{
	let tbody = document.getElementById("cookiestbody");
	tbody.textContent = "";

	for (let domain in g_cinfo)
	{
		let ccs = g_cinfo[domain];
		let cookies = ccs.cookies;
		for (let cookiename in cookies)
		{
			let cook = cookies[cookiename];

			let item = document.createElement("tr");
			let cdomain = document.createElement("td");
			let cname = document.createElement("td");
			cname.style.cssText = "max-width: 400px; overflow-wrap: break-word;";
			let cvalue = document.createElement("td");
			cvalue.style.cssText = "max-width: 700px; overflow-wrap: break-word;";
			let ccount = document.createElement("td");
			let cchanges = document.createElement("td");
			let ccomment = document.createElement("td");

			cdomain.innerHTML = domain;
			cname.innerHTML = cookiename;

			let trimmed = cook.value;
			//if (trimmed.length > 80)
			//	trimmed = trimmed.slice(0, 40) + " ... " + trimmed.slice(trimmed.length - 40);

			cvalue.innerHTML = trimmed;
			ccount.innerHTML = cook.count;
			cchanges.innerHTML = cook.changes;

			// TODO: we are retesting iff tracker - improve!
			// TODO: can we include sites where cookies came from ??
			let strtracker = g_trackers[domain];
			if (undefined !== strtracker)
			{
				item.classList.add("stracker");

				let tspan = document.createElement("span");
				tspan.textContent = "  [" + strtracker + "] ";
				ccomment.appendChild(tspan);

				let a = document.createElement('a');
				//a.setAttribute('href', "https://better.fyi/trackers/" + trackdomain);
				a.setAttribute('href', "https://slayterdev.github.io/tracker-radar-wiki/domains/" + domain + ".html");
				a.innerHTML = " Click for information. ";
				a.setAttribute('target', "_blank");
				tspan.appendChild(a);

				let image = document.createElement("img");
				image.src = "i16.png";
				image.style.cssText = "padding: 2px 5px; vertical-align: middle;"; // top/bot, left,right
				ccomment.appendChild(image);
			}

			item.appendChild(cdomain);
			item.appendChild(cname);
			item.appendChild(cvalue);
			item.appendChild(ccount);
			item.appendChild(cchanges);
			item.appendChild(ccomment);

			item.classList.add("srequest");
			tbody.appendChild(item);
		}
	}

	let tfoot = document.getElementById("cookiestfoot");
	tfoot.textContent = "";
	let tr = document.createElement("tr");
	tfoot.appendChild(tr);

	let td = document.createElement("td");
	let numcookies = tbody.getElementsByTagName("tr").length;
	td.textContent = "# Cookies: " + numcookies;
	tr.appendChild(td);

	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
	tr.appendChild(document.createElement("td"));
}

////////////////////////////////////////////////////////////////////
function graph_items(theobj, mainsite, hide_blocked, maxcount)
{
	/* theobj is either hosts or domains object of format
	{
	  "www.cbc.ca": {
		"count": 73,
		"blocked": 0,
		"referers": {
		  "www.cbc.ca": {
			"count": 72
		  }
		},
		"tp": 2,
		"dcsync": 0,
		"pcsync": 0
	  },
	  "securepubads.g.doubleclick.net": {
		"count": 8,
		"blocked": 0,
		"tracker": "Google: Email, FingerprintingGeneral, Disconnect",
		"tdomain": "doubleclick.net",
		"referers": {
		  "www.usatoday.com": {
			"count": 6
		  },
		  "imasdk.googleapis.com": {
			"count": 2
		  }
		},
		"tp": 2,
		"dcsync": 0,
		"pcsync": 0
	  },
	  "smetrics.cbc.ca": {
		"count": 2,
		"blocked": 2,
		"cntracker": "cbc.ca.102.122.2o7.net",
		"tdomain": "2o7.net",
		"referers": {
		  "www.cbc.ca": {
			"count": 2
		  }
		},
		"tp": 2,
		"dcsync": 0,
		"pcsync": 0
	  }
	*/
	//console.log(theobj);

	// Loop thru all items in theobj and add graph nodes/edges
	for (let host in theobj)
	{
		let thehost = theobj[host];
		let blocked = false;
		if (thehost.count === thehost.blocked)
			blocked = true;
		if (hide_blocked && blocked)
			continue;

		if (g_hide_trackers && ((undefined !== thehost.tracker) || (undefined !== thehost.cntracker)))
			continue;

		//console.assert(thehost.count <= maxcount, "thehost.count <= maxcount");
		//let radius = thehost.count * 0.5;
		let radius = thehost.count / maxcount * 25;
		radius = (radius < 8) ? 8 : radius;

		let fillcolour = "#00AA00"; // circle fill colour
		let colour = "#2222AA"; // text colour
		let stroke = "#2222AA"; // circle border colour

		let hparams = {radius: radius, fill: fillcolour, color: colour, stroke: stroke,
			strokewidth: 2, font: "sans-serif", fontsize: 18, tip: host};

		if (mainsite === host)
		{
			hparams.fontsize = 22;
			hparams.fontweight = "bold";
		}

		// change style for trackers
		if (undefined !== thehost.tracker)
		{
			hparams.fill = "#FF0000";
			hparams.color = "#880000";
			hparams.stroke = "#AA0000";
			hparams.tip = host + "\n" + thehost.tracker;
		}
		else if (undefined !== thehost.cntracker) // check if cname tracker!!
		{
			hparams.fill = "#AA0000";
			hparams.color = "#880000";
			hparams.stroke = "#000000";
			hparams.fontweight = "bold";
			hparams.tip = host + "\nCNAME tracker: " + thehost.cntracker;
		}

		if (blocked) // change style iff blocked
		{
			if ("#00AA00" === hparams.fill) // iff still default colour
				hparams.fill = "#888888";
			hparams.tip = "BLOCKED\n" + hparams.tip;
		}

		if (0 == Object.keys(thehost.referers).length)
		{
			hparams.radius = 10;
			hparams.strokewidth = 5;
		}

		if (thehost.tp) // tracking pixels
		{
			hparams.fill = "#FFFF00";
			//hparams.fontweight = "bold";
			hparams.tip += "\nTracking Pixel: " + thehost.tp;
		}

		//if (??? TODO) // third party cookies
		//{
		//	hparams.fill = "#FF00FF";
		//	//hparams.fontweight = "bold";
		//	hparams.tip += "\nThird Party Cookies: " + thehost.tpc;
		//}

		if (thehost.dcsync) // definite cookie syncs
		{
			hparams.fill = "#FF6600";
			//hparams.fontweight = "bold";
			hparams.tip += "\nDefinite Cookie Sync: " + thehost.dcsync;
		}
		else if (thehost.pcsync) // possible cookie syncs
		{
			hparams.fill = "#FFAA66";
			//hparams.fontweight = "bold";
			hparams.tip += "\nPossible Cookie Sync: " + thehost.pcsync;

		}

		let enode = g_graph.nodeset[host];
		let clone;
		if (undefined !== enode)
		{
			//console.log("Node already exists! Was it added as a referer or does it belong to multiple tabs?\n",
			//	host, enode);
			let crefs; // make real clone of referers here - simplest method
			if (undefined !== enode.referers)
				crefs = JSON.parse(JSON.stringify(enode.referers));
			clone = {tracker: enode.tracker, cntracker: enode.cntracker,
				pcsync: enode.pcsync, dcsync: enode.dcsync,
				tp: enode.tp, blocked: enode.blocked, count: enode.count,
				mainsites: new Set(enode.mainsites),
				referers: crefs,
				id: enode.id};
		}

		// {count: 0, blocked: 0,
		//	tracker: entry.tracker, cntracker: entry.cntracker,
		//	tdomain: entry.tdomain, referers: {},
		//	tp: 0, dcsync: 0, pcsync: 0};

		// save node added and add tracking info to object! If the node already existed
		// then params are overwritten which is what we want! (must have been created as a referer edge below!)

		let nn = g_graph.addNode(host, hparams);
		nn.tracker = thehost.tracker;
		nn.cntracker = thehost.cntracker;
		nn.pcsync = thehost.pcsync; // possible cookie syncs
		nn.dcsync = thehost.dcsync; // possible cookie syncs
		nn.tp = thehost.tp; // tracking pixels
		nn.blocked = blocked;
		nn.count = thehost.count; // request count
		nn.mainsites = new Set([mainsite]);
		nn.referers = thehost.referers;

		if (undefined !== enode)
		{
			if (undefined !== clone.tracker) // may have been added as referer so no info here
				console.assert(nn.tracker === clone.tracker, "nn.tracker (" + nn.tracker + ") !== clone.tracker (" + clone.tracker + ") ???", nn.id, clone.id);
			if (undefined !== clone.tracker) // may have been added as referer so no info here
				console.assert(nn.cntracker === clone.cntracker, "nn.cntracker (" + nn.cntracker + ") !== clone.cntracker (" + clone.cntracker + ") ???", nn.id, clone.id);
			nn.pcsync += clone.pcsync;
			nn.dcsync += clone.dcsync;
			nn.tp += clone.tp;
			if (undefined !== clone.blocked) // may have been added as referer so no info here
				nn.blocked = nn.blocked ? clone.blocked : nn.blocked;
			nn.count += clone.count;
			clone.mainsites.forEach((elem) => { nn.mainsites.add(elem); });

			 // node may have been added as referer so no info here
			if ((undefined !== clone.referers) && (Object.keys(clone.referers).length > 0))
			{
				// loop thru clone referers and if not in new node referers
				// then add, else increment
				let clonerefs = clone.referers;
				for (let rc in clonerefs)
				{
					let rclone = clonerefs[rc];
					let found = nn.referers[rc];
					if (undefined === found)
						nn.referers[rc] = {count: rclone.count};
					else
						found.count += rclone.count; // TODO: confirm this, never happens???...
				}
			}
			//console.log(clone);
		}

		if (0 == Object.keys(thehost.referers).length)
		{
			// NOTE: We do not have enough information here so we assume referrer is main site!
			let params = {elength: 1, stroke: "#882222", strokewidth: 2, dash: blocked};

			let enode = g_graph.nodeset[mainsite];

			if (undefined === enode)
			{
				//console.log("NO REFERERS, mainsite node", mainsite, "does not exist for host", host, "Creating!");
				// This node will likely be overwritten but just in case...
				let nen = g_graph.addNode(mainsite, {radius: radius, fill: fillcolour, color: colour,
					stroke: stroke, strokewidth: 2, font: "sans-serif", fontsize: 18, tip: mainsite});

				// ignore tracker, cntracker, referers, blocked
				nen.pcsync = 0;
				nen.dcsync = 0;
				nen.tp = 0;
				nen.count = 0;
				nen.mainsites = new Set([mainsite]);
			}

			// check if edge already exists in either direction!
			let eedge = g_graph.edge(mainsite, host);
			if (eedge)
			{
				console.log("MAINSITE Edge already exists!", mainsite, host);
				eedge.strokewidth += 2;
				if (eedge.strokewidth > 10)
					eedge.strokewidth = 10;
			}
			else
				g_graph.addEdge(mainsite, host, params);
		}
		else
		{
			let referers = thehost.referers;
			for (let parent in referers)
			{
				if (parent !== host) // do not add iff referer is same as host!!
				{
					let ewidth = referers[parent].count * 0.5;
					ewidth = (ewidth > 10) ? 10 : (ewidth < 1) ? 1 : ewidth;

					let params = {elength: 1, stroke: "#666666", strokewidth: ewidth, dash: blocked};

					// parent node may not already exist but it is almost always
					// overwritten when we add proper host node so say ok!
					let enode = g_graph.nodeset[parent];
					if (undefined === enode)
					{
						//console.log("Parent node", parent, "does not exist for host", host, "Creating!");
						// This node will likely be overwritten but just in case...
						let nen = g_graph.addNode(parent, {radius: radius, fill: fillcolour, color: colour,
							stroke: stroke, strokewidth: 2, font: "sans-serif", fontsize: 18, tip: parent});

						// ignore tracker, cntracker, referers, blocked
						nen.pcsync = 0;
						nen.dcsync = 0;
						nen.tp = 0;
						nen.count = 0;
						nen.mainsites = new Set([mainsite]);
					}

					// check if edge already exists in either direction!
					let eedge = g_graph.edge(parent, host);
					if (eedge)
					{
						//console.log("Edge already exists!", parent, host);
						eedge.strokewidth += ewidth;
						if (eedge.strokewidth > 10)
							eedge.strokewidth = 10;
					}
					else
						g_graph.addEdge(parent, host, params);
				}
			}
		}
	} // for (let host in hosts)
}

////////////////////////////////////////////////////////////////////
function check_tracker(entry, hostname)
{
	let trackdomain = getbasedomain(hostname);
	let strtracker = g_trackers[trackdomain];
	if (undefined !== strtracker)
	{
		entry.tracker = strtracker;
		entry.tdomain = trackdomain;
	}
	else
	{
		// Test using additional DDG tracker list - this should not impact performance in any real way?
		strtracker = g_ddgtrackers[trackdomain];
		if (undefined !== strtracker)
		{
			//console.log("DDG Tracker!", trackdomain, strtracker);
			entry.tracker = "DDG " + strtracker;
			entry.tdomain = trackdomain;
		}
		else
		{
			let cntracker = cname_trackers[hostname];
			if (undefined !== cntracker)
			{
				entry.cntracker = cntracker;
				trackdomain = getbasedomain(cntracker);
				let strtracker = g_trackers[trackdomain];
				if (undefined !== strtracker)
				{
					entry.tdomain = trackdomain;
				}
			}
		}
	}
}

////////////////////////////////////////////////////////////////////
function clear_gui()
{
	g_Progress.show(true);
	g_graph.clear();
	//console.log("clear_gui");
	init_requests_table();
	init_hosts_table();
	init_domains_table();
}

////////////////////////////////////////////////////////////////////
function process_hars()
{
	console.time("process_hars");

	let hide_blocked = document.getElementById("hide-blocked").checked;

	g_graph._mainsites = new Set();
	let sites = {}; // actually files loaded...
	for (let ii = 0; ii < g_rawdata.length; ii++)
	{
		let browser = "UNKNOWN";
		if (g_rawdata[ii].log.browser) // does not exist with downloaded har from pagexray.fouanalytics.com
			browser = g_rawdata[ii].log.browser.name + " " + g_rawdata[ii].log.browser.version;

		let title = "Unknown"
		let DateTime = "2023-01-01T00:00:00.000Z"
		let pt = {}
		if (g_rawdata[ii].log.pages) // May not exist!
		{
			title = g_rawdata[ii].log.pages[0].title;
			DateTime = g_rawdata[ii].log.pages[0].startedDateTime;
			pt = g_rawdata[ii].log.pages[0].pageTimings;
		}

		// We assume timestamp is the most likely thing to be unique (title could be same ?)
		sites[DateTime] = {browser: browser, title: title, startedDateTime: DateTime,
			requests: g_rawdata[ii].log.entries.length, pageTimings: pt};

		let hosts = {};
		let refs = {};
		let mainsite;
		//let page = g_rawdata[ii].log.pages[0].id;
		//console.log("page", page);

		let entries = g_rawdata[ii].log.entries;
		for (let i = 0; i < entries.length; i++)
		{
			let entry = entries[i];
			if (entry.response.content.size > 1000)
				entry.response.content.text = "REDACTED!"; // way too long too show!!

			let hosturl = new URL(entry.request.url);
			entry.hostname = hosturl.hostname;
			if (!mainsite) // just default to first for now!
				mainsite = hosturl.hostname;

			check_tracker(entry, hosturl.hostname);

			let newhost = hosts[hosturl.hostname];
			if (undefined === newhost)
				hosts[hosturl.hostname] = {count: 0, blocked: 0,
					tracker: entry.tracker, cntracker: entry.cntracker, tdomain: entry.tdomain, referers: {},
					tp: 0, dcsync: 0, pcsync: 0};
					//tp: 0, dcsync: 0, pcsync: 0, IP: entry.serverIPAddress};
			hosts[hosturl.hostname].count++;

			// NOTE: Not that easy to determine iff blocked!!
			let rheaders = entry.response;
			if (0 == rheaders.status)
			{
				if (-1 == rheaders.bodySize)
					entry.blocked = true;
				else if (0 == rheaders.bodySize)
				{
					if ("broken" === entry._securityState)
						entry.blocked = true;
					else if (undefined === entry._securityState)
						entry.blocked = true;
				}
			}
			if (entry.blocked) // iff true!
				hosts[hosturl.hostname].blocked++;

			let headers = entry.request.headers;
			// Header field names are case-insensitive
			for (let j = 0; j < headers.length; j++)
			{
				let headitem = headers[j];
				if (headitem.name.toLowerCase() === "referer")
				{
					let referrer = headitem.value;
					if (0 === referrer.length) // happens with downloaded har from pagexray.fouanalytics.com
						break;
					let referrerurl = new URL(referrer);
					if ("" === referrerurl.hostname) // can be about:blank etc...
						break;

					let referers = hosts[hosturl.hostname].referers;
					let r = referers[referrerurl.hostname];
					if (undefined === r)
						 referers[referrerurl.hostname] = {count: 0};
					referers[referrerurl.hostname].count++;

					// add to refs so we can determine main site
					r = refs[referrerurl.hostname];
					if (undefined === r)
						refs[referrerurl.hostname] = {count: 0};
					refs[referrerurl.hostname].count++;

					break;
				}
			}
		} // for (let i = 0; i < entries.length; i++)

		// TODO: what is the best way of determining the main site??
		// not always first but should have first timestamp!!
		let max = 0;
		for (let host in refs)
		{
			let thehost = refs[host];
			//console.log(thehost);
			if (thehost.count > max)
			{
				max = thehost.count;
				mainsite = host;
			}
		}
		g_graph._mainsites.add(mainsite);

		if (!g_lowmem)
			populate_requests_table(entries, mainsite, hide_blocked, hosts);

		// call fcn to populate g_allhosts for use in populate_hosts_table
		// and populate g_alldomains for use in populate_domains_table
		// also graphs depending on graph-domains checkbox
		combine_hosts(hosts, mainsite, hide_blocked);

	} // for (let ii = 0; ii < g_rawdata.length; ii++)

	if (!g_lowmem)
	{
		finalize_requests_table();
		finalize_hosts_table(hide_blocked);
		finalize_domains_table(hide_blocked);

		populate_sites_table(sites);

		populate_cookies_table();
	}

	let numnodes = g_graph.nodes.length;
	let graph_trackers = 0;
	let graph_cntrackers = 0;
	let pcsync = 0;
	let dcsync = 0;
	let tp = 0;
	// default node mass is 1
	let emass = 1.0; // default for Repulsion
	if (g_graph.layouttype === "BHut")
		emass = 2.0;
	else if (g_graph.layouttype === "GraphSpring")
		emass = 2.0;

	// We adjust node masses and length of edges for nodes here as well as count
	// trackers, syncers, tracking pixels etc...
	for (let i = 0; i < numnodes; i++)
	{
		let host = g_graph.nodes[i];
		// larger mass for nodes with many edges
		if (host.links.length > 5)
			host.mass = emass; // this helps spread out large networks better
		else if (host.links.length > 20)
			host.mass = emass * 5;

		// iff only 1 link and not to a mainsite then decrease edge length - helps shorten edges to fringe nodes
		if (1 === host.links.length)
		{
			let blink = false;
			for (const elem of host.mainsites)
			{
				let nn = g_graph.nodeset[elem];
				if (nn && host.links.edge(nn))
				{
					blink = true;
					break;
				}
			}
			if (!blink)
			{
				let edge = Object.values(host.links.edges)[0];
				edge.elength = 0.5;
				//console.log("edge.elength = 0.5", host.id);
			}
		}

		if (undefined !== host.tracker)
			graph_trackers++;
		else if (undefined !== host.cntracker)
			graph_cntrackers++;

		// These could be undefined if node was added in the process of adding edge!
		pcsync += host.pcsync ? host.pcsync : 0;
		dcsync += host.dcsync ? host.dcsync : 0;
		tp += host.tp ? host.tp : 0;
	}

	if (g_hidelabels.checked)
		hidelabels(true);

	if (g_htrackers.checked)
		hidetrackers(true);

	let graph_domains = document.getElementById("graph-domains").checked;
	let nrequests = document.getElementById("requeststbody").getElementsByTagName("tr").length;
	let gtext = "Requests: " + nrequests;

	gtext += "\nTrackers/Advertiser requests: " + g_trequests +
		" (" + (g_trequests / nrequests * 100).toFixed(1) + " %)";

	if (graph_domains)
	{
		if (0 !== graph_cntrackers)
			console.warn("0 !== graph_cntrackers for Domains ????");
		gtext += "\nTotal Domains: " + numnodes;
		if (graph_trackers > 0)
			gtext += "\nKnown Trackers/Advertiser Hosts: " +
				graph_trackers + " (" + (graph_trackers / numnodes * 100).toFixed(1) + " %)";
		//console.assert(0 === graph_cntrackers, "0 !== graph_cntrackers");
	}
	else
	{
		gtext += "\nTotal Hosts: " + numnodes;
		if (graph_trackers > 0)
			gtext += "\nKnown Trackers/Advertiser Hosts: " +
				graph_trackers + " (" + (graph_trackers / numnodes * 100).toFixed(1) + " %)";
		if (graph_cntrackers > 0)
			gtext += "\nKnown CNAME Trackers: " + graph_cntrackers;
	}

	if (tp > 0)
		gtext += "\nTracking Pixels: " + tp;
	if (pcsync > 0)
		gtext += "\nPossible Cookie Syncs: " + pcsync;
	if (dcsync > 0)
		gtext += "\nDefinite Cookie Syncs: " + dcsync;

	// Now count of all first and third party cookies!
	let fpc = 0;
	let tpc = 0;
	for (let domain in g_cinfo)
	{
		let ccs = g_cinfo[domain];
		let numc = Object.keys(ccs.cookies).length;

		let fp = ccs.sites[domain];
		if (undefined !== fp)
		{
			console.assert("fp" === fp, "'fp' === fp failed ??");
			fpc += numc;
		}
		else
			tpc += numc;
	}
	if (tpc > 0)
		gtext += "\nTP Cookies: " + tpc;
	if (fpc > 0)
		gtext += "\nFP Cookies: " + fpc;

	//g_graph.setrepulsion(40);

	// Update all Node.centrality values. We do this and use weighted option in loop fcn
	// to highlight nodes with high traffic!!
	// This applies to ALL graph types!
	g_graph.betweennessCentrality();

	g_graph.stabilize({frames: 300, fps: 30, ipf: 5, directed: false, weighted: 0.5});

	g_graph.settext(gtext, "bold 20px Arial", "#000088", 2, 2);

	//console.log(g_cinfo);
	//console.log(g_csyncers);

	g_Progress.show(false);

	// We do not these anymore
	g_rawdata = [];
	g_allhosts = {};
	g_alldomains = {};
	g_domains = [];
	g_cinfo = {};
	//g_csyncers = {};

	console.timeEnd("process_hars");
}

// TODO: initial positioning should help us stabilize faster!
// Can we further tweak this??
function positionInitially(evt)
{
	let nodes = evt.detail;
	let graph = g_graph; // just so code is exactly the same as stats.js in requests extension!
	let dist = g_graph.distance;

	// Create node array of all mainsites so we can position in main circle
	let mainsites = [];
	// Best to loop over graph.mainsites Set for unique elements in array
	graph._mainsites.forEach((elem) => {
		let node = graph.nodeset[elem];
		// NOTE: elem can be empty string if we are charting and new site/tab is opened
		if (undefined === node)
			console.warn("graph.nodeset[elem] is undefined???", elem, graph._mainsites);
		else
			mainsites.push(node);
	});

	if (1 === mainsites.length) // iff only 1 mainsite
	{
		// create arrays for positioning nodes
		let mnode = mainsites[0];
		let mainsite = mnode.id;
		let cnodes = [];
		let dnodes = [];
		let pnodes = [];
		for (let i = 0; i < nodes.length; i++)
		{
			let node = nodes[i];
			if (node.id !== mainsite)
			{
				// position nodes with only 1 link to this mainsite around it!
				// we also include nodes with no referers as we consider them directly
				// connected to mainsite as well
				if ((1 === node.links.length) && node.referers && (node.referers[mainsite] ||
						(0 == Object.keys(node.referers).length)))
					cnodes.push(node); // single link to mainsite
				else
				{
					if (node.referers && node.referers[mainsite])
						pnodes.push(node); // connected to mainsite
					else
						dnodes.push(node); // not connected to mainsite
				}
			}
		}

		// position mainsite
		let mn = graph.nodeset[mainsite];
		mn.x = mn.y = mn._x = mn._y = 0;

		// single link to mainsite - position in circle around mainsite
		let radius = 200;
		let ainc = 1 / cnodes.length;
		for (let i = 0; i < cnodes.length; i++)
		{
			let node = cnodes[i];
			let angle = 2 * Math.PI * i * ainc;
			node.x = radius * Math.cos(angle);
			node.y = radius * Math.sin(angle);
			node._x = node.x / dist;
			node._y = node.y / dist;
		}

		radius = 50;
		ainc = 1 / pnodes.length;
		// connected to mainsite but multiple links - position in small circle to the right
		for (let i = 0; i < pnodes.length; i++)
		{
			let node = pnodes[i];
			let angle = 2 * Math.PI * i * ainc;
			node.x = 400 + radius * Math.cos(angle);
			node.y = radius * Math.sin(angle);
			node._x = node.x / dist;
			node._y = node.y / dist;
		}

		// not connected to mainsite - position in small circle to the right again
		ainc = 1 / dnodes.length;
		for (let i = 0; i < dnodes.length; i++)
		{
			let node = dnodes[i];
			let angle = 2 * Math.PI * i * ainc;
			node.x = 600 + radius * Math.cos(angle);
			node.y = radius * Math.sin(angle);
			node._x = node.x / dist;
			node._y = node.y / dist;
		}
	}
	else
	{
		// position multiple mainsite nodes in a circle - equal angle spacing
		let radius = 400;
		let ainc = 1 / mainsites.length;
		for (let i = 0; i < mainsites.length; i++)
		{
			let node = mainsites[i];
			let angle = 2 * Math.PI * i * ainc; // Math.random() - greater than or equal to 0 and less than 1

			node.x = radius * Math.cos(angle) + Math.random() * 100 - 50; // add random num from -50 to 50
			node.y = radius * Math.sin(angle) + Math.random() * 100 - 50;
			node._x = node.x / dist;
			node._y = node.y / dist;
			//console.log("mainsite", node.id, angle, node.x, node.y);

			// now position nodes with only 1 link to this mainsite around it!
			// this seems to work quite well!!
			let pnodes = [];
			for (let j = 0; j < nodes.length; j++)
			{
				let n = nodes[j];
				if ((1 === n.links.length) && n.links.edge(node))
					pnodes.push(n);
			}

			//console.log(pnodes);
			let rad = 100;
			let a_inc = 1 / pnodes.length;
			for (let j = 0; j < pnodes.length; j++)
			{
				let n = pnodes[j];
				let ang = 2 * Math.PI * j * a_inc;

				n.x = node.x + rad * Math.cos(ang) + Math.random() * 20 - 10; // add random num from -10 to 10
				n.y = node.y + rad * Math.sin(ang) + Math.random() * 20 - 10;
				n._x = n.x / dist;
				n._y = n.y / dist;
				//console.log("1 link mainsite", n.id, ang, n.x, n.y);
			}
		} // for (let i = 0; i < mainsites.length; i++)

		// BHut is slightly different in the way the algorithm works and it is best
		// to position all unpositioned nodes here, do for all layout types!
		// Finally loop thru all nodes and position nodes that have not been done yet
		// in small circle
		radius = 50;
		ainc = 1 / nodes.length;
		for (let i = 0; i < nodes.length; i++)
		{
			let node = nodes[i];
			let angle = 2 * Math.PI * i * ainc;
			if ((0 === node.x)  && (0 === node.y))
			{
				node.x = radius * Math.cos(angle);
				node.y = radius * Math.sin(angle);
				node._x = node.x / dist;
				node._y = node.y / dist;
				//console.log("Remaining", node.id, angle, node.x, node.y);
			}
		}
	}
}

////////////////////////////////////////////////////////////////////
function hidelabels(bhide)
{
	let numnodes = g_graph.nodes.length;
	for (let i = 0; i < numnodes; i++)
	{
		let host = g_graph.nodes[i];
		if (bhide)
		{
			if (host.count < 5) // hide if few requests
				host.showtext = false;
			if (host.links.length > 5) // but show iff many edge connections
				host.showtext = true;
		}
		else
			host.showtext = true;
	}
	g_graph.redraw();
}

////////////////////////////////////////////////////////////////////
function hidetrackers(bhide)
{
	let numnodes = g_graph.nodes.length;
	for (let i = 0; i < numnodes; i++)
	{
		let host = g_graph.nodes[i];
		if (undefined !== host.tracker)
		{
			host.hidden = bhide;
			let edges = host.links.edges;
			for (let edge in edges)
			{
				edges[edge].hidden = bhide;
			}
		}
		else if (undefined !== host.cntracker)
		{
			host.hidden = bhide;
			let edges = host.links.edges;
			for (let edge in edges)
			{
				edges[edge].hidden = bhide;
			}
		}
	}
	g_graph.redraw();
}

////////////////////////////////////////////////////////////////////
// tcname === "tabcontent" or "tabcontentd" for dialog
// tlname === "tablinks" or "tablinksd" for dialog
function opentab(evt, name, tcname, tlname)
{
	let tabcontent = document.getElementsByClassName(tcname);
	for (let i = 0; i < tabcontent.length; i++)
	{
		tabcontent[i].style.display = "none";
	}
	let tablinks = document.getElementsByClassName(tlname);
	for (let i = 0; i < tablinks.length; i++)
	{
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}
	document.getElementById(name).style.display = "block";
	evt.currentTarget.className += " active";
}

////////////////////////////////////////////////////////////////////
function resizewindow(evt)
{
	let infobox = document.getElementById("idinfobox");
	let content = document.getElementById("idcontent");
	content.style.marginTop = infobox.offsetTop + infobox.offsetHeight - 1 + "px";

	let tpos = infobox.offsetTop + infobox.offsetHeight + "px";

	let theads = document.getElementsByTagName("thead");
	for (let i = 0; i < theads.length; i++)
	{
		theads[i].style.position = "sticky";
		theads[i].style.top = tpos;
	}

	let graph = document.getElementById("graph");
	//console.log(graph);
	let ctx = document.getElementById("_ctx");

	var rect = graph.getBoundingClientRect();
	//console.log(rect);
	if (rect.width) // will fail on initial load!
		ctx.width = rect.width - 2;
	else
		ctx.width = window.innerWidth - 24;

	ctx.height = window.innerHeight - infobox.offsetTop + infobox.offsetHeight - 96;

	// force redraw of canvas iff not called directly!
	if (evt !== null)
		g_graph.redraw();
}

////////////////////////////////////////////////////////////////////
// Simple JavaScript Promise that reads a file as text.
function readFileAsText(file)
{
	return new Promise(function(resolve, reject) {
		let fr = new FileReader();

		fr.onload = function() {
			resolve(fr.result);
		};

		fr.onerror = function() {
			reject(fr);
		};

		fr.readAsText(file);
	});
}

////////////////////////////////////////////////////////////////////
function create_trow(item, title, el)
{
	if (item)
	{
		let tr = document.createElement("tr");
		let td = document.createElement("td");
		td.innerHTML = title;
		tr.appendChild(td);

		td = document.createElement("td");
		td.innerHTML = item;
		td.setAttribute("colspan", 2);
		td.style.cssText = "max-width: 1000px; overflow-wrap: break-word;";
		tr.appendChild(td);
		tr.classList.add("srequest");
		el.appendChild(tr);
	}
}

////////////////////////////////////////////////////////////////////
function create_timings(timings, el)
{
	if (Object.keys(timings).length > 0)
	{
		let tr = document.createElement("tr");
		let td = document.createElement("td");
		td.innerHTML = "Timings:";
		tr.appendChild(td);

		td = document.createElement("td");
		td.setAttribute("colspan", 2);
		tr.appendChild(td);
		tr.classList.add("srequest");
		el.appendChild(tr);

		for (let timing in timings)
		{
			tr = document.createElement("tr");

			td = document.createElement("td");
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = timing;
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = timings[timing] + " ms";
			tr.appendChild(td);
			tr.classList.add("srequest");
			el.appendChild(tr);
		}
	}
}

////////////////////////////////////////////////////////////////////
function create_titem(content, title, el, allowed)
{
	if (undefined === content)
		return;

	if (Object.keys(content).length > 0)
	{
		let tr = document.createElement("tr");
		let td = document.createElement("td");
		td.innerHTML = title;
		tr.appendChild(td);

		td = document.createElement("td");
		td.setAttribute("colspan", 2);
		tr.appendChild(td);
		tr.classList.add("srequest");
		el.appendChild(tr);

		for (let c in content)
		{
			if (c in allowed) // check iff allowed - some fields are way too long!
			{
				tr = document.createElement("tr");

				td = document.createElement("td");
				tr.appendChild(td);

				td = document.createElement("td");
				td.innerHTML = c;
				td.style.cssText = "max-width: 250px; overflow-wrap: break-word;";
				tr.appendChild(td);

				td = document.createElement("td");
				td.innerHTML = content[c];
				td.style.cssText = "max-width: 1000px; overflow-wrap: break-word;";
				tr.appendChild(td);
				tr.classList.add("srequest");
				el.appendChild(tr);
			}
		}
	}
}

////////////////////////////////////////////////////////////////////
function create_array(title, thearray, el)
{
	if (thearray.length > 0)
	{
		let tr = document.createElement("tr");
		let td = document.createElement("td");
		td.innerHTML = title;
		tr.appendChild(td);

		td = document.createElement("td");
		td.setAttribute("colspan", 2);
		tr.appendChild(td);
		tr.classList.add("srequest");
		el.appendChild(tr);

		for (let i = 0; i < thearray.length; i++)
		{
			tr = document.createElement("tr");

			td = document.createElement("td");
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = thearray[i].name;
			td.style.cssText = "max-width: 250px; overflow-wrap: break-word;";
			tr.appendChild(td);

			td = document.createElement("td");
			td.innerHTML = thearray[i].value;
			td.style.cssText = "max-width: 1000px; overflow-wrap: break-word;";
			tr.appendChild(td);
			tr.classList.add("srequest");
			el.appendChild(tr);
		}
	}
}

////////////////////////////////////////////////////////////////////
function populate_modal(data)
{
	//console.log(data);

	// Raw data tab
	let el = document.getElementById("raw");
	// TODO: how to keep text in modal with pre ??
	el.innerHTML = "<pre>" + JSON.stringify(data, null, '  ') + "</pre>";

	// Basic info tab
	el = document.getElementById("basictbody");
	el.innerHTML = "";
	create_trow(data.startedDateTime, "Time Stamp:", el);
	create_trow(data.time, "Time (ms):", el);
	create_trow(data.serverIPAddress, "IP Address:", el);
	create_trow(data.connection, "Port:", el);
	create_trow(data.comment, "Comment:", el);
	create_timings(data.timings, el);

	// Request info tab
	el = document.getElementById("requesttbody");
	el.innerHTML = "";
	create_trow(data.request.url, "URL:", el);
	create_trow(data.request.httpVersion, "HTTP Ver:", el);
	create_trow(data.request.method, "Method:", el);
	create_trow(data.request.headersSize, "Header Size", el);
	create_trow(data.request.bodySize, "Body Size:", el);
	create_trow(data.request.comment, "Comment:", el);
	create_array("Cookies:", data.request.cookies, el);
	create_array("Headers:", data.request.headers, el);
	create_array("Queries:", data.request.queryString, el);
	let allowed = {"mimeType": 0};
	create_titem(data.request.postData, "Post Data:", el, allowed);

	// Response info tab
	el = document.getElementById("responsetbody");
	el.innerHTML = "";
	create_trow(data.response.status, "Status:", el);
	create_trow(data.response.statusText, "Status Text", el);
	create_trow(data.response.httpVersion, "HTTP Ver:", el);
	create_trow(data.response.redirectURL, "Redirect URL:", el);
	create_trow(data.response.headersSize, "Header Size", el);
	create_trow(data.response.bodySize, "Body Size:", el);
	create_trow(data.response.comment, "Comment:", el);
	create_array("Cookies:", data.response.cookies, el);
	create_array("Headers:", data.response.headers, el);
	allowed = {"mimeType": 0, "size": 0, "encoding": 0, "text": 0, "comment": 0};
	create_titem(data.response.content, "Content:", el, allowed);

	// ignore "cache": {...}

	g_modal.showModal();
	document.getElementById("tabd1").click();
}

////////////////////////////////////////////////////////////////////
function addRowHandlers()
{
	let tbody = document.getElementById("requeststbody");
	let rows = tbody.getElementsByTagName("tr");
	for (let i = 0; i < rows.length; i++)
	{
		let currentRow = rows[i];
		//let createClickHandler = function(row)
		//{ return function() { populate_modal(row.harentry); }; };
		//currentRow.onclick = createClickHandler(currentRow);

		// For first cell of row...
		let cell = currentRow.getElementsByTagName("td")[0];
		cell.onclick = function(evt)
		{
			populate_modal(this.parentElement.harentry);
		};
	}
}

////////////////////////////////////////////////////////////////////
function refresh() // called when we click checkboxes to redo!
{
	// Create a new 'change' event and dispatch it
	var event = new Event('change');
	document.getElementById("file-input").dispatchEvent(event);
}

let g_htrackers;
let g_hidelabels;
////////////////////////////////////////////////////////////////////
function modify_options()
{
	// Add Control hiding trackers
	let div = document.createElement("div");
	div.style.cssText = "padding: 4px 0px 4px 0px;";
	g_htrackers = document.createElement("input");
	g_htrackers.type = "checkbox";
	g_htrackers.setAttribute("title", "Hide trackers");
	g_htrackers.id = "g_htrackers";

	g_htrackers.addEventListener("click", (evt) => {
		hidetrackers(evt.target.checked);
	});
	div.appendChild(g_htrackers);

	let label = document.createElement("label");
	label.style.cssText = "margin-left: 6px; padding: 0px 4px 0px 4px;";
	label.setAttribute("title", "Hide trackers");
	label.htmlFor = g_htrackers.id;
	label.appendChild(document.createTextNode("Hide trackers"));
	div.appendChild(label);
	g_graph.popup.dialog.appendChild(div);


	// Add Control for hiding low traffic node labels
	div = document.createElement("div");
	div.style.cssText = "padding: 4px 0px 4px 0px;";
	g_hidelabels = document.createElement("input");
	g_hidelabels.type = "checkbox";
	g_hidelabels.setAttribute("title", "Hide low traffic node labels");
	g_hidelabels.id = "g_hidelabels";

	g_hidelabels.addEventListener("click", (evt) => {
		hidelabels(evt.target.checked);
	});
	div.appendChild(g_hidelabels);

	label = document.createElement("label");
	label.style.cssText = "margin-left: 6px; padding: 0px 4px 0px 4px;";
	label.setAttribute("title", "Hide low traffic node labels");
	label.htmlFor = g_hidelabels.id;
	label.appendChild(document.createTextNode("Hide low traffic node labels"));
	div.appendChild(label);
	g_graph.popup.dialog.appendChild(div);
}

//////////////////////////////////////////////////////////////////
// Code to strip har files so smaller!!!
// Function to strip text content from har files and save locally!
function saveJSON(data, saveAs){
	var stringified = JSON.stringify(data, null, 2);
	var blob = new Blob([stringified], {type: "application/json"});
	var url = URL.createObjectURL(blob);

	var a = document.createElement('a');
	a.download = saveAs;
	a.href = url;
	a.id = "junkelement";
	document.body.appendChild(a);
	a.click();
	document.querySelector('#' + a.id).remove();
}

////////////////////////////////////////////////////////////////////

// Handle multiple files
document.getElementById("file-input").addEventListener("change", function(evt) {
	let files = evt.currentTarget.files;
	let readers = [];

	// Abort if there were no files selected
	if (!files.length)
		return;

	// Code to strip har files so smaller!!!
	let filenames = [];

	// Store promises in array
	for (let i = 0; i < files.length; i++)
	{
		readers.push(readFileAsText(files[i]));
		// Code to strip har files so smaller!!!
		if (g_redact)
			filenames.push(files[i].name);
	}

	// Trigger Promises
	Promise.all(readers).then((values) => {
		// Values will be an array that contains an item with the text of every selected file
		// ["File1 Content", "File2 Content" ... "FileN Content"]
		g_rawdata = [];
		g_allhosts = {};
		g_alldomains = {};
		g_domains = [];

		g_cinfo = {};
		//g_csyncers = {};
		g_trequests = 0;

		g_hide_trackers = document.getElementById("hide-trackers").checked;

		// tooltip for fake button so we can see what files are loaded!!
		let fbtn = document.getElementById("file-input");
		let tip = "";
		for (let i = 0; i < fbtn.files.length; i++)
		{
			tip += fbtn.files[i].name + "\n";
		}
		document.getElementById("file-btn").title = tip;

		// Clear filter search boxes
		document.getElementById("requests_sb").value = "";
		document.getElementById("hosts_sb").value = "";
		document.getElementById("domains_sb").value = "";
		document.getElementById("cookies_sb").value = "";

		for (let i = 0; i < values.length; i++)
		{
			let data = JSON.parse(values[i]);
			g_rawdata.push(data);

			if (g_redact)
			{
				// Code to strip har files so smaller!!!
				let entries = data.log.entries;
				for (let i = 0; i < entries.length; i++)
				{
					let entry = entries[i];
					if (entry.response.content.size > 1000)
						entry.response.content.text = "REDACTED!"; // way too long too show!!
					if (entry.request.postData && (entry.request.postData.text.length > 1000))
						entry.request.postData.text = "REDACTED!"; // way too long too show!!
				}
				// Call fcn to save stripped file to disk
				saveJSON(data, filenames[i]);
			}
		}

		clear_gui();
		// Setup simple table sorting - reset column headers
		refresh_sortables();
		setTimeout(process_hars, 100);
		// We MUST also reset top margins, size etc...
		resizewindow(null);

	});
}, false);

// Add this event handler BEFORE we create graph so graph onResize fires AFTER!!
// OR we could call g_graph.onResize(); at end of resizewindow fcn!
window.addEventListener("resize", resizewindow);

let ADOBE = [
	"2o7.net",
	"adobe.com",
	"auditude.com",
	"demdex.com",
	"demdex.net",
	"dmtracker.com",
	"efrontier.com",
	"everestads.net",
	"everestjs.net",
	"everesttech.net",
	"fyre.co",
	"hitbox.com",
	"livefyre.com",
	"omniture.com",
	"omtrdc.net",
	"touchclarity.com",
	"typekit.com"
];

let GOOGLE = [
	"2mdn.net",
	"google.com",
	"admeld.com",
	"admob.com",
	"apture.com",
	"blogger.com",
	"cc-dt.com",
	"crashlytics.com",
	"dartsearch.net",
	"destinationurl.com",
	"doubleclick.com",
	"doubleclick.net",
	"fcmatch.youtube.com",
	"feedburner.com",
	"ggpht.com",
	"gmail.com",
	"gmodules.com",
	"google.ad",
	"googleadservices.com",
	"googleadsserving.cn",
	"google-analytics.com",
	"googleapis.cn",
	"googleapis.co",
	"googleapis.com",
	"googleartproject.com",
	"google.ca",
	"googlecommerce.com",
	"google.co.uk",
	"googlemail.com",
	"google-melange.com",
	"googleoptimize.com",
	"googlesyndication.com",
	"googletagmanager.com",
	"googletagservices.com",
	"googletraveladservices.com",
	"googleusercontent.com",
	"goooglesyndication.com",
	"gstatic.com",
	"invitemedia.com",
	"orkut.com",
	"panoramio.com",
	"postini.com",
	"postrank.com",
	"recaptcha.net",
	"smtad.net",
	"teracent.com",
	"teracent.net",
	"youtube.com",
	"ytsa.net"
];

function updatetext(sfind, graph_nodes, nodes)
{
	let bhandled = false;
	let allupper = (sfind === sfind.toUpperCase());

	let numnodes = graph_nodes.length;
	for (let i = 0; i < numnodes; i++)
	{
		graph_nodes[i].showtext = false;
	}

	if (allupper && ("GOOGLE" === sfind) || ("ADOBE" === sfind))
	{
		bhandled = true;
		let ar;
		if ("GOOGLE" === sfind)
			ar = GOOGLE;
		else if ("ADOBE" === sfind)
			ar = ADOBE;
		for (let i = 0; i < numnodes; i++)
		{
			let host = graph_nodes[i];
			for (let j = 0; j < ar.length; j++)
			{
				if (host.id.includes(ar[j]))
				{
					nodes.push(host);
					break;
				}
			}
		}
	}
	return bhandled;
}


let g_graph = new Graph(document.getElementById("_ctx"), undefined, updatetext); // Repulsion, GraphSpring, BHut,  Custom

g_graph.canvas.addEventListener("node_selected", function(evt)
{
	g_graph.graphText.show(true);
	g_graph.graphText.set_text(evt.detail.id);

});

g_graph.canvas.addEventListener("position_nodes", positionInitially);

//g_debug_graph = g_graph;

// modify graph popup and add hide trackers checkbox
modify_options();

document.getElementById("graph_btn").addEventListener("click", function(evt) { opentab(evt, "graph", "tabcontent", "tablinks"); });
document.getElementById("sites_btn").addEventListener("click", function(evt) { opentab(evt, "sites", "tabcontent", "tablinks"); });
document.getElementById("requests_btn").addEventListener("click", function(evt) { opentab(evt, "requests", "tabcontent", "tablinks"); });
document.getElementById("hosts_btn").addEventListener("click", function(evt) { opentab(evt, "hosts", "tabcontent", "tablinks"); });
document.getElementById("domains_btn").addEventListener("click", function(evt) { opentab(evt, "domains", "tabcontent", "tablinks"); });
document.getElementById("cookies_btn").addEventListener("click", function(evt) { opentab(evt, "cookies", "tabcontent", "tablinks"); });

document.getElementById("hide-blocked").addEventListener("click", function(evt) { refresh(); });
document.getElementById("graph-domains").addEventListener("click", function(evt) { refresh(); });
document.getElementById("hide-trackers").addEventListener("click", function(evt) { refresh(); });

// Modal dialog related stuff
document.getElementById("tabd1").addEventListener("click", function(evt) { opentab(evt, "tab-d1", "tabcontentd", "tablinksd"); });
document.getElementById("tabd2").addEventListener("click", function(evt) { opentab(evt, "tab-d2", "tabcontentd", "tablinksd"); });
document.getElementById("tabd3").addEventListener("click", function(evt) { opentab(evt, "tab-d3", "tabcontentd", "tablinksd"); });
document.getElementById("tabd4").addEventListener("click", function(evt) { opentab(evt, "tab-d4", "tabcontentd", "tablinksd"); });

// Get the modal
let g_modal = document.getElementById("modal");

// When the user clicks on <span> (X), close the modal
document.getElementById("close").onclick = function() {
	g_modal.close();
};

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(evt) {
	if (evt.target == g_modal) {
		g_modal.close();
	}
};

let g_Progress = new Progress();

resizewindow(null);

// Setup simple table sorting
do_sortable();

// Setup table filtering
do_filter(document.getElementById("requests_sb"), document.getElementById("requeststable"));
do_filter(document.getElementById("hosts_sb"), document.getElementById("hoststable"));
do_filter(document.getElementById("domains_sb"), document.getElementById("domainstable"));
do_filter(document.getElementById("cookies_sb"), document.getElementById("cookiestable"));

document.getElementById("graph_btn").click();
