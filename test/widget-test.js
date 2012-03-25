TestCase("widget", ["util", "jquery", "widget"], function (_, $, widget) {
    return {
        setUp: function ()
        {
            this.node = $("<div></div>").appendTo(document.body);
            this.element = this.node.get(0);
        },

        tearDown: function ()
        {
            /*this.node.remove();
            this.node = null;
            this.element = null;*/
        },

        "test widget has jQuery functions": function ()
        {
            var methods = ["addClass", "removeClass", "toggleClass", "css", "height", "innerHeight", "outerHeight", "width", "innerWidth", "outerWidth", "offset", "position", "scrollLeft", "scrollTop"];
            
            expectAsserts(methods.length);
            
            _.each(methods, function (methodName) {
                assertFunction(methodName + " is not a method on the collection object", widget[methodName]);
            });
        },

        "test widget.render": function ()
        {
            var foo = widget.new();

            assertFalse("The widget rendered attribute is not false before rendering.", foo.get("rendered"));

            foo.render(this.element);

            var bounding = $(foo.get("boundingNode")),
                content = $(foo.get("contentNode"));

            assert("The widget rendered attribute is not true after rendering.", foo.get("rendered"));
            assertSame("The widget parent node is incorrect", this.element, foo.get("parentNode"));
            assertSame("The widget bounding element is not the correct type of tag", "div", foo.get("boundingNode").nodeName.toLowerCase());
            assertSame("The widget content element is not the correct type of tag", "div", foo.get("contentNode").nodeName.toLowerCase());
            assert("The widget bounding element is missing the widget class name.", bounding.hasClass("widget"));
            assertFalse("The widget bounding element has the disabled class name.", bounding.hasClass("disabled"));
            assertFalse("The widget bounding element has the hidden class name.", bounding.hasClass("hidden"));
            assert("The widget content element is misisng the widget-content class name.", content.hasClass("widget-content"));
        },

        "test widget.render when disabled": function ()
        {
            var foo = widget.new();
            foo.set("disabled", true);
            foo.render(this.element);

            var bounding = $(foo.get("boundingNode"));

            assert("The widget bounding element is missing the widget class name.", bounding.hasClass("widget"));
            assert("The widget bounding element does not have the disabled class name.", bounding.hasClass("disabled"));
            assertFalse("The widget bounding element has the hidden class name.", bounding.hasClass("hidden"));
        },

        "test widget.disabled after render": function ()
        {
            var foo = widget.new();
            foo.render(this.element);
            foo.set("disabled", true);

            var bounding = $(foo.get("boundingNode"));

            assert("The widget bounding element is missing the widget class name.", bounding.hasClass("widget"));
            assert("The widget bounding element does not have the disabled class name.", bounding.hasClass("disabled"));
            assertFalse("The widget bounding element has the hidden class name.", bounding.hasClass("hidden"));
        },

        "test widget.render when not visible": function ()
        {
            var foo = widget.new();
            foo.set("visible", false);
            foo.render(this.element);

            var bounding = $(foo.get("boundingNode"));

            assert("The widget bounding element is missing the widget class name.", bounding.hasClass("widget"));
            assertFalse("The widget bounding element has the disabled class name.", bounding.hasClass("disabled"));
            assert("The widget bounding element does not have the hidden class name.", bounding.hasClass("hidden"));
        },

        "test widget.visible after render": function ()
        {
            var foo = widget.new();
            foo.render(this.element);
            foo.set("visible", false);

            var bounding = $(foo.get("boundingNode"));

            assert("The widget bounding element is missing the widget class name.", bounding.hasClass("widget"));
            assertFalse("The widget bounding element has the disabled class name.", bounding.hasClass("disabled"));
            assert("The widget bounding element does not have the hidden class name.", bounding.hasClass("hidden"));
        },

        "test widget.addClass": function ()
        {
            var foo = widget.new();
            foo.render(this.element);

            var bounding = $(foo.get("boundingNode"));

            assert("The widget bounding element is missing the widget class name.", bounding.hasClass("widget"));
            assertFalse("The widget bounding element has the disabled class name.", bounding.hasClass("disabled"));
            assertFalse("The widget bounding element has the hidden class name.", bounding.hasClass("hidden"));

            foo.addClass("test");

            assert("The widget bounding element is missing the widget class name.", bounding.hasClass("widget"));
            assertFalse("The widget bounding element has the disabled class name.", bounding.hasClass("disabled"));
            assertFalse("The widget bounding element has the hidden class name.", bounding.hasClass("hidden"));
            assert("The widget bounding element is missing the test class name.", bounding.hasClass("test"));
        },

        "test widget.destroy": function ()
        {
            var foo = widget.new();
            foo.render(this.element);
            foo.addClass("destroy-test");

            assertSame("The .destroy-test element was not found in the dom.", 1, $(".destroy-test").length);

            foo.destroy();

            assertSame("The .destroy-test element was found in the dom.", 0, $(".destroy-test").length);
        },

        "test widget.render after render": function ()
        {
            var foo = widget.new();
            foo.render(this.element);
            foo.addClass("after-render-test");

            var bounding = $(foo.get("boundingNode"));

            assertSame("The widget parent node is incorrect.", this.element, foo.get("parentNode"));
            assert("The widget bounding element is missing the after-render-test class name.", bounding.hasClass("after-render-test"));

            var newParentNode = $("<div></div>").appendTo(document.body);

            foo.render(newParentNode);

            assertSame("The bounding node did not remain the same", bounding.get(0), foo.get("boundingNode"));
            assertSame("The widget parent node is not the new parent.", newParentNode, foo.get("parentNode"));
            assert("The widget bounding element did not retain the after-render-test class name.", bounding.hasClass("after-render-test"));

            assertSame("The old parent is not empty.", 0, this.element.childNodes.length);
        },

        "test widget.render with template string": function ()
        {
            var foo = widget.new();
            foo.render(this.element, {
                template: "<span>Hello</span>"
            });

            foo.addClass("template-string");

            var span = $("span", foo.get("contentNode"));

            assertSame("There is not one span child in the widget content node.", 1, span.length);
            assertSame("The widget content element's child node is not the correct type of tag", "span", span.get(0).nodeName.toLowerCase());
            assertSame("The span's content is incorrect.", "Hello", span.html());
        },

        "test widget.render with template string and data": function ()
        {
            var foo = widget.new();
            foo.render(this.element, {
                template: "<span><%=msg%></span>",
                data: {
                    msg: "Hello There"
                }
            });

            foo.addClass("template-string-data");

            var span = $("span", foo.get("contentNode"));

            assertSame("There is not one span child in the widget content node.", 1, span.length);
            assertSame("The widget content element's child node is not the correct type of tag", "span", span.get(0).nodeName.toLowerCase());
            assertSame("The span's content is incorrect.", "Hello There", span.html());
        },

        "test widget.render with template function": function ()
        {
            var foo = widget.new();
            foo.render(this.element, {
                template: function () {
                    return "<span>Hello Function</span>"
                }
            });

            foo.addClass("template-function");

            var span = $("span", foo.get("contentNode"));

            assertSame("There is not one span child in the widget content node.", 1, span.length);
            assertSame("The widget content element's child node is not the correct type of tag", "span", span.get(0).nodeName.toLowerCase());
            assertSame("The span's content is incorrect.", "Hello Function", span.html());
        },

        "test widget.render with template function and data": function ()
        {
            var foo = widget.new();
            foo.render(this.element, {
                template: function (data) {
                    return "<span>" + data.msg + "</span>"
                },
                data: {
                    msg: "Hello There Function"
                }
            });

            foo.addClass("template-function");

            var span = $("span", foo.get("contentNode"));

            assertSame("There is not one span child in the widget content node.", 1, span.length);
            assertSame("The widget content element's child node is not the correct type of tag", "span", span.get(0).nodeName.toLowerCase());
            assertSame("The span's content is incorrect.", "Hello There Function", span.html());
        }
    };
});