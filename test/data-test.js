TestCase("data", ["model", "data"], function (model, data) {
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
		"test data.sync read": function () {
			expectAsserts(9);

			var error = null;

			var mod = foo.new();

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

		"test data.sync update": function () {
			expectAsserts(11);

			var error = null;

			var mod = foo.new();

			mod.before("sync", function (e) {
				try {
					assertSame("sync event did not come from the same model", mod, e.src);
					assertSame("method value is incorrect", "update", e.info.method);
					assertSame("options.type value is incorrect", "PUT", e.info.options.type);
					assertSame("options.dataType value is incorrect", "json", e.info.options.dataType);
					assertSame("options.dataType value is incorrect", "application/json", e.info.options.contentType);
					assertFalse("options.dataType value is incorrect", e.info.options.processData);
					assertSame("options.url value is incorrect", mod.url(), e.info.options.url);
				}
				catch (ex) {
					error = ex;
				}
			});

			data.sync("update", mod).done(async(function (data, status, xhr) {
				assertSame("status value is incorrect.", "success", status);
				assertObject("xhr is not an object.", xhr);
				assertObject("data is not an object.", data);
				assertSame("data.name value is incorrect.", "data-test", data.name);
			}));

			if (error !== null) {
				throw error;
			}
		},

		"test data.sync create": function () {
			expectAsserts(11);

			var error = null;

			var mod = foo.new();

			mod.before("sync", function (e) {
				try {
					assertSame("sync event did not come from the same model", mod, e.src);
					assertSame("method value is incorrect", "create", e.info.method);
					assertSame("options.type value is incorrect", "POST", e.info.options.type);
					assertSame("options.dataType value is incorrect", "json", e.info.options.dataType);
					assertSame("options.dataType value is incorrect", "application/json", e.info.options.contentType);
					assertFalse("options.dataType value is incorrect", e.info.options.processData);
					assertSame("options.url value is incorrect", mod.url(), e.info.options.url);
				}
				catch (ex) {
					error = ex;
				}
			});

			data.sync("create", mod).done(async(function (data, status, xhr) {
				assertSame("status value is incorrect.", "success", status);
				assertObject("xhr is not an object.", xhr);
				assertObject("data is not an object.", data);
				assertSame("data.name value is incorrect.", "data-test", data.name);
			}));

			if (error !== null) {
				throw error;
			}
		},

		"test data.sync delete": function () {
			expectAsserts(9);

			var error = null;

			var mod = foo.new();

			mod.before("sync", function (e) {
				try {
					assertSame("sync event did not come from the same model", mod, e.src);
					assertSame("method value is incorrect", "delete", e.info.method);
					assertSame("options.type value is incorrect", "DELETE", e.info.options.type);
					assertSame("options.dataType value is incorrect", "json", e.info.options.dataType);
					assertFalse("options.dataType value is incorrect", e.info.options.processData);
					assertSame("options.url value is incorrect", mod.url(), e.info.options.url);
				}
				catch (ex) {
					error = ex;
				}
			});

			data.sync("delete", mod).done(async(function (data, status, xhr) {
				assertSame("status value is incorrect.", "success", status);
				assertNull("xhr is not an object.", xhr);
				assertNull("data is not an object.", data);
			}));

			if (error !== null) {
				throw error;
			}
		},

		"test data.sync 404": function () {
			expectAsserts(5);

			var mod = bar.new();

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

		"test data.sync abort via sync event": function ()
		{
			expectAsserts(2);

			var mod = foo.new();

			mod.before("sync", function (e) {
				assertSame("method value is incorrect", "read", e.info.method);
				e.preventDefault = true;
			});

			data.sync("read", mod).fail(function (xhr, status, error) {
				assertSame("status value is incorrect.", "abort", status);
			});
		},

		"test data.sync with options.url override": function () {
			expectAsserts(4);

			var error = null;

			var mod = bar.new();

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