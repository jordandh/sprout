(function () {
    var errorCount = 0,
        currentTestCaseName = "",
        currentTestNumber = 0,
        resultsTable = $("#results").get(0);

    function appendTestCaseHeaderRow (testName)
    {
        var row = resultsTable.insertRow(-1),
            cell = row.insertCell(-1);

        $(row).addClass("header");

        cell.colSpan = 2;

        $("<span>").html("Running tests for " + testName).appendTo(cell);
    }

    function appendFailedTestResultRow (testName, ex)
    {
        var row = resultsTable.insertRow(-1),
            cell = row.insertCell(-1);

        $(row).addClass("failed");

        $("<span>").addClass("test-number").html(currentTestNumber).appendTo(cell);

        cell = row.insertCell(-1);
        $("<span>").html(testName + " failed. " + ex.name + ": " + ex.message).appendTo(cell);
    }

    function appendPassedTestResultRow (testName)
    {
        var row = resultsTable.insertRow(-1),
            cell = row.insertCell(-1);

        $(row).addClass("passed");

        $("<span>").addClass("test-number").html(currentTestNumber).appendTo(cell);

        cell = row.insertCell(-1);
        $("<span>").html(testName + " passed.").appendTo(cell);
    }

    function updateTestName (testCaseName)
    {
        if (currentTestCaseName !== testCaseName) {
            currentTestCaseName = testCaseName;
            currentTestNumber = 0;

            appendTestCaseHeaderRow(testCaseName);
        }
    }

    TestCase.onFailed = function (testCaseName, testName, ex) {
        updateTestName(testCaseName);

        currentTestNumber += 1;
        errorCount += 1;

        //console.error(testName + " failed. " + ex.name + ": " + ex.message);
        appendFailedTestResultRow(testName, ex);
    };

    TestCase.onPassed = function (testCaseName, testName) {
        updateTestName(testCaseName);

        currentTestNumber += 1;

        //console.log(testName + " succeeded.");
        appendPassedTestResultRow(testName);
    };


    if (window.CodeKit) {
        /*
         * Config for codekit server
         */
        require.config({
            baseUrl: '',
            paths: {
                'sprout': 'src',
                'jquery': 'bower_components/jquery/dist/jquery',
                'modernizr': 'bower_components/modernizr/modernizr',
                'underscore': 'bower_components/underscore/underscore',
                'underscore.string': 'bower_components/underscore.string/lib/underscore.string'
            },
            shim: {
                'modernizr': { exports: 'Modernizr' }
            }
        });

        require([
            // "test/error-test.js",
            // "test/util-test.js",
            // "test/dom-test.js",
            // "test/base-test.js",
            // "test/plugin-test.js",
            // "test/url-test.js",
            // "test/router-test.js",
            // "test/data-test.js",
            // "test/model-test.js",
            // "test/collection-test.js",
            "test/list-test.js",
            // "test/database-test.js",
            // "test/viewmodel-test.js",
            // "test/pubsub-test.js",
            // "test/databind-test.js"
        ]);
    }
    else {
        /*
         * Config for rails server
         */
        require.config({
            baseUrl: "assets"
        });

        require([
            // "assets/sprout/test/error-test.js",
            // "assets/sprout/test/util-test.js",
            // "assets/sprout/test/dom-test.js",
            // "assets/sprout/test/base-test.js",
            // "assets/sprout/test/plugin-test.js",
            // "assets/sprout/test/url-test.js",
            // "assets/sprout/test/router-test.js",
            // "assets/sprout/test/data-test.js",
            // "assets/sprout/test/model-test.js",
            // "assets/sprout/test/collection-test.js",
            "assets/sprout/test/list-test.js",
            // "assets/sprout/test/database-test.js",
            // "assets/sprout/test/viewmodel-test.js",
            // "assets/sprout/test/pubsub-test.js",
            // "assets/sprout/test/databind-test.js"
        ]);
    }
}());