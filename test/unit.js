(function () {
    var expectedAssertCount = -1,
        assertCount = 0,
        testCount = 0,
        errorCount = 0;
        
    /**
     * Parses the arguments for an assert function to insure there is always a message as the first argument.
     * If the message argument does not exist then it defaults to an empty string.
     * @private
     * @param {Arguments} args The original arguments from the assert function.
     * @param {Number} argsLength The number of arguments the assert function expects.
     * @return {Array} Returns an array of arguments guaranteeing that the first one is the message.
     */
    function getArgsForOptionalMsg (args, argsLength)
    {
        var newArgs = Array.prototype.slice.call(args);
            minArgsLength = argsLength - 1;
        
        if (newArgs.length < minArgsLength) {
            fail("Expected at least " + minArgsLength + " argument" + (minArgsLength === 1 ? "" : "s") + ", got " + newArgs.length);
        }
        else if (newArgs.length < argsLength) {
            newArgs.unshift("");
        }
        
        return newArgs;
    }
    
    /**
     * Returns a pretty easy to read description of an object.
     * @private
     * @param {obj} obj The object to prettify.
     * @return {String} Returns a formatted string description of an object.
     */
    function getPrettyPrintType (obj)
    {
        try {
            return obj.toString();
        }
        catch (ex) { /* Empty */ }
        
        return "[" + typeof(obj) + "]";
    }
    
    /**
     * Returns whether an object is a Boolean or not.
     * @private
     * @param {obj} obj The object to check.
     * @return {Boolean} Returns true if the object is a Boolean, false otherwise.
     */
    function isBoolean (obj)
    {
        if (typeof(obj) !== "boolean") {
            fail("Not a boolean: " + getPrettyPrintType(obj));
        }
    }

    /**
     * Called whenever a test fails.
     * @private
     * @param {String} testCaseName The name of the test case that this test belongs to.
     * @param {String} testName The name of the test to run from the tests parameter.
     * @param {Object} ex The exception from the failed test.
     */
    function onTestFailed (testCaseName, testName, ex)
    {
        errorCount += 1;
        TestCase.onFailed(testCaseName, testName, ex);
    }

    /**
     * Resets the async config so it can be used for another test.
     * @private
     */
    function resetAsync ()
    {
        async.count = 0;
        async.testName = null;
        async.testCaseName = null;
    }

    /**
     * Runs a test.
     * @private
     * @param {String} testCaseName The name of the test case that this test belongs to.
     * @param {Object} tests An object that contains the tests.
     * @param {String} testName The name of the test to run from the tests parameter.
     */
    function runAsyncTest (testCaseName, tests, testName)
    {
        try {
            testCount += 1;
            
            // Run setUp
            if (typeof tests.setUp === "function") {
                tests.setUp();
            }
            
            // Reset assert count
            expectedAssertCount = -1;
            assertCount = 0;
            async.count = 0;
            async.testName = testName;
            async.testCaseName = testCaseName;
            
            // Run test
            tests[testName]();
        }
        catch (ex) {
            onTestFailed(testCaseName, testName, ex);
            resetAsync();
        }
    }

    /**
     * Completes the running of a test.
     * @private
     * @param {String} testCaseName The name of the test case that this test belongs to.
     * @param {Object} tests An object that contains the tests.
     * @param {String} testName The name of the test to complete from the tests parameter.
     */
    function completeAsyncTest (testCaseName, tests, testName)
    {
        try {
            // Check assert count
            if (expectedAssertCount !== -1) {
                if (assertCount !== expectedAssertCount) {
                    fail("Expected " + expectedAssertCount + (expectedAssertCount === 1 ? " assert" : " asserts") + " but " + assertCount + " encountered.");
                }
            }

            // Run tearDown
            if (typeof tests.tearDown === "function") {
                tests.tearDown();
            }

            TestCase.onPassed(testCaseName, testName);
        }
        catch (ex) {
            onTestFailed(testCaseName, testName, ex);
            resetAsync();
        }
    }

    /**
     * Runs the next test that is available. If there is an asynchronous test in progress then the next test will be deferred till after the asynchronous test is over.
     * @private
     * @param {String} testCaseName The name of the test case that this test belongs to.
     * @param {Object} tests An object that contains the tests.
     * @param {Array} testNames An array of tests names to run from the tests parameter.
     */
    function runNextAsyncTest (testCaseName, tests, testNames)
    {
        if (async.count === 0) {
            // If an async test just ran
            if (typeof async.testName === "string") {
                completeAsyncTest(testCaseName, tests, async.testName);
                resetAsync();
            }

            // If there are more tests
            if (testNames.length > 0) {
                resetAsync();

                // Run the test
                runAsyncTest(testCaseName, tests, testNames.shift());

                // Run the next test (this normally results in a timeout being set)
                runNextAsyncTest(testCaseName, tests, testNames);
            }
        }
        else {
            setTimeout(function () {
                runNextAsyncTest(testCaseName, tests, testNames);
            }, 100);
        }
    }

    /**
     * Runs test units. To get the results of a test set ChaiUnit.onTestComplete to a callback function.
     * @param {String} name The name of the test case.
     * @param {Array} imports The name of the files to load using RequireJS
     * @param {Object} tests The tests to run.
     * @options
     * {Function} setUp undefined Setup ran before a test. This function is called before each test function in a test case.
     * {Function} tearDown undefined Teardown ran after a test. This function is called after each test function in a test case.
     * {Function} test... undefined Any function that begins with "test" will be ran as a test. For example: "test Chai.Dom.addClass should add class".
     */
    TestCase = function (name, imports, callback) {
        require(imports, function () {
            var tests = callback.apply(null, arguments),
                testNames = [];
            
            // Grab all the test names
            for (var testName in tests) {
                if (/^test/.test(testName)) {
                    testNames.push(testName);
                }
            }

            // Start the first test
            runNextAsyncTest(name, tests, testNames);
        });
    };

    TestCase.onFailed = function () {};
    TestCase.onPassed = function () {};

    /**
     * Creates a new function for performing asynchronous tests. If a function that contains asserts is going to be called asynchronously in a test it must be wrapped by the async function.
     * This makes it possible for the test engine to include the asynchronous function in its checks.
     * @param {Function} func The function that is being called asynchronously.
     * @return {Function} Returns a function that can be used in asynchronous tests.
     */
    async = function (func)
    {
        var testName = async.testName,
            testCaseName = async.testCaseName;

        async.count += 1;

        return function () {
            try {
                // If an async function from a previous test was called we don't want it affecting the current test.
                // This can happen if a test fails before all of its async functions return.
                if (async.testName !== testName) {
                    return;
                }
                
                async.count -= 1;
                func.apply(null, arguments);
            }
            catch (ex) {
                onTestFailed(testCaseName, testName, ex);

                resetAsync();
            }
        };
    };

    resetAsync();
    
    /**
     * Sets the number of assertions to be expected during a test. If that number of assertions is not encountered then the test fails.
     * @param {Numer} count The number of asserts expected to happen during a test. Use -1 to reset it to not expect a certain number of assertions.
     */
    expectAsserts = function (count)
    {
        expectedAssertCount = count;
    };
    
    /**
     * Throws an exception with the name AssertError and the message provided.
     * @param {String} msg The error message.
     */
    fail = function (msg)
    {
        throw {
            name: "AssertError",
            message: msg
        };
    };
    
    /**
     * Asserts that a value is true.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertTrue = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        isBoolean(args[1]);
        if (args[1] !== true) {
            fail(args[0] + " expected true but was " + getPrettyPrintType(args[1]));
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is false.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertFalse = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        isBoolean(args[1]);
        if (args[1] !== false) {
            fail(args[0] + " expected false but was " + getPrettyPrintType(args[1]));
        }
        
        return true;
    };
    
    /**
     * Asserts that two values are the same (===).
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} expected The value to compare against.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertSame = function (msg, expected, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        
        if (args[2] !== args[1]) {
            fail(args[0] + " expected " + getPrettyPrintType(args[1]) + " but was " + getPrettyPrintType(args[2]));
        }
        
        return true;
    };
    
    /**
     * Asserts that two values are not the same (!==).
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} expected The value to compare against.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNotSame = function (msg, expected, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        
        if (args[2] === args[1]) {
            fail(args[0] + " expected not same as " + getPrettyPrintType(args[1]) + " but was " + getPrettyPrintType(args[2]));
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is null.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNull = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        if (args[1] !== null) {
            fail(args[0] + " expected null but was " + getPrettyPrintType(args[1]));
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is not null.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNotNull = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        if (args[1] === null) {
            fail(args[0] + " expected not null but was null");
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is undefined.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertUndefined = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        if (typeof(args[1]) !== "undefined") {
            fail(args[0] + " expected undefined but was " + getPrettyPrintType(args[1]));
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is not undefined.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNotUndefined = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        if (typeof(args[1]) === "undefined") {
            fail(args[0] + " expected not undefined but was undefined");
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is NaN.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNaN = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        if (!isNaN(args[1])) {
            fail(args[0] + " expected NaN but was " + args[1]);
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is not NaN.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNotNaN = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        if (isNaN(args[1])) {
            fail(args[0] + " expected not NaN but was NaN");
        }
        
        return true;
    };
    
    /**
     * Asserts that a function throws a certan exception.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Function} callback The function to call and check for a thrown exception from.
     * @param {String} error The name of the exception that is expected to be thrown.
     * @return {Boolean} Always returns true.
     */
    assertException = function (msg, callback, error) {
        if (arguments.length == 1) {
            callback = msg;
            msg = "";
        }
        else if (arguments.length == 2) {
            if (typeof(callback) !== "function") {
                error = callback;
                callback = msg;
                msg = "";
            }
        }
        assertCount += 1;
        
        try {
            callback();
        }
        catch(ex) {
            if (ex.name == "AssertError") {
                throw ex;
            }
            
            if (error && ex.name !== error) {
                fail(msg + " expected to throw " + error + " but threw " + ex.name);
            }
            
            return true;
        }
        
        fail(msg + " expected to throw exception");
    };
    
    /**
     * Asserts that a function does not throw an exception
     * @param {String} msg The message to print if the assertion fails.
     * @param {Function} callback The function to call and check for a thrown exception from.
     * @return {Boolean} Always returns true.
     */
    assertNoException = function (msg, callback)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        try {
            args[1]();
        }
        catch (ex) {
            fail(args[0] + " expected not to throw an exception, but threw " + ex.name + " (" + ex.message + ")");
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is an Array.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertArray = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        assertCount += 1;
        
        if (Object.prototype.toString.apply(args[1]) !== "[object Array]") {
            fail(args[0] + " expected to be array, but was " + getPrettyPrintType(args[1]));
        }
        
        return true;
    };
    
    /**
     * Asserts that a value a certain type.
     * @param {String} msg The message to print if the assertion fails.
     * @param {String} expected The type to compare against.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertTypeOf = function (msg, expected, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        actual = typeof(args[2]);
        
        if (actual !== args[1]) {
            fail(args[0] + " expected to be " + args[1] + ", but was " + actual);
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is a Boolean.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertBoolean = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        return assertTypeOf(args[0], "boolean", args[1]);
    };
    
    /**
     * Asserts that a value is a Function.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertFunction = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        return assertTypeOf(args[0], "function", args[1]);
    };
    
    /**
     * Asserts that a value is an Object.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertObject = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        return assertTypeOf(args[0], "object", args[1]);
    };
    
    /**
     * Asserts that a value is an Number.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNumber = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        return assertTypeOf(args[0], "number", args[1]);
    };
    
    /**
     * Asserts that a value is an String.
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertString = function (msg, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 2);
        return assertTypeOf(args[0], "string", args[1]);
    };
    
    /**
     * Asserts that a regular expression matches.
     * @param {String} msg The message to print if the assertion fails.
     * @param {RegExp} regexp The regular expression to match against.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertMatch = function (msg, regexp, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        var isUndef = (typeof(args[2]) === "undefined");
        var _undef;
        
        if (isUndef || !args[1].test(args[2])) {
            actual = (isUndef ? _undef : getPrettyPrintType(args[2]));
            fail(args[0] + " expected " + actual + " to match " + args[1]);
        }
        
        return true;
    };
    
    /**
     * Asserts that a regular expression does not match.
     * @param {String} msg The message to print if the assertion fails.
     * @param {RegExp} regexp The regular expression to match against.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNoMatch = function (msg, regexp, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        
        if (args[1].test(args[2])) {
            fail(args[0] + " expected " + args[2] + " not to match " + args[1]);
        }
        
        return true;
    };
    
    /**
     * Asserts that an element has a certain tag name.
     * @param {String} msg The message to print if the assertion fails.
     * @param {String} tagName The expected tag name.
     * @param {HTMLElement} element The element to test.
     * @return {Boolean} Always returns true.
     */
    assertTagName = function (msg, tagName, element)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        var actual = args[2] && args[2].tagName;
        
        if (String(actual).toLowerCase() !== args[1].toLowerCase()) {
            fail(args[0] + " expected tagName to be " + args[1] + ", but was " + actual);
        }
        
        return true;
    };
    
    /**
     * Asserts that an element has a certain class name.
     * @param {String} msg The message to print if the assertion fails.
     * @param {String} tagName The expected class name.
     * @param {HTMLElement} element The element to test.
     * @return {Boolean} Always returns true.
     */
    assertClassName = function (msg, className, element)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        var actual = args[2] && args[2].className;
        var regexp = new RegExp("(^|\\s)" + args[1] + "(\\s|$)");
        
        try {
            assertMatch(args[0], regexp, actual);
        }
        catch (ex) {
            fail(args[0] + " expected className to include " + args[1] + ", but was " + actual);
        }
        
        return true;
    };
    
    /**
     * Asserts that an element has a certain id.
     * @param {String} msg The message to print if the assertion fails.
     * @param {String} id The expected id.
     * @param {HTMLElement} element The element to test.
     * @return {Boolean} Always returns true.
     */
    assertElementId = function (msg, id, element)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        var actual = args[2] && args[2].className;
        var regexp = new RegExp("(^|\\s)" + args[1] + "(\\s|$)");
        
        if (actual !== args[1]) {
            fail(args[0] + " expected id to be " + args[1] + ", but was " + actual);
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is the instance of a certain type.
     * @param {String} msg The message to print if the assertion fails.
     * @param {String} constructor The expected type's constructor.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertInstanceOf = function (msg, constructor, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        var expected = args[1] && args[1].name || args[1];
        
        if (args[2] === null) {
            fail(args[0] + " expected  " + getPrettyPrintType(args[2]) + " to be instance of " + expected);
        }
        
        if (!(Object(args[2]) instanceof args[1])) {
            fail(args[0] + " expected  " + getPrettyPrintType(args[2]) + " to be instance of " + expected);
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is not the instance of a certain type.
     * @param {String} msg The message to print if the assertion fails.
     * @param {String} constructor The expected type's constructor.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assertNotInstanceOf = function (msg, constructor, actual)
    {
        var args = getArgsForOptionalMsg(arguments, 3);
        assertCount += 1;
        
        if ((Object(args[2]) instanceof args[1])) {
            var expected = args[1] && args[1].name || args[1];
            fail(args[0] + " expected  " + getPrettyPrintType(args[2]) + " not to be instance of " + expected);
        }
        
        return true;
    };
    
    /**
     * Asserts that a value is true.
     * @method
     * @param {String} msg The message to print if the assertion fails.
     * @param {Object} actual The value to test.
     * @return {Boolean} Always returns true.
     */
    assert = assertTrue;
}());