TestCase("util", ["util", "base"], function (_, base) {
	return {
		"test _.remove first item from array": function ()
		{
			var a = [1, 2, 3];
			
			_.remove(a, function (val) {
				return val === 1;
			});
			
			assertSame("array is not correct length", 2, a.length);
			assertSame("array has incorrect item value", 2, a[0]);
			assertSame("array has incorrect item value", 3, a[1]);
		},
		
		"test _.remove last item from array": function ()
		{
			var a = [1, 2, 3];
			
			_.remove(a, function (val) {
				return val === 3;
			});
			
			assertSame("array is not correct length", 2, a.length);
			assertSame("array has incorrect item value", 1, a[0]);
			assertSame("array has incorrect item value", 2, a[1]);
		},
		
		"test _.remove middle item from array": function ()
		{
			var a = [1, 2, 3];
			
			_.remove(a, function (val) {
				return val === 2;
			});
			
			assertSame("array is not correct length", 2, a.length);
			assertSame("array has incorrect item value", 1, a[0]);
			assertSame("array has incorrect item value", 3, a[1]);
		},
		
		"test _.remove does nothing if item not found in array": function ()
		{
			var a = [1, 2, 3];
			
			_.remove(a, function (val) {
				return val === 4;
			});
			
			assertSame("array is not correct length", 3, a.length);
			assertSame("array has incorrect item value", 1, a[0]);
			assertSame("array has incorrect item value", 2, a[1]);
			assertSame("array has incorrect item value", 3, a[2]);
		},
		
		"test _.remove does nothing on empty array": function ()
		{
			var a = [];
			
			_.remove(a, function (val) {
				return val === 4;
			});
			
			assertSame("array is not correct length", 0, a.length);
		},
		
		"test _.remove item from object by value": function ()
		{
			var o = {
				one: 1,
				two: 2,
				three: 3
			};
			
			_.remove(o, function (val) {
				return val === 1;
			});
			
			assertSame("object has incorrect number of members", 2, _.size(o));
			assertUndefined("object has incorrect member", o.one);
			assertNumber("object has incorrect member", o.two);
			assertNumber("object has incorrect member", o.three);
		},
		
		"test _.remove item from object by key": function ()
		{
			var o = {
				one: 1,
				two: 2,
				three: 3
			};
			
			_.remove(o, function (val, key) {
				return key === "one";
			});
			
			assertSame("object has incorrect number of members", 2, _.size(o));
			assertUndefined("object has incorrect member", o.one);
			assertNumber("object has incorrect member", o.two);
			assertNumber("object has incorrect member", o.three);
		},
		
		"test _.remove does nothing if item not found in object": function ()
		{
			var o = {
				one: 1,
				two: 2,
				three: 3
			};
			
			_.remove(o, function (val, key) {
				return key === "four";
			});
			
			assertSame("object has incorrect number of members", 3, _.size(o));
			assertNumber("object has incorrect member", o.one);
			assertNumber("object has incorrect member", o.two);
			assertNumber("object has incorrect member", o.three);
		},
		
		"test _.remove does nothing on empty object": function ()
		{
			var o = {
			};
			
			_.remove(o, function (val, key) {
				return key === "four";
			});
			
			assertSame("object has incorrect number of members", 0, _.size(o));
		},
		
		"test _.remove by value": function ()
		{
			var a = [1, 2, 3];
			
			_.remove(a, 2);
			
			assertSame("array is not correct length", 2, a.length);
			assertSame("array has incorrect item value", 1, a[0]);
			assertSame("array has incorrect item value", 3, a[1]);
		},

		"test _.prototypes": function ()
		{
			/*var p = {};
			var f = function () {};
			f.prototype = p;

			var o = new f();*/


			var a = base.extend({});
			var b = a.extend({});
			var o = b.create();

			var chain = _.prototypes(o);
			
			assertArray("prototypes did not return an array", chain);
			assertSame("the number of prototypes in the chain is incorrect", 5, chain.length);
			assertSame("o is not in the prototype chain", o, chain[0]);
			assertSame("b is not in the prototype chain", b, chain[1]);
			assertSame("a is not in the prototype chain", a, chain[2]);
			assertSame("base is not in the prototype chain", base, chain[3]);
			assertSame("Object is not in the prototype chain", Object.prototype, chain[4]);
		},

		"test _.create dontEnum properties": function ()
		{
			var dontEnumMethods = [
		        "constructor",
		        "toString",
		        "valueOf",
		        "toLocaleString",
		        "prototype",
		        "isPrototypeOf",
		        "propertyIsEnumerable",
		        "hasOwnProperty",
		        "length",
		        "unique"
		    ];
			var o = {
		        "constructor": function () { return "0"},
		        "toString": function () { return "1"},
		        "valueOf": function () { return "2"},
		        "toLocaleString": function () { return "3"},
		        "prototype": function () { return "4"},
		        "isPrototypeOf": function () { return "5"},
		        "propertyIsEnumerable": function () { return "6"},
		        "hasOwnProperty": function () { return "7"},
		        "length": function () { return "8"},
		        "unique": function () { return "9"}
			};

			var obj = _.create(o)

			var result = [];

			for (var i = 0, length = dontEnumMethods.length; i < length; i += 1) {
				result.push(obj[dontEnumMethods[i]]());
			}

			assertSame("result does not work for all properties", "0123456789", result.join(""));
		}
	};
});