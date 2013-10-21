define(["sprout/pubsub", "sprout/util", "sprout/dom"], function (pubsub, _, $) {
    "use strict";

    (function () {
        'use strict';

        var DEFAULT_MAX_DEPTH = 6;
        var DEFAULT_ARRAY_MAX_LENGTH = 50;
        var seen; // Same variable used for all stringifications
        var iterator; // either forEachEnumerableOwnProperty, forEachEnumerableProperty or forEachProperty

        // iterates on enumerable own properties (default behavior)
        var forEachEnumerableOwnProperty = function(obj, callback) {
            for (var k in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) callback(k);
            }
        };
        // iterates on enumerable properties
        var forEachEnumerableProperty = function(obj, callback) {
            for (var k in obj) callback(k);
        };
        // iterates on properties, even non enumerable and inherited ones
        // This is dangerous
        var forEachProperty = function(obj, callback, excluded) {
            if (obj==null) return;
            excluded = excluded || {};
            Object.getOwnPropertyNames(obj).forEach(function(k){
                if (!excluded[k]) {
                    callback(k);
                    excluded[k] = true;
                }
            });
            forEachProperty(Object.getPrototypeOf(obj), callback, excluded);
        };

        Date.prototype.toPrunedJSON = Date.prototype.toJSON;
        String.prototype.toPrunedJSON = String.prototype.toJSON;

        var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            meta = {    // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"' : '\\"',
                '\\': '\\\\'
            };

        function quote(string) {
            escapable.lastIndex = 0;
            return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string'
                    ? c
                    : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' : '"' + string + '"';
        }

        function str(key, holder, depthDecr, arrayMaxLength) {
            var i, k, v, length, partial, value = holder[key];
            if (value && typeof value === 'object' && typeof value.toPrunedJSON === 'function') {
                value = value.toPrunedJSON(key);
            }

            switch (typeof value) {
            case 'string':
                return quote(value);
            case 'number':
                return isFinite(value) ? String(value) : 'null';
            case 'boolean':
            case 'null':
                return String(value);
            case 'object':
                if (!value) {
                    return 'null';
                }
                if (depthDecr<=0 || seen.indexOf(value)!==-1) {
                    return '"-pruned-"';
                }
                seen.push(value);
                partial = [];
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    length = Math.min(value.length, arrayMaxLength);
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value, depthDecr-1, arrayMaxLength) || 'null';
                    }
                    return  '[' + partial.join(',') + ']';
                }
                iterator(value, function(k) {
                    try {
                        v = str(k, value, depthDecr-1, arrayMaxLength);
                        if (v) partial.push(quote(k) + ':' + v);
                    } catch (e) { 
                        // this try/catch due to forbidden accessors on some objects
                    }               
                });
                return '{' + partial.join(',') + '}';
            }
        }

        JSON.prune = function (value, depthDecr, arrayMaxLength) {
            if (typeof depthDecr == "object") {
                var options = depthDecr;
                depthDecr = options.depthDecr;
                arrayMaxLength = options.arrayMaxLength;
                iterator = options.iterator || forEachEnumerableOwnProperty;
                if (options.allProperties) iterator = forEachProperty;
                else if (options.inheritedProperties) iterator = forEachEnumerableProperty
            } else {
                iterator = forEachEnumerableOwnProperty;
            }
            seen = [];
            depthDecr = depthDecr || DEFAULT_MAX_DEPTH;
            arrayMaxLength = arrayMaxLength || DEFAULT_ARRAY_MAX_LENGTH;
            return str('', {'': value}, depthDecr, arrayMaxLength);
        };
        
        JSON.prune.log = function() {
            console.log.apply(console,  Array.prototype.slice.call(arguments).map(function(v){return JSON.parse(JSON.prune(v))}));
        }
        JSON.prune.forEachProperty = forEachProperty; // you might want to also assign it to Object.forEachProperty

    }());

    var errorModule = {
        requestOptions: {
            url: "/errors",
            type: "POST",
            dataType: "json",
            contentType: "application/json"
        },

        stringify: function (error) {
            //return JSON.stringify(decycle(packageError(error)), jsonReplacer);
            //return cereal.stringify(packageError(error));

            //return JSON.stringify(packageError(error), getSerialize(jsonReplacer));

            return JSON.prune(packageError(error), {
                //inheritedProperties: true
            });
        }
    };

//     /*
//      * Crockford's decycle
//      */
//     function decycle (object) {
// // Make a deep copy of an object or array, assuring that there is at most
// // one instance of each object or array in the resulting structure. The
// // duplicate references (which might be forming cycles) are replaced with
// // an object of the form
// //      {$ref: PATH}
// // where the PATH is a JSONPath string that locates the first occurance.
// // So,
// //      var a = [];
// //      a[0] = a;
// //      return JSON.stringify(JSON.decycle(a));
// // produces the string '[{"$ref":"$"}]'.

// // JSONPath is used to locate the unique object. $ indicates the top level of
// // the object or array. [NUMBER] or [STRING] indicates a child member or
// // property.

//         var objects = [],   // Keep a reference to each unique object or array
//             paths = [];     // Keep the path to each unique object or array

