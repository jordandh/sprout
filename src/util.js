define(["underscore", "underscore.string"], function (_, _s) {
    "use strict";

    /*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas. Dual MIT/BSD license */
    window.matchMedia = window.matchMedia || (function(doc, undefined){

      var bool,
          docElem  = doc.documentElement,
          refNode  = docElem.firstElementChild || docElem.firstChild,
          // fakeBody required for <FF4 when executed in <head>
          fakeBody = doc.createElement('body'),
          div      = doc.createElement('div');

      div.id = 'mq-test-1';
      div.style.cssText = "position:absolute;top:-100em";
      fakeBody.style.background = "none";
      fakeBody.appendChild(div);

      return function(q){

        div.innerHTML = '&shy;<style media="'+q+'"> #mq-test-1 { width: 42px; }</style>';

        docElem.insertBefore(fakeBody, refNode);
        bool = div.offsetWidth === 42;
        docElem.removeChild(fakeBody);

        return { matches: bool, media: q };
      };

    }(document));

    var dontEnumMethods = [
        "constructor",
        "toString",
        "valueOf",
        "toLocaleString",
        "prototype",
        "isPrototypeOf",
        "propertyIsEnumerable",
        "hasOwnProperty",
        "length",
        "unique"
    ];

    _.mixin(_s.exports());

    /**
     * @class util
     * Provides utility functions including the underscore and underscore.string api.
     * @singleton
     */
    _.mixin({
        /**
         * Remove the first value from an array or object that passes a truth test.
         * @param {Object|Array} obj The object or array to remove a value from.
         * @param {Object|Function} iterator A value to remove or a function to call. The function must return a truthy or falsy value. Truthy means to remove the value.
         * @param {Object} context (Optional) The context to run the iterator function in.
         */
        remove: function (obj, iterator, context)
        {
            _.all(obj, function (value, index, list) {
                if (_.isFunction(iterator)) {
                    if (iterator.call(context, value, index, list)) {
                        if (_.isArray(list)) {
                            list.splice(index, 1);
                        }
                        else {
                            delete list[index];
                        }

                        return false;
                    }
                }
                else {
                    if (iterator === value) {
                        if (_.isArray(list)) {
                            list.splice(index, 1);
                        }
                        else {
                            delete list[index];
                        }

                        return false;
                    }
                }

                return true;
            });
        },

        override: function (originalFunction, callback, context)
        {
            callback.call(context, originalFunction, context);
        },

        /**
         * Joins strings together to create a path. The path pieces are joined together with a '/'.
         * @param {String} ... Supply any number of strings as arguments to join together.
         * @return {String} Returns the strings joined together as a path.
         */
        joinPaths: function ()
        {
            var length = arguments.length,
                delimiter = "/",
                path, piece;

            if (length === 0) {
                return "";
            }

            path = arguments[0];

            for (var i = 1; i < length; i += 1) {
                piece = arguments[i];

                if (piece !== "") {
                    path = path.replace(/[\/\\]$/, "") + delimiter + piece.replace(/^[\/\\]/, "");
                }
            }

            return path;
        },

        /**
         * Inserts commas into a number. For example 320000 would return '320,000'.
         * @param {Number|String} number The number to insert commas into.
         * @return {String} Returns a string version of the number with commas inserted.
         */
        commafy: function (number)
        {
            return String(number).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        },

        /**
         * Returns the possessive form of a string.
         * @param {String} str The string to make possessive.
         * @return {String} Returns the possessive form of a string.
         */
        possessive: function (str)
        {
            if (str) {
                return str + (str[str.length - 1] === 's' ? "'" : "'s");
            }

            return str;
        },

        /**
         * Returns the prototype chain of an object. The first item in the array is the object and subsequent values are the prototypes up the chain.
         * @param {Object} obj An object to get the prototype chain of.
         * @return {Array} Returns the prototype chain of the object.
         */
        prototypes: function (obj)
        {
            var chain = [];

            while (obj) {
                chain.push(obj);
                obj = _.getPrototypeOf(obj);
            }

            return chain;
        },

        /**
         * Returns the prototype of an object.
         * @param {Object} obj An object to get the prototype of.
         * @return {Object} Returns the prototype of the object.
         */
        getPrototypeOf: function (obj)
        {
            return Object.getPrototypeOf ? Object.getPrototypeOf(obj) : obj.prototypeObject;
        },

        /**
         * Creates an object with a given prototype and members.
         * @param {Object} prototype The prototype for the object being created.
         * @param {Object} members (Optional) Functions and properties to add to the created object.
         * @return {Object} Returns a new object with the given prototype and members.
         */
        create: function (prototype, members)
        {
            var obj, F;

            if (Object.create) {
                obj = Object.create(prototype);

                if (members) {
                    _.each(members, function (value, name) {
                        obj[name] = value;
                    });
                }
            }
            else {
                F = function () {};
                F.prototype = prototype;
                obj = new F();
                obj.prototypeObject = prototype;

                if (members) {
                    _.each(members, function (value, name) {
                        obj[name] = value;
                    });

                    // Fix for don't enum bug in IE8
                    _.each(dontEnumMethods, function (name) {
                        if (members.hasOwnProperty(name)) {
                            obj[name] = members[name];
                        }
                    });
                }
            }

            return obj;
        },

        /**
         * Helper function to create list functions that modify the list's items. Takes care of putting together the items and options parameters and fires an event unless silenced.
         * @param {String} name The name of the event to fire for the modification.
         * @param {Function} modify The function to call that modifies the collection.
         * @return {Function} Returns a function that prepares parameters, fires an event, and calls the modify function.
         */
        createListModifier: function (name, modify)
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
    });

    return _;
});