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
			"https://mediavisor.doubleclick.net"
		],
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
			"https://smetrics.babycenter.ca",
			"https://smetrics.cbc.ca",
			"https://smetrics.costco.ca",
			"https://smetrics.globalnews.ca",
		],
		"Dataunlocker": [
			"https://7mvmjg.www.emanualonline.com"
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
	}
};

// Function to check an url and set red/green result
async function check_url(url, div, parent)
{
	// Lets set up our `AbortController`, and create a request options object
	// that includes the controller's `signal` to pass to `fetch`.
	const controller = new AbortController();
	const config = {
		method: 'HEAD',
		mode: 'no-cors',
		signal: controller.signal
	};
	// Set a timeout limit for the request using `setTimeout`. If the body
	// of this timeout is reached before the request is completed, it will
	// be cancelled.
	const timeout = setTimeout(() => {
		controller.abort();
	}, 8000);

	var hostDiv = document.createElement("div");
	hostDiv.innerHTML = url;
	div.appendChild(hostDiv);
	await fetch(url, config, timeout, parent, div).then(response => {
			console.log(response);
			hostDiv.style.cssText = "background-color: #C70D2C; color: #FFF;";
		}) //Response was received --> ads are NOT blocked
		.catch(error => {
			console.log(error.message);
			hostDiv.style.cssText = "background-color: #BBFFBB;";
		}); //No response --> ads are blocked
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
			//Set log test
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
