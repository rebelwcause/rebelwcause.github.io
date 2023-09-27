/*
sortable.js

https://www.npmjs.com/package/sortable-tablesort
https://github.com/tofsjonas/sortable

https://www.cssscript.com/fast-html-table-sorting/

Modified by Tim Newby ...
Copyleft 2017 Jonas Earendel, Tim Newby
This is free and unencumbered software released into the public domain.

The sortable.js JavaScript library enables any static or dynamic HTML table to be sortable.
Blazing fast and simple to implement.

How to use it:
Import the JavaScript sortable.js into the HTML document.
		<script src="sortable.js"></script>

Add the CSS class sortable to your HTML table and the library will take care of the rest.
	Note that the HTML table MUST have thead and tbody elements.
		<table class="sortable">

Call the 'do_sortable()' fcn in javascript to setup 'click' event listeners
for table th elements. Done!!

Ignore certain table columns using the no-sort class.
	<table class="sortable">
		<thead>
		<tr>
			<th>Month</th>
			<th class="no-sort">Savings</th>
		</tr>
		</thead>
		...

You can also sort any data (like dates, file size) using the data-sort attribute:
	Using the data-sort attribute in tbody > td you can have one visible value and one sortable
	value. This is useful in case you have for instance sizes like kb, Mb, GB, or just really
	weird dates/other (feet, inches, stone, yards, miles, etc.).

	<table class="sortable">
		<thead>
			<tr>
				<th>Movie Name</th>
				<th>Size</th>
				<th>Release date</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Zack Snyder's Justice League</td>
				<td data-sort="943718400">900MB</td>
				<td data-sort="20210318">03/18/2021</td>
			</tr>
			<tr>
				<td>The Sound of Music</td>
				<td data-sort="1610612736">1.5GB</td>
				<td data-sort="19651209">12/09/1965</td>
			</tr>
		</tbody>
	</table>

Use the data-sortcol attribute to sort different columns.
	Using the data-sortcol attribute in thead > th, you can sort on a different column than the one
	that was clicked. For instance if you want to have colspans. Like so:

	<thead>
		<tr>
			<th></th>
			<th>Category</th>
			<th class="show_name">Show</th>
			<th colspan="2">Overall</th>
			<th colspan="2" data-sortcol="5">On Our Dates</th>
			<th data-sortcol="7">First Sold Out</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td class="tags">&nbsp;</td>
			<td class="category">Comedy</td>
			<td class="show_name">Show 1</td>
			<td class="ratio all" data-sort="72">18/25</td>
			<td class="pct all">72%</td>
			<td class="ratio ours" data-sort="75">3/4</td>
			<td class="pct ours">75%</td>
			<td>2022-07-30</td>
		</tr>
		...
	</tbody>

Alternative sorting
	If you click on a table header while holding shift or alt an alternative
	data-sortalt attribute will override data-sort.

	<table class="sortable">
		<thead>
			<tr>
				<th>Movie Name</th>
				<th>Size</th>
				<th>Release date</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Something</td>
				<td data-sortalt="c" data-sort="a">A</td>
				<td data-sortalt="b" data-sort="c">B</td>
				<td data-sortalt="a" data-sort="b">C</td>
			</tr>
			<tr>
				<td>Something else</td>
				<td data-sortalt="e" data-sort="f">D</td>
				<td data-sortalt="f" data-sort="e">E</td>
				<td data-sortalt="d" data-sort="d">F</td>
			</tr>
		</tbody>
	</table>

Ascending sort
	By adding asc to table or th element, the default sorting direction will be ascending instead of descending

	<table class="sortable asc">
		<thead>
		...
		</thead>
		<tbody>
		...
		</tbody>
	</table>

*/

"use strict";
/* jshint esversion: 6 */
/* jshint multistr: true */

// definition to keep js validator from complaining!
// https://jshint.com/

const table_class_name = "sortable";
const descending_th_class = "dir-d";
const ascending_th_class = "dir-u";

////////////////////////////////////////////////////////////////////
function add_sortable_style()
{
	// add css for sortable columns to document
	let css_style = ".sortable th { cursor: pointer; } \
	.sortable th.no-sort { pointer-events: none; } \
	.sortable th::after, .sortable th::before { transition: color 0.2s ease-in-out; font-size: 1.5em; color: transparent; } \
	.sortable th::after { margin-left: 6px; content: '▸'; } \
	.sortable th:hover::after { color: inherit; } \
	.sortable th.dir-d::after { color: inherit; content: '▾'; } \
	.sortable th.dir-u::after { color: inherit; content: '▴'; }";
	var head = document.head || document.getElementsByTagName("head")[0];
	var style = document.createElement("style");
	style.type = "text/css";
	style.appendChild(document.createTextNode(css_style));
	head.appendChild(style);
}

