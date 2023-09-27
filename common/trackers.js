// Script for harview.html

"use strict";

/* jshint esversion: 6 */
/* jshint sub:true */
// Just to shut jsHint up (https://jshint.com/)
// let trackers;

// google-analytics.com Google: Email, FingerprintingGeneral, Disconnect, Analytics
let g_trackers = {
	"2mdn.net": "Advertising, Analytics",
	"aaxads.com": "Acceptable Ads Exchange: Advertising",
	"abtasty.com": "AB Tasty: Tracker, Analytics, Session Replay",
	"addtoany.com": "AddToAny: Tracker, Advertising",
	"adentifi.com": "AdTheorent: Tracker, Advertising",
	"ad.gt": "Audigent: Advertising, Analytics",
	"adlightning.com": "Ad Lightning: Tracker, Advertising",
	"admanmedia.com": "Tracker",
	"admantx.com": "ADmantX: Tracker",
	"admixer.net": "Admixer Technologies: Tracker, Advertising, Analytics",
	"adobedtm.com": "Adobe: Tracker, Analytics",
	"adrizer.com": "Adrizer: Tracker, Analytics",
	"adthrive.com": "AdThrive: Tracker, Advertising, Analytics",
	"advangelists.com": "Mobiquity: Advertising, Analytics",
	"a-mo.net": "Monet Engine: Tracker, Advertising",
	"ampproject.org": "Google: Advertising",
	"appdynamics.com": "Cisco: Tracker, Analytics",
	"avct.cloud": "Avocet Systems: Tracker, Advertising, Analytics",
	"bfmio.com": "Beachfront Media: Advertising, Analytics",
	"blismedia.com": "Blis Global: Tracker, Advertising, Analytics",
	"btloader.com": "Blockthrough: Advertising",
	"certona.net": "Kibo Software: Tracker, Advertising, Analytics",
	"chocolateplatform.com": "Vdopia: Advertising",
	"clickagy.com": "Clickagy: Tracker, Advertising, Analytics",
	"clickcertain.com": "ClickCertain: Tracker, Advertising, Analytics",
	"clicktale.net": "Session Replay",
	"cloudflareinsights.com": "Cloudflare: Analytics",
	"cognitivlabs.com": "Cognitiv: Tracker, Advertising, Analytics",
	"colossusssp.com": "Colossus Media: Tracker, Advertising, Analytics",
	"condenastdigital.com": "Conde Nast Publications: Tracker",
	"conductrics.com": "Conductrics: Advertising, Analytics",
	"contentsquare.net": "ContentSquare: Tracker, Session Replay, Analytics",
	"crazyegg.com": "Tracker, Session Replay",
	"ctnsnet.com": "Crimtan Holdings: Tracker, Advertising, Analytics",
	"dnacdn.net": "Criteo: Tracker, Advertising, Analytics",
	"dotmetrics.net": "Dotmetrics: Tracker, Advertising, Analytics",
	"evidon.com": "Crownpeak: Tracker, Analytics",
	"e-volution.ai": "Evolution Technologies: Advertising, Analytics",
	"exponential.com": "Tracker, Session Replay",
	"ezodn.com": "Ezoic: Tracker, Advertising, Analytics",
	"ezoic.net": "Ezoic: Tracker, Session Replay",
	"facebook.com": "Social, Advertising",
	"facebook.net": "Social, Advertising",
	"fastly.net": "Fastly: Tracker, Session Replay, Advertising, Analytics",
	"fiftyt.com": "Fifty Technology: Tracker, Advertising, Analytics",
	"foresee.com": "Tracker, Session Replay",
	"fullstory.com": "Tracker, Session Replay",
	"gammaplatform.com": "???: Advertising, Analytics",
	"google-analytics.com": "Analytics",
	"googleoptimize.com": "Google: Advertising, Analytics",
	"googletagmanager.com": "Google: Tracker, Analytics",
	"heapanalytics.com": "Heap: Tracker, Session Replay, Analytics",
	"hellobar.com": "Crazy Egg: Tracker, Session Replay, Advertising, Analytics",
	"hotjar.com": "Session Replay",
	"hsadspixel.net": "HubSpot: Tracker, Advertising, Analytics",
	"igodigital.com": "Salesforce: Advertising, Analytics",
	"indexww.com": "Tracker",
	"inspectlet.com": "Tracker, Session Replay",
	"intentiq.com": " Intent IQ: Advertising, Analytics",
	"iteratehq.com": "Pickaxe: Advertising, Analytics",
	"loopme.me": "LoopMe: Tracker, Advertising, Analytics",
	"lytics.io": "Lytics: Tracker, Advertising, Analytics",
	"medallia.ca": "Tracker, Advertising, Analytics",
	"mediago.io": "MediaGo: Advertising, Analytics",
	"mediavine.com": "Mediavine: Tracker, Advertising, Analytics",
	"minutemedia-prebid.com": "Minute Media: Advertising, Analytics",
	"mixpanel.com": "Tracker, Session Replay",
	"ml314.com": "Tracker, Session Replay",
	"mouseflow.com": "Tracker, Session Replay",
	"mrtnsvr.com": "???: Advertising, Analytics",
	"mxpnl.com": "Tracker, Session Replay",
	"nrich.ai": "N.Rich Technologies: Advertising, Analytics",
	"onesignal.com": "OneSignal: Tracker, Advertising, Analytics",
	"onetag-sys.com": "OneTag: Advertising, Analytics",
	"perfectmarket.com": "Tracker, Session Replay",
	"permutive.app": "Permutive: Advertising, Analytics",
	"permutive.com": "Tracker, Session Replay",
	"piano.io": "Piano Software: Advertising, Analytics",
	"playground.xyz": "PLAYGROUND XYZ: Tracker, Advertising, Analytics",
	"prebid.org": "Prebid.org: Advertising, Analytics",
	"privacymanager.io": "LiveRamp: Tracker, Advertising, Analytics",
	"prmutv.co": "Permutive: Advertising, Analytics",
	"proper.io": "Proper Media: Advertising, Analytics",
	"qualaroo.com": "Tracker, Session Replay",
	"qualtrics.com": "Qualtrics: Tracker, Session Replay, Advertising, Analytics",
	"rtactivate.com": "???: Advertising, Analytics",
	"sail-personalize.com": "CM Group: Advertising, Analytics",
	"servenobid.com": "Prebid.org: Advertising, Analytics",
	"sessioncam.com": "Tracker, Session Replay",
	"smaato.net": "Tracker, Analytics",
	"smadex.com": "Entravision: Advertising, Analytics",
	"socdm.com": "Tracker, Analytics",
	"speedcurve.com": "SpeedCurve: Tracker, Analytics",
	"sportradarserving.com": "Sportradar: Advertising, Analytics",
	"srvsynd.com": "???: Advertising, Analytics",
	"taplytics.com": "Taplytics: Advertising, Analytics",
	"taptapnetworks.com": "Taptap: Advertising, Analytics",
	"tealiumiq.com": "Tracker, Session Replay",
	"thrtle.com": "Throtle: Tracker, Advertising, Analytics",
	"tiktok.com": "Analytics",
	"tinypass.com": "Piano Software: Advertising, Analytics",
	"tiqcdn.com": "Tealium: Tracker, Advertising, Analytics",
	"trackonomics.net": "Trackonomics: Advertising, Analytics",
	"truffle.bid": "Truffles: Advertising, Analytics",
	"twitter.com": "Social, Advertising",
	"urbanairship.com": "Airship: Tracker, Advertising, Analytics",
	"uuidksinc.net": "???: Advertising, Analytics",
	"viafoura.co": "Viafoura: Tracker",
	"viafoura.net": "Viafoura: Tracker",
	"visualwebsiteoptimizer.com": "Tracker, Session Replay",
	"webvisor.org": "Yandex: Tracker, Session Replay",
	"yandex.net": "Yandex: Tracker, Session Replay",
	"yandex.ru": "Tracker, Session Replay",
	"zqtk.net": "comScore: Tracker"
};

