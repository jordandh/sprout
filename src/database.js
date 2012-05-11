define("database", ["util", "dom", "base", "collection"], function (_, $, base, collection) {
    "use strict";

    /**
     * Handler for an unsuccessful transaction.
     * @private
     * @param {Object} e The event object passed to event action functions.
     * @param {Object} deferred The deferred object for the sync.
     * @param {Function} fireAfter The fire after function used in firing async events.
     * @param {Object} xhr The jQuery xhr object for the sync.
     * @param {String} status The status text for the error ("timeout", "error", "abort", or "parsererror").
     * @param {String} error The error thrown. When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
     */
    function onAjaxError (e, deferred, fireAfter, xhr, status, error)
    {
        deferred.reject(xhr, status, error);

        e.info.status = status;
        e.info.error = error;
        fireAfter();
    }

    /**
     * Handler for a successful transaction.
     * @private
     * @param {Object} e The event object passed to event action functions.
     * @param {Object} deferred The deferred object for the sync.
     * @param {Function} fireAfter The fire after function used in firing async events.
     * @param {Object} payload The data from the request.
     */
    function onAjaxSuccess (e, deferred, fireAfter, payload, status, xhr)
    {
        var viewModelData = this.parse(payload, e.src, e.info.options.url);
        deferred.resolve(viewModelData, status, xhr);

        e.info.status = "success";
        fireAfter();
    }

    var database = base.extend({
            /**
             * Initializes the database.
             */
            constructor: function ()
            {
                base.constructor.call(this);
                this.cache = {};
            },

            /**
             * Deinitializes the database.
             */
            destructor: function ()
            {
                this.cache = null;
                base.destructor.call(this);
            },

            /**
             * Any attributes accessed that do not exist are turned into collections that belong to the database.
             * @param {String} name The name of the collection.
             * @return {Object} Returns the collection that was created and added to the database.
             */
            miss: function (name)
            {
                var col = collection.new();
                this.set(name, col);
                return col;
            },

            parse: function (payload, viewModel, url)
            {
                var expires = viewModel.expires,
                    viewModelData = payload.data;

                // Put the models in the tables
                _.each(payload.tables, function (models, tableName) {
                    var col = this.get(tableName);

                    _.each(models, function (modelData) {
                        // Update an existing model otherwise add as a new model
                        var mod = col.getById(modelData.id);
                        if (mod) {
                            mod.parse(modelData);
                        }
                        else {
                            col.add(modelData);
                        }
                    }, this);
                }, this);

                // Cache the data
                if (!_.isNumber(expires) || expires > 0) {
                    this.cache[url] = {
                        data: viewModelData,
                        time: new Date()
                    };
                }

                return viewModelData;
            },

            sync: function (viewModel, options)
            {
                var expires = viewModel.expires,
                    deferred = $.Deferred(),
                    db = this,
                    cachedData;
                
                options = options || {};
                options.type = "GET";
                options.dataType = "json";
                
                if (!options.url) {
                    options.url = viewModel.url();
                }

                cachedData = this.cache[options.url];

                // If the data is cached and it never expires or it hasn't expired
                if (!_.isUndefined(cachedData) && (!_.isNumber(expires) || new Date() - cachedData.time < expires)) {
                    deferred.resolve(cachedData.data, "success", null);
                }
                else {
                    // Fire the sync event as an async event
                    viewModel.fire("sync", { options: options }, function (e, fireAfter) {
                        $.ajax(e.info.options).done(_.bind(onAjaxSuccess, db, e, deferred, fireAfter)).fail(_.bind(onAjaxError, db, e, deferred, fireAfter));
                    }, /* Prevented Action */ function (e) {
                        deferred.reject(null, "abort", null);
                    }, true);
                }
                
                return deferred.promise();
            }
        }),
        databases = [];

    return {
        /**
         * The name of the default database. This is used by viewModels that do not have their db attribute set.
         * @property
         * @type String
         */
        defaultDatabaseName: "default",

        /**
         * Returns the database with the given name. If the database does not exist then it is created.
         * @param {String} name The name of the database.
         * @return {Object} Returns the database with the given name.
         */
        get: function (name)
        {
            var db = databases[name];

            if (_.isUndefined(db)) {
                db = database.create();
                db.name = name;
                databases[name] = db;
            }

            return db;
        }
    };
});