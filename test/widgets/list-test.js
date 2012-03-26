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

            assertSame("The widget content element is not the correct type of tag", 1, l.get("contentNode").childNodes.length);
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

            assertSame("The widget content element is not the correct type of tag", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(2).innerHTML);
        },

        "test list.add after render": function ()
        {
            var l = list.new();

            l.render(this.element);

            l.add("Data");

            assertSame("The widget content element is not the correct type of tag", 1, l.get("contentNode").childNodes.length);
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

            assertSame("The widget content element is not the correct type of tag", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "Data", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "Worf", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "Ryker", items.get(2).innerHTML);
        }
    };
});