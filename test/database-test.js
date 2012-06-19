TestCase("database", ["sprout/util", "sprout/viewmodel", "sprout/database"], function (_, viewModel, dbms) {
    var foo = viewModel.extend({
        rootUrl: "/assets/sprout/test/database-test.json",
        expires: 30 * 60 * 1000
    });

    var bar = viewModel.extend({
        rootUrl: "/assets/sprout/test/database-no-cache-test.json",
        expires: 0
    });
    
    return {
        "test database.get": function () {
            var db = dbms.get("test-get");
            
            assertObject("get did not create a database", db);

            var db2 = dbms.get("test-get");

            assertObject("get did not return a database", db);
            assertSame("get did not return same database", db, db2);
        },

        "test database.sync": function () {
            expectAsserts(8);

            var error = null;

            var db = dbms.get("test-sync"),
                vm = foo.create();

            vm.before("sync", function (e) {
                try {
                    assertSame("sync event did not come from the same view model", vm, e.src);
                    assertSame("options.type value is incorrect", "GET", e.info.options.type);
                    assertSame("options.dataType value is incorrect", "json", e.info.options.dataType);
                    assertSame("options.url value is incorrect", vm.url(), e.info.options.url);
                }
                catch (ex) {
                    error = ex;
                }
            });

            db.sync(vm).done(async(function (data, status, xhr) {
                assertSame("status value is incorrect.", "success", status);
                assertObject("xhr is not an object.", xhr);
                assertObject("data is not an object.", data);
                assertSame("data.name value is incorrect.", "Data", data.name);
            }));

            if (error !== null) {
                throw error;
            }
        },

        "test database.sync cache": function () {
            expectAsserts(6);

            var error = null;

            var db = dbms.get("test-sync"),
                vm = foo.create();

            db.sync(vm).done(async(function (data, status) {
                assertSame("status value is incorrect.", "success", status);
                assertSame("data.name value is incorrect.", "Data", data.name);
                assertSame("data.age value is incorrect.", 26, data.age);

                var cachedData = db.cache[vm.url()];
                assertObject("data is not cached", cachedData);
                assertSame("cached data.name value is incorrect", "Data", cachedData.data.name);
                assertSame("cached data.age value is incorrect", 26, cachedData.data.age);
            }));

            if (error !== null) {
                throw error;
            }
        },

        "test database.sync does not cache for expires = 0": function () {
            expectAsserts(4);

            var foobar = viewModel.extend({
                rootUrl: "/assets/sprout/test/database-test.json?cb=test-expires-0",
                expires: 0
            });

            var db = dbms.get("test-sync"),
                vm = foobar.create();

            db.sync(vm).done(async(function (data, status) {
                assertSame("status value is incorrect.", "success", status);
                assertSame("data.name value is incorrect.", "Data", data.name);
                assertSame("data.age value is incorrect.", 26, data.age);

                var cachedData = db.cache[vm.url()];
                assertUndefined("data is cached", cachedData);
            }));
        },

        "test database.sync caches for no expires": function () {
            expectAsserts(6);

            var foobar = viewModel.extend({
                rootUrl: "/assets/sprout/test/database-test.json?cb=test-no-expires"
            });

            var db = dbms.get("test-sync"),
                vm = foobar.create();

            db.sync(vm).done(async(function (data, status) {
                assertSame("status value is incorrect.", "success", status);
                assertSame("data.name value is incorrect.", "Data", data.name);
                assertSame("data.age value is incorrect.", 26, data.age);

                var cachedData = db.cache[vm.url()];
                assertObject("data is not cached", cachedData);
                assertSame("cached data.name value is incorrect", "Data", cachedData.data.name);
                assertSame("cached data.age value is incorrect", 26, cachedData.data.age);
            }));
        },

        "test database.sync cache does expire": function () {
            expectAsserts(10);

            var foobar = viewModel.extend({
                rootUrl: "/assets/sprout/test/database-expire-test.json",
                expires: 5 * 1000
            });

            var db = dbms.get("test-sync"),
                vm = foobar.create(),
                syncCount = 0;

            vm.before("sync", function (e) {
                try {
                    syncCount += 1;
                }
                catch (ex) {
                    error = ex;
                }
            });

            db.sync(vm).done(async(function (data, status) {
                assertSame("status value is incorrect.", "success", status);
                assertSame("data.name value is incorrect.", "Data", data.name);
                assertSame("data.age value is incorrect.", 26, data.age);

                db.sync(vm).done(async(function (data, status) {
                    assertSame("status value is incorrect.", "success", status);
                    assertSame("data.name value is incorrect.", "Data", data.name);
                    assertSame("data.age value is incorrect.", 26, data.age);

                    setTimeout(async(function () {
                        db.sync(vm).done(async(function (data, status) {
                            assertSame("status value is incorrect.", "success", status);
                            assertSame("data.name value is incorrect.", "Data", data.name);
                            assertSame("data.age value is incorrect.", 26, data.age);
                            assertSame("sync count has incorrect value", 2, syncCount);
                        }));
                    }), vm.expires + 1000);
                }));
            }));
        },

        "test database.sync 404": function () {
            expectAsserts(5);

            var foobar = viewModel.extend({
                rootUrl: "/assets/sprout/test/database-does-not-exist-test.json",
                expires: 30 * 60 * 1000
            });

            var db = dbms.get("test-sync"),
                vm = foobar.create();

            vm.after("sync", async(function (e) {
                assertSame("status has incorrect value", "error", e.info.status);
                assertSame("error has incorrect value", "Not Found", e.info.error);
            }));

            db.sync(vm).fail(async(function (xhr, status, error) {
                assertSame("status value is incorrect.", "error", status);
                assertSame("error value is incorrect.", "Not Found", _.trim(error));
                assertObject("xhr is not an object.", xhr);
            }));
        },

        "test database.sync abort via sync event": function () {
            expectAsserts(2);

            var foobar = viewModel.extend({
                rootUrl: "/assets/sprout/test/database-abort-sync-test.json",
                expires: 30 * 60 * 1000
            });

            var db = dbms.get("test-sync"),
                vm = foobar.create();

            vm.before("sync", function (e) {
                assertSame("sync event did not come from the same view model", vm, e.src);
                e.preventDefault = true;
            });

            db.sync(vm).fail(function (data, status) {
                assertSame("status value is incorrect.", "abort", status);
            });
        },

        "test database.sync with options.url override": function () {
            expectAsserts(3);

            var error = null;

            var db = dbms.get("test-sync"),
                vm = bar.create();

            db.sync(vm, { url: "/assets/sprout/test/database-url-override-test.json" }).done(async(function (data, status) {
                try {
                    assertSame("status value is incorrect.", "success", status);
                    assertSame("data.name value is incorrect.", "Lore", data.name);
                    assertSame("data.age value is incorrect.", 27, data.age);
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