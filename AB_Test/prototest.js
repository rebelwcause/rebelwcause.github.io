// code hacked from  https://abrahamjuliot.github.io/creepjs/tests/prototype.html
/* jshint esversion: 7 */
"use strict";
//var self, AnalyserNode, AudioBuffer, BaseAudioContext, Navigator, Screen;
//var WebGL2RenderingContext;

function replacer(key, value) {
	if (typeof value === "function") {
		try {
			return value.toString();
		}
		catch (err)
		{
			// happens on moms only with Proxy - getChannelData etc...
			console.log(err.message, key, value);
		}
	}
	return value;
}

const getEngine = () => {
	const mathPI = 3.141592653589793;
	const compute = n => mathPI ** -100 == +`1.9275814160560${n}e-50`;
	return { isChrome: compute(204), isFirefox: compute(185), isSafari: compute(206) };
};

// Lie Tests
// object constructor descriptor should return undefined properties
const getUndefinedValueLie = (obj, name) => {
	const objName = obj.name;
	const objNameUncapitalized = self[objName.charAt(0).toLowerCase() + objName.slice(1)];
	const hasInvalidValue = !!objNameUncapitalized && (
		typeof Object.getOwnPropertyDescriptor(objNameUncapitalized, name) != 'undefined' ||
		typeof Reflect.getOwnPropertyDescriptor(objNameUncapitalized, name) != 'undefined'
	);
	return hasInvalidValue;
};

// calling the interface prototype on the function should throw a TypeError
const getCallInterfaceTypeErrorLie = (apiFunction, proto) => {
	try {
		new apiFunction();
		apiFunction.call(proto);
		return true;
	} catch (error) {
		return error.constructor.name != 'TypeError';
	}
};

// applying the interface prototype on the function should throw a TypeError
const getApplyInterfaceTypeErrorLie = (apiFunction, proto) => {
	try {
		new apiFunction();
		apiFunction.apply(proto);
		return true;
	} catch (error) {
		return error.constructor.name != 'TypeError';
	}
};

// creating a new instance of the function should throw a TypeError
const getNewInstanceTypeErrorLie = apiFunction => {
	try {
		new apiFunction();
		return true;
	} catch (error) {
		return error.constructor.name != 'TypeError';
	}
};

// toString() and toString.toString() should return a native string in all frames
const getToStringLie = (apiFunction, name) => {
	/*
	Accepted strings:
	'function name() { [native code] }'
	'function name() {\n    [native code]\n}'
	'function get name() { [native code] }'
	'function get name() {\n    [native code]\n}'
	'function () { [native code] }'
	'function () {\n    [native code]\n}'
	*/
	let ToString, ToStringToString, apiFunctionToString, apiFunctionToStringToString;
	try {
		ToString = Function.prototype.toString.call(apiFunction);
	} catch (e) { }
	try {
		ToStringToString = Function.prototype.toString.call(apiFunction.toString);
	} catch (e) { }


	try { // only needed on moms - Proxy - getChannelData etc...
		apiFunctionToString = (ToString ? ToString : apiFunction.toString());
	} catch (e)
	{
		// happens on moms only with Proxy - getChannelData etc...
		console.log("getToStringLie", e.message, apiFunction, name, ToString, ToStringToString);
	}

	apiFunctionToStringToString = ( ToStringToString ? ToStringToString : apiFunction.toString.toString() );

	const trust = name => ({
		[`function ${name}() { [native code] }`]: true,
		[`function get ${name}() { [native code] }`]: true,
		[`function () { [native code] }`]: true,
		[`function ${name}() {${'\n'}    [native code]${'\n'}}`]: true,
		[`function get ${name}() {${'\n'}    [native code]${'\n'}}`]: true,
		[`function () {${'\n'}    [native code]${'\n'}}`]: true
	});

	return (
		!trust(name)[apiFunctionToString] ||
		!trust('toString')[apiFunctionToStringToString]
	);
};

