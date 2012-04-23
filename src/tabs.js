define("tabs", ["util", "dom"], function (_, $) {
    "use strict";

    return {
        tabify: function (tabNode)
        {
            $("> ul", tabNode).on("click", "li", function (ev) {
                var items = $("> ul > li", tabNode),
                    index = items.index(this);
                
                items.removeClass("selected").eq(index).addClass("selected");
                $("> section", tabNode).addClass("hidden").eq(index).removeClass("hidden");
            });
        },

        selectedTab: function (tabNode)
        {
            return $("> section", tabNode).not(".hidden").get(0);
        }
    };
});