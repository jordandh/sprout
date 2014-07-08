define(["module", "sprout/pubsub", "sprout/util", "sprout/dom", "sprout/env"], function (module, pubsub, _, $, env) {
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

    /*
     * localStorage error store
     * Keeps an error from being reported more than once a day.
     */
    var localStorageErrorStore = {
        /*
         * Private helper functions
         */
        LocalStorageKey: 'sprout-errors',

        getErrorKey: function (error)
        {
            var key, ex;

            if (_.isArray(error.exceptions) && error.exceptions.length > 0) {
                ex = error.exceptions[0];
                key = ex.toString();
            }

            return key || undefined;
        },

        getErrorStore: function ()
        {
            // Grab the error data store from local storage
            var errorStore = localStorage[localStorageErrorStore.LocalStorageKey];

            // If there is a data store then parse it
            if (errorStore) {
                return JSON.parse(errorStore);
            }
            
            return {};
        },

        setErrorStore: function (errorStore)
        {
            localStorage[localStorageErrorStore.LocalStorageKey] = JSON.stringify(errorStore);
        },

        pruneErrorStore: function ()
        {
            var errorStore = localStorageErrorStore.getErrorStore(),
                errors;

            if (_.size(errorStore) > localStorageErrorStore.MaxErrorsInStore) {
                // Sort the errors by lastReportedAt and grab the set to keep (MaxErrorsInStore size set)
                errors = _.chain(errorStore).sortBy(function (errorInfo) {
                    return errorInfo.lastReportedAt;
                }).last(localStorageErrorStore.MaxErrorsInStore).value();

                // Start with a fresh error store
                errorStore = {};

                // Put the remaining errors back into the store
                _.each(errors, function (errorInfo) {
                    errorStore[errorInfo.key] = errorInfo;
                });

                localStorageErrorStore.setErrorStore(errorStore);
            }
        },

        /*
         * Public interface
         */
        MaxErrorsInStore: 20,

        shouldReportError: function (error)
        {
            var errorKey = localStorageErrorStore.getErrorKey(error),
                errorStore, errorInfo, aDayAgo, lastReportedAt;

            // If this error does not have a key or local storage is not supported
            if (!errorKey || !env.localStorageEnabled()) {
                return false;
            }

            // Grab the error data store
            errorStore = localStorageErrorStore.getErrorStore();

            // Grab the info for this error
            errorInfo = errorStore[errorKey];

            // If this error was in the data store
            if (errorInfo) {
                lastReportedAt = new Date(errorInfo.lastReportedAt);
                aDayAgo = new Date();
                aDayAgo.setDate(aDayAgo.getDate() - 1);

                // If this error was already reported today
                if (lastReportedAt > aDayAgo) {
                    return false;
                }
            }

            return true;
        },

        markErrorAsReported: function (error)
        {
            var errorKey = localStorageErrorStore.getErrorKey(error),
                errorStore = localStorageErrorStore.getErrorStore();

            errorStore[errorKey] = {
                key: errorKey,
                lastReportedAt: new Date().getTime()
            };

            localStorageErrorStore.setErrorStore(errorStore);
            localStorageErrorStore.pruneErrorStore();
        }
    };

    var errorModule = {
        options: _.extend({
            reportGlobalErrors: true,
            reportPubsubErrors: true,
            reportRequireErrors: true
        }, module.config().options),

        requestOptions: _.extend({
            url: "/errors",
            type: "POST",
            dataType: "json",
            contentType: "application/json"
        }, module.config().requestOptions),

        stringify: function (error) {
            //return JSON.stringify(decycle(packageError(error)), jsonReplacer);
            //return cereal.stringify(packageError(error));

            //return JSON.stringify(packageError(error), getSerialize(jsonReplacer));

            return JSON.prune(packageError(error), {
                //inheritedProperties: true
            });
        },

        errorStore: localStorageErrorStore
    };

    function packageError (error)
    {
        var err = {
                type: error.type,
                info: {},
                navigator: {},
                window: {},
                exceptions: []
            },
            $window = $(window),
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
        err.window.viewport = $window.width() + 'x' + $window.height();

        return err;
    }

    function submitError (error)
    {
        try {
            if (error && errorModule.errorStore.shouldReportError(error)) {
                $.ajax($.extend({}, errorModule.requestOptions, {
                    data: errorModule.stringify(error)
                }));

                errorModule.errorStore.markErrorAsReported(error);
            }
        }
        catch (ex) { /* empty */ }
    }

    function createGlobalError (message, fileName, lineNumber)
    {
        return {
            message: message,
            fileName: fileName,
            lineNumber: lineNumber,
            toString: function () {
                return this.message;
            }
        };
    }

    window.onerror = function (message, fileName, lineNumber) {
        if (errorModule.options.reportGlobalErrors) {
            submitError({
                type: "global",
                exceptions: [
                    createGlobalError(message, fileName, lineNumber)
                ]
            });
        }
    };

    pubsub.subscribe("error", function (e) {
        if (errorModule.options.reportPubsubErrors) {
            submitError({
                type: "pubsub",
                exceptions: e.info.exception ? [e.info.exception] : [],
                info: e.info.info
            });
        }
    });

    requirejs.onError = function (error) {
        if (errorModule.options.reportRequireErrors) {
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
        }
    };

    return errorModule;
});