define(["sprout/util", "sprout/base", "sprout/model", "sprout/data", "sprout/dom"], function (_, base, model, data, $) {
    "use strict";

    /**
     * Helper function to create list functions that modify the list's items. Takes care of putting together the items and options parameters and fires an event unless silenced.
     * @param {String} name The name of the event to fire for the modification.
     * @param {Function} modify The function to call that modifies the collection.
     * @return {Function} Returns a function that prepares parameters, fires an event, and calls the modify function.
     */
    function createListModifier (name, modify)
    {
        return function (items, options) {
            options = options || {};

            if (items) {
                items = _.isArray(items) ? items : [items];
            }
            else {
                items = [];
            }

            if (options.silent) {
                modify.call(this, items, options);
            }
            else {
                this.fire(name, { items: items, options: options }, function (e) {
                    modify.call(this, e.info.items, e.info.options);
                });
            }
        };
    }

    /**
     * Helper function to create list functions that modify the list's items. Takes care of putting together the items and options parameters and fires an event unless silenced.
     * @param {String} name The name of the event to fire for the modification.
     * @param {Function} modify The function to call that modifies the collection.
     * @return {Function} Returns a function that prepares parameters, fires an event, and calls the modify function.
     */
    function createListModifierWithNoItems (name, modify)
    {
        return function (options) {
            options = options || {};

            if (options.silent) {
                modify.call(this, options);
            }
            else {
                this.fire(name, { options: options }, function (e) {
                    // The modify function can return the items it modified. Set info.items equal to it.
                    e.info.items = modify.call(this, e.info.options);
                });
            }
        };
    }
    
    /**
     * Handler for sync errors.
     * @private
     * @param {Object} xhr The jQuery xhr object for the sync.
     * @param {String} status The status text for the error ("timeout", "error", "abort", or "parsererror").
     * @param {String} error The error thrown. When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
     */
    function onSyncFailed (xhr, status, error)
    {
        this.fire("error", { xhr: xhr, status: _.trim(status), error: _.trim(error) });
    }

    /**
     * Handler for when items are deleted from a sync. Removes the item from the collection when deleted.
     * @private
     * @param {Object} e The event object.
     */
    function afterItemSynced (e)
    {
        if (e.info.method === "delete") {
            this.remove(e.src);
        }
    }

    function updateIndices (at)
    {
        var item;

        if (this.index) {
            // Update all the items starting from the lowest index added
            for (var i = at, length = this.items.length; i < length; i += 1) {
                item = this.items[i];
                if (item) {
                    item.set(this.index, i);

                    if (this.itemCollection) {
                        item.set(this.itemCollection, this);
                    }
                }
            }
        }
    }

    /**
     * @class collection
     * Represents a list of models that is backed by a resource (usually a server resource). A collection can only communicate with its resource by fetching a list of data models.
     * It locates the resource by using the url function which builds a path.
     * The data.sync function uses that url to communicate with the resource. This can be overridden by a collection by defining a sync function on it.
     * A common scenario for this is to fetch the collection from a client side db or cookies instead of from the server. If overridden this function's signature must match that of data.sync.
     * By default the url function simply returns the collections rootUrl property. The rootUrl property should be overridden with the location of the collection's resource.
     * Most collection methods allow for a model or a model's json data to be used as input. In order for a collection to properly handle the json data it must know what type of models it contains.
     * The model member property is used for this.
     * Because collection derives from base its attributes can be accessed with the get and set functions.
     * The base.get function can be passed indices to retrieve items from the collection. However, the collection.at function is the preferred method as it is provides better performance.
     * Here is an example of making a foobars collection:
     * <pre><code>
     *     var foobars = collection.extend({
     *         rootUrl: "foobars",
     *         model: foobar
     *     });
     * </code></pre>
     * This creates a foobars collection composed of the foobar model with its server resource located at foobars.
     * @extends base
     */
    /**
     * @event add
     * Fires when items are being added to the collection.
     * @param {Array} items The items being added to the collection.
     * @param {Object} options
     * @options
     * {Boolean} silent false If true then no event is fired for adding the items. This is false by default.
     * {Number} at undefined The index to insert the items at in the collection. By default items are added to the end of the collection.
      */
    /**
     * @event remove
     * Fires when items are being removed from the collection.
     * @param {Array} items The items being removed from the collection.
     * @param {Object} options
     * @options
     * {Boolean} silent false If true then no event is fired for removing the items. This is false by default.
     */
    /**
     * @event reset
     * Fires when the collection is being reset.
     * @param {Array} items The items being added to the collection after it is cleared.
     * @param {Object} options
     * @options
     * {Boolean} silent false If true then no event is fired for resetting the items. This is false by default.
     */
    /**
     * @event sort
     * Fires when the collection is being sorted.
     * @param {Object} options
     * @options
     * {Object} context collection The context to run the comparator function in. Defaults to the collection.
     * {Boolean} silent false If true then no event is fired for adding the item. This is false by default.
     */
    /**
     * @event sync
     * Fires when the collection is communicating with its resource.
     * @param {String} method The sync method being used. Can be "read", "create", "update", or "delete".
     * @param {Object} options Equivalent to the option parameter for jQuery's ajax function.
     * @options
     * {String} url collection.url() Overrides the url used to sync the collection with its resource. The default url is collection.url().
     */
    /**
     * @event error
     * Fires when an error occurred during communication with the collection's resource.
     * @param {Object} xhr The jQuery xhr object for the sync.
     * @param {String} status The status text for the error ("timeout", "error", "abort", or "parsererror").
     * @param {String} error The error thrown. When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
     */
    var collection = base.extend({
            /**
             * Creates a new instance of this collection.
             * @param {Object} json An array of models or model json data to add to the collection after it is created.
             * @return {Object} Returns a new instance of this collection.
             */
            create: function (json)
            {
                var instance = base.create.call(this);
                if (json) {
                    instance.parse(json);
                }
                return instance;
            },
            
            /**
             * Initializes the collection.
             */
            constructor: function ()
            {
                base.constructor.call(this);
                this.items = [];
                this.itemsById = {};
                this.itemsByCid = {};
            },

            /**
             * Deinitializes the collection.
             */
            destructor: function ()
            {
                // Destroy the items if necessary
                if (this.destroyItems) {
                    _.each(this.items, function (item) {
                        if (item && _.isFunction(item.destroy)) {
                            item.destroy();
                        }
                    });
                }

                this.items = null;
                this.itemsById = null;
                this.itemsByCid = null;
                base.destructor.call(this);
            },

            /**
             * The attributes for the collection.
             * @property
             * @type Object
             */
            attributes: {
                /**
                 * @cfg {Boolean} empty Whether or not the collection has no items in it.
                 * @default false
                 * @readOnly
                 * @computable
                 */
                empty: {
                    get: function () {
                        return this.get("count") === 0;
                    },
                    uses: "count"
                },
                /**
                 * @cfg {Boolean} count The number of items in the collection.
                 * @default 0
                 * @readOnly
                 */
                count: {
                    value: 0,
                    readOnly: true
                }
            },

            /**
             * The root url for this collections resource.
             * @property
             * @type String
             */
            rootUrl: "",

            /**
             * The type of models in this collection. If a model's json data is added then this property is used to create a model with that json data.
             * @property
             * @type model
             */
            model: model,

            /**
             * If specified then each item in the collection has an attribute set equal to the item's index in the collection.
             * The attribute set on the item is this index value.
             * If not specified then the index is not set on the items.
             * @property
             * @type String
             */
            index: null,

            /**
             * If specified then each item in the collection has an attribute set equal to this collection.
             * The attribute set on the item is this itemCollection value.
             * If not specified then the collection is not set on the items.
             * @property
             * @type String
             */
            itemCollection: null,

            /**
             * The function used to sort the collection. By default there is no comparator function.
             * If this function is defined then items that are added are inserted in sorted order.
             * This function takes one item as a parameter and must return a value by which the model should be ordered relative to others.
             * @property
             * @type Function
             */
            comparator: null,

            /**
             * Whether or not the collection is a sparse array. Most collections should not be sparse.
             * Primarily used for correctly calculating the collection's count.
             * @property
             * @type Boolean
             */
            sparse: false,

            /**
             * Whether or not the items should be destroyed when they are removed from the collection.
             * An item will be destroyed when removed from the collection or when the collection is destroyed.
             * @property
             * @type Boolean
             */
            destroyItems: false,
            
            /**
             * Returns an array of the collection's items for JSON stringification. The results of this function can be used as the argument for collection.parse.
             * @return {Array} Returns an array of the collection's items for JSON stringification.
             */
            toJSON: function ()
            {
                return this.map(function (item) {
                    if (model.isPrototypeOf(item)) {
                        return item.toJSON();
                    }
                    else {
                        return _.clone(item);
                    }
                });
            },

            clone: function ()
            {
                return collection.create(this.map(function (item) {
                    return item;
                }));
            },
            
            /**
             * Parses a JSON array of items to add to the collection. Any existing items in the array are removed.
             * The result of collection.toJSON can be used as the argument for this function.
             * @param {Object} json The json array to parse and.
             */
            parse: function (json)
            {
                this.reset(json);
            },
            
            /**
             * Returns the item at a given index in the collection.
             * @param {Number} index The index into the collection.
             * @return {model} Returns the model at the index.
             */
            at: function (index)
            {
                return this.items[index];
            },

            /**
             * Returns the item with a matching id in the collection.
             * @param {String} id The id of the item to get.
             * @param {Boolean} createIfMissing If the item is not in the collection then one is created with the given id and returned.
             * @return {model} Returns the model with the matching id.
             */
            getById: function (id, createIfMissing)
            {
                var item = this.itemsById[id];

                if (createIfMissing && !item) {
                    item = this.model.create({ id: id });
                    // TODO: Should this be a call to add?
                    this.itemsById[id] = item;
                    this.itemsByCid[item.get("cid")] = item;
                }

                return item;
            },

            /**
             * Returns the item with a matching cid in the collection.
             * @param {String} cid The cid of the item to get.
             * @return {model} Returns the model with the matching cid.
             */
            getByCid: function (cid)
            {
                return this.itemsByCid[cid];
            },
            
            /**
             * Adds a model to the collection. Fires an add event.
             * @param {Array|model} An array of models or model json data to add to the collection. Or a single model or model's json data to add to the collection.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent false If true then no event is fired for adding the items. This is false by default.
             * {Number} at undefined The index to insert the items at in the collection. By default items are added to the end of the collection.
             */
            add: createListModifier("add", function (items, options)
            {
                var at = [];

                // Turn any json data into models and listen to sync events
                _.each(items, function (item, index) {
                    var id;

                    if (!model.isPrototypeOf(item)) {
                        item = this.model.create(item);
                    }

                    item.after("sync", afterItemSynced, this);

                    id = item.get("id");
                    if (!_.isUndefined(id)) {
                        this.itemsById[id] = item;
                    }

                    this.itemsByCid[item.get("cid")] = item;
                    
                    items[index] = item;
                }, this);

                // If there is a comparator function then insert each item into the sorted array maintaining sort order
                if (_.isFunction(this.comparator)) {
                    _.each(items, function (item) {
                        var index = _.sortedIndex(this.items, item, this.comparator);

                        at.push(index);

                        this.items.splice(index, 0, item);
                    }, this);
                }
                else {
                    // Add the items to the collection at the specifed index or at the end
                    if (_.isNumber(options.at)) {
                        at.push(options.at);

                        // If inserting the items beyond the end of the array
                        if (options.at > this.items.length) {
                            // Then assign them explicitly in order to make the array sparse
                            for (var i = 0, length = items.length; i < length; i += 1) {
                                this.items[options.at + i] = items[i];
                            }
                        }
                        else {
                            this.items.splice.apply(this.items, [options.at, 0].concat(items));
                        }
                    }
                    else {
                        at.push(this.items.length);
                        this.items.push.apply(this.items, items);
                    }
                }

                // Update the item indices
                updateIndices.call(this, Math.min.apply(null, at));

                // Update the count
                this.set("count", this.sparse ? _.sparseSize(this.items) : this.items.length, { force: true });
            }),
            
            /**
             * Removes a model from the collection. Fires a remove event.
             * @param {Array|model} An array of models or a single model to remove from the collection.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent false If true then no event is fired for removing the items. This is false by default.
             */
            remove: createListModifier("remove", function (items, options)
            {
                // Grab the indices of the items being removed (before they are removed)
                options.at = [];
                _.each(items, function (item) {
                    var index = this.indexOf(item);
                    if (index !== -1) {
                        options.at.push(index);
                    }
                }, this);

                // Remove each item
                _.each(items, function (item) {
                    var index = this.indexOf(item);
                    if (index !== -1) {
                        delete this.itemsById[this.items[index].get("id")];
                        delete this.itemsByCid[item.get("cid")];
                        this.items.splice(index, 1);

                        // Destroy the item if necessary. If this is a move modification then the items are being added back so don't destroy them.
                        if (this.destroyItems && !options.move && item && _.isFunction(item.destroy)) {
                            item.destroy();
                        }
                    }
                }, this);

                // Update the item indices
                updateIndices.call(this, Math.min.apply(null, options.at));

                // Update the count
                this.set("count", this.sparse ? _.sparseSize(this.items) : this.items.length, { force: true });
            }),

            /**
             * Replace an item in the collection. Fires a remove event followed by an add event.
             * @param {model} A single model or model's json data to add to the collection.
             * @param {Object} options
             * @options
             * {Boolean} silent false If true then no event is fired for replacing the item. This is false by default.
             * {Number} at undefined The index of the item to replace in the collection.
             */
            replace: createListModifier("replace", function (items, options)
            {
                if (_.isNumber(options.at)) {
                    this.remove(this.at(options.at), _.clone(options));
                }

                this.add(items, options);
            }),

            /**
             * Move an item from location to another in the collection. Fires a remove event followed by an add event.
             * @param {Object} options
             * @options
             * {Boolean} silent false If true then no event is fired for moving the item. This is false by default.
             * {Number} from undefined The index of the item to move in the collection.
             * {Number} to undefined The index to move the item to in the collection.
             */
            move: createListModifierWithNoItems("move", function (options)
            {
                var from = options.from,
                    to = options.to,
                    mod;

                // If the from and to indices are not numbers or are the same then do nothing
                if (!_.isNumber(from) || !_.isNumber(to) || from === to) {
                    return [];
                }

                // Grab the item being removed
                mod = this.at(from);

                // If there is an actual item
                if (mod) {
                    this.remove(mod, {
                        move: true
                    });

                    this.add(mod, {
                        move: true,
                        at: to
                    });

                    return [mod];
                }

                return [];
            }),
            
            /**
             * Replaces all the items in the collection. If nothing is passed in then all the items in the collection are removed. Fires a reset event.
             * @param {Array|model} (Optional) An array of models or model json data to add to the collection. Or a single model or model's json data to add to the collection.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent false If true then no event is fired for resetting the items. This is false by default.
             */
            reset: createListModifier("reset", function (items)
            {
                // Detach event handlers and destroy items
                this.each(function (item) {
                    item.detachAfter("sync", afterItemSynced, this);

                    // Destroy the item if necessary
                    if (this.destroyItems && item && _.isFunction(item.destroy)) {
                        item.destroy();
                    }
                }, this);

                // Set the items array equal to a new empty array
                this.items = [];
                this.itemsById = {};
                this.itemsByCid = {};
                this.set("count", 0, { force: true });
                
                // Add any new items if there are any suppresing the add event since this is a reset event
                if (items.length > 0) {
                    this.add(items, { silent: true });
                }
            }),
            
            /**
             * Extracts a list of attribute values from the collection.
             * @param {String} name The name of the attribute to extract from each item in the collection.
             * @return {Array} Returns an array of attribute values from the collection.
             */
            pluck: function (name)
            {
                return this.map(function (item) {
                    return item.get(name);
                });
            },

            /**
             * Returns whether or not this model has been saved to its persistence layer (whether or not this model has an id).
             * @return {Boolean} Returns whether or not this model has been saved to its persistence layer.
             */
            isNew: function ()
            {
                return this.get("id") === null || _.isUndefined(this.get("id"));
            },

            /**
             * Returns the url for this collection's resource. The url simply returns this.rootUrl.
             * Override this function if it does not point to the collection's resource.
             * @return {String} Returns the url for this model's resource.
             */
            url: function ()
            {
                // return this.rootUrl;

                if (this.isNew()) {
                    return this.rootUrl;
                }

                return this.rootUrl + (this.rootUrl.charAt(this.rootUrl.length - 1) === "/" ? "" : "/") + encodeURIComponent(this.get("id"));
            },
            
            /**
             * Retrieves a collection of models from the its resource.
             * @param {Object} options (Optional) Equivalent to the option parameter for jQuery's ajax function.
             * @options
             * {String} url collection.url() Overrides the url used to sync the collection with its resource. The default url is collection.url().
             * @return {Promise} Returns a promise for the fetch request.
             */
            fetch: function (options)
            {
                return (this.sync || data.sync)("read", this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
            },
            
            /**
             * A convenience method for creating a model, saving it to its resource, and once saved adding it to this collection.
             * This method is equivalent to doing this:
             * <pre><code>
             *     var col = foobars.create(),
             *         mod = foobar.create({ name: "Data" });
             *
             *     mod.save().done(function () {
             *         col.add(mod);
             *     });
             * </code></pre>
             * @param {model} mod A model or a model's json data to create and add to the collection.
             * @param {Object} options (Optional) Equivalent to the option parameter for jQuery's ajax function.
             * @options
             * {String} url model.url() Overrides the url used to sync the model with its resource. The default url is model.url().
             * {Boolean} silent false If true then no event is fired for adding the item. This is false by default.
             * {Number} at undefined The index to insert the items at in the collection. By default the item is added to the end of the collection.
             * @return {Promise} Returns a promise for the save request.
             */
            make: function (mod, options)
            {
                var deferred = new $.Deferred();

                if (!model.isPrototypeOf(mod)) {
                    mod = this.model.create(mod);
                }

                //return mod.save(null, options).done(_.bind(this.add, this, mod, options));

                mod.save(null, options).done(_.bind(this.add, this, mod, options)).done(function () {
                    deferred.resolve.apply(null, [mod].concat(arguments));
                }).fail(function () {
                    deferred.reject.apply(null, arguments);
                });

                return deferred.promise();
            },

            /**
             * Sorts the items in the collection.
             * @param {Function} comparator A function to compare the items with. This function takes one item as a parameter and must return a value by which the model should be ordered relative to others.
             * @param {Object} options (Optional)
             * @options
             * {Object} context collection The context to run the comparator function in. Defaults to the collection.
             * {Boolean} silent false If true then no event is fired for sorting the items. This is false by default.
             */
            sortBy: function (comparator, options)
            {
                options = options || {};

                var sorter = function () {
                    // Sort the items
                    this.items = _.sortBy(this.items, comparator, options.context || this);
                    // Update the item indices
                    updateIndices.call(this, 0);
                };

                if (options.silent) {
                    sorter.call(this);
                }
                else {
                    this.fire("sort", { options: options }, sorter);
                }

                return this;
            },

            /**
             * Sorts the items in the collection using this.comparator to order the items.
             * Normally this function does not need to be called because a collection with a comparator defined maintains sort order automatically.
             * @param {Object} options (Optional)
             * @options
             * {Object} context collection The context to run the comparator function in. Defaults to the collection.
             * {Boolean} silent false If true then no event is fired for sorting the items. This is false by default.
             */
            sort: function (options)
            {
                if (!_.isFunction(this.comparator)) {
                    throw new Error("A comparator function must be defined to sort a collection.");
                }

                return this.sortBy(this.comparator, options);
            }
        }),
        /*
         * Underscore functions to mixin to the collection object
         */
        _methods = ["forEach", "each", "map", "reduce", "reduceRight", "find", "detect", "filter", "select", "reject", "every", "all", "some", "any", "include", "contains", "invoke",
                   "max", "min", "sortedIndex", "toArray", "size", "first", "initial", "rest", "last", "without", "indexOf", "shuffle", "lastIndexOf", "isEmpty", "groupBy", "uniq", "unique"];
    
    // Mixin underscore functions
    _.each(_methods, function (methodName) {
        collection[methodName] = function () {
            return _[methodName].apply(_, [this.items].concat(_.toArray(arguments)));
        };
    });

    /*
     * Add the bindToCollection method to base
     */
    base.bindToCollection = function (name, options) {
        options = options || {};

        var context = options.context || this,
            addListener, removeListener, resetListener, moveListener;

        // Starts listening to changes in the collection
        function attachCollection (col)
        {
            if (col) {
                if (_.isFunction(options.add)) {
                    addListener = _.bind(options.add, context, options);
                    col.after('add', addListener);
                }
                if (_.isFunction(options.remove)) {
                    removeListener = _.bind(options.remove, context, options);
                    col.after('remove', removeListener);
                }
                if (_.isFunction(options.reset)) {
                    resetListener = _.bind(options.reset, context, options);
                    col.after('reset', resetListener);
                }
                if (_.isFunction(options.move)) {
                    moveListener = _.bind(options.move, context, options);
                    col.after('move', moveListener);
                }
            }
        }

        // Stops listening to changes in the collection
        function detachCollection (col)
        {
            if (col) {
                col.detachAfter('add', addListener);
                col.detachAfter('remove', removeListener);
                col.detachAfter('reset', resetListener);
                col.detachAfter('move', moveListener);
                addListener = null;
                removeListener = null;
                resetListener = null;
                moveListener = null;
            }
        }

        // Listen to the collection changing
        this.after(name + 'Change', function (e) {
            detachCollection(e.info.oldValue);
            attachCollection(e.info.newValue);
        });

        if (_.isFunction(options.change)) {
            this.after(name + 'Change', _.bind(options.change, context, options));
        }

        // Attach the collection for the first time
        attachCollection(this.get(name));
    };

    /*
     * Add support for collection specific attribute properties (reduce, map, list)
     */
    _.override(base.setupAttribute, function (setupAttribute) {
        function attachItems (items, state)
        {
            _.each(items, function (item) {
                _.each(state.dependencies, function (dependency) {
                    item.after(dependency + 'Change', state.fireChange);
                });
            });
        }

        function detachItems (items, state)
        {
            _.each(items, function (item) {
                _.each(state.dependencies, function (dependency) {
                    item.detachAfter(dependency + 'Change', state.fireChange);
                });
            });
        }

        function attachCollection (col, state)
        {
            if (col) {
                state.addListener = _.bind(afterItemIsAdded, null, state);
                col.after('add', state.addListener);
                state.removeListener = _.bind(afterItemIsRemoved, null, state);
                col.after('remove', state.removeListener);
                state.afterResetListener = _.bind(afterReset, null, state);
                col.after('reset', state.afterResetListener);
                state.onResetListener = _.bind(onReset, null, state);
                col.on('reset', state.onResetListener);

                // Bind the collection's items
                attachItems(col.items, state);
            }
        }

        function detachCollection (col, state)
        {
            if (col) {
                col.detachAfter('add', state.addListener);
                col.detachAfter('remove', state.removeListener);
                col.detachAfter('reset', state.afterResetListener);
                col.detachOn('reset', state.onResetListener);

                // Unbind the collection's items
                detachItems(col.items, state);
            }
        }

        function afterItemIsAdded (state, e)
        {
            attachItems(e.info.items, state);
            state.fireChange();
        }

        function afterItemIsRemoved (state, e)
        {
            detachItems(e.info.items, state);
            state.fireChange();
        }

        function onReset (state, e)
        {
            detachItems(e.src.items, state);
        }

        function afterReset (state, e)
        {
            attachItems(e.info.items, state);
            state.fireChange();
        }

        /*
         * reduce functions
         */
        var reduceHelper = {
            bindCollection: function (name, attribute, collectionName, dependencies) {
                var self = this,
                    state = {
                        addListener: null,
                        removeListener: null,
                        onResetListener: null,
                        afterResetListener: null,
                        dependencies: dependencies,
                        fireChange: function () {
                            self.fireAttributeChangeEvents(attribute, name, null, attribute.get.call(self));
                        }
                    };

                this.after(collectionName + 'Change', function (e) {
                    detachCollection(e.info.oldValue, state);
                    attachCollection(e.info.newValue, state);

                    // The collection itself changed so fire the change event
                    state.fireChange();
                }, this);

                // Attach the collection for the first time
                attachCollection(this.get(collectionName), state);
            }
        };

        /*
         * map helper
         */
        var mapHelper = {
            start: function (name, attribute, options) {
                var updating = false,
                    collectionType = options.collection || collection;

                // Prevents one of the updater functions from being called if an update is in progress. Also insures that the updating state is correct if an exception is thrown during an update.
                function guardUpdate (updater)
                {
                    return function (bindOptions, e) {
                        if (updating) {
                            return;
                        }

                        try {
                            updating = true;
                            updater.call(this, bindOptions, e);
                        }
                        finally {
                            updating = false;
                        }
                    };
                }
                
                function transformAll ()
                {
                    var self = this,
                        destCol = this.get(name),
                        srcCol = this.get(options.source);

                    if (destCol && srcCol) {
                        destCol.reset(srcCol.map(function (item) {
                            return options.transform.call(self, item);
                        }));
                    }
                }

                // Setup the uses property
                if (_.isString(options.uses)) {
                    options.uses = [options.uses];
                }

                _.each(options.uses, function (dependency) {
                    this.bind(dependency, transformAll, this);
                }, this);

                // Bind to the destination collection
                if (options.untransform) {
                    this.bindToCollection(name, {
                        add: guardUpdate(function (bindOptions, e) {
                            if (e.info.options.move) {
                                return;
                            }

                            var srcCol = this.get(options.source);

                            // Add the items to the source collection
                            if (srcCol) {
                                srcCol.add(_.map(e.info.items, function (item) {
                                    return options.untransform.call(this, item);
                                }, this), e.info.options);
                            }
                        }),
                        remove: guardUpdate(function (bindOptions, e) {
                            if (e.info.options.move) {
                                return;
                            }

                            var srcCol = this.get(options.source);

                            // Remove the items from the source collection
                            if (srcCol) {
                                srcCol.remove(_.map(e.info.options.at, function (index) {
                                    return srcCol.at(index);
                                }, this), e.info.options);
                            }
                        }),
                        reset: guardUpdate(function (bindOptions, e) {
                            var srcCol = this.get(options.source);

                            // Reset the source collection
                            if (srcCol) {
                                srcCol.reset(_.map(e.info.items, function (item) {
                                    return options.untransform.call(this, item);
                                }, this), e.info.options);
                            }
                        }),
                        move: guardUpdate(function (bindOptions, e) {
                            this.get(options.source).move(e.info.options);
                        })
                    });
                }

                // Bind to the source collection
                this.bindToCollection(options.source, {
                    change: function (bindOptions, e) {
                        var self = this;

                        if (e.info.newValue) {
                            // Map the items from the source collection to the destination collection
                            this.set(name, collectionType.create(e.info.newValue.map(function (item) {
                                return options.transform.call(self, item);
                            }, this)));
                        }
                        else {
                            this.set(name, null);
                        }
                    },
                    add: guardUpdate(function (bindOptions, e) {
                        if (e.info.options.move) {
                            return;
                        }

                        // Add the transformed items to the destination collection
                        this.get(name).add(_.map(e.info.items, function (item) {
                            return options.transform.call(this, item);
                        }, this), e.info.options);
                    }),
                    remove: guardUpdate(function (bindOptions, e) {
                        if (e.info.options.move) {
                            return;
                        }

                        var destCol = this.get(name);

                        // Remove the items from the destination collection
                        destCol.remove(_.map(e.info.options.at, function (index) {
                            return destCol.at(index);
                        }, this), e.info.options);
                    }),
                    reset: guardUpdate(function (bindOptions, e) {
                        // Reset the destination collection with the transformed items
                        this.get(name).reset(_.map(e.info.items, function (item) {
                            return options.transform.call(this, item);
                        }, this), e.info.options);
                    }),
                    move: guardUpdate(function (bindOptions, e) {
                        this.get(name).move(e.info.options);
                    })
                });
            }
        };

        /*
         * list helper
         */
        var listHelper = {
            start: function (name, attribute, options)
            {
                var state = {
                    name: name,
                    repo: options.repo,
                    source: options.source,
                    collectionType: options.collection || collection
                };

                // Listen to the source changing
                this.after(options.source + 'Change', _.bind(listHelper.syncWithSource, this, state));

                // Sync for the first time
                listHelper.syncWithSource.call(this, state);
            },

            syncWithSource: function (state)
            {
                var ids = this.get(state.source),
                    col = this.get(state.name),
                    repo = _.isFunction(state.repo) ? state.repo.call(this) : state.repo;

                if (_.isArray(ids) && ids.length > 0) {
                    // Create the collection if it does not exist
                    if (!col) {
                        col = state.collectionType.create();
                    }

                    // Go through each id and sync it with the collection
                    _.each(ids, function (id, index) {
                        var mod = col.at(index);

                        // If the model is not in this collection at this index
                        if (!mod || mod.get('id') !== index) {
                            // Then set the model at this index
                            col.replace(repo.getById(id, true), { at: index });
                        }
                    });

                    // Set this after updating the collection. Do this to improve the performance the first time through here.
                    // By doing this anything that is bound to the collection will not get each update as it happens but instead just get a new collection at once.
                    this.set(state.name, col);
                }
            }
        };

        base.setupAttribute = function (name, attribute) {
            var reduce = attribute.reduce,
                map = attribute.map,
                list = attribute.list;

            // If this attribute has a map property
            if (_.isObject(map)) {
                // Then set it to auto destroy the value as it changes
                attribute.destroy = true;
            }

            // Call the original setupAttribute method
            setupAttribute.apply(this, arguments);

            // If this attribute has a reduce property
            if (_.isObject(reduce)) {
                _.each(reduce, function (dependencies, collectionName) {
                    reduceHelper.bindCollection.call(this, name, attribute, collectionName, _.isString(dependencies) ? [dependencies] : dependencies);
                }, this);
            }

            // If this attribute has a map property
            if (_.isObject(map)) {
                mapHelper.start.call(this, name, attribute, map);
            }

            // If this attribute has a list property
            if (_.isObject(list)) {
                listHelper.start.call(this, name, attribute, list);
            }
        };
    });
    
    return collection;
});