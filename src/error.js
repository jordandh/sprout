define(["sprout/pubsub", "sprout/util", "sprout/dom"], function (pubsub, _, $) {
    "use strict";

    var errorModule = {
        requestOptions: {
            url: "/errors",
            type: "POST",
            dataType: "json",
            contentType: "application/json"
        }
    };

    function jsonReplacer (key, value)
    {
        var obj = value;

        // If this is a dom element then only stringify parts of it
        if (value && value.nodeType) {
            obj = {
                nodeType: value.nodeType,
                tagName: value.tagName,
                id: value.id,
                name: value.name,
                value: value.value,
                className: value.className
            };

            _.each(value.attributes, function (attribute) {
                obj[attribute.name] = attribute.value;
            });
        }

        return obj;
    }

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
                    data: JSON.stringify(packageError(error), jsonReplacer)
                }));
            }
        }
        catch (ex) { /* Empty */ }
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