TestCase("view", ["util", "dom", "view"], function (_, $, view) {
    return {
        setUp: function ()
        {
            this.node = $("<div></div>").appendTo(document.body);
            this.element = this.node.get(0);
        },

        tearDown: function ()
        {
            this.node.remove();
            this.node = null;
            this.element = null;
        },

        "test view has jQuery functions": function ()
        {
            var methods = ["addClass", "removeClass", "toggleClass", "css", "height", "innerHeight", "outerHeight", "width", "innerWidth", "outerWidth", "offset", "position", "scrollLeft", "scrollTop"];
            
            expectAsserts(methods.length);
            
            _.each(methods, function (methodName) {
                assertFunction(methodName + " is not a method on the collection object", view[methodName]);
            });
        },

        "test view.render": function ()
        {
            var foo = view.create();

            assertFalse("The view rendered attribute is not false before rendering.", foo.get("rendered"));

            foo.render(this.element);

            var element = $(foo.get("element"));

            assert("The view rendered attribute is not true after rendering.", foo.get("rendered"));
            assertSame("The view parent node is incorrect", this.element, foo.get("parentNode"));
            assertSame("The view bounding element is not the correct type of tag", "div", foo.get("element").nodeName.toLowerCase());
            assertSame("The view content element is not the correct type of tag", "div", foo.get("element").nodeName.toLowerCase());
            assert("The view bounding element is missing the view class name.", element.hasClass("view"));
            assertFalse("The view bounding element has the disabled class name.", element.hasClass("disabled"));
            assertFalse("The view bounding element has the hidden class name.", element.hasClass("hidden"));
        },

        "test view.render when disabled": function ()
        {
            var foo = view.create();
            foo.set("disabled", true);
            foo.render(this.element);

            var element = $(foo.get("element"));

            assert("The view bounding element is missing the view class name.", element.hasClass("view"));
            assert("The view bounding element does not have the disabled class name.", element.hasClass("disabled"));
            assertFalse("The view bounding element has the hidden class name.", element.hasClass("hidden"));
        },

        "test view.disabled after render": function ()
        {
            var foo = view.create();
            foo.render(this.element);
            foo.set("disabled", true);

            var element = $(foo.get("element"));

            assert("The view bounding element is missing the view class name.", element.hasClass("view"));
            assert("The view bounding element does not have the disabled class name.", element.hasClass("disabled"));
            assertFalse("The view bounding element has the hidden class name.", element.hasClass("hidden"));
        },

        "test view.render when not visible": function ()
        {
            var foo = view.create();
            foo.set("visible", false);
            foo.render(this.element);

            var element = $(foo.get("element"));

            assert("The view bounding element is missing the view class name.", element.hasClass("view"));
            assertFalse("The view bounding element has the disabled class name.", element.hasClass("disabled"));
            assert("The view bounding element does not have the hidden class name.", element.hasClass("hidden"));
        },

        "test view.visible after render": function ()
        {
            var foo = view.create();
            foo.render(this.element);
            foo.set("visible", false);

            var element = $(foo.get("element"));

            assert("The view bounding element is missing the view class name.", element.hasClass("view"));
            assertFalse("The view bounding element has the disabled class name.", element.hasClass("disabled"));
            assert("The view bounding element does not have the hidden class name.", element.hasClass("hidden"));
        },

        "test view.addClass": function ()
        {
            var foo = view.create();
            foo.render(this.element);

            var element = $(foo.get("element"));

            assert("The view bounding element is missing the view class name.", element.hasClass("view"));
            assertFalse("The view bounding element has the disabled class name.", element.hasClass("disabled"));
            assertFalse("The view bounding element has the hidden class name.", element.hasClass("hidden"));

            foo.addClass("test");

            assert("The view bounding element is missing the view class name.", element.hasClass("view"));
            assertFalse("The view bounding element has the disabled class name.", element.hasClass("disabled"));
            assertFalse("The view bounding element has the hidden class name.", element.hasClass("hidden"));
            assert("The view bounding element is missing the test class name.", element.hasClass("test"));
        },

        "test view.destroy": function ()
        {
            var foo = view.create();
            foo.render(this.element);
            foo.addClass("destroy-test");

            assertSame("The .destroy-test element was not found in the dom.", 1, $(".destroy-test").length);

            foo.destroy();

            assertSame("The .destroy-test element was found in the dom.", 0, $(".destroy-test").length);
        },

        "test view.render after render": function ()
        {
            var foo = view.create();
            foo.render(this.element);
            foo.addClass("after-render-test");

            var element = $(foo.get("element"));

            assertSame("The view parent node is incorrect.", this.element, foo.get("parentNode"));
            assert("The view bounding element is missing the after-render-test class name.", element.hasClass("after-render-test"));

            var newParentNode = $("<div></div>").appendTo(document.body);

            foo.render(newParentNode);

            assertSame("The bounding node did not remain the same", element.get(0), foo.get("element"));
            assertSame("The view parent node is not the new parent.", newParentNode, foo.get("parentNode"));
            assert("The view bounding element did not retain the after-render-test class name.", element.hasClass("after-render-test"));

            assertSame("The old parent is not empty.", 0, this.element.childNodes.length);

            $(newParentNode).remove();
        },

        "test view.render with template string": function ()
        {
            var foo = view.create();
            foo.render(this.element, {
                template: "<span>Hello</span>"
            });

            foo.addClass("template-string");

            var span = $("span", foo.get("element"));

            assertSame("There is not one span child in the view content node.", 1, span.length);
            assertSame("The view content element's child node is not the correct type of tag", "span", span.get(0).nodeName.toLowerCase());
            assertSame("The span's content is incorrect.", "Hello", span.html());
        },

        "test view.render with template string and data": function ()
        {
            var foo = view.create();
            foo.render(this.element, {
                template: "<span><%=msg%></span>",
                data: {
                    msg: "Hello There"
                }
            });

            foo.addClass("template-string-data");

            var span = $("span", foo.get("element"));

            assertSame("There is not one span child in the view content node.", 1, span.length);
            assertSame("The view content element's child node is not the correct type of tag", "span", span.get(0).nodeName.toLowerCase());
            assertSame("The span's content is incorrect.", "Hello There", span.html());
        },

        "test view.render with template function": function ()
        {
            var foo = view.create();
            foo.render(this.element, {
                template: function () {
                    return "<span>Hello Function</span>";
                }
            });

            foo.addClass("template-function");

            var span = $("span", foo.get("element"));

            assertSame("There is not one span child in the view content node.", 1, span.length);
            assertSame("The view content element's child node is not the correct type of tag", "span", span.get(0).nodeName.toLowerCase());
            assertSame("The span's content is incorrect.", "Hello Function", span.html());
        },

        "test view.render with template function and data": function ()
        {
            var foo = view.create();
            foo.render(this.element, {
                template: function (data) {
                    return "<span>" + data.msg + "</span>";
                },
                data: {
                    msg: "Hello There Function"
                }
            });

            foo.addClass("template-function");

            var span = $("span", foo.get("element"));

            assertSame("There is not one span child in the view content node.", 1, span.length);
            assertSame("The view content element's child node is not the correct type of tag", "span", span.get(0).nodeName.toLowerCase());
            assertSame("The span's content is incorrect.", "Hello There Function", span.html());
        }
    };
});