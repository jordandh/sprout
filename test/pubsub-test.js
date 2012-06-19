TestCase("pubsub", ["sprout/util", "sprout/pubsub"], function (_, pubsub) {
    return {
        "test pubsub.subscribe": function ()
        {
            expectAsserts(6);
            
            var error = null;
            
            var src = {};
            
            var handle = pubsub.subscribe("msg", function (e) {
                try {
                    assertObject("e is not an object", e);
                    assertSame("name is incorrect", "msg", e.name);
                    assertSame("src is incorrect", src, e.src);
                    assertObject("e.info is not an object", e.info);
                    assertSame("e.info.one has incorrect value", 1, e.info.one);
                    assertSame("e.info.two has incorrect value", 2, e.info.two);
                }
                catch (ex) {
                    error = ex;
                }
            });
            
            pubsub.publish("msg", { one: 1, two: 2 }, src);
            
            pubsub.unsubscribe(handle);
            
            if (error !== null) {
                throw error;
            }
        },
        
        "test pubsub.subscribe context": function ()
        {
            expectAsserts(1);
            
            var error = null;
            
            var src = {},
                o = {};
            
            var handle = pubsub.subscribe("msg", function (e) {
                try {
                    assertSame("context is incorrect", o, this);
                }
                catch (ex) {
                    error = ex;
                }
            }, o);
            
            pubsub.publish("msg", null, src);
            
            pubsub.unsubscribe(handle);
            
            if (error !== null) {
                throw error;
            }
        },
        
        "test pubsub.unsubscribe": function ()
        {
            expectAsserts(1);
            
            var error = null;
            
            var handle = pubsub.subscribe("msg", function (e) {
                try {
                    assert("msg received", true);
                }
                catch (ex) {
                    error = ex;
                }
            });
            
            pubsub.publish("msg");
            
            pubsub.unsubscribe(handle);
            
            pubsub.publish("msg");
            
            if (error !== null) {
                throw error;
            }
        }
    };
});