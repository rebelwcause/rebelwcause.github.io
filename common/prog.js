/* jshint esversion: 6 */
/* jshint multistr: true */
"use strict";

var Progress = class {
	constructor()
	{
		this.visible = false;

		this.prog = document.createElement("div");
		this.prog.style.cssText = "padding: 6px; display: none; position: absolute; \
			background-color: rgba(240,240,240,0.75); width: 250px; \
			box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.4); border-radius: 10px; z-index: 10;";

		this.bar = document.createElement("div");
		this.bar.textContent = "Please Wait...";
		this.bar.style.cssText = "top: 15px; height: 30px; padding: 10px; background-color: #4499EE; \
			color: #FFFFFF; border-radius: 5px; font-size: 28px;";

		this.prog.appendChild(this.bar);

		// add to top level of DOM so on top of everything!
		document.body.appendChild(this.prog);
	}

	show(bshow)
	{
		if (bshow)
		{
			//console.log("showing progress");
			this.visible = true;
			this.prog.style.display = "block";
			this.prog.style.left = (window.innerWidth - this.prog.clientWidth) / 2 + "px";
			this.prog.style.top = (window.innerHeight - this.prog.clientHeight) / 2 + "px";
		}
		else
		{
			//console.log("hiding progress");
			this.visible = false;
			this.prog.style.display = "none";
		}
	}

};
