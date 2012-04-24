define("views/datalist", ["util", "views/list"], function (_, list) {
    "use strict";

    /**
     * Detaches all event handlers that are attached to the datalist's collection.
     * @private
     * @param {Object} itemController The type of controller to create for the list item.
     * @param {Object} model The model for the list item.
     * @param {Number} at (Optional) The index to add the item at in the list. Defaults to the end of the list.
     */
    function addItem (itemController, model, at)
    {
        // Create a controller for the item and set its model
        var item = itemController.create();
        item.set("model", model);

        // Add the controller to the list view in the correct position
        this.add(item, { at: at });
    }

    /**
     * Replaces all the items in the list view with the models in the collection.
     * @private
     */
    function resetList ()
    {
        var collection = this.get("collection"),
            itemController = this.get("itemController");

        // Remove all the items from the list view
        this.reset();

        // If there is a collection and an item controller then add all the items in the collection to the list view
        if (collection && itemController) {
            collection.each(function (model) {
                addItem.call(this, itemController, model);
            }, this);
        }
    }

    /**
     * Handler for when models are added to the datalist's collection. Adds the new models to the list view.
     * @private
     * @param {Object} e The event object.
     */
    function afterModelsAdded (e)
    {
        var itemController = this.get("itemController"),
            at = e.info.options.at;

        // If there is a list view and an item controller then add each model to the list view
        if (itemController) {
            _.each(e.info.items, function (model, index) {
                addItem.call(this, itemController, model, _.isNumber(at) ? at + index : null);
            }, this);
        }
    }

    /**
     * Handler for when models are removed from the datalist's collection. Removes the models from the list view.
     * @private
     * @param {Object} e The event object.
     */
    function afterModelsRemoved (e)
    {
        // If there is a list view then remove each model from it
        _.each(e.info.items, function (model) {
            // Remove the item controller from the list view
            this.remove(this.find(function (controller) {
                return controller.get("model") === model;
            }));
        }, this);
    }

    /**
     * Handler for when the datalist's collection is reset. Resets the list view with the new models in the collection.
     * @private
     */
    function afterReset ()
    {
        resetList.call(this);
    }

    /**
     * Detaches all event handlers that are attached to the datalist's collection.
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
     * @class datalist
     * A list view that is bound to a collection. In order to bind a collection to a datalist there are two attributes to set: collection and itemController.
     * Use the collection attribute to specify the data bound to the list. The itemController attribute is then used for rendering each item in the list.
     * @extends list
     * @namespace views
     */
    /**
     * @cfg {Object} collection The collection to bind to the list view.
     */
    /**
     * @cfg {Object} itemController The controller object used to render the collection items in the list view.
     */
    return list.extend({
        /**
         * Deinitializes the datalist.
         */
        destructor: function ()
        {
            detachCollection.call(this, this.get("collection"));
            list.destructor.call(this);
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