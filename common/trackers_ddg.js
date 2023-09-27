// Script for harview.html

"use strict";

/* jshint esversion: 6 */
/* jshint sub:true */
// Just to shut jsHint up (https://jshint.com/)
// let trackers;

let g_ddgtrackers = {};

////////////////////////////////////////////////////////////////////
function parse_ddgtrackers()
{
	// parse ddg trackers file and build our own list

	let dc = {};
	let trackers = ddgtrackers.trackers;
	for (let tracker in trackers)
	{
		let alreadyhave = g_trackers[tracker];
		if (undefined !== alreadyhave)
			continue;
		let t = trackers[tracker];
		/*
		iff "default": "block" and no rules then included
		iff "default": "block" and we have rules then not included as we are not parsing rules!!!
		iff  "default": "ignore" then we do not include
		iff fingerprinting >= 2 then we always include regardless of above!!
		*/
		let d = t.default
		if (t.fingerprinting && (t.fingerprinting < 2))
		{
			if (undefined === d)
			{
				//console.log("UNDEFINED", t);
				continue;
			}
			if ("ignore" === d)
			{
				//console.log("IGNORE", t);
				continue;
			}
			else if ("block" === d)
			{
				if (t.rules && t.rules.length > 0)
				{
					//console.log("BLOCK -> IGNORING", t);
					continue;
				}
			}
			//else
			//	console.log("UNKNOWN??", t);
		}

		let domain = t.domain;
		let name = t.owner.displayName;
		let cats = "Advertising";
		if (t.categories)
		{
			cats = t.categories.join(', ');
			if ("" === cats)
				cats = "Advertising";
		}

		dc[domain] = name + ": " + cats;
	}
	g_ddgtrackers = dc;
	//console.log(g_ddgtrackers);

	// Now check against other tracker list!!
	//for (let tracker in g_ddgtrackers)
	//{
		//let other = g_trackers[tracker];
		//if (undefined === other)
		//{
			////console.log("DDG Tracker not in Disconnect trackers!", tracker, g_ddgtrackers[tracker]);
		//}
		//else
		//{
			////console.log("BOTH", tracker, g_ddgtrackers[tracker], g_trackers[tracker]);
			//delete g_ddgtrackers[tracker];
		//}
	//}

	//console.log("DDG trackers: ", Object.keys(g_ddgtrackers).length);
	//console.log(g_ddgtrackers);

	//for (let tracker in g_trackers)
	//{
		//let other = g_ddgtrackers[tracker];
		//if (undefined === other)
		//{
			//console.log("Disconnect tracker not in DDG Trackers!", tracker, g_trackers[tracker]);
		//}
		//else
		//{
			//console.log("BOTH", tracker, g_ddgtrackers[tracker], g_trackers[tracker]);
		//}
	//}

}

parse_ddgtrackers();
