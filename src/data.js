define("data", ["util", "dom"], function (_, $) {
    "use strict";
    
    /*
     * An object map for converting sync method types to HTTP verbs.
     */
	var methodToType = {
		"read": "GET",
		"update": "PUT",
		"create": "POST",
		"delete": "DELETE"
	};

    /**
     * Handler for an unsuccessful transaction.
     * @private
     * @param {Object} e The event object passed to event action functions.
     * @param {Function} fireAfter The fire after function used in firing async events.
     * @param {Object} xhr The jQuery xhr object for the sync.
     * @param {String} status The status text for the error ("timeout", "error", "abort", or "parsererror").
     * @param {String} error The error thrown. When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
     */
	function onAjaxError (e, fireAfter, xhr, status, error)
	{
		e.info.status = _.trim(status);
		e.info.error = _.trim(error);
		fireAfter();
	}

    /**
     * Handler for a successful transaction.
     * @private
     * @param {Object} e The event object passed to event action functions.
     * @param {Function} fireAfter The fire after function used in firing async events.
     */
	function onAjaxSuccess (e, fireAfter)
	{
		e.info.status = "success";
		fireAfter();
	}
	
	/**
     * @class data
     * Provides default functionality for communicating with a data resource.
     * The default functionality uses a server as the resource and communicates using AJAX.
     * @singleton
     */
	return {
		/**
         * Carries out a transaction for a model or collection (or any object that implements the interface for a url, toJSON, isNew, and fire method).
         * The transaction can be a read, update, create, or delete action. AJAX is used to communicate with the server resource.
         * A sync event is fired on behalf of the model and a promise object is returned for handling success and fail scenarios.
         * Success callbacks are passed three arguments. The first argument is the response data.
         * The second argument is the status text. The third argument is the jQuery xhr object.
         * Failed callbacks are passed three arguments as well. The first argument is the jQuery xhr object.
         * The second argument is the status text which can be "timeout", "error", "abort", or "parsererror".
         * The third argument is the error thrown; when an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error."
         * @param {String} method The type of transaction to carry out. Can be "read", "update", "create", or "delete".
         * @param {Object} model An object that provies a url, toJSON, isNew, and fire method. Both model and collection implement this interface.
         * @param {Object} options (Optional) Equivalent to the option parameter for jQuery's ajax function.
         * @return {Promise} Returns a promise for the sync transaction.
         */
		sync: function (method, model, options)
		{
			var verb = methodToType[method],
				promise;
			
			options = options || {};
			
			options.type = verb;
			options.dataType = "json";
			
			if (!options.url) {
				options.url = model.url();
			}
			
			// When sending data to save or create send as JSON
			if (method === "create" || method === "update") {
				options.contentType = "application/json";
				options.data = JSON.stringify(options.data || model.toJSON());
			}
			
			// Don't process data for GET requests
			if (verb !== "GET") {
				options.processData = false;
			}
			
			// Fire the sync event as an async event
			model.fire("sync", { method: method, options: options }, function (e, fireAfter) {
				// If deleting the model and the model is new then the server resource does not need to be updated
				if (e.info.method === "delete" && model.isNew()) {
					promise = $.Deferred().resolve(null, "success", null).promise();
				}
				else {
					promise = $.ajax(e.info.options);
				}

				promise.done(_.bind(onAjaxSuccess, null, e, fireAfter)).fail(_.bind(onAjaxError, null, e, fireAfter));
			}, /* Prevented Action */ function (e) {
				promise = new $.Deferred().reject(null, "abort", null).promise();
			}, true);
			
			return promise;
		}
	};
});