define("views/listview", ["util", "view", "widgets/list"], function (_, view, listWidget) {
    "use strict";

    /**
     * Detaches all event handlers that are attached to the listview's collection.
     * @private
     * @param {Object} list The list widget to add the item to.
     * @param {Object} itemView The type of view to create for the list item.
     * @param {Object} model The model for the list item.
     * @param {Number} at (Optional) The index to add the item at in the list. Defaults to the end of the list.
     */
    function addItem (list, itemView, model, at)
    {
        // Create a view for the item and set its model
        var item = itemView.new();
        item.set("model", model);

        // Add the view to the list widget in the correct position
        list.add(item, { at: at });
    }

    /**
     * Replaces all the items in the list widget with the models in the collection.
     * @private
     */
    function resetList ()
    {
        var list = this.get("list"),
            collection = this.get("collection"),
            itemView = this.get("itemView");

        if (list) {
            // Remove all the items from the list widget
            list.reset();

            // If there is a collection and an item view then add all the items in the collection to the list widget
            if (collection && itemView) {
                collection.each(function (model) {
                    addItem.call(this, list, itemView, model);
                }, this);
            }
        }
    }

    /**
     * Handler for when models are added to the listview's collection. Adds the new models to the list widget.
     * @private
     * @param {Object} e The event object.
     */
    function afterModelsAdded (e)
    {
        var list = this.get("list"),
            itemView = this.get("itemView"),
            at = e.info.options.at;

        // If there is a list widget and an item view then add each model to the list widget
        if (list && itemView) {
            _.each(e.info.items, function (model, index) {
                addItem.call(this, list, itemView, model, _.isNumber(at) ? at + index : null);
            }, this);
        }
    }

    /**
     * Handler for when models are removed from the listview's collection. Removes the models from the list widget.
     * @private
     * @param {Object} e The event object.
     */
    function afterModelsRemoved (e)
    {
        var list = this.get("list");

        // If there is a list widget then remove each model from it
        if (list) {
            _.each(e.info.items, function (model) {
                var itemView = list.find(function (view) {
                    return view.get("model") === model;
                });
                
                // Remove the model from the list widget
                list.remove(itemView);
            }, this);
        }
    }

    /**
     * Handler for when the listview's collection is reset. Resets the list widget with the new models in the collection
     * @private
     * @param {Object} e The event object.
     */
    function afterReset (e)
    {
        resetList.call(this);
    }

    /**
     * Detaches all event handlers that are attached to the listview's collection.
     * @private
     * @param {Object} collection The collection object to detach the event handlers from.
     */
    function detachCollection (collection)
    {
        if (collection) {
            collection.detachAfter("add", afterModelsAdded, this);
            collection.detachAfter("remove", afterModelsRemoved, this);
            collection.detachAfter("reset", afterReset, this);
        }
    }

    /**
     * @class listview
     * A view that binds a collection to a list widget. There are two components to setup when using a listview: the collection and itemView attributes.
     * Use the collection attribute to specify the data bound to the list. The itemView attribute is then used for rendering each item in the list.
     * @extends view
     * @namespace views
     */
    return view.extend({
        /**
         * Initializes the listview.
         */
        constructor: function ()
        {
            view.constructor.call(this);

            this.set("list", listWidget.new(), { force: true });
        },

        /**
         * Deinitializes the listview.
         */
        destructor: function ()
        {
            var list = this.get("list");
            if (list) {
                list.destroy();
            }

            detachCollection.call(this, this.get("collection"));

            view.destructor.call(this);
        },

        /**
         * The attributes for the listview.
         * @property
         * @type Object
         */
        attributes: {
            /**
             * @cfg {Object} collection The collection to bind to the list widget.
             */
            /**
             * @cfg {Object} itemView The view object used to render the collection items in the list widget.
             */
            /**
             * @cfg {Object} list The list widget bound to the collection.
             * @readOnly
             */
            list: {
                readOnly: true
            }
        },

        /**
         * Renders the view to the dom.
         * @param {Object} parentNode The dom element to render the listview in.
         */
        render: function (parentNode)
        {
            view.render.call(this, parentNode);

            this.get("list").render(parentNode);
        },

        /**
         * Handles changing of the collection attribute. Takes care of setting up and tearing down event handlers on the collection and resets the list widget for the new collection.
         * @private
         * @param {Object} collection The new value of the collection attribute.
         * @param {Object} oldCollection The old value of the collection attribute.
         */
        collectionChanged: function (collection, oldCollection)
        {
            detachCollection.call(this, oldCollection);

            if (collection) {
                collection.after("add", afterModelsAdded, this);
                collection.after("remove", afterModelsRemoved, this);
                collection.after("reset", afterReset, this);
            }

            resetList.call(this);
        },

        /**
         * Handles changing of the itemView attribute. Resets the list widget for the new item view.
         * @private
         */
        itemViewChanged: function ()
        {
            resetList.call(this);
        }
    });
});