//         return (function derez(value, path) {

// // The derez recurses through the object, producing the deep copy.

//             var i,          // The loop counter
//                 name,       // Property name
//                 nu;         // The new object or array

// // typeof null === 'object', so go on if this value is really an object but not
// // one of the weird builtin objects.

//             if (typeof value === 'object' && value !== null &&
//                     !(value instanceof Boolean) &&
//                     !(value instanceof Date)    &&
//                     !(value instanceof Number)  &&
//                     !(value instanceof RegExp)  &&
//                     !(value instanceof String)) {

// // If the value is an object or array, look to see if we have already
// // encountered it. If so, return a $ref/path object. This is a hard way,
// // linear search that will get slower as the number of unique objects grows.

//                 for (i = 0; i < objects.length; i += 1) {
//                     if (objects[i] === value) {
//                         return {$ref: paths[i]};
//                     }
//                 }

// // Otherwise, accumulate the unique value and its path.

//                 objects.push(value);
//                 paths.push(path);

// // If it is an array, replicate the array.

//                 if (Object.prototype.toString.apply(value) === '[object Array]') {
//                     nu = [];
//                     for (i = 0; i < value.length; i += 1) {
//                         nu[i] = derez(value[i], path + '[' + i + ']');
//                     }
//                 } else {

// // If it is an object, replicate the object.

//                     nu = {};
//                     for (name in value) {
//                         if (Object.prototype.hasOwnProperty.call(value, name)) {
//                             nu[name] = derez(value[name],
//                                 path + '[' + JSON.stringify(name) + ']');
//                         }
//                     }
//                 }
//                 return nu;
//             }
//             return value;
//         }(object, '$'));
//     }

    // function getSerialize (fn) {
    //   var seen = [];
    //   return function (key, value) {
    //     var ret = value;
    //     if (typeof value === 'object' && value) {
    //       if (seen.indexOf(value) !== -1)
    //         ret = '[Circular]';
    //       else
    //         seen.push(value);
    //     }
    //     if (fn) ret = fn(key, ret);
    //     return ret;
    //   };
    // }

    // function jsonReplacer (key, value)
    // {
    //     var obj = value;

    //     // If this is a dom element then only stringify parts of it
    //     if (value && value.nodeType) {
    //         obj = {
    //             nodeType: value.nodeType,
    //             tagName: value.tagName,
    //             id: value.id,
    //             name: value.name,
    //             value: value.value,
    //             className: value.className
    //         };

    //         _.each(value.attributes, function (attribute) {
    //             obj[attribute.name] = attribute.value;
    //         });
    //     }

    //     return obj;
    // }

    function packageError (error)
    {
        var err = {
                type: error.type,
                info: {},
                navigator: {},
                window: {},
                exceptions: []
            },
            ex, exInfo;

        // Grab the exception information
        if (error.exceptions) {
            for (var i = 0, length = error.exceptions.length; i < length; i += 1) {
                ex = error.exceptions[i];

                if (ex) {
                    exInfo = {
                        name: ex.name,
                        message: ex.message
                    };

                    if (ex.fileName) {
                        exInfo.fileName = ex.fileName;
                    }

                    if (ex.lineNumber) {
                        exInfo.lineNumber = ex.lineNumber;
                    }

                    if (ex.type) {
                        exInfo.type = ex.type;
                    }

                    if (ex.description) {
                        exInfo.description = ex.description;
                    }

                    if (ex.number) {
                        exInfo.number = ex.number;
                    }

                    if (ex.arguments) {
                        exInfo.arguments = ex.arguments;
                    }

                    if (ex.stack) {
                        exInfo.stack = ex.stack;
                    }

                    err.exceptions.push(exInfo);
                }
            }
        }

        // Grab the information related to the error
        if (error.info) {
            for (var name in error.info) {
                if (error.info.hasOwnProperty(name)) {
                    err.info[name] = error.info[name];
                }
            }
        }

        // Grab info about the client's environment
        err.navigator.userAgent = navigator.userAgent;
        err.navigator.language = navigator.language;
        err.window.location = window.location.toString();

        //return pruneErrorForJSON(err);
        return err;
    }

    function submitError (error)
    {
        try {
            if (error) {
                $.ajax($.extend({}, errorModule.requestOptions, {
                    data: errorModule.stringify(error)
                }));
            }
        }
        catch (ex) { /* empty */ }
    }

    window.onerror = function (message, fileName, lineNumber) {
        submitError({
            type: "global",
            exceptions: [{
                message: message,
                fileName: fileName,
                lineNumber: lineNumber
            }]
        });
    };

    pubsub.subscribe("error", function (e) {
        submitError({
            type: "pubsub",
            exceptions: e.info.exception ? [e.info.exception] : [],
            info: e.info.info
        });
    });

    requirejs.onError = function (error) {
        submitError({
            type: "requirejs",
            exceptions: [error, error.originalError],
            info: {
                moduleName: error.moduleName,
                moduleTree: error.moduleTree,
                requireType: error.requireType,
                requireModules: error.requireModules
            }
        });
    };

    return errorModule;
});