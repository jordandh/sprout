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

    require.config({
        baseUrl: "assets"
    });

    require([
        "assets/sprout/test/util-test.js",
        "assets/sprout/test/dom-test.js",
        "assets/sprout/test/base-test.js",
        "assets/sprout/test/plugin-test.js",
        "assets/sprout/test/router-test.js",
        "assets/sprout/test/data-test.js",
        "assets/sprout/test/model-test.js",
        "assets/sprout/test/collection-test.js",
        "assets/sprout/test/database-test.js",
        "assets/sprout/test/viewmodel-test.js",
        "assets/sprout/test/pubsub-test.js",
        "assets/sprout/test/databind-test.js"
    ]);
}());