TestCase("plugin", ["sprout/base", "sprout/plugin"], function (Base, Plugin) {
	return {
		setUp: function () {
			this.TestPlugin = Plugin.extend({
				constructor: function (host) {
					Plugin.constructor.call(this, host);
					
					this.attachMembers({
						foo: 1,
						bar: 2,
						detachMembers: function () {
							this.detachMembers(["foo", "bar"]);
						},
						detachAttributes: function () {
							this.detachAttributes(["foo", "bar"]);
						}
					});
					
					this.attachAttributes({
						foo: {
							value: 1
						},
						bar: {
							value: 2
						}
					});
				},
				
				name: "TestPlugin"
			});
		},
		
		"test plugin.name": function () {
			var o = Base.create();
			o.plug(this.TestPlugin);
			
			assertObject("plugin name not used correctly", o.get("plugins").TestPlugin);
		},
		
		"test plugin.attachMembers": function () {
			var o = Base.create();
			o.plug(this.TestPlugin);
			
			assertSame("foo member was not attached", 1, o.foo);
			assertSame("bar member was not attached", 2, o.bar);
		},
		
		"test plugin.attachAttributes": function () {
			var o = Base.create();
			o.plug(this.TestPlugin);
			
			assertSame("foo member was not attached", 1, o.get("foo"));
			assertSame("bar member was not attached", 2, o.get("bar"));
		},
		
		"test plugin.detachMembers": function () {
			var o = Base.create();
			o.plug(this.TestPlugin);
			
			assertSame("foo member was not attached", 1, o.foo);
			assertSame("bar member was not attached", 2, o.bar);
			
			o.detachMembers();
			
			assertUndefined("foo member was not detached", o.foo);
			assertUndefined("bar member was not detached", o.bar);
		},
		
		"test plugin.detachAttributes": function () {
			var o = Base.create();
			o.plug(this.TestPlugin);
			
			assertSame("foo member was not attached", 1, o.get("foo"));
			assertSame("bar member was not attached", 2, o.get("bar"));
			
			o.detachAttributes();
			
			assertUndefined("foo attribute was not detached", o.get("foo"));
			assertUndefined("bar attribute was not detached", o.get("bar"));
		},
		
		"test plugin detaches when unplugged": function () {
			var o = Base.create();
			o.plug(this.TestPlugin);
			
			assertSame("foo member was not attached", 1, o.foo);
			assertSame("bar member was not attached", 2, o.bar);
			assertSame("foo member was not attached", 1, o.get("foo"));
			assertSame("bar member was not attached", 2, o.get("bar"));
			
			o.unplug(this.TestPlugin);
			
			assertUndefined("foo member was not detached", o.foo);
			assertUndefined("bar member was not detached", o.bar);
			assertUndefined("foo attribute was not detached", o.get("foo"));
			assertUndefined("bar attribute was not detached", o.get("bar"));
		},
		
		"test plugin is destroyed when host is destroyed": function () {
			var o = Base.create();
			o.plug(this.TestPlugin);
			
			var plugin = o.get("plugins").TestPlugin;
			
			assertFalse("plugin is already destroyed", plugin.get("destroyed"));
			assertSame("foo member was not attached", 1, o.foo);
			assertSame("bar member was not attached", 2, o.bar);
			assertSame("foo member was not attached", 1, o.get("foo"));
			assertSame("bar member was not attached", 2, o.get("bar"));
			
			o.destroy();
			
			assert("host was not destroyed", o.get("destroyed"));
			assert("plugin was not destroyed", plugin.get("destroyed"));
			assertUndefined("foo member was not detached", o.foo);
			assertUndefined("bar member was not detached", o.bar);
			assertUndefined("foo attribute was not detached", o.get("foo"));
			assertUndefined("bar attribute was not detached", o.get("bar"));
		}
	};
});