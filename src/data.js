define(['sprout/util', 'sprout/dom'], function (_, $) {
    'use strict';
    
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
     * Handler for an unsuccessful transaction.
     * @private
     * @param {Object} e The event object passed to event action functions.
     * @param {Function} fireAfter The fire after function used in firing async events.
     * @param {Object} xhr The jQuery xhr object for the sync.
     * @param {String} status The status text for the error ('timeout', 'error', 'abort', or 'parsererror').
     * @param {String} error The error thrown. When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as 'Not Found' or 'Internal Server Error.'
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
		e.info.status = 'success';
		fireAfter();
	}

	/**
     * Resolves or rejects a derrered object with the given arguments and optionally delayed.
     * @param {Object} deferred The deferred object for the sync.
     * @param {String} method Which method to use on the deferred object. Can be 'resolve' or 'reject'.
     * @param {Array} args The arguments to pass to the deferred method.
     * @param {Number} delay (Optional) The milliseconds to wait before calling deferred method.
     * @param {Date} startTime (Optional) the date that the sync operation started. Used to see how much of the delay time has already passed.
     * @private
     */
	function finishDeferred (deferred, method, args, delay, startTime)
	{
		var timePassed;

		if (_.isNumber(delay) && _.isDate(startTime)) {
			timePassed = new Date() - startTime;
		}

		if (_.isNumber(timePassed) && timePassed < delay) {
			_.delay(function () {
				deferred[method].apply(null, args);
			}, delay - timePassed);
		}
		else {
			deferred[method].apply(null, args);
		}
	}

	function wrapData (data, wrapper)
	{
		var wrappedData = {};
		wrappedData[wrapper] = data;
		return wrappedData;
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
         * The second argument is the status text which can be 'timeout', 'error', 'abort', or 'parsererror'.
         * The third argument is the error thrown; when an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as 'Not Found' or 'Internal Server Error.'
         * @param {String} method The type of transaction to carry out. Can be 'read', 'update', 'create', or 'delete'.
         * @param {Object} model An object that provies a url, toJSON, isNew, and fire method. Both model and collection implement this interface.
         * @param {Object} options (Optional) Equivalent to the option parameter for jQuery's ajax function with some extra functionality.
         * @options
         * {Number} delay undefined If a number then delays (in milliseconds) when the sync operation resolves or rejects itself with a starting point of when the sync function was called. If the sync operation takes longer than the delay then the operation resolves or rejects itself immediately.
         * {String} wrap undefined If supplied then the data is nested in an object in the json data with the name being wrap's value.
         * @return {Promise} Returns a promise for the sync transaction.
         */
		sync: function (method, model, options)
		{
			var verb = methodToType[method],
				deferred = new $.Deferred(),
				promise = deferred.promise(),
				startTime;
			
			options = options || {};
			
			options.type = verb;
			options.dataType = 'json';
			
			if (!options.url) {
				options.url = model.url();
			}
			
			// When sending data to save or create send as JSON
			if (method === 'create' || method === 'update') {
				options.contentType = _.isUndefined(options.contentType) || _.isNull(options.contentType) ? 'application/json' : options.contentType;
				options.data = options.data || model.toJSON();

				if (options.contentType === 'application/json') {
					options.data = JSON.stringify(options.wrap ? wrapData(options.data, options.wrap) : options.data);
				}
			}
			
			// Don't process data for GET requests
			if (verb !== 'GET') {
				options.processData = false;
			}

			// If a delay should be applied then make note of the start time
			if (_.isNumber(options.delay)) {
				startTime = new Date();
			}
			
			// Fire the sync event as an async event
			model.fire('sync', { method: method, options: options }, function (e, fireAfter) {
				// If deleting the model and the model is new then the server resource does not need to be updated
				if (e.info.method === 'delete' && model.isNew()) {
					finishDeferred(deferred, 'resolve', [null, 'success', null], options.delay, startTime);
				}
				else {
					$.ajax(e.info.options).done(function () {
						finishDeferred(deferred, 'resolve', arguments, options.delay, startTime);
					}).fail(function () {
						finishDeferred(deferred, 'reject', arguments, options.delay, startTime);
					});
				}

				promise.done(_.bind(onAjaxSuccess, null, e, fireAfter)).fail(_.bind(onAjaxError, null, e, fireAfter));
			}, /* Prevented Action */ function (e) {
				finishDeferred(deferred, 'reject', [null, 'abort', null], options.delay, startTime);
			}, true);
			
			return promise;
		}
	};
});