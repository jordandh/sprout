TestCase("collection", ["underscore", "collection", "model"], function (_, collection, model) {
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
	
	return {
		"test collection has underscore methods": function ()
		{
			var methods = ["forEach", "each", "map", "reduce", "reduceRight", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains",
						   "invoke", "max", "min", "sortBy", "sortedIndex", "toArray", "size", "first", "initial", "rest", "last", "without", "indexOf", "shuffle", "lastIndexOf",
						   "isEmpty", "groupBy"];
			
			expectAsserts(methods.length);
			
			_.each(methods, function (methodName) {
				assertFunction(methodName + " is not a method on the collection object", collection[methodName]);
			});
		},
		
		"test collection.new": function ()
		{
			var col = animals.new([{
					name: "Spot",
					age: 8
				}, {
					name: "Stripe",
					age: 10
				}
			]);
			
			assert("collection is not a prototype of animals", collection.isPrototypeOf(col));
			assertSame("collection count is incorrect.", 2, col.count());
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Stripe", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 10, col.get("1.age"));
		},
		
		"test collection.count": function ()
		{
			var col = animals.new([{
					name: "Spot",
					age: 8
				}, {
					name: "Stripe",
					age: 10
				}
			]);
			
			assertSame("collection count is incorrect.", 2, col.count());
		},
		
		"test collection.at": function ()
		{
			var col = animals.new();
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			
			var dog = animal.new({
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
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			var mod = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(mod);
			
			assertSame("collection count is incorrect.", 1, col.count());
			
			var item = col.get(0);
			assertSame("item from collection is not same as item added to collection.", mod, item);
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
		},
		
		"test collection.add multiple models": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			
			var dog = animal.new({
				name: "Stripe",
				age: 10
			});
			
			col.add([cat, dog]);
			
			assertSame("collection count is incorrect.", 2, col.count());
			
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
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			col.add({
				name: "Spot",
				age: 8
			});
			
			assertSame("collection count is incorrect.", 1, col.count());
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
		},
		
		"test collection.add multiple json data": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			col.add([{
				name: "Spot",
				age: 8
			}, {
				name: "Stripe",
				age: 10
			}]);
			
			assertSame("collection count is incorrect.", 2, col.count());
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Stripe", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 10, col.get("1.age"));
		},
		
		"test collection.reset": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			col.add([{
				name: "Spot",
				age: 8
			}, {
				name: "Stripe",
				age: 10
			}]);
			
			assertSame("collection count is incorrect.", 2, col.count());
			
			var cat = col.get("0"),
				dog = col.get("1");
			
			col.reset();
			
			assertSame("collection count after reset is incorrect.", 0, col.count());
		},
		
		"test collection.reset with new items": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			col.add([{
				name: "Spot",
				age: 8
			}, {
				name: "Stripe",
				age: 10
			}]);
			
			assertSame("collection count is incorrect.", 2, col.count());
			
			var cat = col.get("0"),
				dog = col.get("1");
			
			col.reset([{
				name: "Quick",
				age: 3
			}, {
				name: "Slow",
				age: 5
			}]);
			
			assertSame("collection count is incorrect.", 2, col.count());
			assertSame("item.name value is incorrect.", "Quick", col.get("0.name"));
			assertSame("item.age value is incorrect.", 3, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Slow", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 5, col.get("1.age"));
		},
		
		"test collection.remove first item": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.new({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.new({
				name: "Bessy",
				age: 9
			});
			col.add(cow);
			
			assertSame("collection count after adding items is incorrect.", 3, col.count());
			
			col.remove(cat);
			
			assertSame("collection count after removing item is incorrect.", 2, col.count());
			assertSame("dog item from collection is not same as item added to collection.", dog, col.get("0"));
			assertSame("cow item from collection is not same as item added to collection.", cow, col.get("1"));
		},
		
		"test collection.remove middle item": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.new({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.new({
				name: "Bessy",
				age: 9
			});
			col.add(cow);
			
			assertSame("collection count after adding items is incorrect.", 3, col.count());
			
			col.remove(dog);
			
			assertSame("collection count after removing item is incorrect.", 2, col.count());
			assertSame("cat item from collection is not same as item added to collection.", cat, col.get("0"));
			assertSame("cow item from collection is not same as item added to collection.", cow, col.get("1"));
		},
		
		"test collection.remove last item": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.new({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.new({
				name: "Bessy",
				age: 9
			});
			col.add(cow);
			
			assertSame("collection count after adding items is incorrect.", 3, col.count());
			
			col.remove(cow);
			
			assertSame("collection count after removing item is incorrect.", 2, col.count());
			assertSame("cat item from collection is not same as item added to collection.", cat, col.get("0"));
			assertSame("dog item from collection is not same as item added to collection.", dog, col.get("1"));
		},
		
		"test collection.remove does nothing if item not found": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.new({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.new({
				name: "Bessy",
				age: 9
			});
			col.add(cow);
			
			var rat = animal.new({
				name: "Fuzz",
				age: 2
			});
			
			assertSame("collection count after adding items is incorrect.", 3, col.count());
			
			col.remove(rat);
			
			assertSame("collection count after removing item is incorrect.", 3, col.count());
			assertSame("cat item from collection is not same as item added to collection.", cat, col.get("0"));
			assertSame("dog item from collection is not same as item added to collection.", dog, col.get("1"));
			assertSame("cow item from collection is not same as item added to collection.", cow, col.get("2"));
		},
		
		"test collection.toJSON": function () {
			var col = animals.new();
			
			var mod = animal.new({
				id: 1,
				name: "Spot",
				age: 8
			});
			col.add(mod);
			
			mod = animal.new({
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
			var mod = zoo.new();
			
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
			assertSame("collection count is incorrect", 2, col.count())
			assertSame("item.name value is incorrect.", "Spot", col.get("0.name"));
			assertSame("item.age value is incorrect.", 8, col.get("0.age"));
			assertSame("dog item.name value is incorrect.", "Stripe", col.get("1.name"));
			assertSame("dog item.age value is incorrect.", 10, col.get("1.age"));
		},
		
		"test collection.pluck": function ()
		{
			var col = animals.new([{
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
			var col = animals.new([{
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

			var col = foobars.new();

			col.fetch().done(async(function () {
				assertSame("collection has incorrect item count", 2, col.count());
			}));
		},

		"test collection.create with model": function ()
		{
			expectAsserts(5);

			var col = foobars.new();

			var mod = foobar.new({
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			});

			col.create(mod).done(async(function () {
				assertSame("collection has incorrect item count", 1, col.count());
				
				var data = col.get(0);
				assertObject("model from collection is not an object", data);
				assertSame("name has incorrect value", "Data", data.get("name"));
				assertSame("email has incorrect value", "data@starfleet.com", data.get("email"));
				assertSame("age has incorrect value", 26, data.get("age"));

				data.delete();
			}));
		},

		"test collection.create with json data": function ()
		{
			expectAsserts(5);

			var col = foobars.new();

			var json = {
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			};

			col.create(json).done(async(function () {
				assertSame("collection has incorrect item count", 1, col.count());
				
				var data = col.get(0);
				assertObject("model from collection is not an object", data);
				assertSame("name has incorrect value", "Data", data.get("name"));
				assertSame("email has incorrect value", "data@starfleet.com", data.get("email"));
				assertSame("age has incorrect value", 26, data.get("age"));

				data.delete();
			}));
		},

		"test collection removes new model after it is deleted": function ()
		{
			var col = animals.new();
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(cat);

			assertSame("collection count is incorrect before delete.", 1, col.count());

			cat.delete();

			assertSame("collection count is incorrect after delete.", 0, col.count());
		},

		"test collection removes existing model after it is deleted": function ()
		{
			expectAsserts(3);

			var col = foobars.new();

			var json = {
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			};
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			col.create(json).done(async(function () {
				assertSame("collection count is incorrect before delete.", 1, col.count());

				var data = col.get(0);
				data.delete().done(async(function () {
					assertSame("collection count is incorrect after delete.", 0, col.count());
				}));
			}));
		},

		"test collection does not remove model after a failed delete": function ()
		{
			expectAsserts(3);

			var col = foobars.new();

			var json = {
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			};
			
			assertSame("collection count is incorrect.", 0, col.count());
			
			col.create(json).done(async(function () {
				assertSame("collection count is incorrect before delete.", 1, col.count());

				var data = col.get(0);
				data.delete().done(async(function () {
					assertSame("collection count is incorrect after delete.", 0, col.count());
				}));
			}));
		},

		"test collection sync error event": function ()
		{
			expectAsserts(8);

			var col = animals.new();

			col.after("error", async(function (e) {
				assertSame("event name is incorrect", "error", e.name);
				assertSame("event src is incorrect", col, e.src);
				assertSame("status has incorrect value", "error", e.info.status);
				assertSame("error has incorrect value", "Not Found", e.info.error);
				assertObject("xhr has incorrect value", e.info.xhr);
			}));

			col.fetch({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
				assertSame("status value is incorrect.", "error", status);
				assertSame("error value is incorrect.", "Not Found", error);
				assertObject("xhr is not an object.", xhr);
			}));
		},

		"test collection.sort throws an exception with no comparator": function ()
		{
			var col = animals.new();

			assertException("sort did not throw correct exception", function () {
				col.sort();
			}, "CollectionSortError");
		},

		"test collection.sort": function ()
		{
			var col = animals.new();
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.new({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.new({
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
			var col = animals.new();
			
			var cow = animal.new({
				name: "Bessy",
				age: 9
			});
			col.add(cow);

			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.new({
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

			var rat = animal.new({
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
			var col = animals.new();
			
			var cat = animal.new({
				name: "Spot",
				age: 8
			});
			col.add(cat);
			
			var dog = animal.new({
				name: "Stripe",
				age: 10
			});
			col.add(dog);
			
			var cow = animal.new({
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
			var col = animals.new([{
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
			var col = animals.new([{
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
			var col = animals.new([{
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
			var col = animals.new([{
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
		}
	}
});