// "prototype" in function should not exist
const getPrototypeInFunctionLie = apiFunction => 'prototype' in apiFunction;

// "arguments", "caller", "prototype", "toString"  should not exist in descriptor
const getDescriptorLie = apiFunction => {
	const hasInvalidDescriptor = (
		Object.getOwnPropertyDescriptor(apiFunction, 'arguments') ||
		Reflect.getOwnPropertyDescriptor(apiFunction, 'arguments') ||
		Object.getOwnPropertyDescriptor(apiFunction, 'caller') ||
		Reflect.getOwnPropertyDescriptor(apiFunction, 'caller') ||
		Object.getOwnPropertyDescriptor(apiFunction, 'prototype') ||
		Reflect.getOwnPropertyDescriptor(apiFunction, 'prototype') ||
		Object.getOwnPropertyDescriptor(apiFunction, 'toString') ||
		Reflect.getOwnPropertyDescriptor(apiFunction, 'toString')
	);
	return hasInvalidDescriptor;
};

// "arguments", "caller", "prototype", "toString" should not exist as own property
const getOwnPropertyLie = apiFunction => {
	const hasInvalidOwnProperty = (
		apiFunction.hasOwnProperty('arguments') || apiFunction.hasOwnProperty('caller') ||
		apiFunction.hasOwnProperty('prototype') || apiFunction.hasOwnProperty('toString')
	);
	return hasInvalidOwnProperty;
};

// descriptor keys should only contain "name" and "length" not "toString" !!!
const getDescriptorKeysLie = apiFunction => {
	const descriptorKeys = Object.keys(Object.getOwnPropertyDescriptors(apiFunction));
	const hasInvalidKeys = '' + descriptorKeys != 'length,name' && '' + descriptorKeys != 'name,length';
	return hasInvalidKeys;
};

// own property names should only contain "name" and "length" not "toString" !!!
const getOwnPropertyNamesLie = apiFunction => {
	const ownPropertyNames = Object.getOwnPropertyNames(apiFunction);
	const hasInvalidNames = !( '' + ownPropertyNames == 'length,name' || '' + ownPropertyNames == 'name,length' );
	return hasInvalidNames;
};

// own keys names should only contain "name" and "length" not "toString" !!!
const getOwnKeysLie = apiFunction => {
	const ownKeys = Reflect.ownKeys(apiFunction);
	const hasInvalidKeys = !( '' + ownKeys == 'length,name' || '' + ownKeys == 'name,length' );
	return hasInvalidKeys;
};

// setPrototypeOf error tests
const spawnError = (apiFunction, method) => {
	if (method == 'setPrototypeOf') {
		return Object.setPrototypeOf(apiFunction, Object.create(apiFunction)) + '';
	} else {
		apiFunction.__proto__ = apiFunction;
		return apiFunction++;
	}
};

const getChainCycleLie = ({ apiFunction, method = 'setPrototypeOf' }) => {
	const nativeProto = Object.getPrototypeOf(apiFunction);
	try {
		spawnError(apiFunction, method);
		return true; // failed to throw
	} catch (error) {
		const { isChrome, isFirefox } = getEngine();
		const { name, message, stack } = error;
		const targetStackLine = ((stack || '').split('\n') || [])[1];
		const hasTypeError = name == 'TypeError';
		const chromeLie = isChrome && (
			message != `Cyclic __proto__ value` || (
				method == '__proto__' && (
					!targetStackLine.startsWith(`    at Function.set __proto__ [as __proto__]`) &&
					!targetStackLine.startsWith(`    at set __proto__ [as __proto__]`) // Chrome 102
				)
			)
		);
		const firefoxLie = isFirefox && (
			message != `can't set prototype: it would cause a prototype chain cycle`
		);
		if (!hasTypeError || chromeLie || firefoxLie) {
			return true; // failed Error
		}
	} finally {
		try { // can also error - just ignore
			Object.setPrototypeOf(apiFunction, nativeProto); // restore
		} catch (error) {}
	}
};