////////////////////////////////////////////////////////////////////
function parse_trackers()
{
	// parse disconnect services.json file and build our own list

	let dc = {};
	let categories = trackers.categories;
	for (let category in categories)
	{
		//console.log(category);
		var arr = categories[category];
		for (var i = 0; i < arr.length; i++)
		{
			var obj = arr[i];
			//console.log(obj);
			for (let iname in obj)
			{
				let item = obj[iname];
				//console.log(iname);
				for (let name in item)
				{
					//console.log("	", name);
					var arrd = item[name];
					// check if this is a string and iff so bail!!!
					// can be entry for 'session-replay', 'performance', etc...
					if (typeof arrd === "string")
					{
						//console.log("Skipping", name, arrd);
						break;
					}

					for (var k = 0; k < arrd.length; k++)
					{
						let handled = false;
						var domain = arrd[k];
						// DEBUG code
						//if (domain.includes("/"))
						//	console.log("DOMAIN INCLUDES /", domain);
						//if (domain.endsWith(".com") || domain.endsWith(".net") || domain.endsWith(".org")
						//		|| domain.endsWith(".ca"))
						//	continue;

						let parts = domain.split(".");
						if (parts.length > 3)
							console.log("	UNEXPECTED DOMAIN??", domain); // TODO: This does happen!!
						if (parts.length === 3)
						{
							// condense so adservice.google.com, blah.google.com
							// are all under google.com
							//console.log("	", domain);
							if (parts[1].length > 3) // we assume iff longer than 3 chars then we condense
							{
								//console.log("	", domain);
								let domain = parts[1] + "." + parts[2];
								let d = dc[domain];
								if (undefined == d)
								{
									dc[domain] = iname + ": " + category;
									//console.log("ADDED NEW", domain);
								}
								else
								{
									let existing = dc[domain];
									if (!existing.includes(category))
									{
										dc[domain] = dc[domain] + ", " + category;
										//console.log("APPENDED", domain, dc[domain]);
									}
								}
								handled = true;
							}
						}
						if (!handled)
						{
							let d = dc[domain];
							if (undefined == d)
							{
								dc[domain] = iname + ": " + category;
							}
							else
							{
								let existing = dc[domain];
								if (!existing.includes(category))
								{
									dc[domain] = dc[domain] + ", " + category;
								}
							}
						}
					}
				}
			}
		}
	}
	//console.log(dc);
	// if not already in dc then add otherwise ignore!!!
	for (let host in g_trackers)
	{
		let d = dc[host];
		if (undefined === d)
		{
			dc[host] = g_trackers[host];
			//console.log("trackers.js added new host: ", host, "'" + dc[host] + "'");
		}
		else
		{
			let cat = g_trackers[host];
			if (!d.includes(cat))
			{
				dc[host] = dc[host] + ", " + cat;
				//console.log("trackers.js added new info: ", host, "'" + dc[host] + "'", "'" + cat + "'");
			}
		}
	}
	g_trackers = dc;
	//console.log(g_trackers);
	//console.log("Disconnect trackers: ", Object.keys(g_trackers).length);

}

parse_trackers();
