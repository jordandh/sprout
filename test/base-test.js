TestCase("base", ["underscore", "base"], function (_, Base) {
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
			var c = Base.new();
			assert("c is destroyed", !c.get("destroyed"));
			assert("c does not have its own attributes property", c.hasOwnProperty("attributes"));
			assertObject("attributes is not an object", c.attributes);
		},
		
		"test base.destructor": function () {
			var c = Base.new();
			
			assert("c is destroyed.", !c.get("destroyed"));
			
			c.destroy();
			
			assert("c is not destroyed.", c.get("destroyed"));
			assertUndefined("c.plugins is not undefined.", c.get("plugins"));
		},
		
		"test base.fire": function () {
			expectAsserts(2);
			
			var c = Base.new();
			
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

			var c = Base.new();

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
			
			var c = Base.new();
			
			c.before("test", function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			});
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.on": function () {
			expectAsserts(1);
			
			var c = Base.new();
			
			c.on("test", function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			});
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.after": function () {
			expectAsserts(1);
			
			var c = Base.new();
			
			c.after("test", function (e) {
				assert("foo does not equal bar", e.info.foo === "bar");
			});
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.before preventDefault and preventedAction": function () {
			expectAsserts(2);
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
			c.after("test", handler);
			
			c.fire("test", { foo: "bar" });
			
			c.detachAfter("test", handler);
			
			c.fire("test", { foo: "bar" });
		},
		
		"test base.attributes default value": function () {
			var c = Base.new();
			
			assertFalse("attribute has incorrect value", c.get("destroyed"));
		},
		
		"test base.attributes validator": function () {
			var c = Animal.new();
			
			assertSame("attribute has incorrect value", "", c.get("name"));
			
			c.set("name", 2);
			assertSame("attribute has incorrect value", "", c.get("name"));
			
			c.set("name", "Spot");
			assertSame("attribute has incorrect value", "Spot", c.get("name"));
			
			
			c.set("name", 2);
			assertSame("attribute has incorrect value", "Spot", c.get("name"));
		},
		
		"test base.attributes readOnly": function () {
			var c = Base.new();
			
			c.attributes.test = {
				value: 1,
				readOnly: true
			};
			
			assertSame("attribute has incorrect value", 1, c.get("test"));
			
			c.set("test", 2);
			assertSame("attribute has incorrect value", 1, c.get("test"));
		},
		
		"test base.attributes setter": function () {
			expectAsserts(3);
			
			var c = Base.new();
			
			c.attributes.test = {
				value: 1,
				setter: function (newValue, oldValue, name) {
					assertSame("attribute name has incorrect value", "test", name);
					assertSame("attribute old value has incorrect value", 1, oldValue);
					assertSame("attribute new value has incorrect value", 2, newValue);
					return newValue;
				}
			};
			
			c.set("test", 2);
		},
		
		"test base.attributes setter returning a value": function () {
			var c = Base.new();
			
			c.attributes.test = {
				value: 1,
				setter: function (newValue, oldValue, name) {
					return 3;
				}
			};
			
			assertSame("attribute has incorrect value", 1, c.get("test"));
			
			c.set("test", 2);
			assertSame("attribute has incorrect value", 3, c.get("test"));
		},
		
		"test base.attributes setter returning undefined": function () {
			var c = Base.new();
			
			c.attributes.test = {
				value: 1,
				setter: function (newValue, oldValue, name) {
				}
			};
			
			assertSame("attribute has incorrect value", 1, c.get("test"));
			
			c.set("test", 2);
			assertSame("attribute has incorrect value", 1, c.get("test"));
		},
		
		"test base.attributes handler with <attribute name>Changed function": function () {
			expectAsserts(5);
			
			var c = Base.new();
			
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
			
			var cat = Cat.new();
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
			var c = Base.new();
			
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
						value: Animal.new()
					}
				}
			});
			
			var zoo = Zoo.new();
			zoo.get("animal").set("name", "Harry");
			
			assertSame("attribute value is incorrect", "Harry", zoo.get("animal.name"));
		},
		
		"test base.get nonexistent nested value returns undefined": function () {
			var Zoo = Base.extend({
				attributes: {
					animal: {
						value: Animal.new()
					}
				}
			});
			
			var zoo = Zoo.new();
			
			assertUndefined("attribute value is incorrect", zoo.get("animal.species"));
		},
		
		"test base.set": function () {
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			
			var c = Base.new();
			
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
			var c = Base.new();
			
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
			var c = Base.new();
			
			assertUndefined("test attribute is not undefined", c.get("test"));
			
			c.set("test", "foo");
			assertSame("test attribute has incorrect value", "foo", c.get("test"));
		},
		
		"test base.extend isPrototypeOf": function () {
			var Animal = Base.extend({}),
				Snake = Animal.extend({}),
				snake = Snake.new();
			
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
			
			var snake = Snake.new();
			
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
			
			var snake = Snake.new();
			snake.destroy();
			
			assertSame("Snake destructor was not called", "dead reptile", snake.species);
			assertFalse("Animal destructor was not called", snake.alive);
			assert("Base destructor was not called", snake.get("destroyed"));
		},
		
		"test base.extend method override": function () {
			var Animal = Base.extend({
				alive: true,
				talk: function () {
					return "I'm alive."
				}
			});
			
			var Snake = Animal.extend({
				talk: function () {
					return "Hsss. " + Animal.talk.call(this);
				}
			});
			
			var snake = Snake.new();
			
			assertSame("method return value is incorrect", "Hsss. I'm alive.", snake.talk());
		},
		
		"test base.extend property override": function () {
			var Animal = Base.extend({
				alive: true,
				talk: function () {
					return "I'm alive."
				}
			});
			
			var Snake = Animal.extend({
				alive: false,
				talk: function () {
					return "Hsss. " + Animal.talk.call(this);
				}
			});
			
			var snake = Snake.new();
			
			assertFalse("property value is incorrect", snake.alive);
		},
		
		"test base.new attributes parameter": function ()
		{
			var Animal = Base.extend({
				attributes: {
					name: {},
					age: {}
				}
			});
			
			var b = Animal.new({
				name: "Chewie",
				age: 42
			});
			
			assertSame("name attribute has incorrect value", "Chewie", b.get("name"));
			assertSame("age attribute has incorrect value", 42, b.get("age"));
		}
	};
});