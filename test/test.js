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
        "assets/test/util-test.js",
        "assets/test/base-test.js",
        "assets/test/plugin-test.js",
        "assets/test/data-test.js",
        "assets/test/model-test.js",
        "assets/test/collection-test.js",
        "assets/test/pubsub-test.js",
        "assets/test/widget-test.js"
    ]);
}());