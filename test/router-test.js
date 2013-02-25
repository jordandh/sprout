TestCase("router", ["sprout/router"], function (router) {
    var hasHistory = window.history && window.history.pushState,
        hasHash = "onhashchange" in window && (document.documentMode === undefined || document.documentMode > 7);

    if (!hasHistory) {
        return {};
    }
    
    return {
        tearDown: function () {
            if (hasHistory) {
                window.history.replaceState({}, document.title, "/jsUnitTest.htm");
            }
            else if (hasHash) {
                window.location.hash = "";
            }
        },

        "test router.destroy": function ()
        {
            var r = router.create();
            r.start();

            assertFunction("bound listener is not defined", r.boundListener);

            r.destroy();

            assertNull("bound listener is defined", r.boundListener);
            assertNull("routes is defined", r.routes);
            assertNull("rootUrl is defined", r.rootUrl);
        },

        "test router.start": function ()
        {
            var r = router.create();
            r.start();

            assertSame("rootUrl has incorrect value", "", r.rootUrl);

            r.destroy();
        },

        "test router.stop": function ()
        {
            expectAsserts(3);

            var r = router.create();
            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: function () {
                        assert("router is listening to history changes after stop", false);
                    }
                },
                "department": {
                    path: "starfleet/:department/:doctor",
                    start: function () {
                        assert("this assert should be called", true);
                    }
                }
            });

            r.start("jsUnitTest.htm/startrek");
            assertFunction("bound listener is not defined", r.boundListener);

            r.navigate("starfleet/medical/bcrusher");
            r.stop();
            r.navigate("starfleet");

            assertNull("bound listener is defined", r.boundListener);
        },

        "test router.start with rootUrl as plain string": function ()
        {
            var r = router.create();
            r.start("jsUnitTest.htm");

            assertSame("rootUrl has incorrect value", "jsUnitTest.htm", r.rootUrl);

            r.destroy();
        },

        "test router.start with rootUrl as variable string": function ()
        {
            var r = router.create();
            r.start("jsUnitTest.:ext");

            assertSame("rootUrl has incorrect value", "jsUnitTest.htm", r.rootUrl);

            r.destroy();
        },

        "test router.start with rootUrl as regexp": function ()
        {
            var r = router.create();
            r.start(/^jsUnitTest\.\w+/);

            assertSame("rootUrl has incorrect value", "jsUnitTest.htm", r.rootUrl);

            r.destroy();
        },

        "test router.add single route": function () {
            var r = router.create(),
                onStarfleet = function () {},
                o = {};

            r.add("starfleet", {
                path: "starfleet",
                start: onStarfleet,
                context: o
            });

            assertObject("router.routes is not an object", r.routes);
            assertObject("starfleet route is not in router", r.routes.starfleet);
            assertSame("starfleet route does not have correct start handler", onStarfleet, r.routes.starfleet.start);
            assertSame("starfleet route does not have correct context", o, r.routes.starfleet.context);

            r.destroy();
        },

        "test router.add multiples routes with value as object": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            assertObject("router.routes is not an object", r.routes);
            assertObject("starfleet route is not in router", r.routes.starfleet);
            assertSame("starfleet route does not have correct start handler", onStarfleet, r.routes.starfleet.start);
            assertSame("starfleet route does not have correct context", o, r.routes.starfleet.context);

            assertObject("medical route is not in router", r.routes.medical);
            assertSame("medical route does not have correct start handler", onMedical, r.routes.medical.start);
            assertSame("medical route does not have correct context", med, r.routes.medical.context);

            r.destroy();
        },

        "test router.add throws exception for existing route": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onStarfleet2 = function () {},
                o = {},
                o2 = {};

            r.add("starfleet", {
                path: "starfleet",
                start: onStarfleet,
                context: o
            });

            assertObject("router.routes is not an object", r.routes);
            assertObject("starfleet route is not in router", r.routes.starfleet);
            assertSame("starfleet route does not have correct start handler", onStarfleet, r.routes.starfleet.start);
            assertSame("starfleet route does not have correct context", o, r.routes.starfleet.context);

            assertException("add did not throw correct exception", function () {
                r.add("starfleet", {
                    path: "starfleet",
                    start: onStarfleet2,
                    context: o2
                });
            }, "Error");

            assertObject("router.routes is not an object after exception", r.routes);
            assertObject("starfleet route is not in router exception", r.routes.starfleet);
            assertSame("starfleet route does not have correct start handler exception", onStarfleet, r.routes.starfleet.start);
            assertSame("starfleet route does not have correct context exception", o, r.routes.starfleet.context);

            r.destroy();
        },

        "test router.add single route with regexp": function () {
            var r = router.create(),
                onStarfleet = function () {},
                o = {};

            r.add("starfleet", {
                path: /^starfleet/,
                start: onStarfleet,
                context: o
            });

            assertObject("router.routes is not an object", r.routes);
            assertObject("starfleet route is not in router", r.routes.starfleet);
            assertSame("starfleet route does not have correct start handler", onStarfleet, r.routes.starfleet.start);
            assertSame("starfleet route does not have correct context", o, r.routes.starfleet.context);

            r.destroy();
        },

        "test router.add single route matches after start": function () {
            expectAsserts(1);

            var r = router.create(),
                onStarfleet = function () {
                    assert("this assert should be called", true);
                },
                o = {};

            r.start("jsUnitTest.htm");
            r.navigate("st/starfleet");

            r.add("starfleet", {
                path: "st/starfleet",
                start: onStarfleet,
                context: o
            });

            r.destroy();
        },

        "test router.add multiple routes matches after start": function () {
            expectAsserts(1);

            var r = router.create(),
                onStarfleet = function () {
                    assert("this assert should be called", true);
                },
                onMedical = function () {},
                o = {},
                med = {};

            r.start("jsUnitTest.htm");
            r.navigate("trek/starfleet");

            r.add({
                "starfleet": {
                    path: "trek/starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "trek/starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            r.destroy();
        },

        "test router.remove": function () {
            var r = router.create(),
                onStarfleet = function () {},
                o = {};

            r.add("starfleet", {
                path: "starfleet",
                start: onStarfleet,
                context: o
            });

            assertObject("router.routes is not an object", r.routes);
            assertObject("starfleet route is not in router", r.routes.starfleet);

            r.remove("starfleet");

            assertObject("router.routes is not an object", r.routes);
            assertUndefined("starfleet route is still in router", r.routes.starfleet);

            r.destroy();
        },

        "test router.match plain text single path": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onStarfleet, result[0].route.start);
            assertArray("route parameters has incorrect value", result[0].parameters);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match root path": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onStarfleet, result[0].route.start);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match root path with leading /": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("/");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onStarfleet, result[0].route.start);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match plain text multiple path": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet/medical");

            assertArray("starfleet/medical did not match", result);
            assertSame("starfleet/medical did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onMedical, result[0].route.start);
            assertSame("route has incorrect context", med, result[0].route.context);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match plain text single path with leading /": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("/starfleet");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onStarfleet, result[0].route.start);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match plain text multiple path with leading /": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("/starfleet/medical");

            assertArray("starfleet/medical did not match", result);
            assertSame("starfleet/medical did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onMedical, result[0].route.start);
            assertSame("route has incorrect context", med, result[0].route.context);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match plain text single path with trailing /": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet/");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onStarfleet, result[0].route.start);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match variable text": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/:department",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet/medical");

            assertArray("starfleet/medical did not match", result);
            assertSame("starfleet/medical did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onMedical, result[0].route.start);
            assertSame("route has incorrect context", med, result[0].route.context);
            assertSame("route has incorrect number of parameters", 1, result[0].parameters.length);
            assertSame("route department parameter has incorrect value", "medical", result[0].parameters[0]);

            r.destroy();
        },

        "test router.match variable text with leading /": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/:department",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("/starfleet/medical");

            assertArray("starfleet/medical did not match", result);
            assertSame("starfleet/medical did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onMedical, result[0].route.start);
            assertSame("route has incorrect context", med, result[0].route.context);
            assertSame("route has incorrect number of parameters", 1, result[0].parameters.length);
            assertSame("route department parameter has incorrect value", "medical", result[0].parameters[0]);

            r.destroy();
        },

        "test router.match variable text as partial path": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/dep-:department",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet/dep-medical");

            assertArray("starfleet/medical did not match", result);
            assertSame("starfleet/medical did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start start handler", onMedical, result[0].route.start);
            assertSame("route has incorrect context", med, result[0].route.context);
            assertSame("route has incorrect number of parameters", 1, result[0].parameters.length);
            assertSame("route department parameter has incorrect value", "medical", result[0].parameters[0]);

            r.destroy();
        },

        "test router.match multiple variables text": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/:department/doctor/:doctor",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet/medical/doctor/crusher");

            assertArray("starfleet/medical did not match", result);
            assertSame("starfleet/medical did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onMedical, result[0].route.start);
            assertSame("route has incorrect context", med, result[0].route.context);
            assertSame("route has incorrect number of parameters", 2, result[0].parameters.length);
            assertSame("route department parameter has incorrect value", "medical", result[0].parameters[0]);
            assertSame("route doctor parameter has incorrect value", "crusher", result[0].parameters[1]);

            r.destroy();
        },

        "test router.match multiple variables text as partial path": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/dep-:department/doctor/dr.:doctor",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet/dep-medical/doctor/dr.crusher");

            assertArray("starfleet/medical did not match", result);
            assertSame("starfleet/medical did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onMedical, result[0].route.start);
            assertSame("route has incorrect context", med, result[0].route.context);
            assertSame("route has incorrect number of parameters", 2, result[0].parameters.length);
            assertSame("route department parameter has incorrect value", "medical", result[0].parameters[0]);
            assertSame("route doctor parameter has incorrect value", "crusher", result[0].parameters[1]);

            r.destroy();
        },

        "test router.match plain text single path with regexp": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: /^starfleet/,
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onStarfleet, result[0].route.start);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match plain text single path with multiples matches": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet",
                    start: onMedical,
                    context: med
                }
            });

            var result = r.match("starfleet");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 2, result.length);
            
            if (result[0].route.context === o) {
                assertSame("starfleet.0 route has incorrect start handler", onStarfleet, result[0].route.start);
                assertSame("medical.0 route has incorrect start handler", onMedical, result[1].route.start);
                assertSame("starfleet.0 route has incorrect number of parameters", 0, result[0].parameters.length);
                assertSame("medical.0 route has incorrect number of parameters", 0, result[1].parameters.length);
            }
            else {
                assertSame("starfleet.1 route has incorrect start handler", onStarfleet, result[1].route.start);
                assertSame("medical.1 route has incorrect start handler", onMedical, result[0].route.start);
                assertSame("starfleet.1 route has incorrect number of parameters", 0, result[1].parameters.length);
                assertSame("medical.1 route has incorrect number of parameters", 0, result[0].parameters.length);
            }

            r.destroy();
        },

        "test router.match plain text single path with rootUrl": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            r.start("jsUnitTest.htm/startrek");

            var result = r.match("starfleet");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onStarfleet, result[0].route.start);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.match plain text single path with rootUrl with leading /": function () {
            var r = router.create(),
                onStarfleet = function () {},
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            r.start("jsUnitTest.htm/startrek");

            var result = r.match("/starfleet");

            assertArray("starfleet did not match", result);
            assertSame("starfleet did not match correct number of routes", 1, result.length);
            assertSame("route has incorrect start handler", onStarfleet, result[0].route.start);
            assertSame("route has incorrect number of parameters", 0, result[0].parameters.length);

            r.destroy();
        },

        "test router.navigate with plain text route": function () {
            expectAsserts(1);

            var r = router.create(),
                onStarfleet = function () {
                    assert("this assert should be called", true);
                },
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "startrek/starfleet",
                    start: onStarfleet,
                    context: o
                },
                "medical": {
                    path: "startrek/starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            r.start("jsUnitTest.htm");

            r.navigate("startrek/starfleet");

            r.destroy();
        },

        "test router.navigate with variable text route": function () {
            expectAsserts(2);

            var r = router.create(),
                onStarfleet = function () {},
                onDepartment = function (department) {
                    assertSame("route has incorrect context", dep, this);
                    assertSame("department parameter has incorrect value", "medical", department);
                },
                o = {},
                dep = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "department": {
                    path: "starfleet/:department",
                    start: onDepartment,
                    context: dep
                }
            });

            r.start("jsUnitTest.htm/startrek");

            r.navigate("starfleet/medical");

            r.destroy();
        },

        "test router.navigate with multiple variables text route": function () {
            expectAsserts(3);

            var r = router.create(),
                onStarfleet = function () {},
                onDepartment = function (name, department, doctor) {
                    assertSame("route has incorrect context", dep, this);
                    assertSame("department parameter has incorrect value", "medical", department);
                    assertSame("doctor parameter has incorrect value", "bcrusher", doctor);
                },
                o = {},
                dep = {};

            r.add({
                "starfleet": {
                    path: "starfleet",
                    start: onStarfleet,
                    context: o
                },
                "department": {
                    path: "starfleet/:department/:doctor",
                    start: onDepartment,
                    context: dep
                }
            });

            r.start("jsUnitTest.htm/startrek");

            r.navigate("starfleet/medical/bcrusher");

            r.destroy();
        },

        "test router.navigate calls stop on previously matched routes": function () {
            expectAsserts(2);

            var r = router.create(),
                onStarfleet = function () {
                    assert("this start assert should be called", true);
                },
                stopStarfleet = function () {
                    assert("this stop assert should be called", true);
                },
                onMedical = function () {},
                o = {},
                med = {};

            r.add({
                "starfleet": {
                    path: "startrek/starfleet",
                    start: onStarfleet,
                    stop: stopStarfleet,
                    context: o
                },
                "medical": {
                    path: "startrek/starfleet/medical",
                    start: onMedical,
                    context: med
                }
            });

            r.start("jsUnitTest.htm");

            r.navigate("startrek/starfleet");
            r.navigate("nothing");

            r.destroy();
        }
    };
});