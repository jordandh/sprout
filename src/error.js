define("error", ["pubsub", "dom"], function (pubsub, $) {
    "use strict";

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

        return err;
    }

    function submitError (error)
    {
        try {
            if (error) {
                $.ajax({
                    url: "/SubmitError.erb",
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    data: JSON.stringify(packageError(error))
                });
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
            exceptions: [e.info.exception],
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
});