define(["sprout/util", "sprout/dom", "sprout/base", "sprout/collection"], function (_, $, base, collection) {
    "use strict";

    /*
     * An object map for converting sync method types to HTTP verbs.
     */
    var methodToType = {
        'read': 'GET',
        'update': 'PUT',
        'create': 'POST',
        'delete': 'DELETE'
    };
    
    /**
     * Resolves or rejects a derrered object with the given arguments and optionally delayed.
     * @param {Object} deferred The deferred object for the sync.
     * @param {String} method Which method to use on the deferred object. Can be 'resolve' or 'reject'.
     * @param {Array} args The arguments to pass to the deferred method.
     * @param {Number} delay (Optional) The milliseconds to wait before calling deferred method.
     * @param {Date} startTime (Optional) the date that the sync operation started. Used to see how much of the delay time has already passed.
     * @private
     */
    function finishDeferred (deferred, method, args, options)
    {
        var timePassed;

        if (_.isNumber(options.wait) && options.wait > 0) {
            options.promise.releaseHold = function () {
                options.wait -= 1;
                if (options.wait <= 0) {
                    finishDeferred.call(this, deferred, method, args, options);
                }
            };
            return;
        }

        if (_.isNumber(options.delay) && _.isDate(options.startTime)) {
            timePassed = new Date() - options.startTime;
        }

        if (_.isNumber(timePassed) && timePassed < options.delay) {
            _.delay(function () {
                deferred[method].apply(null, args);
            }, options.delay - timePassed);
        }
        else {
            deferred[method].apply(null, args);
        }
    }

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
    function onAjaxError (e, deferred, options, fireAfter, xhr, status, error)
    {
        status = _.trim(status);
        error = _.trim(error);

        finishDeferred(deferred, 'reject', [xhr, status, error], options);

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
    function onAjaxSuccess (e, deferred, options, fireAfter, payload, status, xhr)
    {
        var viewModelData = this.parse(payload, e.src, e.info.options.url);

        finishDeferred(deferred, 'resolve', [viewModelData, status, xhr], options);

        e.info.status = "success";
        fireAfter();
    }

    /**
     * @class database
     * @extends base
     */
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
             * Looks up a model type in the schema and returns the corresponding collection the type belongs in.
             * @param {String} type The name of the model type.
             * @return {Object} Returns the collection that the model type belongs in.
             */
            getCollectionForType: function (type)
            {
                var schema = this.get("schema"),
                    col;

                if (schema) {
                    type = type.toLowerCase();

                    _.find(schema, function (colSchema, colName) {
                        if (type === colSchema.type.toLowerCase()) {
                            col = this.get(colName);
                            return true;
                        }
                    }, this);
                }

                return col;
            },

            /**
             * Any attributes accessed that do not exist are turned into collections that belong to the database.
             * @param {String} name The name of the collection.
             * @return {Object} Returns the collection that was created and added to the database.
             */
            miss: function (name)
            {
                var schema = this.get("schema"),
                    col = collection.create(),
                    colSchema, colModel;

                this.set(name, col);

                if (schema) {
                    colSchema = schema[name];
                    if (colSchema) {
                        colModel = colSchema.model;

                        if (_.isObject(colModel)) {
                            col.model = colModel;
                        }
                        else if (_.isString(colModel)) {
                            // TODO: call require on the colModel and then set the col.model equal to the result. This means getting a db collection has to be async which could suck.
                        }
                    }
                }

                return col;
            },

            /**
             * Override to parse new data. The viewmodel should fill itself out at this point. By parsing the json data from the new data the viewmodel can determine what models to add to itself.
             * @param {Object} payload A JSON object containing the data from the request.
             * @param {Object} viewModel (Optional) The viewmodel requesting the data.
             * @param {String} url (Optional) The url for the request.
             * @return {Object} Returns the json data from the payload that belongs to the viewmodel.
             */
            parse: function (payload, viewModel, url)
            {
                var expires = viewModel ? viewModel.expires : 0,
                    viewModelData = payload.data;

                // Put the models in the tables
                _.each(payload.tables, function (models, tableName) {
                    var col = this.get(tableName);

                    _.each(models, function (modelData) {
                        if (modelData) {
                            // Update an existing model otherwise add as a new model
                            var mod = col.getById(modelData.id);
                            if (mod) {
                                mod.parse(modelData);
                            }
                            else {
                                col.add(modelData);
                            }
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

            /**
             * Carries out a read transaction for a viewmodel. AJAX is used to communicate with the server resource.
             * A sync event is fired on behalf of the viewmodel and a promise object is returned for handling success and fail scenarios.
             * Success callbacks are passed three arguments. The first argument is the response data.
             * The second argument is the status text. The third argument is the jQuery xhr object.
             * Failed callbacks are passed three arguments as well. The first argument is the jQuery xhr object.
             * The second argument is the status text which can be "timeout", "error", "abort", or "parsererror".
             * The third argument is the error thrown; when an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
             * @param {Object} viewModel The viewmodel requesting the data.
             * @param {Object} options (Optional) Equivalent to the option parameter for jQuery's ajax function.
             * @options
             * {Number} delay undefined If a number then delays (in milliseconds) when the sync operation resolves or rejects itself with a starting point of when the sync function was called. If the sync operation takes longer than the delay then the operation resolves or rejects itself immediately.
             * {Number} wait undefined If a number then makes the sync operation wait before resolving or rejecting itself. This is done with a wait count option. The wait count is decremented with the releaseHold method on the promise returned by the sync function. Once the wait count reaches zero the sync operation resolves or rejects itself (assuming the sync operation has finished). If the sync operation finishes and the wait count is zero then the sync operation resolves or rejects itself immediately.
             * @return {Promise} Returns a promise for the sync transaction.
             */
            sync: function (method, viewModel, options)
            {
                var verb = methodToType[method],
                    expires = viewModel.expires,
                    deferred = $.Deferred(),
                    promise = deferred.promise(),
                    db = this,
                    deferredOptions = {},
                    cachedData, jqXHR;

                options = options || {};
                options.type = verb;
                options.dataType = "json";

                if (!options.url) {
                    options.url = viewModel.url();
                }

                // When sending data to save or create send as JSON
                if (method === 'create' || method === 'update') {
                    options.contentType = 'application/json';
                    options.data = JSON.stringify(options.data);
                }
                else if (method === 'read') {
                    cachedData = this.cache[options.url];
                }

                // If a delay should be applied then make note of the start time
                if (_.isNumber(options.delay)) {
                    deferredOptions.delay = options.delay;
                    deferredOptions.startTime = new Date();
                }

                if (_.isNumber(options.wait) && options.wait > 0) {
                    deferredOptions.wait = options.wait;
                    deferredOptions.promise = promise;
                    // Put a simple release hold that only decrements the wait count. This is so the wait count is updated before the first call to finishDeferred.
                    // The finishDeferred function will overwrite this function to call itself once the wait drops to zero or lower.
                    promise.releaseHold = function () {
                        deferredOptions.wait -= 1;
                    };
                }

                promise.abort = function (abortOptions) {
                    abortOptions = abortOptions || {};

                    if (jqXHR) {
                        jqXHR.abort();
                    }

                    if (abortOptions.ignoreWait) {
                        delete deferredOptions.wait;
                    }
                    finishDeferred(deferred, 'reject', [null, "abort", null], deferredOptions);
                };

                // If the data is cached and it never expires or it hasn't expired
                if (method === 'read' && !_.isUndefined(cachedData) && (!_.isNumber(expires) || new Date() - cachedData.time < expires)) {
                    finishDeferred(deferred, 'resolve', [cachedData.data, "success", null], deferredOptions);
                }
                else {
                    // Fire the sync event as an async event
                    viewModel.fire("sync", { options: options }, function (e, fireAfter) {
                        jqXHR = $.ajax(e.info.options).done(_.bind(onAjaxSuccess, db, e, deferred, deferredOptions, fireAfter)).fail(_.bind(onAjaxError, db, e, deferred, deferredOptions, fireAfter));
                    }, /* Prevented Action */ function (e) {
                        finishDeferred(deferred, 'reject', [null, "abort", null], deferredOptions);
                    }, true);
                }
                
                return promise;
            }
        }),
        databases = [];

    /**
     * @class dbms
     * Provides functionality for accessing databases.
     * @singleton
     */
    return {
        /**
         * The name of the default database. This is used by viewmodels that do not have their db attribute set.
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