// API Function Test
const getLies = ({ apiFunction, proto, obj = null, lieProps }) => {
	if (typeof apiFunction != 'function') {
		return { lied: false, lieTypes: [] };
	}
	const name = apiFunction.name.replace(/get\s/, '');

	let lies = {
		// custom lie string names
		//["failed illegal error"]: obj ? getIllegalTypeErrorLie(obj, name) : false,
		["failed undefined properties"]: obj ? getUndefinedValueLie(obj, name) : false,
		["failed call interface error"]: getCallInterfaceTypeErrorLie(apiFunction, proto),
		["failed apply interface error"]: getApplyInterfaceTypeErrorLie(apiFunction, proto),
		["failed new instance error"]: getNewInstanceTypeErrorLie(apiFunction),
		//["failed class extends error"]: getClassExtendsTypeErrorLie(apiFunction),
		//["failed null conversion error"]: getNullConversionTypeErrorLie(apiFunction),
		["failed toString"]: getToStringLie(apiFunction, name),
		["failed 'prototype' in function"]: getPrototypeInFunctionLie(apiFunction),
		["failed descriptor"]: getDescriptorLie(apiFunction),
		["failed own property"]: getOwnPropertyLie(apiFunction),
		["failed descriptor keys"]: getDescriptorKeysLie(apiFunction),
		["failed own property names"]: getOwnPropertyNamesLie(apiFunction),
		["failed own keys names"]: getOwnKeysLie(apiFunction),
		//["failed object toString error"]: getNewObjectToStringTypeErrorLie(apiFunction),
		//// Proxy Detection
		//["failed at incompatible proxy error"]: getIncompatibleProxyTypeErrorLie(apiFunction),
		//["failed at toString incompatible proxy error"]: getToStringIncompatibleProxyTypeErrorLie(apiFunction),
		["failed at too much recursion error"]: getChainCycleLie({ apiFunction })
	};
	//// conditionally use advanced detection
	//const detectProxies = (
		//name == 'toString' || !!lieProps['Function.toString']
	//)
	//// TODO: commented for moms
	////if (detectProxies) {
		////lies = {
			////...lies,
			////// Advanced Proxy Detection
			////["failed at too much recursion __proto__ error"]: getChainCycleLie({ apiFunction, method: '__proto__' }),
			////["failed at chain cycle error"]: getTooMuchRecursionLie({ apiFunction }),
			////["failed at chain cycle __proto__ error"]: getTooMuchRecursionLie({ apiFunction, method: '__proto__' }),
			////["failed at reflect set proto"]: getReflectSetProtoLie({ apiFunction, randomId }),
			////["failed at reflect set proto proxy"]: getReflectSetProtoProxyLie({ apiFunction, randomId }),
			////["failed at instanceof check error"]: getInstanceofCheckLie(apiFunction),
			////["failed at define properties"]: getDefinePropertiesLie(apiFunction)
		////}
	////}
	const lieTypes = Object.keys(lies).filter(key => !!lies[key]);
	return { lied: lieTypes.length, lieTypes };
};

