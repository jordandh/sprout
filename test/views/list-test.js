TestCase("views/list", ["util", "jquery", "views/list"], function (_, $, list) {
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

            assertSame("The view content element is not the correct type of tag", "ul", l.get("contentNode").nodeName.toLowerCase());
        },

        "test list.add before render": function ()
        {
            var l = list.new();

            l.add("Data");

            l.render(this.element);
            
            assertSame("The list does not have the correct number of elements in the dom", 1, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", $("li", l.get("contentNode")).html());
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
            assertSame("The item's content is incorrect", "Data", $("li", l.get("contentNode")).html());
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

        "test list.sort throws an exception with no comparator": function ()
        {
            var l = list.new();

            assertException("sort did not throw correct exception", function () {
                l.sort();
            }, "ListSortError");
        },

        "test list.sortBy before render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            assertSame("Data is not first item before sort.", "Data", l.at(0));
            assertSame("Worf is not second item before sort.", "Worf", l.at(1));
            assertSame("Ryker is not third item before sort.", "Ryker", l.at(2));

            l.comparator = function (item) {
                return item;
            };
            l.sort();

            assertSame("Data is not first item before sort.", "Data", l.at(0));
            assertSame("Ryker is not third item before sort.", "Ryker", l.at(1));
            assertSame("Worf is not second item before sort.", "Worf", l.at(2));

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(2).innerHTML);
        },

        "test list.sort before render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            assertSame("Data is not first item before sort.", "Data", l.at(0));
            assertSame("Worf is not second item before sort.", "Worf", l.at(1));
            assertSame("Ryker is not third item before sort.", "Ryker", l.at(2));

            var o = {};

            l.sortBy(function (item) {
                assertSame("context is incorrect", o, this);
                return item;
            }, { context: o });

            assertSame("Data is not first item before sort.", "Data", l.at(0));
            assertSame("Ryker is not third item before sort.", "Ryker", l.at(1));
            assertSame("Worf is not second item before sort.", "Worf", l.at(2));

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(2).innerHTML);
        },

        "test list.sortBy after render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            assertSame("Data is not first item before sort.", "Data", l.at(0));
            assertSame("Worf is not second item before sort.", "Worf", l.at(1));
            assertSame("Ryker is not third item before sort.", "Ryker", l.at(2));

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(2).innerHTML);

            l.comparator = function (item) {
                return item;
            };
            l.sort();

            assertSame("Data is not first item before sort.", "Data", l.at(0));
            assertSame("Ryker is not third item before sort.", "Ryker", l.at(1));
            assertSame("Worf is not second item before sort.", "Worf", l.at(2));

            items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(2).innerHTML);
        },

        "test list.sort after render": function ()
        {
            var l = list.new();

            l.add([
                "Data",
                "Worf",
                "Ryker"
            ]);

            assertSame("Data is not first item before sort.", "Data", l.at(0));
            assertSame("Worf is not second item before sort.", "Worf", l.at(1));
            assertSame("Ryker is not third item before sort.", "Ryker", l.at(2));

            l.render(this.element);

            var items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(2).innerHTML);

            var o = {};

            l.sortBy(function (item) {
                assertSame("context is incorrect", o, this);
                return item;
            }, { context: o });

            assertSame("Data is not first item before sort.", "Data", l.at(0));
            assertSame("Ryker is not third item before sort.", "Ryker", l.at(1));
            assertSame("Worf is not second item before sort.", "Worf", l.at(2));

            items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(2).innerHTML);
        }
    };
});