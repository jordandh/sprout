define("view", ["util", "jquery", "base"], function (_, $, base) {
    "use strict";
    
    /**
     * @class view
     * Widgets are UI controls that are easily themed via css and manipulated via attributes and a jQuery api. The view object exists to be inherited from or used to load templates.
     * It provides the basic functionality for a view to be rendered and styled.
     * Every view is rendered with consistent markup accessible through the boundingNode and contentNode attributes.
     * The standard view box model is a bounding node wrapping a content node.
     * The markup for a simple view:
     * <pre><code>
     *     &lt;div class="view">
     *     &nbsp;&nbsp;&lt;div class="view-content">&lt;/div>
     *     &lt;/div>
     * </code></pre>
     * Most views will use this model, however, it is possible to flatten the markup so that there is only one node:
     * <pre><code>
     *     &lt;div class="view view-content">&lt;/div>
     * </code></pre>
     * This can be done by setting the contentTag of an object that inherits from view or a view instance to null.
     * When inheriting from view there are a few things that need to be done. Your view needs a unique name. A view's name is used for adding classes to the view's markup.
     * Your view may also need to define a boundingTag and contentTag. Both tag types default to a div. Usually only the contentTag needs to be overridden.
     * And lastly the renderContent function most likely needs to be overridden. This function should render the view into the content node.
     * Here is a simple example of a button view:
     * <pre><code>
     *     var button = view.extend({
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
     * The above example creates a button view whose content tag is button. When rendered it sets the text of the button using its label attribute.
     * <pre><code>
     *     var btn = button.new({ label: "Hello" });
     *     btn.render(document.body);
     * </code></pre>
     * The above code creates a button view and renders it to the body. The markup created is as follows:
     * <pre><code>
     *     &lt;div class="view button">
     *     &nbsp;&nbsp;&lt;button class="view-content">Hello&lt;/button>
     *     &lt;/div>
     * </code></pre>
     * If inheriting from view is a little more than you need then the view object can be used to render templates.
     * <pre><code>
     *     var v = view.new();
     *     v.name = "template-example";
     *     v.render(document.body, {
     *         &nbsp;&nbsp;template: '&lt;image src="<%=src%>">&lt;/image>&lt;span class="template-example-caption"><%=caption%>&lt;/span>',
     *         &nbsp;&nbsp;data: {
     *             &nbsp;&nbsp;&nbsp;&nbsp;src: "/images/example.png",
     *             &nbsp;&nbsp;&nbsp;&nbsp;caption: "Example"
     *         &nbsp;&nbsp;}
     *     });
     * </code></pre>
     * The above code creates the following markup:
     * <pre><code>
     *     &lt;div class="view template-example">
     *     &nbsp;&nbsp;&lt;div class="view-content">
     *     &nbsp;&nbsp;&nbsp;&nbsp;&lt;image src="/images/example.png">&lt;/image>
     *     &nbsp;&nbsp;&nbsp;&nbsp;&lt;span class="template-example-caption">Example&lt;/span>
     *     &nbsp;&nbsp;&lt;/div>
     *     &lt;/div>
     * </code></pre>
     * @extends base
     */
    var view = base.extend({
            /**
             * Deinitializes the view.
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
             * The attributes for the view.
             * @property
             * @type Object
             */
            attributes: {
                /**
                 * @cfg {Boolean} disabled Whether or not the view is disabled.
                 * @default false
                 */
                disabled: {
                    value: false,
                    validator: _.isBoolean
                },
                /**
                 * @cfg {Boolean} visible Whether or not the view is visible.
                 * @default true
                 */
                visible: {
                    value: true,
                    validator: _.isBoolean
                },
                /**
                 * @cfg {Boolean} rendered Whether or not this view instance has been rendered.
                 * @default false
                 * @readOnly
                 */
                rendered: {
                    value: false,
                    readOnly: true,
                    validator: _.isBoolean
                },
                /**
                 * @cfg {Element} parentNode The dom element that the view is rendered in.
                 * @default null
                 * @readOnly
                 */
                parentNode: {
                    value: null,
                    readOnly: true
                },
                /**
                 * @cfg {Element} boundingNode The top level dom element of the view.
                 * @default null
                 * @readOnly
                 */
                boundingNode: {
                    value: null,
                    readOnly: true
                },
                /**
                 * @cfg {Element} contentNode The second level dom element of the view. The actual content of the view is in this element.
                 * @default null
                 * @readOnly
                 */
                contentNode: {
                    value: null,
                    readOnly: true
                }
            },

            /**
             * The tag type of the bounding dom element. This is used when the view is rendered.
             * @property
             * @type String
             */
            boundingTag: "div",

            /**
             * The tag type of the content dom element. This is used when the view is rendered. Set this to null in an object that inherits from view or a view instance to flatten the view box model to just one dom element.
             * @property
             * @type String
             */
            contentTag: "div",

            /**
             * The name of the view. When a view is rendered the bounding node automatically is given class names from all the objects in the view's hierarchy.
             * @property
             * @type String
             */
            name: "view",

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
             * Renders the view to the dom.
             * @param {Object} parentNode The dom element to render the view in.
             * @param {Object} options
             * @options
             * {String|Function} template undefined A string to run through a templater or a function to call that renders the contents of the view. The function must return a string to insert into the view and takes the data object from this options parameter as its single argument.
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
                        message: "Invalid parentNode specified for view.render function."
                    };
                }

                options = options || {};

                this.fire("render", { parentNode: parentNode, options: options }, function (e) {
                    var bounding, content;

                    parentNode = e.info.parentNode;
                    options = e.info.options;

                    // If the view was previously rendered
                    if (this.get("rendered")) {
                        // Remove the view from its current parent node and append it to its new parent node
                        $(this.get("boundingNode")).detach().appendTo(parentNode);
                        this.set("parentNode", parentNode, { force: true });
                    }
                    // Else this is the first time the view is being rendered
                    else {
                        // Create the bounding and content nodes
                        bounding = $("<" + this.boundingTag + ">");
                        content = _.isString(this.contentTag) ? $("<" + this.contentTag + ">") : bounding;

                        // Add the class names that belong on this view
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

                        content.addClass("view-content");

                        // Add the view to the parent node
                        if (content !== bounding) {
                            bounding.append(content).appendTo(parentNode);
                        }
                        else {
                            bounding.appendTo(parentNode);
                        }

                        this.set("boundingNode", bounding.get(0), { force: true });
                        this.set("contentNode", content.get(0), { force: true });
                        this.set("parentNode", parentNode, { force: true });
                        this.set("rendered", true, { force: true });

                        this.renderContent(options);
                    }
                });
            },

            /**
             * Renders the view's content. This function should not be called directly. The view object calls this function when the view is rendered.
             * Objects that inherit from view should override this method to render its content. If this function is called it will render a template into the content if options.template is defined.
             * @private
             * @param {Object} options This options parameter is the same options parameter passed into view.render.
             * @options
             * {String|Function} template undefined A string to run through a templater or a function to call that renders the contents of the view. The function must return a string to insert into the view and takes the data object from this options parameter as its single argument.
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
         * jQuery functions to mixin to the view object
         */
        jQueryMethods = ["addClass", "removeClass", "toggleClass", "css", "height", "innerHeight", "outerHeight", "width", "innerWidth", "outerWidth", "offset", "position", "scrollLeft", "scrollTop"];
    
    // Mixin jQuery functions
    _.each(jQueryMethods, function (methodName) {
        view[methodName] = function () {
            if (this.get("rendered")) {
                var node = $(this.get("boundingNode"));
                node[methodName].apply(node, arguments);
            }

            return this;
        };
    });

    return view;
});