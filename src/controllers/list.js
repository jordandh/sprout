define("controllers/list", ["util", "controller", "views/list"], function (_, controller, listWidget) {
    "use strict";

    /**
     * Detaches all event handlers that are attached to the list controller's collection.
     * @private
     * @param {Object} list The list view to add the item to.
     * @param {Object} itemController The type of controller to create for the list item.
     * @param {Object} model The model for the list item.
     * @param {Number} at (Optional) The index to add the item at in the list. Defaults to the end of the list.
     */
    function addItem (list, itemController, model, at)
    {
        // Create a controller for the item and set its model
        var item = itemController.new();
        item.set("model", model);

        // Add the controller to the list view in the correct position
        list.add(item, { at: at });
    }

    /**
     * Replaces all the items in the list view with the models in the collection.
     * @private
     */
    function resetList ()
    {
        var list = this.get("list"),
            collection = this.get("collection"),
            itemController = this.get("itemController");

        if (list) {
            // Remove all the items from the list view
            list.reset();

            // If there is a collection and an item controller then add all the items in the collection to the list view
            if (collection && itemController) {
                collection.each(function (model) {
                    addItem.call(this, list, itemController, model);
                }, this);
            }
        }
    }

    /**
     * Handler for when models are added to the list controller's collection. Adds the new models to the list view.
     * @private
     * @param {Object} e The event object.
     */
    function afterModelsAdded (e)
    {
        var list = this.get("list"),
            itemController = this.get("itemController"),
            at = e.info.options.at;

        // If there is a list view and an item controller then add each model to the list view
        if (list && itemController) {
            _.each(e.info.items, function (model, index) {
                addItem.call(this, list, itemController, model, _.isNumber(at) ? at + index : null);
            }, this);
        }
    }

    /**
     * Handler for when models are removed from the list controller's collection. Removes the models from the list view.
     * @private
     * @param {Object} e The event object.
     */
    function afterModelsRemoved (e)
    {
        var list = this.get("list");

        // If there is a list view then remove each model from it
        if (list) {
            _.each(e.info.items, function (model) {
                var itemController = list.find(function (controller) {
                    return controller.get("model") === model;
                });
                
                // Remove the item controller from the list view
                list.remove(itemController);
            }, this);
        }
    }

    /**
     * Handler for when the list controller's collection is reset. Resets the list view with the new models in the collection.
     * @private
     * @param {Object} e The event object.
     */
    function afterReset (e)
    {
        resetList.call(this);
    }

    /**
     * Detaches all event handlers that are attached to the list controller's collection.
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
     * @class list
     * A controller that binds a collection to a list view. There are two components to setup when using a list controller: the collection and itemController attributes.
     * Use the collection attribute to specify the data bound to the list. The itemController attribute is then used for rendering each item in the list.
     * @extends controller
     * @namespace controllers
     */
    return controller.extend({
        /**
         * Initializes the list controller.
         */
        constructor: function ()
        {
            controller.constructor.call(this);

            this.set("list", listWidget.new(), { force: true });
        },

        /**
         * Deinitializes the list controller.
         */
        destructor: function ()
        {
            var list = this.get("list");
            if (list) {
                list.destroy();
            }

            detachCollection.call(this, this.get("collection"));

            controller.destructor.call(this);
        },

        /**
         * The attributes for the list controller.
         * @property
         * @type Object
         */
        attributes: {
            /**
             * @cfg {Object} collection The collection to bind to the list view.
             */
            /**
             * @cfg {Object} itemController The controller object used to render the collection items in the list view.
             */
            /**
             * @cfg {Object} list The list view bound to the collection.
             * @readOnly
             */
            list: {
                readOnly: true
            }
        },

        /**
         * Renders the controller's views to the dom.
         * @param {Object} parentNode The dom element to render the list controller in.
         */
        render: function (parentNode)
        {
            controller.render.call(this, parentNode);

            this.get("list").render(parentNode);
        },

        /**
         * Handles changing of the collection attribute. Takes care of setting up and tearing down event handlers on the collection and resets the list view for the new collection.
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
         * Handles changing of the itemController attribute. Resets the list view for the new item controller.
         * @private
         */
        itemControllerChanged: function ()
        {
            resetList.call(this);
        }
    });
});