define(['sprout/util', 'sprout/purl'], function (_, purl) {
	'use strict';

	var namedParam = /:\w+/g,
		splatParam = /\*\w+/g,
		escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g,
		pathStripper = /^[#\/]/;

	function toPathRegExp (path)
	{
		return new RegExp('^' + path.replace(escapeRegExp, '\\$&').replace(namedParam, '([^\/]+)').replace(splatParam, '(.*?)') + '$');
	}

	/**
	 * @class url
	 * Provides functionality for manipulating urls including the querystring, hash, and navigation.
	 * Extends the jQuery-URL-Parser library (also known as purl) with new functionality.
	 */
	return function () {
		var url = purl.apply(this, arguments),
			purlParam = url.param;

		/**
		 * Gets or sets a querystring parameter.
		 * @param {Object|String} param An object set of querystring parameters to set. Or a string of the querystring parameter name.
		 * @param {String} value (Optional) If provided and the first parameter is a string then sets the querystring parameter with this value.
		 * @return {String|url} If used to set values then this url is returned for chaining. If used to get a value then the value is returned.
		 */
		url.param = function (param, value) {
			if (_.isObject(param)) {
				_.each(param, function (val, key) {
					this.data.param.query[key] = val;
				}, this);
				return this;
			}

			if (_.isString(param) && !_.isUndefined(value)) {
				this.data.param.query[param] = value;
				return this;
			}

			return purlParam.apply(this, arguments);
		};

		/**
		 * Removes the querystirng parameters passed in.
		 * @param {String} params A space delimited string of querystring parameters to removed from the url.
		 * @return {url} This url object is returned for chaining.
		 */
		url.remove = function (params) {
			_.each(params.split(' '), function (param) {
				delete this.data.param.query[param];
			}, this);

			return this;
		};

		/**
		 * Constructs a path from the url's properties and navigates the browser to it.
		 * @return {url} This url object is returned for chaining.
		 */
		url.navigate = function () {
			var path = [this.data.attr.base, this.data.attr.path],
				param = this.param(),
				count = 0;

			// Querystring
			//_.each(this.data.param.query, function (val, key) {
			if (param !== '') {
				_.each(param, function (val, key) {
					if (key !== '') {
						path.push(count > 0 ? '&' : '?', encodeURIComponent(key), '=', encodeURIComponent(val));
						count += 1;
					}
				});
			}

			// Hash/Fragment
			/*count = 0;
			_.each(this.data.param.fragment, function (val, key) {
				path.push(count > 0 ? '&' : '#', encodeURIComponent(key), '=', encodeURIComponent(val));
				count += 1;
			});*/

			document.location.href = path.join('');

			return this;
		};

		url.url = function (skipEncoding) {
			var path = [this.data.attr.base, this.data.attr.path],
				param = this.param(),
				count = 0;

			// Querystring
			if (param !== '') {
				_.each(param, function (val, key) {
					if (key !== '') {
						if (skipEncoding) {
							path.push(count > 0 ? '&' : '?', key, '=', val);
						}
						else {
							path.push(count > 0 ? '&' : '?', encodeURIComponent(key), '=', encodeURIComponent(val));
						}

						count += 1;
					}
				});
			}

			// Hash/Fragment
			/*count = 0;
			_.each(this.data.param.fragment, function (val, key) {
				path.push(count > 0 ? '&' : '#', encodeURIComponent(key), '=', encodeURIComponent(val));
				count += 1;
			});*/

			return path.join('');
		};

		/**
		 * Determines whether the url's path matches a given pattern.
		 * @return {Boolean} Returns true if the url's path matches the pattern, false otherwise.
		 */
		url.match = function (pattern) {
			return (_.isRegExp(pattern) ? pattern : toPathRegExp(pattern)).test(this.attr('path').replace(pathStripper, ''));
		};

		url.absolute = function () {
			var source = this.attr('source');


			/* Only accept commonly trusted protocols:
			 * Only data-image URLs are accepted, Exotic flavours (escaped slash,
			 * html-entitied characters) are not supported to keep the function fast
			 */
			if(/^(https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i.test(source)) {
				return source; // Url is already absolute
			}

			var base_url = location.href.match(/^(.+)\/?(?:#.+)?$/)[0] + '/';

			if (source.substring(0, 2) === '//') {
				return location.protocol + source;
			}
			else if (source.charAt(0) === '/') {
				return location.protocol + '//' + location.host + source;
			}
			else if (source.substring(0,2) === './') {
				source = '.' + source;
			}
			else if (/^\s*$/.test(source)) {
				return ''; //Empty = Return nothing
			}
			else {
				source = '../' + source;
			}

			source = base_url + source;

			while(/\/\.\.\//.test(source = source.replace(/[^\/]+\/+\.\.\//g,"")));

			/* Escape certain characters to prevent XSS */
			// source = source.replace(/\.$/,"").replace(/\/\./g,"").replace(/"/g,"%22")
			// 		.replace(/'/g,"%27").replace(/</g,"%3C").replace(/>/g,"%3E");

			return source;
		};

		return url;
	};
});