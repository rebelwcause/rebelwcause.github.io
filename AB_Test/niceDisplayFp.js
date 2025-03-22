document.addEventListener('DOMContentLoaded', function() {
	(async() => {
		await new Promise(r => setTimeout(r, 2000));
		console.log("running fpCollect.generateFingerprint");
		const fingerprint = await fpCollect.generateFingerprint();
		const rowsFingerprint = [];
		rowsFingerprint.push('<tr><th>Attribute</th><th>Value</th><tr/>');
		Object.keys(fingerprint).forEach(function(key) {
			if (key === 'canvas')
				rowsFingerprint.push('<tr><td>' + key + '</td><td ><img src="' + fingerprint[key].image + '"></td><tr/>');
			else if (key === 'navigatorPrototype')
			{
				let arrayv = fingerprint[key];
				let result = ""
				for (v in arrayv)
					result += arrayv[v] + "<br/>"
				rowsFingerprint.push('<tr><td>' + key + '</td><td>' + result + '</td><tr/>');
				//rowsFingerprint.push('<tr><td>' + key + '</td><td>' + JSON.stringify(fingerprint[key], null, 4) + '</td><tr/>');
			}
			else
				rowsFingerprint.push('<tr><td>' + key + '</td><td>' + JSON.stringify(fingerprint[key], null, 1) + '</td><tr/>');
		});
		document.getElementById('fp').innerHTML = rowsFingerprint.join('');
		console.log("Done fpCollect.generateFingerprint");
	})();
});