function check_proto(proto, name, props, apiName, obj)
{
	try {
		try {
			const apiFunction = proto[name]; // may trigger TypeError
			const stype = typeof apiFunction;
			if (stype == 'function')
			{
				let res = getLies({ apiFunction: proto[name], proto, lieProps: props });
				// returns { lied: lieTypes.length, lieTypes }
				if (res.lied) {
					return (props[apiName] = {lieTypes: res.lieTypes,
						FunctionInfo: Object.getOwnPropertyDescriptor(proto, name),
						PropertyDescriptors: Object.getOwnPropertyDescriptors(proto[name])});
				}
				return (props[apiName] = {lieTypes: undefined,
					FunctionInfo: Object.getOwnPropertyDescriptor(proto, name),
					PropertyDescriptors: Object.getOwnPropertyDescriptors(proto[name])});
			}

			// since there is no TypeError and the typeof is not a function,
			// search getter function and handle invalid values and ingnore name, length, and constants
			if ( name != 'name' && name != 'length' && name[0] !== name[0].toUpperCase())
			{
				// search getter function
				const getterFunction = Object.getOwnPropertyDescriptor(proto, name).get;
				if (getterFunction)
				{
					let res = getLies({ apiFunction: getterFunction, proto, obj, }); // send the obj for special tests
					if (res.lied) {
						return (props[apiName] = {lieTypes: res.lieTypes,
							FunctionInfo: Object.getOwnPropertyDescriptor(proto, name),
							PropertyDescriptors: Object.getOwnPropertyDescriptors(getterFunction)});
					}
				}

				const lie = ["failed descriptor.value undefined"];
				try {
					let pfcn = Object.getOwnPropertyDescriptor(proto, name);
					let pDescriptors;
					if (pfcn)
						pDescriptors = Object.getOwnPropertyDescriptors(proto[name]);
					return (props[apiName] = {lieTypes: lie,
						FunctionInfo: pfcn,
						PropertyDescriptors: pDescriptors});
				}
				catch (erra)
				{
					console.log("erra", erra.message);
				}
			}
			else
			{
				// undefined, number...
				//console.log("UNHANDLED", stype, name);
			}
		}
		catch (err2)
		{
			// TypeError: 'get appName' called on an object that does not implement interface Navigator.
			//console.log("ERROR", err2.message);
		}
		// else search getter function
		const getterFunction = Object.getOwnPropertyDescriptor(proto, name).get;
		if (getterFunction)
		{
			let res = getLies({ apiFunction: getterFunction, proto, obj, }); // send the obj for special tests
			if (res.lied) {
				return (props[apiName] = {lieTypes: res.lieTypes, FunctionInfo: getterFunction,
					PropertyDescriptors: Object.getOwnPropertyDescriptors(getterFunction)});
			}
			return (props[apiName] = {lieTypes: undefined, FunctionInfo: getterFunction,
					PropertyDescriptors: Object.getOwnPropertyDescriptors(getterFunction)});
		}
		else
		{
			//console.log("NO getterFunction", name);
		}
	}
	catch (error)
	{
		const lie = ["failed prototype test execution"];
		return (props[apiName] = {lieTypes: lie, FunctionInfo: undefined,
			PropertyDescriptors: undefined});
	}
}

function check_single_proto(obj, name)
{
	const props = {}; // lie list and detail
	const proto = obj.prototype ? obj.prototype : obj;
	const objectNameString = /\s(.+)\]/;
	const apiName = `${
		obj.name ? obj.name : objectNameString.test(obj) ? objectNameString.exec(obj)[1] : undefined
		}.${name}`;
	//console.log("apiName", apiName);

	check_proto(proto, name, props, apiName, obj);
	return props;
}

function check_many_protos(objects)
{
	const props = {}; // lie list and detail
	let propsSearched = []; // list of properties searched

	for (let obj of objects)
	{
		const proto = obj.prototype ? obj.prototype : obj;

		const interfaceObject = !!obj.prototype ? obj.prototype : obj;
		let navarray = Object.getOwnPropertyNames(interfaceObject);
		//console.log(navarray);

		for (let name of navarray)
		{
			if ('constructor' === name || 'onmouseenter' === name || 'onmouseleave' === name)
				continue;

			const objectNameString = /\s(.+)\]/;
			const apiName = `${
				obj.name ? obj.name : objectNameString.test(obj) ? objectNameString.exec(obj)[1] : undefined
				}.${name}`;
			//console.log("apiName", apiName);
			propsSearched.push(apiName);
			check_proto(proto, name, props, apiName, obj);
		}
	}
	return {props: props, propsSearched: propsSearched};
}
