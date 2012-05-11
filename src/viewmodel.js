define("viewmodel", ["util", "base", "database"], function (_, base, database) {
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
        this.fire("error", { xhr: xhr, status: status, error: error });
    }

    /**
     * Returns the attribute value or the matching text if the attribute does not exist.
     * @private
     * @param {String} match The matching text.
     * @param {String} name The name of the attribute.
     * @return {String} Returns the attribute's value if it exists, otherwise match.
     */
    function getUrlValue (match, name)
    {
        var value = this.get(name);
        return _.isUndefined(value) ? match : value;
    }

    return base.extend({
        /**
         * Initializes the viewModel.
         */
        constructor: function ()
        {
            base.constructor.call(this);
            this.db = null;
            this.set("db", database.defaultDatabaseName);
        },

        /**
         * Deinitializes the viewModel.
         */
        destructor: function ()
        {
            this.db = null;
            base.destructor.call(this);
        },

        /**
         * The attributes for the viewModel.
         * @property
         * @type Object
         */
        attributes:
        {
            /**
             * @cfg {String} db The name of the database that contains the viewModel's data.
             */
            db: {
                value: "",
                validator: _.isString
            }
        },

        dbChanged: function (db)
        {
            this.db = database.get(db);
        },

        /**
         * The root url for this viewModel's resource.
         * @property
         * @type String
         */
        rootUrl: "",

        /**
         * The span of time until the viewModel's data expires after being requested. If the viewModel fetches data after expiring then it will ignore the cache and get new data from its resource.
         * A value of zero means the data expires immediately or in other words is not cached. If the value is greater than zero then the data is cached.
         * If the value is not a number then the data never expires. By default data never expires.
         * @property
         * @type Number
         */
        expires: null,

        /**
         * Override to parse new data. The viewModel should fill itself out at this point. By parsing the json data from the new data the viewModel can determine what models to add to itself.
         * @param {Object} json A JSON object of the viewModel's new data.
         */
        parse: function (json)
        {
        },

        /**
         * Returns the url for this viewModel's resource. The url simply returns this.rootUrl.
         * Override this function if this.rootUrl does not point to the viewModel's resource.
         * @return {String} Returns the url for this model's resource.
         */
        url: function ()
        {
            return this.rootUrl.replace(/{([^{}]*)}/g, _.bind(getUrlValue, this));
        },

        /**
         * Retrieves a viewModel's data from the its resource. The viewModel must have any attributes necessary for fetching the data set on it already.
         * @param {Object} options Equivalent to the option parameter for jQuery's ajax function.
         * @options
         * {String} url viewModel.url() Overrides the url used to sync the viewModel with its resource. The default url is model.url().
         * @return {Promise} Returns a promise for the fetch request.
         */
        fetch: function (options)
        {
            return this.db.sync(this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
        }
    });
});