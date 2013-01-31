define(["sprout/util", "sprout/base", "sprout/model", "sprout/data", "sprout/dom"], function (_, base, model, data, $) {
    "use strict";
    
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
             * The function used to sort the collection. By default there is no comparator function.
             * If this function is defined then items that are added are inserted in sorted order.
             * This function takes one item as a parameter and must return a value by which the model should be ordered relative to others.
             * @property
             * @type Function
             */
            comparator: null,
            
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
            add: _.createListModifier("add", function (items, options)
            {
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
                        this.items.splice(_.sortedIndex(this.items, item, this.comparator), 0, item);
                    }, this);
                }
                else {
                    // Add the items to the collection at the specifed index or at the end
                    if (_.isNumber(options.at)) {
                        this.items.splice.apply(this.items, [options.at, 0].concat(items));
                    }
                    else {
                        this.items.push.apply(this.items, items);
                    }

                    this.set("count", this.items.length, { force: true });
                }
            }),
            
            /**
             * Removes a model from the collection. Fires a remove event.
             * @param {Array|model} An array of models or a single model to remove from the collection.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent false If true then no event is fired for removing the items. This is false by default.
             */
            remove: _.createListModifier("remove", function (items)
            {
                _.each(items, function (item) {
                    var index = this.indexOf(item);
                    if (index !== -1) {
                        delete this.itemsById[this.items[index].get("id")];
                        delete this.itemsByCid[item.get("cid")];
                        this.items.splice(index, 1);
                    }
                }, this);

                this.set("count", this.items.length, { force: true });
            }),
            
            /**
             * Replaces all the items in the collection. If nothing is passed in then all the items in the collection are removed. Fires a reset event.
             * @param {Array|model} (Optional) An array of models or model json data to add to the collection. Or a single model or model's json data to add to the collection.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent false If true then no event is fired for resetting the items. This is false by default.
             */
            reset: _.createListModifier("reset", function (items)
            {
                // Detach event handlers
                this.each(function (item) {
                    item.detachAfter("sync", afterItemSynced, this);
                });

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
             * Returns the url for this collection's resource. The url simply returns this.rootUrl.
             * Override this function if it does not point to the collection's resource.
             * @return {String} Returns the url for this model's resource.
             */
            url: function ()
            {
                return this.rootUrl;
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
                    this.items = _.sortBy(this.items, comparator, options.context || this);
                };

                if (options.silent) {
                    sorter.call(this);
                }
                else {
                    this.fire("sort", { options: options }, sorter);
                }
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
        collection[methodName] = function () {
            return _[methodName].apply(_, [this.items].concat(_.toArray(arguments)));
        };
    });

    // Add collection dependency to base attributes
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

        function bindCollection (name, attribute, collectionName, dependencies)
        {
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
                var oldCollection = e.info.oldValue,
                    newCollection = e.info.newValue;

                // Unbind the old collection
                if (oldCollection) {
                    oldCollection.detachAfter('add', state.addListener);
                    oldCollection.detachAfter('remove', state.removeListener);
                    oldCollection.detachAfter('reset', state.afterResetListener);
                    oldCollection.detachOn('reset', state.onResetListener);

                    // Unbind the collection's items
                    detachItems(oldCollection.items, state);
                }

                // Bind the new collection
                if (newCollection) {
                    state.addListener = _.bind(afterItemIsAdded, this, state);
                    newCollection.after('add', state.addListener);
                    state.removeListener = _.bind(afterItemIsRemoved, this, state);
                    newCollection.after('remove', state.removeListener);
                    state.afterResetListener = _.bind(afterReset, this, state);
                    newCollection.after('reset', state.afterResetListener);
                    state.onResetListener = _.bind(onReset, this, state);
                    newCollection.on('reset', state.onResetListener);

                    // Bind the collection's items
                    attachItems(newCollection.items, state);
                }

                // The collection itself changed so fire the change event
                state.fireChange();
            }, this);
        }

        base.setupAttribute = function (name, attribute) {
            setupAttribute.apply(this, arguments);

            var reduce = attribute.reduce;

            if (_.isObject(reduce)) {
                _.each(reduce, function (dependencies, collectionName) {
                    bindCollection.call(this, name, attribute, collectionName, _.isString(dependencies) ? [dependencies] : dependencies);
                }, this);
            }
        };
    });
    
    return collection;
});