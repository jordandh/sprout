TestCase("collection", ["sprout/util", "sprout/collection", "sprout/model"], function (_, collection, model) {
	var animal = model.extend({
		attributes: {
			name: {},
			age: {}
		}
	});
	
	var animals = collection.extend({
		model: animal
	});
	
	var zoo = model.extend({
		attributes: {
			name: {},
			location: {},
			animals: {
				collection: animals
			}
		}
	});

	var foobar = model.extend({
		rootUrl: "foobars"
	});

	var foobars = collection.extend({
		rootUrl: "foobars",
		model: foobar
	});

	var sparseCollection = collection.extend({
		sparse: true
	});

	var indexCollection = collection.extend({
		index: 'index'
	});
	
	return {
		"test collection has underscore methods": function ()
		{
			var methods = ["forEach", "each", "map", "reduce", "reduceRight", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains",
						   "invoke", "max", "min", "sortBy", "sortedIndex", "toArray", "size", "first", "initial", "rest", "last", "without", "indexOf", "shuffle", "lastIndexOf",
						   "isEmpty", "groupBy", "uniq", "unique"];
			
			expectAsserts(methods.length);
			
			_.each(methods, function (methodName) {
				assertFunction(methodName + " is not a method on the collection object", collection[methodName]);
			});
		},
		
		"test collection.create": function ()
		{
			var col = animals.create([{
					name: "Spot",
					age: 8
				}, {
					name: "Stripe",
					age: 10
				}
			]);
			
			assert("collection is not a prototype of animals", collection.isPrototypeOf(col));
			assertSame("collection count is incorrect.", 2, col.get("count"));
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Stripe", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 10, col.get("1.age"));
		},
		
		"test collection.count": function ()
		{
			var col = animals.create([{
					name: "Spot",
					age: 8
				}, {
					name: "Stripe",
					age: 10
				}
			]);
			
			assertSame("collection count is incorrect.", 2, col.get("count"));
		},

		"test collection.empty": function ()
		{
			var col = animals.create();

			assert("collection is not empty.", col.get("empty"));
			
			col.add([{
					name: "Spot",
					age: 8
				}, {
					name: "Stripe",
					age: 10
				}
			]);

			assertFalse("collection is empty.", col.get("empty"));

			col.reset();

			assert("collection is not empty.", col.get("empty"));
		},
		
		"test collection.at": function ()
		{
			var col = animals.create();
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			
			col.add([cat, dog]);
			
			assertSame("cat item from collection is not same as item added to collection.", cat, col.at(0));
			assertSame("dog item from collection is not same as item added to collection.", dog, col.at(1));
			assertUndefined("out of bounds item from collection is not undefined.", col.at(2));
		},
		
		"test collection.add single model": function ()
		{
			var error;

			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			var mod = animal.create({
				name: "Spot",
				age: 8
			});

			col.add(mod);
			
			assertSame("collection count is incorrect.", 1, col.get("count"));
			
			var item = col.get(0);
			assertSame("item from collection is not same as item added to collection.", mod, item);
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));

			if (error) {
				throw error;
			}
		},
		
		"test collection.add multiple models": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			
			col.add([cat, dog]);
			
			assertSame("collection count is incorrect.", 2, col.get("count"));
			
			var item = col.get(0);
			assertSame("cat item from collection is not same as item added to collection.", cat, item);
			item = col.get(1);
			assertSame("dog item from collection is not same as item added to collection.", dog, item);
			
			assertSame("cat item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("cat item.age value is incorrect.", 8, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Stripe", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 10, col.get("1.age"));
		},
		
		"test collection.add single json data": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			col.add({
				name: "Spot",
				age: 8
			});
			
			assertSame("collection count is incorrect.", 1, col.get("count"));
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
		},
		
		"test collection.add multiple json data": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			col.add([{
				name: "Spot",
				age: 8
			}, {
				name: "Stripe",
				age: 10
			}]);
			
			assertSame("collection count is incorrect.", 2, col.get("count"));
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Stripe", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 10, col.get("1.age"));
		},

		"test collection.replace": function ()
		{
			var col = animals.create();
			
			// Add some items
			col.add({
				name: "Stripe",
				age: 23
			});

			var mod = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(mod);

			col.add({
				name: "Zebra",
				age: 4
			});

			var item = col.at(1);
			assertSame("item from collection is not same as item added to collection.", mod, item);
			assertSame("item.name value is incorrect.", "Spot", col.get("1.name"));
			assertSame("item.age value is incorrect.", 8, col.get("1.age"));

			// Replace the item
			mod = animal.create({
				name: "Doug",
				age: 3
			});
			col.replace(mod, { at: 1 });

			item = col.at(1);
			assertSame("item from collection is not same as item added to collection after replace.", mod, item);
			assertSame("item.name value is incorrect after replace.", "Doug", col.get("1.name"));
			assertSame("item.age value is incorrect after replace.", 3, col.get("1.age"));
		},

		"test collection.move item backward": function ()
		{
			var col = animals.create();
			
			// Add some items
			col.add([{
				name: "Stripe",
				age: 23
			}, {
				name: "Spot",
				age: 8
			}, {
				name: "Zebra",
				age: 4
			}]);

			assertSame("item[0].name value is incorrect.", "Stripe", col.get("0.name"));
			assertSame("item[0].age value is incorrect.", 23, col.get("0.age"));
			assertSame("item[1].name value is incorrect.", "Spot", col.get("1.name"));
			assertSame("item[1].age value is incorrect.", 8, col.get("1.age"));
			assertSame("item[2].name value is incorrect.", "Zebra", col.get("2.name"));
			assertSame("item[2].age value is incorrect.", 4, col.get("2.age"));

			// Move an item
			var zebra = col.at(2);

			col.move({
				from: 2,
				to: 0
			});

			assertSame("item moved is not at correct index.", zebra, col.at(0));
			assertSame("item[0].name value is incorrect after move.", "Zebra", col.get("0.name"));
			assertSame("item[0].age value is incorrect after move.", 4, col.get("0.age"));
			assertSame("item[1].name value is incorrect after move.", "Stripe", col.get("1.name"));
			assertSame("item[1].age value is incorrect after move.", 23, col.get("1.age"));
			assertSame("item[2].name value is incorrect after move.", "Spot", col.get("2.name"));
			assertSame("item[2].age value is incorrect after move.", 8, col.get("2.age"));
		},

		"test collection.move item forward": function ()
		{
			var col = animals.create();
			
			// Add some items
			col.add([{
				name: "Stripe",
				age: 23
			}, {
				name: "Spot",
				age: 8
			}, {
				name: "Zebra",
				age: 4
			}]);

			assertSame("item[0].name value is incorrect.", "Stripe", col.get("0.name"));
			assertSame("item[0].age value is incorrect.", 23, col.get("0.age"));
			assertSame("item[1].name value is incorrect.", "Spot", col.get("1.name"));
			assertSame("item[1].age value is incorrect.", 8, col.get("1.age"));
			assertSame("item[2].name value is incorrect.", "Zebra", col.get("2.name"));
			assertSame("item[2].age value is incorrect.", 4, col.get("2.age"));

			// Move an item
			var stripe = col.at(0);

			col.move({
				from: 0,
				to: 1
			});

			assertSame("item moved is not at correct index.", stripe, col.at(1));
			assertSame("item[0].name value is incorrect after move.", "Spot", col.get("0.name"));
			assertSame("item[0].age value is incorrect after move.", 8, col.get("0.age"));
			assertSame("item[1].name value is incorrect after move.", "Stripe", col.get("1.name"));
			assertSame("item[1].age value is incorrect after move.", 23, col.get("1.age"));
			assertSame("item[2].name value is incorrect after move.", "Zebra", col.get("2.name"));
			assertSame("item[2].age value is incorrect after move.", 4, col.get("2.age"));
		},
		
		"test collection.reset": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			col.add([{
				name: "Spot",
				age: 8
			}, {
				name: "Stripe",
				age: 10
			}]);
			
			assertSame("collection count is incorrect.", 2, col.get("count"));
			
			var cat = col.get("0"),
				dog = col.get("1");
			
			col.reset();
			
			assertSame("collection count after reset is incorrect.", 0, col.get("count"));
		},
		
		"test collection.reset with new items": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			col.add([{
				name: "Spot",
				age: 8
			}, {
				name: "Stripe",
				age: 10
			}]);
			
			assertSame("collection count is incorrect.", 2, col.get("count"));
			
			var cat = col.get("0"),
				dog = col.get("1");
			
			col.reset([{
				name: "Quick",
				age: 3
			}, {
				name: "Slow",
				age: 5
			}]);
			
			assertSame("collection count is incorrect.", 2, col.get("count"));
			assertSame("item.name value is incorrect.", "Quick", col.get("0.name"));
			assertSame("item.age value is incorrect.", 3, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Slow", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 5, col.get("1.age"));
		},
		
		"test collection.remove first item": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.create({
				name: "Bessy",
				age: 9
			});
			col.add(cow);
			
			assertSame("collection count after adding items is incorrect.", 3, col.get("count"));
			
			col.remove(cat);
			
			assertSame("collection count after removing item is incorrect.", 2, col.get("count"));
			assertSame("dog item from collection is not same as item added to collection.", dog, col.get("0"));
			assertSame("cow item from collection is not same as item added to collection.", cow, col.get("1"));
		},
		
		"test collection.remove middle item": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.create({
				name: "Bessy",
				age: 9
			});
			col.add(cow);
			
			assertSame("collection count after adding items is incorrect.", 3, col.get("count"));
			
			col.remove(dog);
			
			assertSame("collection count after removing item is incorrect.", 2, col.get("count"));
			assertSame("cat item from collection is not same as item added to collection.", cat, col.get("0"));
			assertSame("cow item from collection is not same as item added to collection.", cow, col.get("1"));
		},
		
		"test collection.remove last item": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.create({
				name: "Bessy",
				age: 9
			});
			col.add(cow);
			
			assertSame("collection count after adding items is incorrect.", 3, col.get("count"));
			
			col.remove(cow);
			
			assertSame("collection count after removing item is incorrect.", 2, col.get("count"));
			assertSame("cat item from collection is not same as item added to collection.", cat, col.get("0"));
			assertSame("dog item from collection is not same as item added to collection.", dog, col.get("1"));
		},
		
		"test collection.remove does nothing if item not found": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.create({
				name: "Bessy",
				age: 9
			});
			col.add(cow);
			
			var rat = animal.create({
				name: "Fuzz",
				age: 2
			});
			
			assertSame("collection count after adding items is incorrect.", 3, col.get("count"));
			
			col.remove(rat);
			
			assertSame("collection count after removing item is incorrect.", 3, col.get("count"));
			assertSame("cat item from collection is not same as item added to collection.", cat, col.get("0"));
			assertSame("dog item from collection is not same as item added to collection.", dog, col.get("1"));
			assertSame("cow item from collection is not same as item added to collection.", cow, col.get("2"));
		},
		
		"test collection.toJSON": function () {
			var col = animals.create();
			
			var mod = animal.create({
				id: 1,
				name: "Spot",
				age: 8
			});
			col.add(mod);
			
			mod = animal.create({
				id: 2,
				name: "Stripe",
				age: 10
			});
			col.add(mod);
			
			var json = col.toJSON();
			
			assertArray("json object is not an array", json);
			assertSame("json length is incorrect", 2, json.length);
			assertObject("json[0] is not an object", json[0]);
			assertObject("json[1] is not an object", json[1]);
			assertSame("json[0].id value is incorrect", 1, json[0].id);
			assertSame("json[0].name value is incorrect", "Spot", json[0].name);
			assertSame("json[0].age value is incorrect", 8, json[0].age);
			assertSame("json[1].id value is incorrect", 2, json[1].id);
			assertSame("json[1].name value is incorrect", "Stripe", json[1].name);
			assertSame("json[1].age value is incorrect", 10, json[1].age);
		},
		
		"test collection.parse with collection attributes": function () {
			var mod = zoo.create();
			
			mod.parse({
				name: "Big Zoo",
				location: "San Diego",
				animals: [{
						name: "Spot",
						age: 8
					}, {
						name: "Stripe",
						age: 10
					}
				]
			});
			
			assertSame("name attribute has incorrect value.", "Big Zoo", mod.get("name"));
			assertSame("location attribute has incorrect value.", "San Diego", mod.get("location"));
			
			var col = mod.get("animals");
			
			assert("collection is not a prototype of animals", collection.isPrototypeOf(col));
			assertSame("collection count is incorrect", 2, col.get("count"))
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Stripe", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 10, col.get("1.age"));
		},
		
		"test collection.pluck": function ()
		{
			var col = animals.create([{
					name: "Spot",
					age: 8
				}, {
					name: "Stripe",
					age: 10
				}
			]);
			
			var names = col.pluck("name");
			
			assertSame("names length is incorrect.", 2, names.length);
			assertSame("name[0] has incorrect value.", "Spot", names[0]);
			assertSame("name[1] has incorrect value.", "Stripe", names[1]);
		},
		
		"test collection.pluck on non-existant attribute name returns all undefined values in array": function ()
		{
			var col = animals.create([{
					name: "Spot",
					age: 8
				}, {
					name: "Stripe",
					age: 10
				}
			]);
			
			var names = col.pluck("not-there");
			
			assertSame("names length is incorrect.", 2, names.length);
			assertUndefined("name[0] has incorrect value.", names[0]);
			assertUndefined("name[1] has incorrect value.", names[1]);
		},

		"test collection.fetch": function ()
		{
			expectAsserts(1);

			var col = foobars.create();

			col.fetch().done(async(function () {
				assertSame("collection has incorrect item count", 2, col.get("count"));
			}));
		},

		"test collection.make with model": function ()
		{
			expectAsserts(5);

			var col = foobars.create();

			var mod = foobar.create({
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			});

			col.make(mod).done(async(function () {
				assertSame("collection has incorrect item count", 1, col.get("count"));
				
				var data = col.get(0);
				assertObject("model from collection is not an object", data);
				assertSame("name has incorrect value", "Data", data.get("name"));
				assertSame("email has incorrect value", "data@starfleet.com", data.get("email"));
				assertSame("age has incorrect value", 26, data.get("age"));

				data.erase();
			}));
		},

		"test collection.make with json data": function ()
		{
			expectAsserts(5);

			var col = foobars.create();

			var json = {
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			};

			col.make(json).done(async(function () {
				assertSame("collection has incorrect item count", 1, col.get("count"));
				
				var data = col.get(0);
				assertObject("model from collection is not an object", data);
				assertSame("name has incorrect value", "Data", data.get("name"));
				assertSame("email has incorrect value", "data@starfleet.com", data.get("email"));
				assertSame("age has incorrect value", 26, data.get("age"));

				data.erase();
			}));
		},

		"test collection removes new model after it is erased": function ()
		{
			var col = animals.create();
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(cat);

			assertSame("collection count is incorrect before erase.", 1, col.get("count"));

			cat.erase();

			assertSame("collection count is incorrect after erase.", 0, col.get("count"));
		},

		"test collection removes existing model after it is erased": function ()
		{
			expectAsserts(3);

			var col = foobars.create();

			var json = {
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			};
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			col.make(json).done(async(function () {
				assertSame("collection count is incorrect before erase.", 1, col.get("count"));

				var data = col.get(0);
				data.erase().done(async(function () {
					assertSame("collection count is incorrect after erase.", 0, col.get("count"));
				}));
			}));
		},

		"test collection does not remove model after a failed erase": function ()
		{
			expectAsserts(3);

			var col = foobars.create();

			var json = {
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			};
			
			assertSame("collection count is incorrect.", 0, col.get("count"));
			
			col.make(json).done(async(function () {
				assertSame("collection count is incorrect before erase.", 1, col.get("count"));

				var data = col.get(0);
				data.erase().done(async(function () {
					assertSame("collection count is incorrect after erase.", 0, col.get("count"));
				}));
			}));
		},

		"test collection sync error event": function ()
		{
			expectAsserts(8);

			var col = animals.create();

			col.after("error", async(function (e) {
				assertSame("event name is incorrect", "error", e.name);
				assertSame("event src is incorrect", col, e.src);
				assertSame("status has incorrect value", "error", e.info.status);
				assertSame("error has incorrect value", "Not Found", e.info.error);
				assertObject("xhr has incorrect value", e.info.xhr);
			}));

			col.fetch({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
				assertSame("status value is incorrect.", "error", status);
				assertSame("error value is incorrect.", "Not Found", _.trim(error));
				assertObject("xhr is not an object.", xhr);
			}));
		},

		"test collection.sort throws an exception with no comparator": function ()
		{
			var col = animals.create();

			assertException("sort did not throw correct exception", function () {
				col.sort();
			}, "Error");
		},

		"test collection.sort": function ()
		{
			var col = animals.create();
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.create({
				name: "Bessy",
				age: 9
			});
			col.add(cow);

			assertSame("cat is not first item before sort.", cat, col.at(0));
			assertSame("dog is not second item before sort.", dog, col.at(1));
			assertSame("cow is not third item before sort.", cow, col.at(2));

			col.comparator = function (item) {
				return item.get("name");
			};
			col.sort();

			assertSame("cow is not first item after sort.", cow, col.at(0));
			assertSame("cat is not second item after sort.", cat, col.at(1));
			assertSame("dog is not third item after sort.", dog, col.at(2));
		},

		"test collection.add on sorted array": function ()
		{
			var col = animals.create();
			
			var cow = animal.create({
				name: "Bessy",
				age: 9
			});
			col.add(cow);

			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			assertSame("cow is not first item after sort.", cow, col.at(0));
			assertSame("cat is not second item after sort.", cat, col.at(1));
			assertSame("dog is not third item after sort.", dog, col.at(2));

			col.comparator = function (item) {
				return item.get("name");
			};

			var rat = animal.create({
				name: "Rodney",
				age: 1
			});
			col.add(rat);

			assertSame("cow is not first item after sort.", cow, col.at(0));
			assertSame("rat is not second item after sort.", rat, col.at(1));
			assertSame("cat is not third item after sort.", cat, col.at(2));
			assertSame("dog is not fourth item after sort.", dog, col.at(3));
		},

		"test collection.sortBy": function ()
		{
			var col = animals.create();
			
			var cat = animal.create({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.create({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.create({
				name: "Bessy",
				age: 9
			});
			col.add(cow);

			assertSame("cat is not first item before sort.", cat, col.at(0));
			assertSame("dog is not second item before sort.", dog, col.at(1));
			assertSame("cow is not third item before sort.", cow, col.at(2));

			var o = {};

			col.sortBy(function (item) {
				assertSame("context is incorrect", o, this);
				return item.get("age");
			}, { context: o });

			assertSame("cat is not first item after sort.", cat, col.at(0));
			assertSame("cow is not second item after sort.", cow, col.at(1));
			assertSame("dog is not third item after sort.", dog, col.at(2));
		},

		"test collection.getById returns model after it is added": function ()
		{
			var col = animals.create([{
					id: "A",
					name: "Spot",
					age: 8
				}, {
					id: "B",
					name: "Stripe",
					age: 10
				}
			]);

			var mod = col.at(0),
				modById = col.getById("A");
			assertSame("model by id A has incorrect value", mod, modById);

			mod = col.at(1);
			modById = col.getById("B");
			assertSame("model by id B has incorrect value", mod, modById);
		},

		"test collection.getById returns undefined for ids not in collection": function ()
		{
			var col = animals.create([{
					id: "A",
					name: "Spot",
					age: 8
				}, {
					id: "B",
					name: "Stripe",
					age: 10
				}
			]);

			var mod = col.at(0),
				modById = col.getById("A");
			assertSame("model by id A has incorrect value", mod, modById);

			mod = col.at(1);
			modById = col.getById("B");
			assertSame("model by id B has incorrect value", mod, modById);

			modById = col.getById("Not Found");
			assertUndefined("model by id is not undefined", modById);
		},

		"test collection.getById returns undefined after model is removed": function ()
		{
			var col = animals.create([{
					id: "A",
					name: "Spot",
					age: 8
				}, {
					id: "B",
					name: "Stripe",
					age: 10
				}
			]);

			var mod = col.at(0),
				modById = col.getById("A");
			assertSame("model by id A has incorrect value", mod, modById);

			mod = col.at(1);
			modById = col.getById("B");
			assertSame("model by id B has incorrect value", mod, modById);

			col.remove(mod);
			modById = col.getById("B");
			assertUndefined("model by id is not undefined", modById);
		},

		"test collection.getById returns undefined after reset": function ()
		{
			var col = animals.create([{
					id: "A",
					name: "Spot",
					age: 8
				}, {
					id: "B",
					name: "Stripe",
					age: 10
				}
			]);

			var mod = col.at(0);
			assertSame("model by id A has incorrect value", mod, col.getById("A"));

			mod = col.at(1);
			assertSame("model by id B has incorrect value", mod, col.getById("B"));

			col.reset();
			assertUndefined("model by id A is not undefined", col.getById("A"));
			assertUndefined("model by id B is not undefined", col.getById("B"));
		},

		"test collection.getByCid returns model after it is added": function ()
		{
			var col = animals.create([{
					id: "A",
					name: "Spot",
					age: 8
				}, {
					id: "B",
					name: "Stripe",
					age: 10
				}
			]);

			var mod = col.at(0),
				modByCid = col.getByCid(mod.get('cid'));
			assertSame("model by cid A has incorrect value", mod, modByCid);

			mod = col.at(1);
			modByCid = col.getByCid(mod.get('cid'));
			assertSame("model by cid B has incorrect value", mod, modByCid);
		},

		"test collection.getByCid returns undefined for cids not in collection": function ()
		{
			var col = animals.create([{
					id: "A",
					name: "Spot",
					age: 8
				}, {
					id: "B",
					name: "Stripe",
					age: 10
				}
			]);

			var mod = col.at(0),
				modByCid = col.getByCid(mod.get('cid'));
			assertSame("model by cid A has incorrect value", mod, modByCid);

			mod = col.at(1);
			modByCid = col.getByCid(mod.get('cid'));
			assertSame("model by cid B has incorrect value", mod, modByCid);

			modByCid = col.getByCid("Not Found");
			assertUndefined("model by cid is not undefined", modByCid);
		},

		"test collection.getByCid returns undefined after model is removed": function ()
		{
			var col = animals.create([{
					id: "A",
					name: "Spot",
					age: 8
				}, {
					id: "B",
					name: "Stripe",
					age: 10
				}
			]);

			var mod = col.at(0),
				modByCid = col.getByCid(mod.get('cid'));
			assertSame("model by cid A has incorrect value", mod, modByCid);

			mod = col.at(1);
			modByCid = col.getByCid(mod.get('cid'));
			assertSame("model by cid B has incorrect value", mod, modByCid);

			col.remove(mod);
			modByCid = col.getByCid("B");
			assertUndefined("model by cid is not undefined", modByCid);
		},
		
		"test collection.getByCid returns undefined after reset": function ()
		{
			var col = animals.create([{
					id: "A",
					name: "Spot",
					age: 8
				}, {
					id: "B",
					name: "Stripe",
					age: 10
				}
			]);

			var mod = col.at(0);
			assertSame("model by cid A has incorrect value", mod, col.getByCid(mod.get('cid')));

			mod = col.at(1);
			assertSame("model by cid B has incorrect value", mod, col.getByCid(mod.get('cid')));

			col.reset();
			assertUndefined("model by cid A is not undefined", col.getByCid(mod.get('cid')));
			assertUndefined("model by cid B is not undefined", col.getByCid(mod.get('cid')));
		},

		/*
		 * collection attribute.reduce
		 */
		"test collection.attribute.reduce fires on item value changes": function ()
		{
			expectAsserts(7);

			// Make a model with a reduce attribute
			var park = zoo.extend({
				attributes: {
					ageTotal: {
						get: function () {
							return this.get("animals").reduce(function (ageTotal, a) {
								return ageTotal + a.get("age");
							},0);
						},
						reduce: {
							animals: "age"
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: [{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				]
			});

			assertSame("the age total does not match", 18, sd.get("ageTotal"));

			var count = 0;
			sd.after("ageTotalChange", function (e) {
				if (count === 0) {
					assertSame("the e.info.newValue age total does not match (1)", 22, e.info.newValue);
					assertSame("the age total does not match in the after event (1)", 22, sd.get("ageTotal"));
				}
				else {
					assertSame("the e.info.newValue age total does not match (2)", 14, e.info.newValue);
					assertSame("the age total does not match in the after event (2)", 14, sd.get("ageTotal"));
				}

				count += 1;
			});

			sd.get("animals").getById("A").set("age", 12);

			assertSame("the age total does not match after changing an age (1)", 22, sd.get("ageTotal"));

			sd.get("animals").getById("A").set("age", 4);

			assertSame("the age total does not match after changing an age (2)", 14, sd.get("ageTotal"));

			sd.destroy();
		},

		"test collection.attribute.reduce after removing an item": function ()
		{
			expectAsserts(9);

			// Make a model with a reduce attribute
			var park = zoo.extend({
				attributes: {
					ageTotal: {
						get: function () {
							return this.get("animals").reduce(function (ageTotal, a) {
								return ageTotal + a.get("age");
							},0);
						},
						reduce: {
							animals: "age"
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: [{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				]
			});

			assertSame("the age total does not match", 18, sd.get("ageTotal"));

			var count = 0;
			sd.after("ageTotalChange", function (e) {
				if (count === 0) {
					assertSame("the e.info.newValue age total does not match (1)", 22, e.info.newValue);
					assertSame("the age total does not match in the after event (1)", 22, sd.get("ageTotal"));
				}
				else {
					assertSame("the e.info.newValue age total does not match (2)", 10, e.info.newValue);
					assertSame("the age total does not match in the after event (2)", 10, sd.get("ageTotal"));
				}

				count += 1;
			});

			var aniA = sd.get("animals").getById("A");

			assertSame("aniA does not have the correct number of listeners (1)", 1, aniA.events["agechange"].after.length);

			aniA.set("age", 12);

			assertSame("the age total does not match after changing an age", 22, sd.get("ageTotal"));

			sd.get("animals").remove(aniA);

			assertSame("aniA does not have the correct number of listeners (2)", 0, aniA.events["agechange"].after.length);
			assertSame("the age total does not match after removing an item", 10, sd.get("ageTotal"));

			sd.destroy();
		},

		"test collection.attribute.reduce after adding an item": function ()
		{
			expectAsserts(8);

			// Make a model with a reduce attribute
			var park = zoo.extend({
				attributes: {
					ageTotal: {
						get: function () {
							return this.get("animals").reduce(function (ageTotal, a) {
								return ageTotal + a.get("age");
							},0);
						},
						reduce: {
							animals: "age"
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: [{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				]
			});

			assertSame("the age total does not match", 18, sd.get("ageTotal"));

			var count = 0;
			sd.after("ageTotalChange", function (e) {
				if (count === 0) {
					assertSame("the e.info.newValue age total does not match (1)", 22, e.info.newValue);
					assertSame("the age total does not match in the after event (1)", 22, sd.get("ageTotal"));
				}
				else {
					assertSame("the e.info.newValue age total does not match (2)", 24, e.info.newValue);
					assertSame("the age total does not match in the after event (2)", 24, sd.get("ageTotal"));
				}

				count += 1;
			});

			var aniA = sd.get("animals").getById("A");

			aniA.set("age", 12);

			assertSame("the age total does not match after changing an age", 22, sd.get("ageTotal"));

			sd.get("animals").add({
				id: "C",
				name: "Hound",
				age: 2
			});

			var aniC = sd.get("animals").getById("C");

			assertSame("aniC does not have the correct number of listeners (1)", 1, aniA.events["agechange"].after.length);
			assertSame("the age total does not match after adding an item", 24, sd.get("ageTotal"));

			sd.destroy();
		},

		"test collection.attribute.reduce after resetting list to empty": function ()
		{
			expectAsserts(11);

			// Make a model with a reduce attribute
			var park = zoo.extend({
				attributes: {
					ageTotal: {
						get: function () {
							return this.get("animals").reduce(function (ageTotal, a) {
								return ageTotal + a.get("age");
							},0);
						},
						reduce: {
							animals: "age"
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: [{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				]
			});

			assertSame("the age total does not match", 18, sd.get("ageTotal"));

			var count = 0;
			sd.after("ageTotalChange", function (e) {
				if (count === 0) {
					assertSame("the e.info.newValue age total does not match (1)", 22, e.info.newValue);
					assertSame("the age total does not match in the after event (1)", 22, sd.get("ageTotal"));
				}
				else {
					assertSame("the e.info.newValue age total does not match (2)", 0, e.info.newValue);
					assertSame("the age total does not match in the after event (2)", 0, sd.get("ageTotal"));
				}

				count += 1;
			});

			var aniA = sd.get("animals").getById("A");
			var aniB = sd.get("animals").getById("B");

			assertSame("aniA does not have the correct number of listeners (1)", 1, aniA.events["agechange"].after.length);
			assertSame("aniB does not have the correct number of listeners (1)", 1, aniB.events["agechange"].after.length);

			aniA.set("age", 12);

			assertSame("the age total does not match after changing an age", 22, sd.get("ageTotal"));

			sd.get("animals").reset();

			assertSame("aniA does not have the correct number of listeners (2)", 0, aniA.events["agechange"].after.length);
			assertSame("aniB does not have the correct number of listeners (2)", 0, aniB.events["agechange"].after.length);
			assertSame("the age total does not match after resetting the list", 0, sd.get("ageTotal"));

			sd.destroy();
		},

		"test collection.attribute.reduce after resetting list with other items": function ()
		{
			expectAsserts(13);

			// Make a model with a reduce attribute
			var park = zoo.extend({
				attributes: {
					ageTotal: {
						get: function () {
							return this.get("animals").reduce(function (ageTotal, a) {
								return ageTotal + a.get("age");
							},0);
						},
						reduce: {
							animals: "age"
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: [{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				]
			});

			assertSame("the age total does not match", 18, sd.get("ageTotal"));

			var count = 0;
			sd.after("ageTotalChange", function (e) {
				if (count === 0) {
					assertSame("the e.info.newValue age total does not match (1)", 22, e.info.newValue);
					assertSame("the age total does not match in the after event (1)", 22, sd.get("ageTotal"));
				}
				else {
					assertSame("the e.info.newValue age total does not match (2)", 5, e.info.newValue);
					assertSame("the age total does not match in the after event (2)", 5, sd.get("ageTotal"));
				}

				count += 1;
			});

			var aniA = sd.get("animals").getById("A");
			var aniB = sd.get("animals").getById("B");

			assertSame("aniA does not have the correct number of listeners (1)", 1, aniA.events["agechange"].after.length);
			assertSame("aniB does not have the correct number of listeners (1)", 1, aniB.events["agechange"].after.length);

			aniA.set("age", 12);

			assertSame("the age total does not match after changing an age", 22, sd.get("ageTotal"));

			sd.get("animals").reset([{
					id: "C",
					name: "Hound",
					age: 2
				}, {
					id: "D",
					name: "Mouse",
					age: 3
				}
			]);

			assertSame("aniA does not have the correct number of listeners (2)", 0, aniA.events["agechange"].after.length);
			assertSame("aniB does not have the correct number of listeners (2)", 0, aniB.events["agechange"].after.length);

			var aniC = sd.get("animals").getById("C");
			var aniD = sd.get("animals").getById("D");

			assertSame("aniC does not have the correct number of listeners (1)", 1, aniC.events["agechange"].after.length);
			assertSame("aniD does not have the correct number of listeners (1)", 1, aniD.events["agechange"].after.length);
			assertSame("the age total does not match after resetting the list", 5, sd.get("ageTotal"));

			sd.destroy();
		},

		"test collection.attribute.reduce after changing the collection": function ()
		{
			expectAsserts(21);

			// Make a model with a reduce attribute
			var park = zoo.extend({
				attributes: {
					ageTotal: {
						get: function () {
							return this.get("animals").reduce(function (ageTotal, a) {
								return ageTotal + a.get("age");
							},0);
						},
						reduce: {
							animals: "age"
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: [{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				]
			});

			var animals = sd.get("animals");

			assertSame("animals does not have the correct number of add listeners (1)", 1, animals.events["add"].after.length);
			assertSame("animals does not have the correct number of remove listeners (1)", 1, animals.events["remove"].after.length);
			assertSame("animals does not have the correct number of on reset listeners (1)", 1, animals.events["reset"].on.length);
			assertSame("animals does not have the correct number of after reset listeners (1)", 1, animals.events["reset"].after.length);
			assertSame("the age total does not match", 18, sd.get("ageTotal"));

			var count = 0;
			sd.after("ageTotalChange", function (e) {
				if (count === 0) {
					assertSame("the e.info.newValue age total does not match (1)", 22, e.info.newValue);
					assertSame("the age total does not match in the after event (1)", 22, sd.get("ageTotal"));
				}
				else {
					assertSame("the e.info.newValue age total does not match (2)", 5, e.info.newValue);
					assertSame("the age total does not match in the after event (2)", 5, sd.get("ageTotal"));
				}

				count += 1;
			});

			var aniA = sd.get("animals").getById("A");
			var aniB = sd.get("animals").getById("B");

			assertSame("aniA does not have the correct number of listeners (1)", 1, aniA.events["agechange"].after.length);
			assertSame("aniB does not have the correct number of listeners (1)", 1, aniB.events["agechange"].after.length);

			aniA.set("age", 12);

			assertSame("the age total does not match after changing an age", 22, sd.get("ageTotal"));

			sd.set("animals", collection.create([{
					id: "C",
					name: "Hound",
					age: 2
				}, {
					id: "D",
					name: "Mouse",
					age: 3
				}
			]));

			assertSame("animals does not have the correct number of add listeners (2)", 0, animals.events["add"].after.length);
			assertSame("animals does not have the correct number of remove listeners (2)", 0, animals.events["remove"].after.length);
			assertSame("animals does not have the correct number of on reset listeners (2)", 0, animals.events["reset"].on.length);
			assertSame("animals does not have the correct number of after reset listeners (2)", 0, animals.events["reset"].after.length);
			assertSame("aniA does not have the correct number of listeners (2)", 0, aniA.events["agechange"].after.length);
			assertSame("aniB does not have the correct number of listeners (2)", 0, aniB.events["agechange"].after.length);

			var aniC = sd.get("animals").getById("C");
			var aniD = sd.get("animals").getById("D");

			assertSame("aniC does not have the correct number of listeners (1)", 1, aniC.events["agechange"].after.length);
			assertSame("aniD does not have the correct number of listeners (1)", 1, aniD.events["agechange"].after.length);
			assertSame("the age total does not match after changing the list", 5, sd.get("ageTotal"));

			sd.destroy();
		},

		/*
		 * collection attribute.map
		 */
		"test collection.attribute.map": function ()
		{
			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var owned_animals = sd.get('owned_animals');

			assert("owned_animals is not a collection", collection.isPrototypeOf(owned_animals));
			assertSame("owned_animals has the incorrect number of items", 2, owned_animals.get('count'));

			sd.destroy();
		},

		"test collection.attribute.map with custom collection": function ()
		{
			var animals = collection.extend();

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							},
							collection: animals
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var owned_animals = sd.get('owned_animals');

			assert("owned_animals is not an animals collection", animals.isPrototypeOf(owned_animals));
			assertSame("owned_animals has the incorrect number of items", 2, owned_animals.get('count'));

			sd.destroy();
		},

		"test collection.attribute.map after removing an item": function ()
		{
			expectAsserts(4);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');

			owned_animals.after('remove', function (e) {
				assertSame("the removed item is not at the correct index", 0, e.info.options.at[0]);
				assertSame("the removed item is incorrect", 'A', e.info.items[0].get('id'));
			});

			animals.remove(animals.at(0));

			assertSame("animals has the incorrect number of items", 1, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 1, owned_animals.get('count'));

			sd.destroy();
		},

		"test collection.attribute.map after adding an item": function ()
		{
			expectAsserts(7);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');
			var count = 0;
			var error = null;

			owned_animals.after('add', function (e) {
				try {
					if (count === 0) {
						assertSame("the added item is incorrect", 'C', e.info.items[0].get('animal.id'));
					}
					else {
						assertSame("the added item is not at the correct index", 1, e.info.options.at);
						assertSame("the added item is incorrect", 'D', e.info.items[0].get('animal.id'));
					}

					count += 1;
				}
				catch (ex) {
					error = ex;
				}
			});

			animals.add({
				id: "C",
				name: "Speckle",
				age: 3
			});

			assertSame("animals has the incorrect number of items", 3, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 3, owned_animals.get('count'));

			animals.add({
				id: "D",
				name: "Patches",
				age: 4
			}, {
				at: 1
			});

			assertSame("animals has the incorrect number of items", 4, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 4, owned_animals.get('count'));

			sd.destroy();

			if (error) {
				throw error;
			}
		},

		"test collection.attribute.map after resetting list to empty": function ()
		{
			expectAsserts(5);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');
			var error = null;

			owned_animals.after('reset', function (e) {
				try {
					assert("just making sure this is called", true);
				}
				catch (ex) {
					error = ex;
				}
			});

			assertSame("animals has the incorrect number of items", 2, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 2, owned_animals.get('count'));

			animals.reset();

			assertSame("animals has the incorrect number of items", 0, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 0, owned_animals.get('count'));

			sd.destroy();

			if (error) {
				throw error;
			}
		},

		"test collection.attribute.map after resetting list with other items": function ()
		{
			expectAsserts(5);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');
			var error = null;

			owned_animals.after('reset', function (e) {
				try {
					assertSame("incorrect item was added on reset", "C", e.info.items[0].get('animal.id'));
				}
				catch (ex) {
					error = ex;
				}
			});

			assertSame("animals has the incorrect number of items", 2, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 2, owned_animals.get('count'));

			animals.reset({
				id: "C",
				name: "Speckle",
				age: 3
			});

			assertSame("animals has the incorrect number of items", 1, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 1, owned_animals.get('count'));

			sd.destroy();

			if (error) {
				throw error;
			}
		},

		"test collection.attribute.map after changing the collection": function ()
		{
			expectAsserts(5);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');
			var error = null;

			sd.after('owned_animalsChange', function (e) {
				try {
					assertNotSame("incorrect item was added on reset", owned_animals, e.info.newValue);
				}
				catch (ex) {
					error = ex;
				}
			});

			assertSame("animals has the incorrect number of items", 2, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 2, owned_animals.get('count'));

			sd.set('animals', collection.create([{
				id: "C",
				name: "Speckle",
				age: 3
			}]));

			animals = sd.get('animals');
			owned_animals = sd.get('owned_animals');

			assertSame("animals has the incorrect number of items", 1, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 1, owned_animals.get('count'));

			sd.destroy();

			if (error) {
				throw error;
			}
		},

		"test collection.attribute.map after removing an item from destination collection": function ()
		{
			expectAsserts(4);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');

			animals.after('remove', function (e) {
				assertSame("the removed item is not at the correct index", 0, e.info.options.at[0]);
				assertSame("the removed item is incorrect", 'A', e.info.items[0].get('id'));
			});

			// Remove an item from the destination collection
			owned_animals.remove(owned_animals.at(0));

			assertSame("animals has the incorrect number of items", 1, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 1, owned_animals.get('count'));

			sd.destroy();
		},

		"test collection.attribute.map after adding an item to destination collection": function ()
		{
			expectAsserts(7);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							},
							untransform: function (owned_animal) {
								return owned_animal.get('animal');
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');
			var count = 0;
			var error = null;

			animals.after('add', function (e) {
				try {
					if (count === 0) {
						assertSame("the added item is incorrect", 'C', e.info.items[0].get('id'));
					}
					else {
						assertSame("the added item is not at the correct index", 1, e.info.options.at);
						assertSame("the added item is incorrect", 'D', e.info.items[0].get('id'));
					}

					count += 1;
				}
				catch (ex) {
					error = ex;
				}
			});

			owned_animals.add(model.create({
				animal: model.create({
					id: "C",
					name: "Speckle",
					age: 3
				}),
				owned: false
			}));

			assertSame("animals has the incorrect number of items", 3, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 3, owned_animals.get('count'));

			owned_animals.add(model.create({
				animal: model.create({
					id: "D",
					name: "Patches",
					age: 4
				}),
				owned: false
			}), {
				at: 1
			});

			assertSame("animals has the incorrect number of items", 4, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 4, owned_animals.get('count'));

			sd.destroy();

			if (error) {
				throw error;
			}
		},

		"test collection.attribute.map after resetting destination collection to empty": function ()
		{
			expectAsserts(5);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');
			var error = null;

			animals.after('reset', function (e) {
				try {
					assert("just making sure this is called", true);
				}
				catch (ex) {
					error = ex;
				}
			});

			assertSame("animals has the incorrect number of items", 2, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 2, owned_animals.get('count'));

			owned_animals.reset();

			assertSame("animals has the incorrect number of items", 0, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 0, owned_animals.get('count'));

			sd.destroy();

			if (error) {
				throw error;
			}
		},

		"test collection.attribute.map after resetting destination collection with other items": function ()
		{
			expectAsserts(5);

			// Make a model with a map attribute
			var park = model.extend({
				attributes: {
					owned_animals: {
						map: {
							source: 'animals',
							transform: function (animal) {
								return model.create({
									animal: animal,
									owned: animal.get('name') === 'Spot'
								});
							},
							untransform: function (owned_animal) {
								return owned_animal.get('animal');
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animals: collection.create([{
						id: "A",
						name: "Spot",
						age: 8
					}, {
						id: "B",
						name: "Stripe",
						age: 10
					}
				])
			});

			var animals = sd.get('animals');
			var owned_animals = sd.get('owned_animals');
			var error = null;

			animals.after('reset', function (e) {
				try {
					assertSame("incorrect item was added on reset", "C", e.info.items[0].get('id'));
				}
				catch (ex) {
					error = ex;
				}
			});

			assertSame("animals has the incorrect number of items", 2, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 2, owned_animals.get('count'));

			owned_animals.reset(model.create({
				animal: model.create({
					id: "C",
					name: "Speckle",
					age: 3
				}),
				owned: false
			}));

			assertSame("animals has the incorrect number of items", 1, animals.get('count'));
			assertSame("owned_animals has the incorrect number of items", 1, owned_animals.get('count'));

			sd.destroy();

			if (error) {
				throw error;
			}
		},

		/*
		 * collection attribute.list
		 */
		"test collection.attribute.list": function ()
		{
			// Make a model with a list attribute
			var park = model.extend({
				attributes: {
					animals: {
						list: {
							source: 'animal_ids',
							repo: collection.create()
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animal_ids: [1, 2, 3]
			});

			var pets = sd.get('animals');

			assert("pets is not a collection", collection.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items", 3, pets.get('count'));
			assertSame("pets[0] has the incorrect id", 1, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id", 3, pets.at(2).get('id'));

			sd.destroy();
		},

		"test collection.attribute.list with custom collection": function ()
		{
			// Make a model with a list attribute
			var park = model.extend({
				attributes: {
					animals: {
						list: {
							source: 'animal_ids',
							repo: collection.create(),
							collection: animals
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animal_ids: [1, 2, 3]
			});

			var pets = sd.get('animals');

			assert("pets is not an animals collection", animals.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items", 3, pets.get('count'));
			assertSame("pets[0] has the incorrect id", 1, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id", 3, pets.at(2).get('id'));

			sd.destroy();
		},

		"test collection.attribute.list with repo function": function ()
		{
			var repoCollection = collection.create();

			// Make a model with a list attribute
			var park = model.extend({
				attributes: {
					animals: {
						list: {
							source: 'animal_ids',
							repo: function () {
								return repoCollection;
							}
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animal_ids: [1, 2, 3]
			});

			var pets = sd.get('animals');

			assert("pets is not a collection", collection.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items", 3, pets.get('count'));
			assertSame("pets[0] has the incorrect id", 1, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id", 3, pets.at(2).get('id'));

			sd.destroy();
		},

		"test collection.attribute.list with subsequent set with more items": function ()
		{
			// Make a model with a list attribute
			var park = model.extend({
				attributes: {
					animals: {
						list: {
							source: 'animal_ids',
							repo: collection.create()
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animal_ids: [1, 2, 3]
			});

			var pets = sd.get('animals');

			assert("pets is not a collection", collection.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items", 3, pets.get('count'));
			assertSame("pets[0] has the incorrect id", 1, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id", 3, pets.at(2).get('id'));

			// Set the animal_ids again
			sd.set('animal_ids', [1, 2, 3, 4]);

			assert("pets is not a collection after set", collection.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items after set", 4, pets.get('count'));
			assertSame("pets[0] has the incorrect id after set", 1, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id after set", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id after set", 3, pets.at(2).get('id'));
			assertSame("pets[3] has the incorrect id after set", 4, pets.at(3).get('id'));

			sd.destroy();
		},

		"test collection.attribute.list with subsequent set with fewer items": function ()
		{
			// Make a model with a list attribute
			var park = model.extend({
				attributes: {
					animals: {
						list: {
							source: 'animal_ids',
							repo: collection.create()
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animal_ids: [1, 2, 3]
			});

			var pets = sd.get('animals');

			assert("pets is not a collection", collection.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items", 3, pets.get('count'));
			assertSame("pets[0] has the incorrect id", 1, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id", 3, pets.at(2).get('id'));

			// Set the animal_ids again
			sd.set('animal_ids', [1]);

			assert("pets is not a collection after set", collection.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items after set", 3, pets.get('count'));
			assertSame("pets[0] has the incorrect id after set", 1, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id after set", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id after set", 3, pets.at(2).get('id'));

			sd.destroy();
		},

		"test collection.attribute.list with subsequent set changing items": function ()
		{
			// Make a model with a list attribute
			var park = model.extend({
				attributes: {
					animals: {
						list: {
							source: 'animal_ids',
							repo: collection.create()
						}
					}
				}
			});

			// Instantiate a park model to use
			var sd = park.create({
				animal_ids: [1, 2, 3]
			});

			var pets = sd.get('animals');

			assert("pets is not a collection", collection.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items", 3, pets.get('count'));
			assertSame("pets[0] has the incorrect id", 1, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id", 3, pets.at(2).get('id'));

			// Set the animal_ids again
			sd.set('animal_ids', [4]);

			assert("pets is not a collection after set", collection.isPrototypeOf(pets));
			assertSame("pets has the incorrect number of items after set", 3, pets.get('count'));
			assertSame("pets[0] has the incorrect id after set", 4, pets.at(0).get('id'));
			assertSame("pets[1] has the incorrect id after set", 2, pets.at(1).get('id'));
			assertSame("pets[2] has the incorrect id after set", 3, pets.at(2).get('id'));

			sd.destroy();
		},

		"test collection's base.bindToCollection": function ()
		{
			expectAsserts(12);

			var park = model.extend({
				attributes: {
					pets: {
						value: collection.create()
					}
				}
			}).create();

			// Setup the options
			var bindOptions = {
                add: function (options, e) {
                    assertSame('add.options is not the same as bindOptions', bindOptions, options);
                    assert('add.e does not have the correct values', 'Fluffy', e.info.items[0].get('name'));
                },
                remove: function (options, e) {
                    assertSame('remove.options is not the same as bindOptions', bindOptions, options);
                    assert('remove.e does not have the correct values', 'Fluffy', e.info.items[0].get('name'));
                },
                reset: function (options, e) {
                    assertSame('reset.options is not the same as bindOptions', bindOptions, options);
                    assert('reset.e does not have the correct values', 0, e.info.items.length);
                }
            };

			// Bind to the collection
            park.bindToCollection('pets', bindOptions);

            // Modify the collection
            var pets = park.get('pets');

            pets.add({ name: 'Fluffy' });
            pets.add([
				{ name: 'Scratchy' },
				{ name: 'Itchy' }
            ]);
            pets.move({
				from: 2,
				to: 0
            });
            pets.remove(pets.at(0));
            pets.reset();
		},

		"test collection's base.bindToCollection changing collection": function ()
		{
			// Test that the new colleciton is bound and the old one is unbound
			expectAsserts(6);

			var firstPets = collection.create();

			var park = model.extend({
				attributes: {
					pets: {
						value: firstPets
					}
				}
			}).create();

			// Setup the options. These should only be called once each after changing the collection
			var bindOptions = {
                add: function (options, e) {
                    assertSame('add.options is not the same as bindOptions', bindOptions, options);
                    assert('add.e does not have the correct values', 'Fluffy', e.info.items[0].get('name'));
                },
                remove: function (options, e) {
                    assertSame('remove.options is not the same as bindOptions', bindOptions, options);
                    assert('remove.e does not have the correct values', 'Fluffy', e.info.items[0].get('name'));
                },
                reset: function (options, e) {
                    assertSame('reset.options is not the same as bindOptions', bindOptions, options);
                    assert('reset.e does not have the correct values', 0, e.info.items.length);
                }
            };

			// Bind to the collection
            park.bindToCollection('pets', bindOptions);

            // Change the collection
            park.set('pets', collection.create());

            // Modify the collection
            var pets = park.get('pets');

            pets.add({ name: 'Fluffy' });
            pets.remove(pets.at(0));
            pets.reset();

            // Modify the firstPets collection. This should not call any of the binded functions
            firstPets.add({ name: 'Scratchy' });
            firstPets.remove(pets.at(0));
            firstPets.reset();
		},

		/*
		 * sparse collections
		 */
		"test sparse collection.count": function ()
		{
			var col = sparseCollection.create();

			assertSame('collection.count has incorrect value before adding items', 0, col.get('count'));

			// Add some items to the end of the array
			col.add([{ id: 0 }, { id: 1 }, { id: 2 }]);

			assertSame('collection.count has incorrect value after adding items', 3, col.get('count'));

			// Add an item beyond the end of the array
			col.add({ id: 6 }, { at: 6 });

			assertSame('collection.count has incorrect value after adding an item beyond the end of the collection', 4, col.get('count'));

			// Add mutliple items beyond the end of the array
			col.add([{ id: 10 }, { id: 11 }, { id: 12 }], { at: 10 });

			assertSame('collection.count has incorrect value after adding multiple items beyond the end of the collection', 7, col.get('count'));
		},

		"test sparse collection.add": function ()
		{
			var col = sparseCollection.create();

			// Add some items to the end of the array
			col.add([{ id: 0 }, { id: 1 }, { id: 2 }]);

			assertSame('collection[0] has incorrect value after adding items', 0, col.get('0.id'));
			assertSame('collection[1] has incorrect value after adding items', 1, col.get('1.id'));
			assertSame('collection[2] has incorrect value after adding items', 2, col.get('2.id'));

			// Add an item beyond the end of the array
			col.add({ id: 6 }, { at: 6 });

			assertSame('collection[0] has incorrect value after adding an item beyond the end of the collection', 0, col.get('0.id'));
			assertSame('collection[1] has incorrect value after adding an item beyond the end of the collection', 1, col.get('1.id'));
			assertSame('collection[2] has incorrect value after adding an item beyond the end of the collection', 2, col.get('2.id'));
			assertUndefined('collection[3] has incorrect value after adding an item beyond the end of the collection', col.get('3.id'));
			assertUndefined('collection[4] has incorrect value after adding an item beyond the end of the collection', col.get('4.id'));
			assertUndefined('collection[5] has incorrect value after adding an item beyond the end of the collection', col.get('5.id'));
			assertSame('collection[6] has incorrect value after adding an item beyond the end of the collection', 6, col.get('6.id'));

			// Add mutliple items beyond the end of the array
			col.add([{ id: 10 }, { id: 11 }, { id: 12 }], { at: 10 });

			assertSame('collection[0] has incorrect value after adding an item beyond the end of the collection', 0, col.get('0.id'));
			assertSame('collection[1] has incorrect value after adding an item beyond the end of the collection', 1, col.get('1.id'));
			assertSame('collection[2] has incorrect value after adding an item beyond the end of the collection', 2, col.get('2.id'));
			assertUndefined('collection[3] has incorrect value after adding an item beyond the end of the collection', col.get('3.id'));
			assertUndefined('collection[4] has incorrect value after adding an item beyond the end of the collection', col.get('4.id'));
			assertUndefined('collection[5] has incorrect value after adding an item beyond the end of the collection', col.get('5.id'));
			assertSame('collection[6] has incorrect value after adding an item beyond the end of the collection', 6, col.get('6.id'));
			assertUndefined('collection[7] has incorrect value after adding multiple items beyond the end of the collection', col.get('7.id'));
			assertUndefined('collection[8] has incorrect value after adding multiple items beyond the end of the collection', col.get('8.id'));
			assertUndefined('collection[9] has incorrect value after adding multiple items beyond the end of the collection', col.get('9.id'));
			assertSame('collection[10] has incorrect value after adding multiple items beyond the end of the collection', 10, col.get('10.id'));
			assertSame('collection[11] has incorrect value after adding multiple items beyond the end of the collection', 11, col.get('11.id'));
			assertSame('collection[12] has incorrect value after adding multiple items beyond the end of the collection', 12, col.get('12.id'));
		},

		"test sparse collection.remove": function ()
		{
			var col = sparseCollection.create();

			var eleven = model.create({ id: 11 });

			// Add some items to the collection
			col.add([{ id: 0 }]);
			col.add([{ id: 10 }, eleven, { id: 12 }], { at: 10 });

			assertSame('collection[0] has incorrect value before remove', 0, col.get('0.id'));
			assertSame('collection[10] has incorrect value before remove', 10, col.get('10.id'));
			assertSame('collection[11] has incorrect value before remove', 11, col.get('11.id'));
			assertSame('collection[12] has incorrect value before remove', 12, col.get('12.id'));

			// Remove an item from the collection
			col.remove(eleven);

			assertSame('collection[0] has incorrect value after remove', 0, col.get('0.id'));
			assertSame('collection[10] has incorrect value after remove', 10, col.get('10.id'));
			assertSame('collection[11] has incorrect value after remove', 12, col.get('11.id'));
		},

		"test sparse collection.replace": function ()
		{
			var col = sparseCollection.create();

			var eleven = model.create({ id: 11 });

			// Add some items to the collection
			col.add([{ id: 0 }]);
			col.add([{ id: 10 }, eleven, { id: 12 }], { at: 10 });

			assertSame('collection[0] has incorrect value before replace', 0, col.get('0.id'));
			assertSame('collection[10] has incorrect value before replace', 10, col.get('10.id'));
			assertSame('collection[11] has incorrect value before replace', 11, col.get('11.id'));
			assertSame('collection[12] has incorrect value before replace', 12, col.get('12.id'));

			// Remove an item from the collection
			col.replace({ id: 'new11' }, { at: 11 });

			assertSame('collection[0] has incorrect value after replace', 0, col.get('0.id'));
			assertSame('collection[10] has incorrect value after replace', 10, col.get('10.id'));
			assertSame('collection[11] has incorrect value after replace', 'new11', col.get('11.id'));
			assertSame('collection[12] has incorrect value after replace', 12, col.get('12.id'));
		},

		"test sparse collection.reset": function ()
		{
			var col = sparseCollection.create();

			var eleven = model.create({ id: 11 });

			// Add some items to the collection
			col.add([{ id: 0 }]);
			col.add([{ id: 10 }, eleven, { id: 12 }], { at: 10 });

			assertSame('collection.count has incorrect value before reset', 4, col.get('count'));
			assertSame('collection[0] has incorrect value before reset', 0, col.get('0.id'));
			assertSame('collection[10] has incorrect value before reset', 10, col.get('10.id'));
			assertSame('collection[11] has incorrect value before reset', 11, col.get('11.id'));
			assertSame('collection[12] has incorrect value before reset', 12, col.get('12.id'));

			// Remove an item from the collection
			col.reset();

			assertSame('collection.count has incorrect value after reset', 0, col.get('count'));
			assertUndefined('collection[0] has incorrect value after reset', col.get('0.id'));
			assertUndefined('collection[10] has incorrect value after reset', col.get('10.id'));
			assertUndefined('collection[11] has incorrect value after reset', col.get('11.id'));
			assertUndefined('collection[12] has incorrect value after reset', col.get('12.id'));
		},

		/*
		 * collection.index
		 */
		"test collection.index after create": function ()
		{
			var col = indexCollection.create([{
				id: 0,
				name: 'Data'
			}, {
				id: 1,
				name: 'Riker'
			}, {
				id: 2,
				name: 'Picard'
			}]);

			assertSame('col[0] has incorrect index value', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value', 2, col.get('2.index'));
		},

		"test collection.index after remove": function ()
		{
			var col = indexCollection.create([{
				id: 0,
				name: 'Data'
			}, {
				id: 1,
				name: 'Riker'
			}, {
				id: 2,
				name: 'Picard'
			}]);

			assertSame('col[0] has incorrect index value', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value', 2, col.get('2.index'));

			col.remove(col.at(1));

			assertSame('col[0] has incorrect index value after remove', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value after remove', 1, col.get('1.index'));
		},

		"test collection.index after add to end of collection": function ()
		{
			var col = indexCollection.create([{
				id: 0,
				name: 'Data'
			}, {
				id: 1,
				name: 'Riker'
			}, {
				id: 2,
				name: 'Picard'
			}]);

			assertSame('col[0] has incorrect index value', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value', 2, col.get('2.index'));

			col.add({
				id: 3,
				name: 'Troi'
			});

			assertSame('col[0] has incorrect index value after add', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value after add', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value after add', 2, col.get('2.index'));
			assertSame('col[3] has incorrect index value after add', 3, col.get('3.index'));
		},

		"test collection.index after add to middle of collection": function ()
		{
			var col = indexCollection.create([{
				id: 0,
				name: 'Data'
			}, {
				id: 1,
				name: 'Riker'
			}, {
				id: 2,
				name: 'Picard'
			}]);

			assertSame('col[0] has incorrect index value', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value', 2, col.get('2.index'));

			col.add({
				id: 3,
				name: 'Troi'
			}, { at: 1 });

			assertSame('col[0] has incorrect index value after add', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value after add', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value after add', 2, col.get('2.index'));
			assertSame('col[3] has incorrect index value after add', 3, col.get('3.index'));
		},

		"test collection.index after reset": function ()
		{
			var col = indexCollection.create([{
				id: 0,
				name: 'Data'
			}, {
				id: 1,
				name: 'Riker'
			}, {
				id: 2,
				name: 'Picard'
			}]);

			assertSame('col[0] has incorrect index value', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value', 2, col.get('2.index'));

			col.reset([{
				id: 2,
				name: 'Picard'
			}, {
				id: 0,
				name: 'Data'
			}, {
				id: 1,
				name: 'Riker'
			}]);

			assertSame('col[0] has incorrect index value after reset', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value after reset', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value after reset', 2, col.get('2.index'));
		},

		"test collection.index after sort": function ()
		{
			var col = indexCollection.create([{
				id: 0,
				name: 'Data'
			}, {
				id: 1,
				name: 'Riker'
			}, {
				id: 2,
				name: 'Picard'
			}]);

			assertSame('col[0] has incorrect index value', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value', 2, col.get('2.index'));

			col.sortBy(function (item) {
				return item.get('name');
			});

			assertSame('col[0] has incorrect name value after sort', 'Data', col.get('0.name'));
			assertSame('col[1] has incorrect name value after sort', 'Picard', col.get('1.name'));
			assertSame('col[2] has incorrect name value after sort', 'Riker', col.get('2.name'));

			assertSame('col[0] has incorrect index value after sort', 0, col.get('0.index'));
			assertSame('col[1] has incorrect index value after sort', 1, col.get('1.index'));
			assertSame('col[2] has incorrect index value after sort', 2, col.get('2.index'));
		}
	};
});