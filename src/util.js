define("util", ["underscore", "underscore.string"], function (_, _s) {
    "use strict";

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
     * Provides utility functions including the underscore api.
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
            // If ES5 is not available then use the code below to create an object.
            /*function F () {}
            F.prototype = prototype;
            var obj = new F();*/
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
                        /*var method = members[name];
                        if (!_.isUndefined(method)) {
                            obj[name] = method;
                        }*/
                        if (members.hasOwnProperty(name)) {
                            obj[name] = members[name];
                        }
                    });
                }
            }
            
            /*if (members) {
                _.each(members, function (value, name) {
                    obj[name] = value;
                });
            }*/
            
            // If ES5 is not available then super needs to be set on the object so that _.getPrototypeOf can use it.
            //obj.super = prototype;
            
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