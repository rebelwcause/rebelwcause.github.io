/*
filtable.js
Code for simple table filtering based on search input...
*/

"use strict";
/* jshint esversion: 6 */
/* jshint multistr: true */

// definition to keep js validator from complaining!
// https://jshint.com/

/*
Call function with search input and table to be filtered
table MUST have one tbody element containing all rows...

	// Example Setup
	do_filter(document.getElementById("requests_sb"), document.getElementById("requeststable"));
	do_filter(document.getElementById("hosts_sb"), document.getElementById("hoststable"));
	do_filter(document.getElementById("domains_sb"), document.getElementById("domainstable"));
	do_filter(document.getElementById("cookies_sb"), document.getElementById("cookiestable"));
*/
function do_filter(input, table)
{
	// we store 2 custom params in input element - ftable and ftimeout
	input.ftable = table;
	input.addEventListener("keyup", filtertable);
}

function filtertable(evt)
{
	// Cancel any existing timeout
	if (evt.target.ftimeout)
		clearTimeout(evt.target.ftimeout);
	// Setup new timeout fcn
	evt.target.ftimeout = setTimeout(() => {
		//console.time("filtable");

		// get filter word
		var searchWord = evt.target.value.toUpperCase();

		// get table body and then rows in body, then loop over rows
		// and create text string...
		var tBody = evt.target.ftable.getElementsByTagName('tbody')[0];

		// Temporarily remove tbody from DOM - speeds things up alot for large table!
		var tbodyparent = tBody.parentElement;
		tBody = tbodyparent.removeChild(tBody);

		var tableRows = tBody.getElementsByTagName('tr');
		for (var k = 0; k < tableRows.length; k++)
		{
			var row = tableRows[k];
			var allText = "";
			for (var j = 0; j < row.cells.length; j++)
			{
				allText += row.cells[j].innerText + " ";
			}

			var stxt = "";
			if (-1 === allText.toUpperCase().indexOf(searchWord))
				stxt = "none";
			row.style.display = stxt;
		}
		// Add tbody back and reset timer var
		tbodyparent.appendChild(tBody);
		evt.target.ftimeout = undefined;

		//console.timeEnd("filtable");
	}, 300);
}
