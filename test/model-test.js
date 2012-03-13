TestCase("model", ["model"], function (model) {
	var foo = model.extend({
		attributes: {
			name: {
				value: "foobar"
			},
			species: {
				value: "human"
			},
			obj: {
				value: null
			},
			literal: {
				value: {
					one: 1,
					two: [1,2,3],
					three: "three"
				}
			}
		},
		
		foo: "foo"
	});
	
	var bar = model.extend({
		attributes: {
			name: {
				value: "worf"
			},
			species: {
				value: "klingon"
			},
			children: {
				value: [1, 2, 3]
			},
			age: {
				value: 35
			}
		}
	});
	
	var simple = model.extend({
		attributes: {
			one: {
				value: 1
			},
			two: {
				value: 2
			},
			three: {
				value: 3
			}
		}
	});
	
	var complex = model.extend({
		attributes: {
			a: {
				value: null,
				model: simple
			},
			b: {
				value: null,
				model: simple
			},
			c: {
				value: "c"
			}
		}
	});

	var foobar = model.extend({
		rootUrl: "foobars"
	});
	
	return {
		"test model.new": function ()
		{
			var mod = simple.new({
				one: 11,
				two: 12,
				three: 13
			});
			
			assert("model is not a prototype of simple", model.isPrototypeOf(mod));
			assertSame("one attribute has incorrect value", 11, mod.get("one"));
			assertSame("two attribute has incorrect value", 12, mod.get("two"));
			assertSame("three attribute has incorrect value", 13, mod.get("three"));
		},
		
		"test model.clone on model object": function () {
			var mod = model.new(),
				clone = mod.clone();
			
			assert("cloned model is not a child of model.", model.isPrototypeOf(clone));
			assertNotSame("original model and cloned model are not different.", mod, clone);
			assertNotSame("original model and cloned model do not have different client ids.", mod.get("cid"), clone.get("cid"));
			assertSame("original model and cloned model do not have same id attribute value.", mod.get("id"), clone.get("id"));
		},
		
		"test model.clone on child of model object": function () {
			var mod = foo.new(),
				obj = model.new();
			
			mod.set("name", "funbar");
			mod.set("species", "vulcan");
			mod.set("obj", obj);
			
			var clone = mod.clone();
			
			assert("cloned model is not a child of the foo model.", foo.isPrototypeOf(clone));
			assert("cloned model is not a child of model.", model.isPrototypeOf(clone));
			assertNotSame("original model and cloned model are not different.", mod, clone);
			assertNotSame("original model and cloned model do not have different client ids.", mod.get("cid"), clone.get("cid"));
			assertSame("original model and cloned model do not have same id attribute value.", mod.get("id"), clone.get("id"));
			assertSame("original model and cloned model do not have same name attribute value.", mod.get("name"), clone.get("name"));
			assertSame("original model and cloned model do not have same species attribute value.", mod.get("species"), clone.get("species"));
			assertSame("cloned model has incorrect value for name attribute.", "funbar", clone.get("name"));
			assertSame("cloned model has incorrect value for species attribute.", "vulcan", clone.get("species"));
			assertSame("cloned model has incorrect value for foo property.", "foo", clone.foo);
			
			clone.destroy();
			
			assert("clone is not destroyed after destroy", clone.get("destroyed"));
			
			mod.destroy();
			
			assert("mod is not destroyed after destroy", clone.get("destroyed"));
		},
		
		"test model.toJSON": function ()
		{
			var mod = foo.new(),
				json = mod.toJSON();
			
			assertObject("json is not an object.", json);
			assertUndefined("cid is defined.", json.cid);
			assertUndefined("destroyed is defined.", json.destroyed);
			assertUndefined("plugins is defined.", json.plugins);
			assertUndefined("id property has incorrect value", json.id);
			assertSame("name property has incorrect value", "foobar", json.name);
			assertSame("species property has incorrect value", "human", json.species);
			assertSame("obj property has incorrect value", null, json.obj);
		},
		
		"test model.toJSON with model attribute": function ()
		{
			var mod = foo.new(),
				b = bar.new();
			
			mod.set("obj", b);
			
			var json = mod.toJSON();
			
			assertObject("json is not an object.", json);
			assertUndefined("cid is defined.", json.cid);
			assertUndefined("destroyed is defined.", json.destroyed);
			assertUndefined("plugins is defined.", json.plugins);
			assertUndefined("id property has incorrect value.", json.id);
			assertSame("name property has incorrect value.", "foobar", json.name);
			assertSame("species property has incorrect value.", "human", json.species);
			
			assertObject("literal property has incorrect value.", json.literal);
			assertSame("literal.one property has incorrect value.", 1, json.literal.one);
			assertSame("literal.two[0] property has incorrect value.", 1, json.literal.two[0]);
			assertSame("literal.two[1] property has incorrect value.", 2, json.literal.two[1]);
			assertSame("literal.two[2] property has incorrect value.", 3, json.literal.two[2]);
			assertSame("literal.three property has incorrect value.", "three", json.literal.three);
			
			assertObject("obj property has incorrect value.", json.obj);
			assertUndefined("obj.cid is defined.", json.obj.cid);
			assertUndefined("obj.destroyed is defined.", json.obj.destroyed);
			assertUndefined("obj.plugins is defined.", json.obj.plugins);
			assertUndefined("obj.id property has incorrect value.", json.obj.id);
			assertSame("obj.name property has incorrect value.", "worf", json.obj.name);
			assertSame("obj.species property has incorrect value.", "klingon", json.obj.species);
			assertArray("obj.children property is not an array.", json.obj.children);
			assertSame("obj.children[0] has incorrect value.", 1, json.obj.children[0]);
			assertSame("obj.children[1] has incorrect value.", 2, json.obj.children[1]);
			assertSame("obj.children[2] has incorrect value.", 3, json.obj.children[2]);
			assertSame("obj.name property has incorrect value.", 35, json.obj.age);
		},
		
		"test model.parse": function ()
		{
			var mod = simple.new();
			
			mod.parse({
				one: 11,
				two: 12,
				three: 13
			});
			
			assertSame("one attribute has incorrect value.", 11, mod.get("one"));
			assertSame("two attribute has incorrect value.", 12, mod.get("two"));
			assertSame("three attribute has incorrect value.", 13, mod.get("three"));
		},
		
		"test model.parse with model attributes": function ()
		{
			var mod = complex.new();
			
			mod.parse({
				a: {
					one: 11,
					two: 12,
					three: 13
				},
				b: {
					one: "b11",
					two: "b12",
					three: "b13"
				},
				c: "c3po"
			});
			
			assert("simple is not a prototype of a.", simple.isPrototypeOf(mod.get("a")));
			assertSame("a.one attribute has incorrect value.", 11, mod.get("a.one"));
			assertSame("a.two attribute has incorrect value.", 12, mod.get("a.two"));
			assertSame("a.three attribute has incorrect value.", 13, mod.get("a.three"));
			
			assert("simple is not a prototype of b.", simple.isPrototypeOf(mod.get("b")));
			assertSame("b.one attribute has incorrect value.", "b11", mod.get("b.one"));
			assertSame("b.two attribute has incorrect value.", "b12", mod.get("b.two"));
			assertSame("b.three attribute has incorrect value.", "b13", mod.get("b.three"));
			
			assertSame("c attribute has incorrect value.", "c3po", mod.get("c"));
		},

		"test model.isNew on new model": function ()
		{
			var mod = foobar.new();

			assert("model is not new", mod.isNew());
		},

		"test model.isNew on existing model": function ()
		{
			var mod = foobar.new({
				id: 1
			});

			assertFalse("model is new", mod.isNew());
		},

		"test model.url on new model": function ()
		{
			var mod = foobar.new();

			assertSame("url has incorrect value", "foobars", mod.url());
		},

		"test model.url on existing model": function ()
		{
			var mod = foobar.new({
				id: 1
			});

			assertSame("url has incorrect value", "foobars/1", mod.url());
		},

		"test model.save create": function ()
		{
			expectAsserts(2);

			var mod = foobar.new({
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			});

			mod.save().done(async(function () {
				assertNumber("id is not a number", mod.get("id"));
				assertFalse("model is still new", mod.isNew());

				mod.delete();
			}));
		},

		"test model.save update": function ()
		{
			expectAsserts(8);

			var mod = foobar.new({
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			});

			mod.save().done(async(function () {
				var id = mod.get("id");
				assertNumber("id is not a number", mod.get("id"));
				assertSame("name has incorrect value", "Data", mod.get("name"));
				assertSame("email has incorrect value", "data@starfleet.com", mod.get("email"));
				assertSame("age has incorrect value", 26, mod.get("age"));

				mod.set("name", "Lore");
				mod.set("age", 27);
				mod.set("email", "lore@starfleet.com");

				mod.save().done(async(function () {
					assertSame("id does not match after update", id, mod.get("id"));
					assertSame("name has incorrect value", "Lore", mod.get("name"));
					assertSame("email has incorrect value", "lore@starfleet.com", mod.get("email"));
					assertSame("age has incorrect value", 27, mod.get("age"));

					mod.delete();
				}));
			}));
		},

		"test model.delete": function ()
		{
			expectAsserts(2);

			var mod = foobar.new({
				name: "Worf",
				email: "worf@starfleet.com",
				age: 36
			});

			mod.save().done(async(function () {
				assertNumber("id is not a number", mod.get("id"));

				mod.delete().done(async(function () {
					assertNumber("id is not a number", mod.get("id"));
				}));
			}));
		},

		"test model.fetch": function ()
		{
			expectAsserts(5);

			var mod = foobar.new({
				name: "Worf",
				email: "worf@starfleet.com",
				age: 36
			});

			mod.save().done(async(function () {
				var id = mod.get("id");
				assertNumber("id is not a number", mod.get("id"));

				var worf = foobar.new({
					id: id
				});

				worf.fetch().done(async(function () {
					assertSame("id does not match after update", id, worf.get("id"));
					assertSame("name has incorrect value", "Worf", worf.get("name"));
					assertSame("email has incorrect value", "worf@starfleet.com", worf.get("email"));
					assertSame("age has incorrect value", 36, worf.get("age"));

					worf.delete();
				}));
			}));
		},

		"test model.save create 404": function ()
		{
			expectAsserts(3);

			var mod = foobar.new({
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			});

			mod.save({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
				assertSame("status value is incorrect.", "error", status);
				assertSame("error value is incorrect.", "Not Found", error);
				assertObject("xhr is not an object.", xhr);
			}));
		},

		"test model.save update 404": function ()
		{
			expectAsserts(7);


			var mod = foobar.new({
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			});

			mod.save().done(async(function () {
				var id = mod.get("id");
				assertNumber("id is not a number", mod.get("id"));
				assertSame("name has incorrect value", "Data", mod.get("name"));
				assertSame("email has incorrect value", "data@starfleet.com", mod.get("email"));
				assertSame("age has incorrect value", 26, mod.get("age"));

				mod.set("name", "Lore");
				mod.set("age", 27);
				mod.set("email", "lore@starfleet.com");

				mod.save({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
					assertSame("status value is incorrect.", "error", status);
					assertSame("error value is incorrect.", "Not Found", error);
					assertObject("xhr is not an object.", xhr);

					mod.delete();
				}));
			}));
		},

		"test model.delete 404": function ()
		{
			expectAsserts(4);

			var mod = foobar.new({
				name: "Worf",
				email: "worf@starfleet.com",
				age: 36
			});

			mod.save().done(async(function () {
				assertNumber("id is not a number", mod.get("id"));

				mod.delete({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
					assertSame("status value is incorrect.", "error", status);
					assertSame("error value is incorrect.", "Not Found", error);
					assertObject("xhr is not an object.", xhr);

					mod.delete();
				}));
			}));
		},

		"test model.fetch 404": function ()
		{
			expectAsserts(4);

			var mod = foobar.new({
				name: "Worf",
				email: "worf@starfleet.com",
				age: 36
			});

			mod.save().done(async(function () {
				var id = mod.get("id");
				assertNumber("id is not a number", mod.get("id"));

				var worf = foobar.new({
					id: id
				});

				mod.fetch({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
					assertSame("status value is incorrect.", "error", status);
					assertSame("error value is incorrect.", "Not Found", error);
					assertObject("xhr is not an object.", xhr);

					mod.delete();
				}));
			}));
		},

		"test model sync error event": function ()
		{
			expectAsserts(8);

			var mod = foobar.new({
				name: "Data",
				email: "data@starfleet.com",
				age: 26
			});

			mod.after("error", async(function (e) {
				assertSame("event name is incorrect", "error", e.name);
				assertSame("event src is incorrect", mod, e.src);
				assertSame("status has incorrect value", "error", e.info.status);
				assertSame("error has incorrect value", "Not Found", e.info.error);
				assertObject("xhr has incorrect value", e.info.xhr);
			}));

			mod.save({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
				assertSame("status value is incorrect.", "error", status);
				assertSame("error value is incorrect.", "Not Found", error);
				assertObject("xhr is not an object.", xhr);
			}));
		}
	};
});