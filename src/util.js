define("util", ["underscore"], function (_) {
    _.mixin({
        /**
         * Remove the first value which passes a truth test.
         */
        remove: function (obj, iterator, context) {
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
         */
        prototypes: function (obj) {
            var chain = [];

            while (obj) {
                chain.push(obj);
                obj = Object.getPrototypeOf(obj);
            }

            return chain;
        },

        /**
         * Creates an object.
         */
        create: function (prototype, members) {
            // TODO: use ES5 Object.create if it exists
            function F () {}
            F.prototype = prototype;
            var obj = new F();
            
            if (members) {
                _.each(members, function (value, name) {
                    obj[name] = value;
                });
            }
            
            // TODO: Object.getPrototypeOf is not supported in IE < 9. If IE8 must be supported then use obj.super to make it possible to get the prototype of an object.
            //obj.super = prototype;
            
            return obj;
        }
    });

    return _;
});