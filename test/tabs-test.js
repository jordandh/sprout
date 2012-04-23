TestCase("tabs", ["util", "dom", "tabs"], function (_, $, tabs) {
    return {
        setUp: function ()
        {
            this.node = $('<div class="tabs"><ul><li>Test Tab 1</li><li>Test Tab 2</li></ul><section></section><section class="hidden"></section></div>').appendTo(document.body);
            this.element = this.node.get(0);
        },

        tearDown: function ()
        {
            this.node.remove();
            this.node = null;
            this.element = null;
        },

        "test tabs.tabify": function ()
        {
            tabs.tabify(this.element);
            assert(false);
        }
    };
});