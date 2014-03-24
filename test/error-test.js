TestCase('error', ['sprout/error', 'sprout/util'], function (error, _) {
	return {
        setUp: function () {
            localStorage.clear();
        },

        'test error.stringify with circular references': function ()
        {
            var info = {},
                a = {},
                b = {};

            a.bbb = b;
            a.root = info;
            
            b.aaa = a;
            b.root = info;

            info.aa = a;
            info.bb = b;

            var err = {
                type: 'test',
                info: info
            };

            var results;

            assertNoException('stringify threw an exception', function () {
                results = error.stringify(err);
            });

            assertString('stringify results is not a string', results);
        },

        'test error.localStorageErrorStore.getErrorKey should return a string': function ()
        {
            var errorStore = error.errorStore,
                err = {
                    exceptions: [new Error('Error testing.')]
                };

            assertString('getErrorKey result is not a string', errorStore.getErrorKey(err));
        },

        'test error.localStorageErrorStore.shouldReportError should return true for an error not already reported': function ()
        {
            var errorStore = error.errorStore,
                err = {
                    exceptions: [new Error('Error testing.')]
                };

            assert('shouldReportError result is not true', errorStore.shouldReportError(err));
        },

        'test error.localStorageErrorStore.shouldReportError should return false for an error already reported': function ()
        {
            var errorStore = error.errorStore,
                err = {
                    exceptions: [new Error('Error testing.')]
                };

            errorStore.markErrorAsReported(err);

            assertFalse('shouldReportError result is not false', errorStore.shouldReportError(err));
        },

        'test error.localStorageErrorStore.markErrorAsReported stores error': function ()
        {
            var errorStore = error.errorStore,
                err = {
                    exceptions: [new Error('Error testing.')]
                };

            errorStore.markErrorAsReported(err);

            var store = localStorage[errorStore.LocalStorageKey];
            assertString('localStorage store is empty', store);

            store = JSON.parse(store);
            assertObject('localStorage store is not an object', store);

            var errorKey = errorStore.getErrorKey(err);
            var errorInfo = store[errorKey];
            assertObject('localStorage store does not contain error', errorInfo);
        },

        'test error.localStorageErrorStore does not exceed maximum number of errors stored': function ()
        {
            var errorStore = error.errorStore,
                store;

            // Make this something more manageable
            errorStore.MaxErrorsInStore = 2;

            // Add first error
            errorStore.markErrorAsReported({
                exceptions: [new Error('Error testing 1.')]
            });
            store = JSON.parse(localStorage[errorStore.LocalStorageKey]);
            assertSame('localStorage store has incorrect number of items', 1, _.size(store));

            // Add second error
            errorStore.markErrorAsReported({
                exceptions: [new Error('Error testing 2.')]
            });
            store = JSON.parse(localStorage[errorStore.LocalStorageKey]);
            assertSame('localStorage store has incorrect number of items', 2, _.size(store));

            // Add third error
            errorStore.markErrorAsReported({
                exceptions: [new Error('Error testing 3.')]
            });
            store = JSON.parse(localStorage[errorStore.LocalStorageKey]);
            assertSame('localStorage store has incorrect number of items', 2, _.size(store));
        },

        'test error.localStorageErrorStore prunes oldest reported error first': function ()
        {
            var errorStore = error.errorStore,
                store;

            // Make this something more manageable
            errorStore.MaxErrorsInStore = 2;

            // Add first error
            var err1 = {
                exceptions: [new Error('Error testing 1.')]
            };
            errorStore.markErrorAsReported(err1);

            // Add second error
            var err2 = {
                exceptions: [new Error('Error testing 2.')]
            };
            errorStore.markErrorAsReported(err2);

            // Add third error
            var err3 = {
                exceptions: [new Error('Error testing 3.')]
            };
            errorStore.markErrorAsReported(err3);

            store = JSON.parse(localStorage[errorStore.LocalStorageKey]);
            assertSame('localStorage store has incorrect number of items', 2, _.size(store));
            assertUndefined('first error is in the store.', store[errorStore.getErrorKey(err1)]);
            assertObject('second error is not in the store.', store[errorStore.getErrorKey(err2)]);
            assertObject('third error is not in the store.', store[errorStore.getErrorKey(err3)]);
        }
    };
});