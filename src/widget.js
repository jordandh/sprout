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
                    readOnly: true,
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

            /**
             * Renders the widget to the dom.
             * @param {Object} parentNode The dom element to render the widget in.
             * @param {Object} options
             * @options
             * {String|Function} template undefined A string to run through a templater or a function to call that renders the contents of the widget. The function must return a string to insert into the widget and takes the data object from this options parameter as its single argument.
             * {Object} data undefined The data used when rendering the template.
             */
            render: function (parentNode, options)
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

                options = options || {};

                this.fire("render", { parentNode: parentNode, options: options }, function (e) {
                    var bounding, content;

                    parentNode = e.info.parentNode;
                    options = e.info.options;

                    // If the widget was previously rendered
                    if (this.get("rendered")) {
                        // Remove the widget from its current parent node and append it to its new parent node
                        $(this.get("boundingNode")).detach().appendTo(parentNode);
                        this.set("parentNode", parentNode, { force: true });
                    }
                    // Else this is the first time the widget is being rendered
                    else {
                        // Create the bounding and content nodes
                        bounding = $("<" + this.boundingTag + ">");
                        content = $("<" + this.contentTag + ">").addClass("widget-content");

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

                        this.set("boundingNode", bounding.get(0), { force: true });
                        this.set("contentNode", content.get(0), { force: true });
                        this.set("parentNode", parentNode, { force: true });
                        this.set("rendered", true, { force: true });

                        this.renderContent(options);
                    }
                });
            },

            /**
             * Renders the widget's content. This function should not be called directly. The widget object calls this function when the widget is rendered.
             * Objects that inherit from widget should override this method to render its content. If this function is called it will render a template into the content if options.template is defined.
             * @private
             * @param {Object} options This options parameter is the same options parameter passed into widget.render.
             * @options
             * {String|Function} template undefined A string to run through a templater or a function to call that renders the contents of the widget. The function must return a string to insert into the widget and takes the data object from this options parameter as its single argument.
             * {Object} data undefined The data used when rendering the template.
             */
            renderContent: function (options)
            {
                // If the template is a function then call it passing the template data
                if (_.isFunction(options.template)) {
                    $(this.get("contentNode")).html(options.template(options.data));
                }
                // Else if the template is a string then use the utils.template function to render it
                else if (_.isString(options.template)) {
                    $(this.get("contentNode")).html(_.template(options.template, options.data));
                }
            }
        }),
        /*
         * jQuery functions to mixin to the widget object
         */
        jQueryMethods = ["addClass", "removeClass", "toggleClass", "css", "height", "innerHeight", "outerHeight", "width", "innerWidth", "outerWidth", "offset", "position", "scrollLeft", "scrollTop", "on", "off"];
    
    // Mixin jQuery functions
    _.each(jQueryMethods, function (methodName) {
        widget[methodName] = function () {
            if (this.get("rendered")) {
                var node = $(this.get("boundingNode"));
                node[methodName].apply(node, arguments);
            }

            return this;
        };
    });

    return widget;
});