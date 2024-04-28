"use strict";

/* jshint esversion: 6 */

window.onload = function() {
	let ab_spy_test_element = document.getElementById("spy-script-div");
	ab_spy_test_element.setAttribute("data-expectedresult", "fail");
	ab_spy_test_element.textContent = "Target";
};
