define("widget", ["util", "jquery", "base"], function (_, $, base) {
    "use strict";

    // TODO: make it possible to have only a bounding node instead of the bounding / content node structure
    
    /**
     * @class widget
     * Widgets are UI controls that are easily themed via css and manipulated via attributes and a jQuery api. The widget object exists to be inherited from or used to load templates.
     * It provides the basic functionality for a widget to be rendered and styled.
     * Every widget is rendered with consistent markup accessible through the boundingNode and contentNode attributes.
     * The standard widget box model is a bounding node wrapping a content node.
     * The markup for a simple widget:
     * <pre><code>
     *     &lt;div class="widget">
     *     &nbsp;&nbsp;&lt;div class="widget-content">&lt;/div>
     *     &lt;/div>
     * </code></pre>
     * Most widgets will use this model, however, it is possible to flatten the markup so that there is only one node:
     * <pre><code>
     *     &lt;div class="widget widget-content">&lt;/div>
     * </code></pre>
     * This can be done by setting the contentTag of an object that inherits from widget or a widget instance to null.
     * When inheriting from widget there are a few things that need to be done. Your widget needs a unique name. A widget's name is used for adding classes to the widget's markup.
     * Your widget may also need to define a boundingTag and contentTag. Both tag types default to a div. Usually only the contentTag needs to be overridden.
     * And lastly the renderContent function most likely needs to be overridden. This function should render the widget into the content node.
     * Here is a simple example of a button widget:
     * <pre><code>
     *     var button = widget.extend({
     *         &nbsp;&nbsp;name: "button",
     *         &nbsp;&nbsp;contentTag: "button",
     *         &nbsp;&nbsp;attributes: {
     *             &nbsp;&nbsp;&nbsp;&nbsp;label: { value: "", validator: _.isString }
     *         &nbsp;&nbsp;},
     *         &nbsp;&nbsp;renderContent: function () {
     *             &nbsp;&nbsp;&nbsp;&nbsp;$(this.get("contentNode")).html(this.get("label"));
     *         &nbsp;&nbsp;}
     *     });
     * </code></pre>
     * The above example creates a button widget whose content tag is button. When rendered it sets the text of the button using its label attribute.
     * <pre><code>
     *     var btn = button.new({ label: "Hello" });
     *     btn.render(document.body);
     * </code></pre>
     * The above code creates a button widget and renders it to the body. The markup created is as follows:
     * <pre><code>
     *     &lt;div class="widget button">
     *     &nbsp;&nbsp;&lt;button class="widget-content">Hello&lt;/button>
     *     &lt;/div>
     * </code></pre>
     * If inheriting from widget is a little more than you need then the widget object can be used to render templates.
     * <pre><code>
     *     var widg = widget.new();
     *     widg.name = "template-example";
     *     widg.render(document.body, {
     *         &nbsp;&nbsp;template: '&lt;image src="<%=src%>">&lt;/image>&lt;span class="template-example-caption"><%=caption%>&lt;/span>',
     *         &nbsp;&nbsp;data: {
     *             &nbsp;&nbsp;&nbsp;&nbsp;src: "/images/example.png",
     *             &nbsp;&nbsp;&nbsp;&nbsp;caption: "Example"
     *         &nbsp;&nbsp;}
     *     });
     * </code></pre>
     * The above code creates the following markup:
     * <pre><code>
     *     &lt;div class="widget template-example">
     *     &nbsp;&nbsp;&lt;div class="widget-content">
     *     &nbsp;&nbsp;&nbsp;&nbsp;&lt;image src="/images/example.png">&lt;/image>
     *     &nbsp;&nbsp;&nbsp;&nbsp;&lt;span class="template-example-caption">Example&lt;/span>
     *     &nbsp;&nbsp;&lt;/div>
     *     &lt;/div>
     * </code></pre>
     * @extends base
     */
    var widget = base.extend({
            /**
             * Deinitializes the widget.
             */
            destructor: function ()
            {
                var parentNode = this.get("parentNode"),
                    boundingNode = this.get("boundingNode");

                if (parentNode && boundingNode) {
                    //parentNode.removeChild(boundingNode);
                    $(boundingNode).remove();
                }

                base.destructor.call(this);
            },

            /**
             * The attributes for the widget.
             * @property
             * @type Object
             */
            attributes: {
                /**
                 * @cfg {Boolean} disabled Whether or not the widget is disabled.
                 * @default false
                 */
                disabled: {
                    value: false,
                    validator: _.isBoolean
                },
                /**
                 * @cfg {Boolean} visible Whether or not the widget is visible.
                 * @default true
                 */
                visible: {
                    value: true,
                    validator: _.isBoolean
                },
                /**
                 * @cfg {Boolean} rendered Whether or not this widget instance has been rendered.
                 * @default false
                 * @readOnly
                 */
                rendered: {
                    value: false,
                    readOnly: true,
                    validator: _.isBoolean
                },
                /**
                 * @cfg {Element} parentNode The dom element that the widget is rendered in.
                 * @default null
                 * @readOnly
                 */
                parentNode: {
                    value: null,
                    readOnly: true
                },
                /**
                 * @cfg {Element} boundingNode The top level dom element of the widget.
                 * @default null
                 * @readOnly
                 */
                boundingNode: {
                    value: null,
                    readOnly: true
                },
                /**
                 * @cfg {Element} contentNode The second level dom element of the widget. The actual content of the widget is in this element.
                 * @default null
                 * @readOnly
                 */
                contentNode: {
                    value: null,
                    readOnly: true
                }
            },

            /**
             * The tag type of the bounding dom element. This is used when the widget is rendered.
             * @property
             * @type String
             */
            boundingTag: "div",

            /**
             * The tag type of the content dom element. This is used when the widget is rendered. Set this to null in an object that inherits from widget or a widget instance to flatten the widget box model to just one dom element.
             * @property
             * @type String
             */
            contentTag: "div",

            /**
             * The name of the widget. When a widget is rendered the bounding node automatically is given class names from all the objects in the widgets hierarchy.
             * @property
             * @type String
             */
            name: "widget",

            /**
             * Handles changing of the disabled attribute. Takes care of adding and removing the disabled class from the bounding node.
             * @private
             * @param {Boolean} disabled The new value of the disabled attribute.
             */
            disabledChanged: function (disabled)
            {
                if (disabled) {
                    this.addClass("disabled");
                }
                else {
                    this.removeClass("disabled");
                }
            },
            
            /**
             * Handles changing of the visible attribute. Takes care of adding and removing the hidden class from the bounding node.
             * @private
             * @param {Boolean} visible The new value of the visible attribute.
             */
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
        jQueryMethods = ["addClass", "removeClass", "toggleClass", "css", "height", "innerHeight", "outerHeight", "width", "innerWidth", "outerWidth", "offset", "position", "scrollLeft", "scrollTop"];
    
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