add_sortable_style();

// Function to setup sorting on all tables which have class 'table_class_name'
// Call this fcn after tables have been created...
function do_sortable()
{
	var tables = document.getElementsByClassName(table_class_name);
	for (var i = 0; i < tables.length; i++)
	{
		var ths = tables[i].getElementsByTagName("th");
		for (var j = 0; j < ths.length; j++)
		{
			ths[j].addEventListener("click", make_sortable);
		}
	}
}

// Function to reset sorting on all tables which have class 'table_class_name'
// Call this fcn to reset th column headers to no sort appearance
function refresh_sortables()
{
	var tables = document.getElementsByClassName(table_class_name);
	for (var i = 0; i < tables.length; i++)
	{
		var ths = tables[i].getElementsByTagName("th");
		for (var j = 0; j < ths.length; j++)
		{
			ths[j].classList.remove(descending_th_class);
			ths[j].classList.remove(ascending_th_class);
		}
	}
}

function make_sortable(e) // table th 'click' event handler
{
	const alt_sort = e.shiftKey || e.altKey;

	// allows for elements inside TH
	function findElementRecursive(element, tag)
	{
		// catch case where we clicked inside element with no parent 'tag'
		// ie. clicked inside tbody...
		if (null === element)
			return null;
		return element.nodeName === tag ? element : findElementRecursive(element.parentNode, tag);
	}

	function reClassify(element, dir)
	{
		element.classList.remove(descending_th_class);
		element.classList.remove(ascending_th_class);
		if (dir)
			element.classList.add(dir);
	}

	function getCellValue(element)
	{
		// The dataset read-only property of the HTMLElement interface provides read/write
		// access to custom data attributes (data-*) on elements.
		var value = (alt_sort && element.dataset.sortalt) || element.dataset.sort || element.textContent;
		return value;
	}

	var element = findElementRecursive(e.target, "TH");
	if (!element) // iff no parent 'th' element then abort!
		return;

	var tr = findElementRecursive(element, "TR");
	var table = findElementRecursive(tr, "TABLE");

	if (table.classList.contains(table_class_name))
	{
		const ascending_table_sort_class = "asc";
		var sort_col_index;
		var nodes = tr.cells;
		// Reset thead cells and get column index
		for (var i = 0; i < nodes.length; i++)
		{
			if (nodes[i] === element)
				sort_col_index = parseInt(element.dataset.sortcol) || i;
			else
				reClassify(nodes[i], "");
		}
		var dir = descending_th_class;
		// Check if we're sorting ascending or descending
		if (element.classList.contains(descending_th_class) ||
				(element.classList.contains(ascending_table_sort_class) &&
				!element.classList.contains(ascending_th_class)) ||
				(table.classList.contains(ascending_table_sort_class) &&
					!element.classList.contains(ascending_th_class)))
			dir = ascending_th_class;

		// Update the 'th' class accordingly
		reClassify(element, dir);
		var reverse = dir === ascending_th_class;

		// loop through all tbodies and sort them
		for (i = 0; i < table.tBodies.length; i++)
		{
			var org_tbody = table.tBodies[i];
			// Put the array rows in an array, so we can sort them...
			var rows = [].slice.call(org_tbody.rows, 0);

			// Sort them using Array.prototype.sort()
			rows.sort(function (a, b)
			{
				var x = getCellValue((reverse ? a : b).cells[sort_col_index]);
				var y = getCellValue((reverse ? b : a).cells[sort_col_index]);
				// parseFloat() picks the longest substring starting from the beginning that generates a
				// valid number literal. If it encounters an invalid character, it returns the number represented
				// up to that point, ignoring the invalid character and all characters following it.
				// If the argument's first character can't start a legal number literal per the syntax
				// above, parseFloat returns NaN.
				var temp = parseFloat(x) - parseFloat(y);
				var bool = isNaN(temp) ? x.localeCompare(y) : temp;
				return bool;
			});

			// Make an empty clone
			var clone_tbody = org_tbody.cloneNode();
			// Fill the clone with the sorted rows
			while (rows.length)
			{
				clone_tbody.appendChild(rows.splice(0, 1)[0]);
			}
			// And finally replace the unsorted table with the sorted one
			table.replaceChild(clone_tbody, org_tbody);
		}
	}
}
