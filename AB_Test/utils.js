"use strict";

/* jshint esversion: 9 */

const data = {
	"Ads": {
		"Google Ads": ["https://pagead2.googlesyndication.com",
			"https://adservice.google.com",
			"https://pagead2.googleadservices.com"],
		"Media.net": ["https://static.media.net",
			"https://media.net",
			"https://adservetx.media.net"],
		"Doubleclick.net": ["https://doubleclick.net",
			"https://ad.doubleclick.net",
			"https://static.doubleclick.net",
			"https://m.doubleclick.net",
			"https://mediavisor.doubleclick.net"],
		"Amazon": ["https://adtago.s3.amazonaws.com",
			"https://analyticsengine.s3.amazonaws.com",
			"https://advertising-api-eu.amazon.com",
			"https://amazonclix.com"],
		"Microsoft": ["https://acdn.adnxs.com",
			"https://acdn.adnxs-simple.com",
			"https://v.clarity.ms",
			"https://bat.bing.com"]
	},
	"Analytics": {
		"Google Analytics": ["https://google-analytics.com",
			"https://ssl.google-analytics.com"],
		"Hotjar": ["https://hotjar.com",
			"https://static.hotjar.com"],
		"MouseFlow": ["https://mouseflow.com"],
		"FreshMarketer": "https://freshmarketer.com",
		"Luckyorange": ["https://luckyorange.com",
			"https://cdn.luckyorange.com",
			"https://w1.luckyorange.com",
			"https://upload.luckyorange.net",
			"https://cs.luckyorange.net",
			"https://settings.luckyorange.net"],
		"Stats WP Plugin": ["https://stats.wp.com"]
	},
	"Error Trackers": {
		"Bugsnag": ["https://notify.bugsnag.com",
			"https://sessions.bugsnag.com",
			"https://api.bugsnag.com",
			"https://app.bugsnag.com"],
		"Sentry": ["https://browser.sentry-cdn.com",
			"https://app.getsentry.com"]
	},
	"CNAME Trackers": {
		"Adobe": [
			"https://swasc.homedepot.ca",
			"https://smetrics.cbc.ca",
			"https://smetrics.costco.ca",
			"https://smetrics.globalnews.ca",
		],
		"Dataunlocker": [
			"https://7mvmjg.www.emanualonline.com",
			"https://tutbc1.www.tapmyback.com"
		],
		"Acton": [
			"https://info.augustahealth.org",
			"https://marketing.tourismpg.com"
		]
	},
	"Social Trackers": {
		"Facebook": ["https://pixel.facebook.com",
			"https://ads.facebook.com",
			"https://an.facebook.com"],
		"Twitter": ["https://ads-api.twitter.com",
			"https://advertising.twitter.com"],
		"LinkedIn": ["https://ads.linkedin.com",
			"https://analytics.pointdrive.linkedin.com"],
		"Pinterest": ["https://ads.pinterest.com",
			"https://log.pinterest.com",
			"https://ads-dev.pinterest.com",
			"https://analytics.pinterest.com",
			"https://trk.pinterest.com",
			"https://widgets.pinterest.com"],
		"Reddit": ["https://ads.reddit.com",
			"https://d.reddit.com",
			"https://rereddit.com",
			"https://events.redditmedia.com"],
		"YouTube": ["https://ads.youtube.com"],
		"TikTok": ["https://analytics.tiktok.com",
			"https://ads.tiktok.com",
			"https://analytics-sg.tiktok.com",
			"https://ads-sg.tiktok.com"]
	},
	"Miscellaneous": {
		"Miscellaneous": [
			"https://www.googletagmanager.com",
			"https://ads.scorecardresearch.com",
			"https://gumgum.com",
			"https://tr.outbrain.com",
			"https://tags.crwdcntrl.net",
			"https://tlx.3lift.com",
			"https://pixel.rubiconproject.com",
			"https://js-sec.indexww.com",
			"https://ads.pubmatic.com",
			"https://sst.teamsimmer.com/gtm.js?id=GTM-M5WNG39",
			"https://sgtm.simoahava.com/gtm.js?id=GTM-PZ7GMV9",
			"https://gtm.bswhealth.com",
		]
	},
};

// Function to check an url and set red/green result
async function check_url(url, div, parent)
{
	// Lets set up our 'AbortController', and create a request options object
	// that includes the controller's 'signal' to pass to 'fetch'.
	// AbortController does not exist in older ff versions...
	let controller, sig;
	try {
		controller = new AbortController();
		sig = controller.signal;
	}
	catch(error) {
		//console.error(error);
	}

	let config = {
		method: 'HEAD',
		mode: 'no-cors',
		signal: sig
	};
	// Set a timeout limit for the request using 'setTimeout'. If the body
	// of this timeout is reached before the request is completed, it will be cancelled.
	let timeout = setTimeout(() => {
		try {
			controller.abort();
		}
		catch(error) {
			//console.error(error);
		}
	}, 8000);

	var hostDiv = document.createElement("div");
	hostDiv.innerHTML = url;
	div.appendChild(hostDiv);
	await fetch(url, config, timeout, parent, div).then(response => {
			console.log(response);
			hostDiv.style.cssText = "background-color: #C70D2C; color: #FFF;";
		}) // Response was received --> NOT Blocked
		.catch(error => {
			console.log(error.message);
			hostDiv.style.cssText = "background-color: #BBFFBB;";
		}); // No response --> Assume Blocked
}


// Function to fetch all the tests
async function fetchTests()
{
	const testingInfoLoading = document.getElementById("testingInfo");
	let fetches = [];
	for (let element in data)
	{
		var catEl = document.createElement("div");
		catEl.id = element;
		catEl.innerHTML = "<h3>" + "&nbsp;&nbsp;" + element + "</h3>";
		testingInfoLoading.appendChild(catEl);
		var category = data[element];
		for (let key in category)
		{
			var div = document.createElement('div');
			const dw = document.createElement('div');
			div.style.cssText = "padding-left: 20px;";
			dw.style.cssText = "padding-left: 20px;";
			div.id = key;
			div.innerHTML = "<span>" + key + "</span>";
			div.appendChild(dw);
			catEl.appendChild(div);
			if (category.hasOwnProperty(key))
			{
				var value = category[key];
				if (Array.isArray(value))
				{
					for (let i = 0; i < value.length; i++)
					{
						fetches.push(check_url(value[i], dw, div));
					}
				}
				else
					fetches.push(check_url(value, dw, div));
			}
		}
	}
}

window.addEventListener("load", (event) => {
	fetchTests().then((result) => {
		console.log("All tests completed");
	});
});
