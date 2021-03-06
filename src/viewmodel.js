define(["sprout/util", "sprout/base", "sprout/database"], function (_, base, database) {
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
     * @class viewmodel
     * @extends base
     */
    /**
     * @event sync
     * Fires when the view model is communicating with its resource.
     * @param {Object} options Equivalent to the option parameter for jQuery's ajax function.
     * @options
     * {String} url viewmodel.url() Overrides the url used to sync the view model with its resource. The default url is model.url().
     */
    /**
     * @event error
     * Fires when an error occurred during communication with the model's resource.
     * @param {Object} xhr The jQuery xhr object for the sync.
     * @param {String} status The status text for the error ("timeout", "error", "abort", or "parsererror").
     * @param {String} error The error thrown. When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
     */
    return base.extend({
        /**
         * Initializes the viewmodel.
         */
        constructor: function ()
        {
            base.constructor.call(this);
            this.db = null;
            this.set("db", database.defaultDatabaseName);
        },

        /**
         * Deinitializes the viewmodel.
         */
        destructor: function ()
        {
            this.db = null;
            base.destructor.call(this);
        },

        /**
         * The attributes for the viewmodel.
         * @property
         * @type Object
         */
        attributes:
        {
            /**
             * @cfg {String} db The name of the database that contains the viewmodel's data.
             */
            db: {
                value: "",
                validator: _.isString
            }
        },

        /**
         * Handles changing of the db attribute. Takes care of getting a reference to the view model's database.
         * @private
         * @param {String} db The new value of the db attribute.
         */
        dbChanged: function (db)
        {
            this.db = database.get(db || database.defaultDatabaseName);
        },

        /**
         * The root url for this viewmodel's resource.
         * @property
         * @type String
         */
        rootUrl: "",

        /**
         * The urlEncoder is the function used to encode a value when building the viewmodel's url.
         * @property
         * @type Function
         */
        urlEncoder: encodeURI,
        
        /**
         * The urlEncoders is an object of key/value pairs to define encoding functions per attribute name (attribute name => encoding function).
         * @property
         * @type Object
         */
        urlEncoders: null,

        /**
         * The span of time until the viewmodel's data expires after being requested. If the viewmodel fetches data after expiring then it will ignore the cache and get new data from its resource.
         * A value of zero means the data expires immediately or in other words is not cached. If the value is greater than zero then the data is cached.
         * If the value is not a number then the data never expires. By default data never expires.
         * @property
         * @type Number
         */
        expires: null,

        /**
         * Parses a JSON object representation of the viewmodel's attributes.
         * Override to parse new data. The viewmodel should fill itself out at this point. By parsing the json data from the new data the viewmodel can determine what models to add to itself.
         * Usually you override this function and first call viewmodel.parse to read in the json data. Then you use that data to grab more data from the database.
         * @param {Object} json A JSON object of the viewmodel's new data.
         */
        parse: function (json)
        {
            var valueChanged = false;

            _.each(json, function (value, name) {
                var attribute = this.getAttribute(name);
                
                if (attribute && (attribute.model || attribute.collection)) {
                    valueChanged |= this.set(name, (attribute.model || attribute.collection).create(value));
                }
                else {
                    valueChanged |= this.set(name, value);
                }
            }, this);

            if (valueChanged) {
                this.fire("update");
            }
        },

        /**
         * Returns the url for this viewmodel's resource. The url simply returns this.rootUrl.
         * Override this function if this.rootUrl does not point to the viewmodel's resource.
         * @return {String} Returns the url for this model's resource.
         */
        url: function ()
        {
            return this.rootUrl.replace(/{([^{}]*)}/g, _.bind(this.getUrlValue, this));
        },

        /**
         * Returns the attribute value or the matching text if the attribute does not exist.
         * @param {String} match The matching text.
         * @param {String} name The name of the attribute.
         * @return {String} Returns the attribute's value if it exists, otherwise match.
         */
        getUrlValue: function (match, name)
        {
            var value = this.get(name),
                urlEncoder = this.urlEncoder;

            if (this.urlEncoders && this.urlEncoders[name]) {
                urlEncoder = this.urlEncoders[name];
            }

            return urlEncoder(_.isUndefined(value) ? match : value);
        },

        /**
         * Retrieves a viewmodel's data from the its resource. The viewmodel must have any attributes necessary for fetching the data set on it already.
         * @param {Object} options Equivalent to the option parameter for jQuery's ajax function.
         * @options
         * {String} url viewmodel.url() Overrides the url used to sync the viewmodel with its resource. The default url is viewmodel.url().
         * @return {Promise} Returns a promise for the fetch request.
         */
        fetch: function (options)
        {
            return this.db.sync("read", this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
        },

        save: function (options)
        {
            return this.db.sync("update", this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
        },

        erase: function (options)
        {
            return this.db.sync("delete", this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
        }
    });
});
