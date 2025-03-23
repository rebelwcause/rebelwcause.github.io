/* jshint esversion: 8 */
function check_spoofing(theobject, theprop)
{
	// simple fcn to check for spoofing...
	if (!Object.getOwnPropertyDescriptor(theobject, theprop))
		return false; // not spoofed

	try {
		let gm = Object.getOwnPropertyDescriptor(theobject, theprop).get();
		if (gm.toString())
		{
			console.log("check_spoofing get spoof ", gm.toString());
			return true;
		}
	}
	catch (err)
	{
		// No get but could be value?
		console.log("check_spoofing No get but could be value?");
	}
	if (Object.getOwnPropertyDescriptor(theobject, theprop).value)
	{
		console.log("check_spoofing value spoof");
		return true;
	}

	return false;
}

function stringToHash(string) {
	let hash = 0;
	if (string.length == 0) return hash;
	for (i = 0; i < string.length; i++) {
		char = string.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return hash;
}

document.addEventListener('DOMContentLoaded', function() {
	(async() => {
		console.log("running fpCollect.generateFingerprint");
		const fingerprint = await fpCollect.generateFingerprint();
		const rowsFingerprint = [];
		const checksp = ["appCodeName", "appName", "appVersion",
			"buildID", "cookieEnabled", "doNotTrack",
			"globalPrivacyControl", "hardwareConcurrency", "language",
			"languages", "maxTouchPoints", "onLine", "oscpu", "pdfViewerEnabled",
			"platform", "product", "productSub", "userAgent", "vendor",
			"vendorSub", "webdriver"];
		rowsFingerprint.push('<tr><th>Attribute</th><th>Value</th><th>Comment</th><tr/>');
		Object.keys(fingerprint).forEach(function(key) {
			if (key === 'canvas')
			{
				rowsFingerprint.push('<tr><td>' + key + '</td><td><img src="' + fingerprint[key].image + '"></td><td></td><tr/>');
				rowsFingerprint.push('<tr><td>' + key + ' data hash </td><td>' + stringToHash(fingerprint[key].image) + '</td><td></td><tr/>');
			}
			else if (key === 'navigatorPrototype')
			{
				let arrayv = fingerprint[key];
				let result = "";
				for (let v in arrayv)
					result += arrayv[v] + "<br/>";
				rowsFingerprint.push('<tr><td>' + key + '</td><td>' + result + '</td><td></td><tr/>');
			}
			else
			{
				if (checksp.includes(key))
				{
					let psp = check_spoofing(navigator, key);
					let comment = psp ? "Spoofed?" : "OK";
					rowsFingerprint.push('<tr><td>' + key + '</td><td>' + JSON.stringify(fingerprint[key], null, 1) +
						'</td><td>' + comment + '</td><tr/>');
				}
				else
					rowsFingerprint.push('<tr><td>' + key + '</td><td>' + JSON.stringify(fingerprint[key], null, 1) +
						'</td><td></td><tr/>');
			}
		});
		document.getElementById('fp').innerHTML = rowsFingerprint.join('');
		console.log("Done fpCollect.generateFingerprint");


		const fpPromise = FingerprintJS.load();
		fpPromise.then(fp => fp.get()).then(result => {
			const visitorId = result.visitorId;
			console.log("fingerprintjs: ", visitorId);

			let rjson = JSON.stringify(result.components, null, 2);

			document.getElementById('fpInfo').innerHTML += "<br>fingerprintjs Fingerprint: " + visitorId + "<br>" + rjson;
		});

	})();
});
