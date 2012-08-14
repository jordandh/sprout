define(["sprout/util", "sprout/base", "sprout/data"], function (_, base, data) {
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
     * @class model
     * Represents a data model that is backed by a resource (usually a server resource). A model can communicate with its resource in four ways: fetching, creating, saving, and deleting.
     * It locates the resource by using the url function to build a path. This url is used to fetch, create, update, and delete the model.
     * The data.sync function is used to communicate with the resource. This can be overridden by a model by defining a sync function on it.
     * A common scenario for this is to save the model to a client side db or cookies instead of to the server. If overridden this function's signature must match that of data.sync.
     * By default the url function uses the model's rootUrl and the model's id to build a url. Both of these members can be overridden to provide different behavior.
     * The model object is meant to be extended for each model type in your application. Ovuerriding members to tailor it for each model type.
     * Common members to override are rootUrl, url, and sync. The rootUrl property points to the model's resource.
     * The url function returns the url specific to an instance of the model.
     * The model's values themselves are stored as attributes and can be used just like base.attributes.
     * Here is an example of making a foobar model.
     * <pre><code>
     *     var foobar = model.extend({
     *         rootUrl: "foobars"
     *     });
     * </code></pre>
     * This creates a foobar model with its server resource located at foobars.
     * @extends base
     */
    /**
     * @event sync
     * Fires when the model is communicating with its resource.
     * @param {String} method The sync method being used. Can be "read", "create", "update", or "delete".
     * @param {Object} options Equivalent to the option parameter for jQuery's ajax function.
     * @options
     * {String} url model.url() Overrides the url used to sync the model with its resource. The default url is model.url().
     */
    /**
     * @event error
     * Fires when an error occurred during communication with the model's resource.
     * @param {Object} xhr The jQuery xhr object for the sync.
     * @param {String} status The status text for the error ("timeout", "error", "abort", or "parsererror").
     * @param {String} error The error thrown. When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
     */
    var model = base.extend({
        /**
         * Creates a new instance of this model.
         * @param {Object} json A key/value hash of model atrributes to set on the model after it is created.
         * @return {Object} Returns a new instance of this model.
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
         * Initializes the model.
         */
        constructor: function ()
        {
            base.constructor.call(this);
            this.set("cid", _.uniqueId("c"), { force: true });
        },
        
        /**
         * The attributes for the model.
         * @property
         * @type Object
         */
        attributes:
        {
            /**
             * @cfg {Number} cid The unique client id of this model.
             * @readOnly
             */
            cid: {
                readOnly: true
            }
        },
        
        /**
         * The root url for this model's resource.
         * @property
         * @type String
         */
        rootUrl: "",
        
        /**
         * Returns an object of the model's attributes for JSON stringification. The results of this function can be used as the argument for model.parse.
         * @return {Object} Returns an object of the model's attributes for JSON stringification.
         */
        toJSON: function ()
        {
            var json = {};
            
            _.each(this.get(), function (value, name) {
                // Do not add all attributes to the json object
                if (name !== "cid" && name !== "destroyed" && name !== "plugins") {
                    if (model.isPrototypeOf(value)) {
                        json[name] = value.toJSON();
                    }
                    else {
                        json[name] = _.clone(value);
                    }
                }
            });
            
            return json;
        },
        
        /**
         * Parses a JSON object representation of the model's attributes. The result of model.toJSON can be used as the argument for this function.
         * @param {Object} json The JSON object of this model's attributes.
         */
        parse: function (json)
        {
            _.each(json, function (value, name) {
                var attribute = this.getAttribute(name);
                
                if (attribute && (attribute.model || attribute.collection)) {
                    this.set(name, (attribute.model || attribute.collection).create(value));
                }
                else {
                    this.set(name, value);
                }
            }, this);
        },
        
        /**
         * Creates a shallow-copied clone. Caller of clone is responsible for releasing the cloned model.
         * @return {Boolean} Returns a shallow-copied clone of this model.
         */
        clone: function ()
        {
            // TODO: may want to do this instead (which would make this a deep copy):
            // return Object.getPrototypeOf(this).create(this.toJSON());
            // This is not the fastest way to do it since it turns everything into JSON just to turn it back into new models.
            
            //var clone = this.super.create();
            //var clone = Object.getPrototypeOf(this).create();
            var clone = _.getPrototypeOf(this).create();
            
            _.each(this.get(), function (value, name) {
                // Do not copy all attributes to clone
                if (name !== "cid" && name !== "destroyed" && name !== "plugins") {
                    clone.set(name, value);
                }
            });
            
            return clone;
        },
        
        /**
         * Returns whether or not this model has been saved to its persistence layer (whether or not this model has an id).
         * @return {Boolean} Returns whether or not this model has been saved to its persistence layer.
         */
        isNew: function ()
        {
            return _.isUndefined(this.get("id"));
        },
        
        /**
         * Returns the url for this model's resource. The url is constructed using this.rootUrl and the model's id.
         * If the model is new then the url is simply this.rootUrl. If the model is not new then the url is this.rootUrl/<model id>.
         * Override this function if it does not point to the model's resource.
         * @return {String} Returns the url for this model's resource.
         */
        url: function ()
        {
            if (this.isNew()) {
                return this.rootUrl;
            }
            
            return this.rootUrl + (this.rootUrl.charAt(this.rootUrl.length - 1) === "/" ? "" : "/") + encodeURIComponent(this.get("id"));
        },
        
        /**
         * Retrieves a model's attributes from the its resource. The model must have an id for this to retrieve a model from its resource.
         * @param {Object} options Equivalent to the option parameter for jQuery's ajax function.
         * @options
         * {String} url model.url() Overrides the url used to sync the model with its resource. The default url is model.url().
         * @return {Promise} Returns a promise for the fetch request.
         */
        fetch: function (options)
        {
            return (this.sync || data.sync)("read", this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
        },
        
        /**
         * Saves a model's attributes to its resource. If the model is new then the model is updated on its resource.
         * If the model is not new then the model is created on its resource.
         * @param {Object} attributes Attributes to set on the model. Use options.wait to set the attributes only after the model has been saved to its resource.
         * @param {Object} options Equivalent to the option parameter for jQuery's ajax function and includes the options for the model's sync function.
         * @options
         * {String} url model.url() Overrides the url used to sync the model with its resource. The default url is model.url().
         * {Boolean} wait false If true then any attributes passed in are not set until after the model has been saved to its resource.
         * {Boolean} mix false If true then any attributes passed in are mixed with the model's other attributes and saved to its resource.
         * @return {Promise} Returns a promise for the save request.
         */
        save: function (attributes, options)
        {
            var promise;

            options = options || {};

            options.wrap = this.wrap;

            // If attributes are being set on this save
            if (attributes) {
                // If the attributes should be set only after the server returns with a success
                if (options.wait) {
                    // Then send over the model's current state with the new attribute values
                    if (options.mix) {
                        options.data = _.extend(this.toJSON(), attributes);
                    }
                    else {
                        options.data = attributes;
                    }
                }
                else {
                    // Else just set the attribtues on the model now
                    this.set(attributes);
                }
            }

            promise = (this.sync || data.sync)(this.isNew() ? "create" : "update", this, options).fail(_.bind(onSyncFailed, this));
            promise.done(_.bind(function (json) {
                // If the attributes should be set after the server returns with a success
                if (options.wait && attributes && options.mix) {
                    // Then change the results from the server to include the attributes
                    json = _.extend(attributes, json);
                    //this.parse(attributes);
                }

                this.parse(json);
            }, this));

            return promise;

            //return (this.sync || data.sync)(this.isNew() ? "create" : "update", this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
        },
        
        /**
         * Deletes a model from the its resource. If this model is in a collection then it will be removed from the collection when deleted from the resource.
         * @param {Object} options Equivalent to the option parameter for jQuery's ajax function.
         * @options
         * {String} url model.url() Overrides the url used to sync the model with its resource. The default url is model.url().
         * @return {Promise} Returns a promise for the delete request.
         */
        erase: function (options)
        {
            return (this.sync || data.sync)("delete", this, options).done(_.bind(this.parse, this)).fail(_.bind(onSyncFailed, this));
        }
    });
    
    return model;
});