// Script for harview.html

"use strict";

/* jshint esversion: 6 */
/* jshint sub:true */
// Just to shut jsHint up (https://jshint.com/)
// let trackers;

let g_trackers = {};
let cname_trackers = {};

////////////////////////////////////////////////////////////////////
function get_trackers()
{
	let url = 'https://raw.githubusercontent.com/rebelwcause/Trackers/refs/heads/main/trackers.json'
	fetch(url).then(async(response) => {
		// get json response here
		let data = await response.json();
		if (response.status === 200)
		{
			console.log("update_trackers: OK", response.status, url);
			//console.log(data)
			g_trackers = data;
		}
		else
		{
			// Rest of status codes (400,500,303), can be handled here appropriately
			console.log("get_trackers: Error getting trackers list", response.status);
		}
	}).catch((err) => {
		console.log("get_trackers: Error getting trackers list", err);
	});

	url = 'https://raw.githubusercontent.com/rebelwcause/Trackers/refs/heads/main/cname_trackers.json'
	fetch(url).then(async(response) => {
		// get json response here
		let data = await response.json();
		if (response.status === 200)
		{
			console.log("update_trackers: OK", response.status, url);
			//console.log(data)
			cname_trackers = data;
		}
		else
		{
			// Rest of status codes (400,500,303), can be handled here appropriately
			console.log("get_trackers: Error getting cname trackers list", response.status);
		}
	}).catch((err) => {
		console.log("get_trackers: Error getting cname trackers list", err);
	});

}

get_trackers();
