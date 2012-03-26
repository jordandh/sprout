TestCase("widgets/list", ["util", "jquery", "widgets/list"], function (_, $, list) {
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

        "test list has underscore methods": function () {
            var methods = ["forEach", "each", "map", "reduce", "reduceRight", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke",
                   "max", "min", "sortedIndex", "toArray", "size", "first", "initial", "rest", "last", "without", "indexOf", "shuffle", "lastIndexOf", "isEmpty", "groupBy"];
            
            expectAsserts(methods.length);
            
            _.each(methods, function (methodName) {
                assertFunction(methodName + " is not a method on the list object", list[methodName]);
            });
        },

        "test list.render": function ()
        {
            var l = list.new();

            l.render(this.element);

            assertSame("The widget content element is not the correct type of tag", "ul", l.get("contentNode").nodeName.toLowerCase());
        },

        "test list.add before render": function ()
        {
            var l = list.new();

            l.add("Data");

            l.render(this.element);

            assertSame("The list does not have the correct number of elements in the dom", 1, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", $("li", l.get("contextNode")).html());
        },

        "test list.add multiple items before render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(2).innerHTML);
        },

        "test list.add after render": function ()
        {
            var l = list.new();

            l.render(this.element);

            l.add("Data");

            assertSame("The list does not have the correct number of elements in the dom", 1, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", $("li", l.get("contextNode")).html());
        },

        "test list.add multiple items after render": function ()
        {
            var l = list.new();

            l.render(this.element);

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(2).innerHTML);
        },

        "test list.remove before render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            l.remove("Worf");

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 2, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(1).innerHTML);
        },

        "test list.remove multiple items before render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            l.remove(["Worf", "Data"]);

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 1, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Ryker", items.get(0).innerHTML);
        },

        "test list.remove after render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            l.render(this.element);

            l.remove("Worf");

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 2, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(1).innerHTML);
        },

        "test list.remove multiple items after render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            l.render(this.element);

            l.remove(["Worf", "Data"]);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 1, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Ryker", items.get(0).innerHTML);
        },

        "test list.reset before render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            l.reset([
                "Picard",
                "Beverly"
            ]);

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 2, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Picard", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Beverly", items.get(1).innerHTML);
        },

        "test list.reset after render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(2).innerHTML);

            l.reset([
                "Picard",
                "Beverly"
            ]);

            items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 2, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Picard", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Beverly", items.get(1).innerHTML);
        },

        "test list.sortBy": function ()
        {
            assert(false);
        },

        "test list.sort": function ()
        {
            assert(false);
        }
    };
});