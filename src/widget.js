define("widget", ["util", "jquery", "base"], function (_, $, base) {
    "use strict";
    
    /**
     * @class widget
     * Widgets are UI controls that are easily themed via css and manipulated via attributes and a jQuery api. The widget object exists to be inherited from.
     * It provides the basic functionality for a widget to be rendered, styled, and
     * @extends base
     */
    var widget = base.extend({
            destructor: function ()
            {
                var parentNode = this.get("parentNode"),
                    boundingNode = this.get("boundingNode");

                if (parentNode && boundingNode) {
                    parentNode.removeChild(boundingNode);
                }

                base.destructor.call(this);
            },

            attributes: {
                disabled: {
                    value: false,
                    validator: _.isBoolean
                },
                visible: {
                    value: true,
                    validator: _.isBoolean
                },
                rendered: {
                    value: false,
                    validator: _.isBoolean
                },
                parentNode: {
                    value: null,
                    readOnly: true
                },
                boundingNode: {
                    value: null,
                    readOnly: true
                },
                contentNode: {
                    value: null,
                    readOnly: true
                }
            },

            boundingTag: "div",

            contentTag: "div",

            name: "widget",

            disabledChanged: function (disabled)
            {
                if (disabled) {
                    this.addClass("disabled");
                }
                else {
                    this.removeClass("disabled");
                }
            },
            
            visibleChanged: function (visible)
            {
                if (visible) {
                    this.removeClass("hidden");
                }
                else {
                    this.addClass("hidden");
                }
            },

            render: function (parentNode)
            {
                if (_.isString(parentNode)) {
                    parentNode = $(parentNode).get(0);
                }

                if (!parentNode) {
                    throw {
                        name: "TypeError",
                        message: "Invalid parentNode specified for widget.render function."
                    };
                }

                this.fire("render", { parentNode: parentNode }, function (e) {
                    var bounding, content;

                    parentNode = e.info.parentNode;

                    // If the widget was previously rendered
                    if (this.get("rendered")) {
                        // Remove the widget from its current parent node and append it to its new parent node
                        $(this.get("boundingNode")).detach().appendTo(parentNode);
                        this.set("parentNode", parentNode);
                    }
                    // Else this is the first time the widget is being rendered
                    else {
                        // Create the bounding and content nodes
                        bounding = $("<" + this.boundingTag + ">");
                        content = $("<" + this.contentTag + ">");

                        // Add the class names that belong on this widget
                        _.each(_.prototypes(this).reverse(), function (proto) {
                            var name = proto.name;
                            if (_.isString(name)) {
                                bounding.addClass(name);
                            }
                        });

                        if (this.get("disabled")) {
                            bounding.addClass("disabled");
                        }
                        if (!this.get("visible")) {
                            bounding.addClass("hidden");
                        }

                        bounding.append(content).appendTo(parentNode);

                        this.set("boundingNode", bounding.get(0));
                        this.set("contentNode", content.get(0));
                        this.set("parentNode", parentNode);
                        this.set("rendered", true);

                        this.renderContent();
                    }
                });
            },

            renderContent: function ()
            {
            }
        }),
        /*
         * jQuery functions to mixin to the widget object
         */
        jQueryMethods = ["addClass", "removeClass", "toggleClass", "css", "height", "innerHeight", "outerHeight", "width", "innerWidth", "outerWidth", "offset", "position", "scrollLeft", "scrollTop", "on", "off"];
    
    // Mixin jQuery functions
    _.each(jQueryMethods, function (methodName) {
        widget[methodName] = function () {
            return $(this.get("boundingNode"))[methodName].apply($, arguments);
        };
    });

    return widget;
});