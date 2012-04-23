define("views/list", ["util", "dom", "view"], function (_, $, view) {
    "use strict";
    
    /**
     * Renders a list item to the dom.
     * @private
     * @param {Object} view The list item to be rendered.
     */
    function renderItem (view)
    {
        var item = $("<li>");

        if (_.isString(view)) {
            item.html(view);
        }
        else {
            view.render(item.get(0));
        }

        item.appendTo(this.get("contentNode"));
    }

    /**
     * @class list
     * A view that renders a list of items. View items can be view controllers or other views.
     * @extends view
     * @namespace views
     */
    var list = view.extend({
            /**
             * Initializes the list.
             */
            constructor: function ()
            {
                view.constructor.call(this);

                this.items = [];
            },

            /**
             * Deinitializes the listview.
             */
            destructor: function ()
            {
                // Destroy each item
                this.each(function (item) {
                    if (_.isObject(item)) {
                        item.destroy();
                    }
                });

                this.items = null;

                view.destructor.call(this);
            },

            /**
             * The attributes for the list.
             * @property
             * @type Object
             */
            attributes:
            {
                /**
                 * @cfg {Boolean} cloud Whether or not the list is displayed as a word cloud.
                 * @default false
                 */
                cloud: {
                    value: false
                }
            },

            /**
             * The name of the list view.
             * @property
             * @type String
             */
            name: "list",

            /**
             * The type of tag for the content node of the list view.
             * @property
             * @type String
             */
            contentTag: "ul",

            /**
             * The function used to sort the list. By default there is no comparator function.
             * If this function is defined then items that are added are inserted in sorted order.
             * This function takes one item as a parameter and must return a value by which the item should be ordered relative to others.
             * @property
             * @type Function
             */
            comparator: null,

            /**
             * Handles changing of the cloud attribute. Takes care of adding and removing the cloud class from the bounding node.
             * @private
             * @param {Boolean} disabled The new value of the disabled attribute.
             */
            cloudChanged: function (cloud)
            {
                if (cloud) {
                    this.addClass("cloud");
                }
                else {
                    this.removeClass("cloud");
                }
            },

            /**
             * Renders the list items into the dom. This function should not be directly called. Instead call list.render.
             * @private
             * @param {Object} options This options parameter is the same options parameter passed into view.render.
             * @options
             * {String|Function} template undefined A string to run through a templater or a function to call that renders the contents of the view. The function must return a string to insert into the view and takes the data object from this options parameter as its single argument.
             * {Object} data undefined The data used when rendering the template.
             */
            renderContent: function ()
            {
                var cloud = this.get("cloud");
                if (cloud) {
                    this.addClass("cloud");
                }

                this.each(renderItem, this);
            },

            /**
             * Returns the number of items in the list.
             * @return {Number} Returns the number of items in the list.
             */
            count: function ()
            {
                return this.items.length;
            },

            /**
             * Returns the item at a given index in the list.
             * @param {Number} index The index into the list.
             * @return {Object} Returns the item at the index.
             */
            at: function (index)
            {
                return this.items[index];
            },

            /**
             * Adds a view to the list. Fires an add event.
             * @param {Array|model} An array of views to add to the list. Or a single viewto add to the list.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent false If true then no event is fired for adding the items. This is false by default.
             * {Number} at undefined The index to insert the items at in the list. By default items are added to the end of the list.
             */
            add: _.createListModifier("add", function (items, options)
            {
                // If there is a comparator function then insert each item into the sorted array maintaining sort order
                if (_.isFunction(this.comparator)) {
                    _.each(items, function (item) {
                        // Add the item to the list
                        this.items.splice(_.sortedIndex(this.items, item, this.comparator), 0, item);

                        // Add the item to the dom
                        if (this.get("rendered")) {
                            renderItem.call(this, item);
                        }
                    }, this);
                }
                else {
                    // Add the items to the list at the specifed index or at the end
                    if (_.isNumber(options.at)) {
                        this.items.splice.apply(this.items, [options.at, 0].concat(items));
                    }
                    else {
                        this.items.push.apply(this.items, items);
                    }

                    // Add the items to the dom
                    if (this.get("rendered")) {
                        _.each(items, renderItem, this);
                    }
                }
            }),

            /**
             * Removes a view from the list. Fires a remove event.
             * @param {Array|model} An array of views or a single view to remove from the list.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent false If true then no event is fired for removing the items. This is false by default.
             */
            remove: _.createListModifier("remove", function (items)
            {
                _.each(items, function (item) {
                    var index = this.indexOf(item);
                    if (index !== -1) {
                        // Destroy the item
                        if (_.isObject(item)) {
                            item.destroy();
                        }

                        // Remove the item from the list
                        this.items.splice(index, 1);

                        // Remove the item from the dom
                        if (this.get("rendered")) {
                            $("li", this.get("contentNode")).eq(index).remove();
                        }
                    }
                }, this);
            }),

            /**
             * Replaces all the items in the list. Fires a reset event.
             * @param {Array|model} (Optional) An array of views to add to the list. Or a single view to add to the list.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent false If true then no event is fired for resetting the items. This is false by default.
             */
            reset: _.createListModifier("reset", function (items)
            {
                // Destroy each item that is being removed
                this.each(function (item) {
                    if (_.isObject(item)) {
                        item.destroy();
                    }
                });

                // Set the items array equal to a new empty array
                this.items = [];

                // Clear the dom
                if (this.get("rendered")) {
                    $(this.get("contentNode")).empty();
                }
                
                // Add any new items if there are any suppresing the add event since this is a reset event
                if (items.length > 0) {
                    this.add(items, { silent: true });
                }
            }),

            /**
             * Extracts a list of attribute values from the list.
             * @param {String} name The name of the attribute to extract from each item in the list.
             * @return {Array} Returns an array of attribute values from the list.
             */
            pluck: function (name)
            {
                return this.map(function (item) {
                    return item.get(name);
                });
            },

            /**
             * Sorts the items in the list.
             * @param {Function} comparator A function to compare the items with. This function takes one item as a parameter and must return a value by which the model should be ordered relative to others.
             * @param {Object} options (Optional)
             * @options
             * {Object} context list The context to run the comparator function in. Defaults to the list.
             * {Boolean} silent false If true then no event is fired for sorting the items. This is false by default.
             */
            sortBy: function (comparator, options)
            {
                options = options || {};

                var sorter = function () {
                    // Sort the items
                    this.items = _.sortBy(this.items, comparator, options.context || this);

                    // Remove the items from the dom
                    $(this.get("contentNode")).empty();

                    // Render the items in their new order
                    this.each(renderItem, this);
                };

                if (options.silent) {
                    sorter.call(this);
                }
                else {
                    this.fire("sort", { options: options }, sorter);
                }
            },

            /**
             * Sorts the items in the list using this.comparator to order the items.
             * Normally this function does not need to be called because a list with a comparator defined maintains sort order automatically.
             * @param {Object} options (Optional)
             * @options
             * {Object} context list The context to run the comparator function in. Defaults to the list.
             * {Boolean} silent false If true then no event is fired for sorting the items. This is false by default.
             */
            sort: function (options)
            {
                if (!_.isFunction(this.comparator)) {
                    throw {
                        name: "ListSortError",
                        message: "A comparator function must be defined to sort a collection."
                    };
                }

                this.sortBy(this.comparator, options);
            }
        }),
        /*
         * Underscore functions to mixin to the collection object
         */
        _methods = ["forEach", "each", "map", "reduce", "reduceRight", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke",
                   "max", "min", "sortedIndex", "toArray", "size", "first", "initial", "rest", "last", "without", "indexOf", "shuffle", "lastIndexOf", "isEmpty", "groupBy"];


    // Mixin underscore functions
    _.each(_methods, function (methodName) {
        list[methodName] = function () {
            return _[methodName].apply(_, [this.items].concat(_.toArray(arguments)));
        };
    });

    return list;
});