TestCase("base", ["sprout/util", "sprout/base"], function (_, Base) {
	var Animal = Base.extend({
		attributes: {
			name: {
				value: "",
				validator: _.isString
			}
		}
	});
	
	return {
		"test base.constructor": function () {
			var c = Base.create();
			assert("c is destroyed", !c.get("destroyed"));
			assert("c does not have its own attributes property", c.hasOwnProperty("attributes"));
			assertObject("attributes is not an object", c.attributes);
		},
		
		"test base.destructor": function () {
			var c = Base.create();
			
			assert("c is destroyed.", !c.get("destroyed"));
			
			c.destroy();
			
			assert("c is not destroyed.", c.get("destroyed"));
			assertUndefined("c.plugins is not undefined.", c.get("plugins"));
		},

		"test base.destroy throws if called more than once": function () {
			var c = Base.create();
			
			assert("c is destroyed.", !c.get("destroyed"));
			
			c.destroy();
			
			assert("c is not destroyed.", c.get("destroyed"));

			assertException("destroy did not throw correct exception", function () {
				c.destroy();
			}, "Error");
		},
		
		"test base.fire": function () {
			expectAsserts(2);
			
			var c = Base.create();
			
			c.on("test", function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
				e.info.foo = "foobar";
			});
			
			c.fire("test", { foo: "bar" }, function (e) {
				assert("foo does not equal foobar", e.info.foo === "foobar");
			});
		},

		"test base.fire async": function () {
			expectAsserts(2);

			var c = Base.create();

			c.after("test", function (e) {
				assertSame("foo does not equal foobar in after handler", "bar", e.info.foo);
			});

			c.fire("test", { foo: "bar" }, function (e, fireAfter) {
				assertSame("foo does not equal foobar", "bar", e.info.foo);
				fireAfter();
			}, null, true);
		},
		
		"test base.before": function () {
			expectAsserts(1);
			
			var c = Base.create();
			
			c.before("test", function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			});
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.on": function () {
			expectAsserts(1);
			
			var c = Base.create();
			
			c.on("test", function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			});
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.after": function () {
			expectAsserts(1);
			
			var c = Base.create();
			
			c.after("test", function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			});
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.before preventDefault and preventedAction": function () {
			expectAsserts(2);
			
			var c = Base.create();
			
			c.before("test", function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
				e.info.foo = "foobar";
				e.preventDefault = true;
			});
			
			c.fire("test", { foo: "bar" }, null, function (e) {
				assert("foo does not equal foobar", e.info.foo === "foobar");
			});
		},
		
		"test base.detachBefore": function () {
			expectAsserts(1);
			
			var handler = function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			};
			
			var c = Base.create();
			
			c.before("test", handler);
			
			c.fire("test", { foo: "bar" });
			
			c.detachBefore("test", handler);
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.detachOn": function () {
			expectAsserts(1);
			
			var handler = function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			};
			
			var c = Base.create();
			
			c.on("test", handler);
			
			c.fire("test", { foo: "bar" });
			
			c.detachOn("test", handler);
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.detachAfter": function () {
			expectAsserts(1);
			
			var handler = function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			};
			
			var c = Base.create();
			
			c.after("test", handler);
			
			c.fire("test", { foo: "bar" });
			
			c.detachAfter("test", handler);
			
			c.fire("test", { foo: "bar" });
		},

		"test base.detachAfter on destroyed object does nothing": function () {
			var c = Base.create();

			handler = function () {};
			
			c.after("test", handler);
			c.destroy();

			c.detachAfter("test", handler);
		},
		
		"test base.attributes default value": function () {
			var c = Base.create();
			
			assertFalse("attribute has incorrect value", c.get("destroyed"));
		},
		
		"test base.attributes validator": function () {
			var c = Animal.create();
			
			assertSame("attribute has incorrect value", "", c.get("name"));
			
			c.set("name", 2);
			assertSame("attribute has incorrect value", "", c.get("name"));
			
			c.set("name", "Spot");
			assertSame("attribute has incorrect value", "Spot", c.get("name"));
			
			c.set("name", 2);
			assertSame("attribute has incorrect value", "Spot", c.get("name"));
		},
		
		"test base.attributes readOnly": function () {
			var c = Base.create();
			
			c.attributes.test = {
				value: 1,
				readOnly: true
			};
			
			assertSame("attribute has incorrect value", 1, c.get("test"));
			
			c.set("test", 2);
			assertSame("attribute has incorrect value", 1, c.get("test"));
		},

		"test base.attributes get": function () {
			expectAsserts(2);

			var c = Base.create();
			
			c.attributes.test = {
				get: function (name) {
					assertSame("attribute name has incorrect value", "test", name);
					return 2;
				}
			};
			
			assertSame("attribute value is incorrect", 2, c.get("test"));
		},

		"test base.attributes get value is not cached": function () {
			expectAsserts(5);

			var c = Base.create();
			var val = 2;
			
			c.attributes.test = {
				get: function (name) {
					assertSame("attribute name has incorrect value", "test", name);
					return val;
				}
			};
			
			assertSame("attribute value is incorrect", 2, c.get("test"));

			c.set("test", 3);

			assertSame("attribute value is incorrect", 2, c.get("test"));
		},
		
		"test base.attributes set": function () {
			expectAsserts(3);
			
			var c = Base.create();
			
			c.attributes.test = {
				value: 1,
				set: function (newValue, oldValue, name) {
					assertSame("attribute name has incorrect value", "test", name);
					assertSame("attribute old value has incorrect value", 1, oldValue);
					assertSame("attribute new value has incorrect value", 2, newValue);
					return newValue;
				}
			};
			
			c.set("test", 2);
		},
		
		"test base.attributes set returning a value": function () {
			var c = Base.create();
			
			c.attributes.test = {
				value: 1,
				set: function (newValue, oldValue, name) {
					return 3;
				}
			};
			
			assertSame("attribute has incorrect value", 1, c.get("test"));
			
			c.set("test", 2);
			assertSame("attribute has incorrect value", 3, c.get("test"));
		},
		
		"test base.attributes set returning undefined": function () {
			var c = Base.create();
			
			c.attributes.test = {
				value: 1,
				set: function (newValue, oldValue, name) {
				}
			};
			
			assertSame("attribute has incorrect value", 1, c.get("test"));
			
			c.set("test", 2);
			assertSame("attribute has incorrect value", 1, c.get("test"));
		},

		"test base.attributes uses": function () {
			expectAsserts(11);

			var person = Base.extend({
				attributes: {
					fullname: {
						get: function () {
							return this.get("firstname") + " " + this.get("lastname");
						},
						uses: ["firstname", "lastname"]
					}
				}
			});
			
			var will = person.create({
				firstname: "Will",
				lastname: "Ryker"
			});

			var count = 0;
			
			assertSame("firstname value is incorrect", "Will", will.get("firstname"));
			assertSame("lastname value is incorrect", "Ryker", will.get("lastname"));
			assertSame("fullname value is incorrect", "Will Ryker", will.get("fullname"));

			will.after("fullnameChange", function (e) {
				if (count === 0) {
					assertSame("fullname value is incorrect", "William Ryker", e.info.newValue);
					assertSame("fullname value is incorrect", "William Ryker", will.get("fullname"));
				}
				else if (count === 1) {
					assertSame("fullname value is incorrect", "William Troy", e.info.newValue);
					assertSame("fullname value is incorrect", "William Troy", will.get("fullname"));
				}

				count += 1;
			});

			will.set("firstname", "William");

			assertSame("firstname value is incorrect", "William", will.get("firstname"));
			assertSame("fullname value is incorrect", "William Ryker", will.get("fullname"));

			will.set("lastname", "Troy");

			assertSame("lastname value is incorrect", "Troy", will.get("lastname"));
			assertSame("fullname value is incorrect", "William Troy", will.get("fullname"));
		},
		
		"test base.attributes handler with <attribute name>Changed function": function () {
			expectAsserts(5);
			
			var c = Base.create();
			
			var o = {
				name: "foo",
				testChanged: function (newValue, oldValue) {
					assertSame("context is incorrect", "foo", this.name);
					assertSame("attribute has incorrect value", 1, oldValue);
					assertSame("attribute has incorrect value", 2, newValue);
				}
			};
			
			c.attributes.test = {
				value: 1,
				handler: o
			};
			
			assertSame("attribute has incorrect value", 1, c.get("test"));
			
			c.set("test", 2);
			assertSame("attribute has incorrect value", 2, c.get("test"));
		},

		"test base.attribute destroy does destroy value on instance": function () {
			var Animal = Base.extend({
				attributes: {
					name: {
						destory: true
					}
				}
			});

			c = Animal.create();

			c.set("name", Base.create());

			assertObject("attribute value is not on object before destroy", c.get("name"));
			
			c.destroy();

			assertUndefined("attribute value is on object after destroy", c.get("name"));
		},

		"test base.attribute destroy does not destroy value on prototype": function () {
			var Animal = Base.extend({
				attributes: {
					name: {
						value: Base.create(),
						destory: true
					}
				}
			});

			c = Animal.create();

			assertObject("attribute value is not on prototype before destroy", Animal.attributes.name.value);
			
			c.destroy();

			assertObject("attribute value is not on prototype after destroy", Animal.attributes.name.value);
		},
		
		"test base.get with no parameters": function ()
		{
			var Animal = Base.extend({
				attributes: {
					name: {
						value: ""
					}
				}
			});
			
			var Cat = Animal.extend({
				attributes: {
					phrase: {
						value: "meow"
					}
				}
			});
			
			var cat = Cat.create();
			cat.set("name", "Spot");
			cat.set("age", 8);
			
			var values = cat.get();
			
			assertObject("values is not an object.", values);
			assertSame("values object has incorrect number of members", 5, _.keys(values).length)
			assertSame("age is incorrect value.", 8, values.age);
			assertSame("name is incorrect value.", "Spot", values.name);
			assertSame("phrase is incorrect value.", "meow", values.phrase);
			assertSame("destroyed is incorrect value.", false, values.destroyed);
			assertObject("plugins is not an object.", values.plugins);
		},
		
		"test base.get": function () {
			var c = Base.create();
			
			c.attributes.test = {
				value: 1,
				readOnly: true
			};
			
			assertSame("attribute value is incorrect", 1, c.get("test"));
		},
		
		"test base.get nested value": function () {
			var Zoo = Base.extend({
				attributes: {
					animal: {
						value: Animal.create()
					}
				}
			});
			
			var zoo = Zoo.create();
			zoo.get("animal").set("name", "Harry");
			
			assertSame("attribute value is incorrect", "Harry", zoo.get("animal.name"));
		},
		
		"test base.get nonexistent nested value returns undefined": function () {
			var Zoo = Base.extend({
				attributes: {
					animal: {
						value: Animal.create()
					}
				}
			});
			
			var zoo = Zoo.create();
			
			assertUndefined("attribute value is incorrect", zoo.get("animal.species"));
		},

		"test base.get nonexistent attribute calls miss": function () {
			var Cat = Animal.extend({
				miss: function (name) {
					return "Missing Attribute";
				}
			});
			
			var cat = Cat.create();
			
			assertSame("get did not receive its value from miss method", "Missing Attribute", cat.get("missing"));
		},

		"test base.get nonexistent attribute": function () {
			var animal = Animal.create();
			
			assertUndefined("get returned incorrect value", animal.get("missing"));
		},
		
		"test base.set": function () {
			var c = Base.create();
			
			c.attributes.test = {
				value: 1
			};
			
			assertSame("attribute has incorrect value", 1, c.get("test"));
			
			var changed = c.set("test", 2);
			assertSame("attribute has incorrect value", 2, c.get("test"));
			assertBoolean("set did not return a boolean", changed);
			assert("set did not return true when the value changed", changed);
			
			changed = c.set("test", 2);
			assertSame("attribute has incorrect value", 2, c.get("test"));
			assertBoolean("set did not return a boolean", changed);
			assertFalse("set did not return true when the value changed", changed);
		},
		
		"test base.set before event": function () {
			expectAsserts(9);
			
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
						
			c.attributes.test = {
				value: 1
			};
			
			c.before("testChange", function (e) {
				try {
					assertSame("context is incorrect", o, this);
					assertSame("context name is incorrect", "foo", this.name);
					assertSame("event name has incorrect value", "testChange", e.name);
					assertSame("src has incorrect value", c, e.src);
					assertBoolean("preventDefault is not a boolean", e.preventDefault);
					assertFalse("preventDefault is not false", e.preventDefault);
					assertSame("attribute name is incorrect", "test", e.info.name);
					assertSame("old value is incorrect", 1, e.info.oldValue);
					assertSame("new value is incorrect", 2, e.info.newValue);
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2);
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set before event preventDefault": function () {
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
						
			c.attributes.test = {
				value: 1
			};
			
			c.before("testChange", function (e) {
				try {
					e.preventDefault = true;
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2);
			
			assertSame("attribute value is incorrect", 1, c.get("test"));
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set on event": function () {
			expectAsserts(9);
			
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
						
			c.attributes.test = {
				value: 1
			};
			
			c.on("testChange", function (e) {
				try {
					assertSame("context is incorrect", o, this);
					assertSame("context name is incorrect", "foo", this.name);
					assertSame("event name has incorrect value", "testChange", e.name);
					assertSame("src has incorrect value", c, e.src);
					assertBoolean("preventDefault is not a boolean", e.preventDefault);
					assertFalse("preventDefault is not false", e.preventDefault);
					assertSame("attribute name is incorrect", "test", e.info.name);
					assertSame("old value is incorrect", 1, e.info.oldValue);
					assertSame("new value is incorrect", 2, e.info.newValue);
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2);
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set after event": function () {
			expectAsserts(9);
			
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
						
			c.attributes.test = {
				value: 1
			};
			
			c.after("testChange", function (e) {
				try {
					assertSame("context is incorrect", o, this);
					assertSame("context name is incorrect", "foo", this.name);
					assertSame("event name has incorrect value", "testChange", e.name);
					assertSame("src has incorrect value", c, e.src);
					assertBoolean("preventDefault is not a boolean", e.preventDefault);
					assertFalse("preventDefault is not false", e.preventDefault);
					assertSame("attribute name is incorrect", "test", e.info.name);
					assertSame("old value is incorrect", 1, e.info.oldValue);
					assertSame("new value is incorrect", 2, e.info.newValue);
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2);
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set generic before change event": function () {
			expectAsserts(9);
			
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
						
			c.attributes.test = {
				value: 1
			};
			
			c.before("change", function (e) {
				try {
					if (e.info.name === "test") {
						assertSame("context is incorrect", o, this);
						assertSame("context name is incorrect", "foo", this.name);
						assertSame("event name has incorrect value", "change", e.name);
						assertSame("src has incorrect value", c, e.src);
						assertBoolean("preventDefault is not a boolean", e.preventDefault);
						assertFalse("preventDefault is not false", e.preventDefault);
						assertSame("attribute name is incorrect", "test", e.info.name);
						assertSame("old value is incorrect", 1, e.info.oldValue);
						assertSame("new value is incorrect", 2, e.info.newValue);
					}
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2);
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set generic before change event preventDefault": function () {
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
						
			c.attributes.test = {
				value: 1
			};
			
			c.before("change", function (e) {
				try {
					if (e.info.name === "test") {
						e.preventDefault = true;
					}
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2);
			
			assertSame("attribute value is incorrect", 1, c.get("test"));
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set generic on change event": function () {
			expectAsserts(9);
			
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
						
			c.attributes.test = {
				value: 1
			};
			
			c.on("change", function (e) {
				try {
					if (e.info.name === "test") {
						assertSame("context is incorrect", o, this);
						assertSame("context name is incorrect", "foo", this.name);
						assertSame("event name has incorrect value", "change", e.name);
						assertSame("src has incorrect value", c, e.src);
						assertBoolean("preventDefault is not a boolean", e.preventDefault);
						assertFalse("preventDefault is not false", e.preventDefault);
						assertSame("attribute name is incorrect", "test", e.info.name);
						assertSame("old value is incorrect", 1, e.info.oldValue);
						assertSame("new value is incorrect", 2, e.info.newValue);
					}
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2);
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set generic after change event": function () {
			expectAsserts(9);
			
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
						
			c.attributes.test = {
				value: 1
			};
			
			c.after("change", function (e) {
				try {
					if (e.info.name === "test") {
						assertSame("context is incorrect.", o, this);
						assertSame("context name is incorrect.", "foo", this.name);
						assertSame("event name has incorrect value.", "change", e.name);
						assertSame("src has incorrect value.", c, e.src);
						assertBoolean("preventDefault is not a boolean.", e.preventDefault);
						assertFalse("preventDefault is not false.", e.preventDefault);
						assertSame("attribute name is incorrect.", "test", e.info.name);
						assertSame("old value is incorrect.", 1, e.info.oldValue);
						assertSame("new value is incorrect.", 2, e.info.newValue);
					}
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2);
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set silently": function () {
			expectAsserts(0);
			
			var error = null;
			
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
			
			c.attributes.test = {
				value: 1
			};
			
			c.before("change", function (e) {
				try {
					assertNotSame("event should not have triggered callbacks.", "test", e.info.name);
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.on("change", function (e) {
				try {
					assertNotSame("event should not have triggered callbacks.", "test", e.info.name);
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.after("change", function (e) {
				try {
					assertNotSame("event should not have triggered callbacks.", "test", e.info.name);
				}
				catch (ex) {
					error = ex;
				}
			}, o);
			
			c.set("test", 2, { silent: true });
			
			if (error !== null) {
				throw error;
			}
		},
		
		"test base.set forcefully": function () {
			var c = Base.create();
			
			var o = {
				name: "foo"
			};
			
			c.attributes.test = {
				value: 1
			};
			
			assertSame("attribute value is incorrect.", 1, c.get("test"));
			
			c.set("test", 2, { force: true });
			assertSame("attribute value is incorrect.", 2, c.get("test"));
		},
		
		"test base.set on non-existant attribute": function ()
		{
			var c = Base.create();
			
			assertUndefined("test attribute is not undefined", c.get("test"));
			
			c.set("test", "foo");
			assertSame("test attribute has incorrect value", "foo", c.get("test"));
		},

		"test base.addAttribute with single attribute": function ()
		{
			var c = Base.create();

			assertUndefined("test attribute is defined", c.getAttribute("test"));
			assertUndefined("test attribute value is defined", c.get("test"));

			c.addAttribute("test", {
				value: "foo"
			});

			assertObject("test attribute is undefined", c.getAttribute("test"));
			assertSame("test attribute value is undefined", "foo", c.get("test"));
		},

		"test base.addAttribute with multiple attributes": function ()
		{
			var c = Base.create();

			assertUndefined("test attribute is defined", c.getAttribute("test"));
			assertUndefined("test attribute value is defined", c.get("test"));
			assertUndefined("foobar attribute is defined", c.getAttribute("foobar"));
			assertUndefined("foobar attribute value is defined", c.get("foobar"));

			c.addAttribute({
				test: {
					value: "foo"
				},
				foobar: {
					value: "foo"
				}
			});

			assertObject("test attribute is undefined", c.getAttribute("test"));
			assertSame("test attribute value is undefined", "foo", c.get("test"));
			assertObject("foobar attribute is undefined", c.getAttribute("foobar"));
			assertSame("foobar attribute value is undefined", "foo", c.get("foobar"));
		},

		"test base.addAttribute with computable value": function ()
		{
			var c = Base.create();
			c.set("name", "Data");

			assertUndefined("test attribute is defined", c.getAttribute("test"));
			assertUndefined("test attribute value is defined", c.get("test"));

			c.addAttribute("test", {
				get: function () {
					return "I am " + this.get("name");
				},
				uses: "name"
			});

			assertObject("test attribute is undefined", c.getAttribute("test"));
			assertSame("name attribute value is incorrect after attribute added", "Data", c.get("name"));
			assertSame("test attribute value is undefined after attribute added", "I am Data", c.get("test"));

			c.set("name", "Worf");

			assertSame("name attribute value is incorrect after change", "Worf", c.get("name"));
			assertSame("test attribute value is undefined after change", "I am Worf", c.get("test"));
		},

		"test base.addAttribute with computable value does not add duplicate event listeners on dependencies": function ()
		{
			var c = Base.create();
			c.set("name", "Data");

			assertUndefined("test attribute is defined", c.getAttribute("test"));
			assertUndefined("test attribute value is defined", c.get("test"));

			c.addAttribute("test", {
				get: function () {
					return "I am " + this.get("name");
				},
				uses: "name"
			});

			assertObject("test attribute is undefined", c.getAttribute("test"));
			assertSame("test attribute dependency handler count is incorrect", 1, c.events["namechange"].after.length);

			c.addAttribute("test2", {
				value: 1
			});

			assertObject("test2 attribute is undefined", c.getAttribute("test2"));
			assertSame("test attribute dependency handler count is incorrect after addAttribute was called again", 1, c.events["namechange"].after.length);
		},
		
		"test base.extend isPrototypeOf": function () {
			var Animal = Base.extend({}),
				Snake = Animal.extend({}),
				snake = Snake.create();
			
			assert("Snake is not a prototype of instance", Snake.isPrototypeOf(snake));
			assert("Animal is not a prototype of instance", Animal.isPrototypeOf(snake));
			assert("Base is not a prototype of instance", Base.isPrototypeOf(snake));
		},
		
		"test base.extend constructor chain": function () {
			var Animal = Base.extend({
				constructor: function () {
					Base.constructor.call(this);
					this.alive = true;
				}
			});
			
			var Snake = Animal.extend({
				constructor: function () {
					Animal.constructor.call(this);
					this.species = "reptile";
				}
			});
			
			var snake = Snake.create();
			
			assertSame("Snake constructor was not called", "reptile", snake.species);
			assert("Animal constructor was not called", snake.alive);
			assertFalse("Base constructor was not called", snake.get("destroyed"));
		},
		
		"test base.extend destructor chain": function () {
			var Animal = Base.extend({
				constructor: function () {
					Base.constructor.call(this);
					this.alive = true;
				},
				destructor: function () {
					Base.destructor.call(this);
					this.alive = false;
				}
			});
			
			var Snake = Animal.extend({
				constructor: function () {
					Animal.constructor.call(this);
					this.species = "reptile";
				},
				destructor: function () {
					Animal.destructor.call(this);
					this.species = "dead reptile";
				}
			});
			
			var snake = Snake.create();
			snake.destroy();
			
			assertSame("Snake destructor was not called", "dead reptile", snake.species);
			assertFalse("Animal destructor was not called", snake.alive);
			assert("Base destructor was not called", snake.get("destroyed"));
		},
		
		"test base.extend method override": function () {
			var Animal = Base.extend({
				alive: true,
				talk: function () {
					return "I'm alive.";
				}
			});
			
			var Snake = Animal.extend({
				talk: function () {
					return "Hsss. " + Animal.talk.call(this);
				}
			});
			
			var snake = Snake.create();
			
			assertSame("method return value is incorrect", "Hsss. I'm alive.", snake.talk());
		},
		
		"test base.extend property override": function () {
			var Animal = Base.extend({
				alive: true,
				talk: function () {
					return "I'm alive.";
				}
			});
			
			var Snake = Animal.extend({
				alive: false,
				talk: function () {
					return "Hsss. " + Animal.talk.call(this);
				}
			});
			
			var snake = Snake.create();
			
			assertFalse("property value is incorrect", snake.alive);
		},

		"test base.mixin with no attributes": function ()
		{
			var Human = Base.extend({
				attributes: {
					name: {
						value: "",
						validator: _.isString
					}
				}
			});

			Human.mixin({
				text: "Hello I am",
				talk: function () {
					return this.text + " " + this.get("name");
				}
			});

			var h = Human.create({
				name: "Data"
			});

			assertSame("the value from talk is incorrect", "Hello I am Data", h.talk());
		},

		"test base.mixin with attributes": function ()
		{
			var Human = Base.extend({
				attributes: {
					name: {
						value: "",
						validator: _.isString
					}
				}
			});

			Human.mixin({
				text: "Hello I am",
				talk: function () {
					return this.text + " " + this.get("name");
				},

				attributes: {
					gender: ""
				},
				speak: function () {
					return this.text + " " + this.get("gender");
				}
			});

			var h = Human.create({
				name: "Picard",
				gender: "male"
			});

			assertSame("the value from talk is incorrect", "Hello I am Picard", h.talk());
			assertSame("the value from talk is incorrect", "Hello I am male", h.speak());
		},
		
		"test base.create attributes parameter": function ()
		{
			var Animal = Base.extend({
				attributes: {
					name: {},
					age: {}
				}
			});
			
			var b = Animal.create({
				name: "Chewie",
				age: 42
			});
			
			assertSame("name attribute has incorrect value", "Chewie", b.get("name"));
			assertSame("age attribute has incorrect value", 42, b.get("age"));
		},

		"test base.proxy member does not change origin object": function ()
		{
			var b = Base.create();

			assertUndefined("the origin object has testName", b.testName);

			var c = b.proxy({
				testName: "Test"
			});

			assertUndefined("the origin object has testName", b.testName);
			assertString("the proxy object does not have testName", c.testName);
		},

		"test base.proxy attribute does not change origin object": function ()
		{
			var b = Base.create();

			assertUndefined("the origin object has a testName attribute", b.getAttribute("testName"));

			var c = b.proxy({
				attributes: {
					"testName": { value: "test attr" }
				}
			});

			assertUndefined("the origin object has a testName attribute", b.getAttribute("testName"));
			assertObject("the proxy object does not have a testName attribute", c.getAttribute("testName"));

			assertUndefined("the origin object has a testName attribute value", b.get("testName"));
			assertSame("the proxy object has a testName attribute value", "test attr", c.get("testName"));

			c.set("testName", "foobar");

			assertUndefined("the origin object has a testName attribute after set", b.getAttribute("testName"));
			assertObject("the proxy object does not have a testName attribute after set", c.getAttribute("testName"));

			assertSame("the proxy object has a testName attribute value after set", "foobar", c.get("testName"));
		}
	};
});