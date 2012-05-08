TestCase("database", ["viewmodel", "database"], function (viewModel, database) {
    var foo = model.extend({
        url: function () {
            return "/assets/test/data-test.json";
        }
    });

    var bar = model.extend({
        url: function () {
            return "/assets/test/does-not-exist-test.json";
        }
    });
    
    return {
        "test database.sync": function () {
            expectAsserts(9);

            var error = null;

            var mod = foo.create();

            mod.before("sync", function (e) {
                try {
                    assertSame("sync event did not come from the same model", mod, e.src);
                    assertSame("method value is incorrect", "read", e.info.method);
                    assertSame("options.type value is incorrect", "GET", e.info.options.type);
                    assertSame("options.dataType value is incorrect", "json", e.info.options.dataType);
                    assertSame("options.url value is incorrect", mod.url(), e.info.options.url);
                }
                catch (ex) {
                    error = ex;
                }
            });

            data.sync("read", mod).done(async(function (data, status, xhr) {
                assertSame("status value is incorrect.", "success", status);
                assertObject("xhr is not an object.", xhr);
                assertObject("data is not an object.", data);
                assertSame("data.name value is incorrect.", "data-test", data.name);
            }));

            if (error !== null) {
                throw error;
            }
        },

        "test database.sync 404": function () {
            expectAsserts(5);

            var mod = bar.create();

            mod.after("sync", async(function (e) {
                assertSame("status has incorrect value", "error", e.info.status);
                assertSame("error has incorrect value", "Not Found", e.info.error);
            }));

            data.sync("read", mod).fail(async(function (xhr, status, error) {
                assertSame("status value is incorrect.", "error", status);
                assertSame("error value is incorrect.", "Not Found", error);
                assertObject("xhr is not an object.", xhr);
            }));
        },

        "test database.sync abort via sync event": function ()
        {
            expectAsserts(2);

            var mod = foo.create();

            mod.before("sync", function (e) {
                assertSame("method value is incorrect", "read", e.info.method);
                e.preventDefault = true;
            });

            data.sync("read", mod).fail(function (xhr, status, error) {
                assertSame("status value is incorrect.", "abort", status);
            });
        },

        "test database.sync with options.url override": function () {
            expectAsserts(4);

            var error = null;

            var mod = bar.create();

            data.sync("read", mod, { url: "/assets/test/data-test.json" }).done(async(function (data, status, xhr) {
                try {
                    assertSame("status value is incorrect.", "success", status);
                    assertObject("xhr is not an object.", xhr);
                    assertObject("data is not an object.", data);
                    assertSame("data.name value is incorrect.", "data-test", data.name);
                }
                catch (ex) {
                    error = ex;
                }
            }));

            if (error !== null) {
                throw error;
            }
        }
    };
});