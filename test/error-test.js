TestCase('error', ['sprout/error'], function (error) {
	return {
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
            console.log(results);
        }
    };
});