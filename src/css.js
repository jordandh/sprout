define(function () {
    function addCSS (css)
    {
        var style = document.createElement("style"),
            rules = document.createTextNode(css);

        style.type = "text/css";

        if (style.styleSheet) {
            style.styleSheet.cssText = rules.nodeValue;
        }
        else {
            style.appendChild(rules);
        }

        document.getElementsByTagName("head")[0].appendChild(style);
    }

    return {
        load: function (name, req, load, config) {
            req(["text!" + name], function (css) {
                addCSS(css);
                load(css);
            });
        }
    };
});