/* jshint esversion: 8 */
// uncomment for jshint.com
//var Navigator, Screen, fpCollect, FingerprintJS;


function is_spoofed(ptype, prop)
{
	let result = check_single_proto(Navigator, prop);
	result = Object.values(result)[0];
	if (result.lieTypes && (result.lieTypes.length > 0))
	{
		let info = JSON.stringify(result.lieTypes, null, 2);
		return {val: true, reason: info};
	}
	return {val: false, reason: "???"};
}

function stringToHash(string) {
	let hash = 0;
	if (string.length == 0) return hash;
	for (let i = 0; i < string.length; i++) {
		let char = string.charCodeAt(i);
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
		const checksp = ["appCodeName", "appName", "appVersion", "buildID", "clipboard", "cookieEnabled", "credentials",
			"doNotTrack", "globalPrivacyControl", "hardwareConcurrency", "language", "languages", "locks", "maxTouchPoints",
			"mediaCapabilities", "mediaDevices", "mediaSession", "mimeTypes", "onLine", "oscpu", "pdfViewerEnabled",
			"permissions", "platform", "plugins", "product", "productSub", "serviceWorker", "storage", "userActivation",
			"userAgent", "vendor", "vendorSub", "wakeLock", "webdriver"];
		rowsFingerprint.push('<tr><th>Attribute</th><th>Value</th><th>Comment</th></tr>');
		Object.keys(fingerprint).forEach(function(key) {
			if (key === 'canvas')
			{
				rowsFingerprint.push('<tr style="outline: thin solid #dddddd"><td>' + key + '</td><td><img src="' + fingerprint[key].image + '"></td><td></td></tr>');
				rowsFingerprint.push('<tr style="outline: thin solid #dddddd"><td>' + key + ' data hash </td><td>' + stringToHash(fingerprint[key].image) + '</td><td></td></tr>');
			}
			else if (key === 'navigatorPrototype')
			{
				let arrayv = fingerprint[key];
				let result = "";
				for (let v in arrayv)
					result += arrayv[v] + "<br/>";
				rowsFingerprint.push('<tr style="outline: thin solid #dddddd" ><td>' + key + '</td><td>' + result + '</td><td></td></tr>');
			}
			else
			{
				if (checksp.includes(key))
				{
					let result = is_spoofed(navigator, key);
					let comment = result.val ? "Spoofed? " + result.reason : "OK";
					rowsFingerprint.push('<tr style="outline: thin solid #dddddd"><td>' + key + '</td><td>' + JSON.stringify(fingerprint[key], null, 1) +
						'</td><td>' + comment + '</td></tr>');
				}
				else
					rowsFingerprint.push('<tr style="outline: thin solid #dddddd"><td>' + key + '</td><td>' + JSON.stringify(fingerprint[key], null, 1) +
						'</td><td></td></tr>');
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

		// TODO
		// Multiple proto tests
		let objects = [AnalyserNode, AudioBuffer, BaseAudioContext, CanvasRenderingContext2D, HTMLCanvasElement,
			HTMLElement, Navigator, Screen, WebGLRenderingContext, WebGL2RenderingContext, Window];

		let results = check_many_protos(objects);
		let liedapis = 0;
		let liecount = 0;
		for (let item in results.props)
		{
			let value = results.props[item];
			if (undefined !== value.lieTypes)
			{
				liedapis++;
				liecount += value.lieTypes.length;
			}
		}
		for (let item in results.props)
		{
			let value = results.props[item];
			if (undefined == value.lieTypes)
				delete results.props[item];
		}

		let iel = document.getElementById("tamperInfo");
		iel.innerText += "Total Lies: " + liecount;
		iel.innerText += ", Total Lying API fcns: " + liedapis;
		iel.innerText += ", Total Checks: " + results.propsSearched.length + "\n";
		//iel.innerText += JSON.stringify(results.props, replacer, 2);

		let text = ""
		for (let item in results.props)
		{
			let value = results.props[item];
			text += "\n" + item + "\n";
			if (undefined !== value.lieTypes)
				text += "\tlieTypes: " + JSON.stringify(value.lieTypes) + "\n";
			if (undefined !== value.FunctionInfo)
			{
				if (typeof value.FunctionInfo === 'object')
				{
					text += "\tFunctionInfo: " + "\n";
					for (let val in value.FunctionInfo)
					{
						text += "\t\t" + val + ": " + JSON.stringify(value.FunctionInfo[val], replacer) + "\n";
					}
				}
				else
				{
					console.log("typeof value.FunctionInfo", typeof value.FunctionInfo);
					text += "\tFunctionInfo: " + JSON.stringify(value.FunctionInfo, replacer, 2) + "\n";
				}
			}
			if (undefined !== value.PropertyDescriptors)
			{
				text += "\tPropertyDescriptors: " + "\n";
				for (let val in value.PropertyDescriptors)
				{
					text += "\t\t" + val + ": " + JSON.stringify(value.PropertyDescriptors[val]) + "\n";
				}
			}
		}
		iel.innerText += text;

	})();
});
