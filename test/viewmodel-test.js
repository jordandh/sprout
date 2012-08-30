TestCase("viewmodel", ["sprout/util", "sprout/viewmodel", "sprout/database"], function (_, viewModel, database) {
    var foo = viewModel.extend({
        rootUrl: "/assets/sprout/test/viewmodel-test.json",
        expires: 30 * 60 * 1000,
        parse: function (json) {
            this.set("name", json.name);
            this.set("age", json.age);
        }
    });

    var bar = viewModel.extend({
        attributes: {
            id: {
                value: 1
            }
        },
        rootUrl: "/assets/sprout/test/viewmodel-no-cache-test.json?test={id}",
        expires: 0
    });

    return {
        "test viewmodel.db": function () {
            var vm = foo.create();
            
            assertSame("default db name is incorrect", database.defaultDatabaseName, vm.get("db"));
        },

        "test viewmodel.url": function () {
            var vm = foo.create();
            
            assertSame("url returned incorrect value", "/assets/sprout/test/viewmodel-test.json", vm.url());
        },

        "test viewmodel.url supplant": function () {
            var vm = bar.create();
            
            assertSame("url returned incorrect value", "/assets/sprout/test/viewmodel-no-cache-test.json?test=1", vm.url());

            vm.set("id", 2);
            assertSame("url returned incorrect value", "/assets/sprout/test/viewmodel-no-cache-test.json?test=2", vm.url());
        },
        
        "test viewmodel.parse": function () {
            var vm = foo.create();

            vm.parse({
                name: "Lore",
                age: 27
            });

            assertSame("name has incorrect value", "Lore", vm.get("name"));
            assertSame("age has incorrect value", 27, vm.get("age"));
        },

        "test viewmodel.update event fires on attribute change in parse": function ()
        {
            expectAsserts(2);

            var error = null;

            var vm = bar.create();

            vm.parse({
                one: 1,
                two: 2
            });

            assertSame("vm.one has incorrect value", 1, vm.get("one"));

            vm.after("update", function (e) {
                try {
                    assertSame("vm.one has incorrect value after update", 11, e.src.get("one"));
                }
                catch (ex) {
                    error = ex;
                }
            });

            vm.parse({
                one: 11
            });

            if (error !== null) {
                throw error;
            }
        },

        "test viewmodel.update event does not fire on no attributes changed in parse": function ()
        {
            expectAsserts(1);

            var error = null;

            var vm = bar.create();

            vm.parse({
                one: 1,
                two: 2
            });

            assertSame("vm.one has incorrect value", 1, vm.get("one"));

            vm.after("update", function (e) {
                try {
                    assert("model should not have fired update event", false);
                }
                catch (ex) {
                    error = ex;
                }
            });

            vm.parse({
                one: 1,
                two: 2
            });

            if (error !== null) {
                throw error;
            }
        },

        "test viewmodel.fetch": function () {
            expectAsserts(2);

            var vm = foo.create();

            vm.fetch().done(async(function () {
                assertSame("name has incorrect value", "Data", vm.get("name"));
                assertSame("age has incorrect value", 26, vm.get("age"));
            }));
        },

        "test viewmodel.fetch 404": function () {
            expectAsserts(3);

            var vm = bar.create();

            vm.fetch({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
                assertSame("status value is incorrect.", "error", status);
                assertSame("error value is incorrect.", "Not Found", _.trim(error));
                assertObject("xhr is not an object.", xhr);
            }));
        },

        "test viewmodel.fetch sync error event": function ()
        {
            expectAsserts(8);

            var vm = bar.create();

            vm.after("error", async(function (e) {
                assertSame("event name is incorrect", "error", e.name);
                assertSame("event src is incorrect", vm, e.src);
                assertSame("status has incorrect value", "error", e.info.status);
                assertSame("error has incorrect value", "Not Found", e.info.error);
                assertObject("xhr has incorrect value", e.info.xhr);
            }));

            vm.fetch({ url: "/assets/test/does-not-exist-test" }).fail(async(function (xhr, status, error) {
                assertSame("status value is incorrect.", "error", status);
                assertSame("error value is incorrect.", "Not Found", _.trim(error));
                assertObject("xhr is not an object.", xhr);
            }));
        }
    };
});