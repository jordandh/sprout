TestCase('url', ['sprout/url'], function (url) {
	return {
        'test url.match returns true on match': function ()
        {
            var u = url('http://www.example.com/test/path');

            assert('url path did not match pattern', u.match('test/path'));
        },

        'test url.match returns false on no match': function ()
        {
            var u = url('http://www.example.com/test/path');

            assertFalse('url path did match pattern', u.match('test/path/fail'));
        },

        'test url.match returns false with leading slash no match': function ()
        {
            var u = url('http://www.example.com/test/path');

            assertFalse('url path did match pattern', u.match('/test/path'));
        },

        'test url.match returns true on match with variable at end': function ()
        {
            var u = url('http://www.example.com/test/path');

            assert('url path did not match pattern', u.match('test/:end'));
        },

        'test url.match returns true on match with variable at start': function ()
        {
            var u = url('http://www.example.com/test/path');

            assert('url path did not match pattern', u.match(':start/path'));
        },

        'test url.match returns true on match with variable in middle': function ()
        {
            var u = url('http://www.example.com/test/path/here');

            assert('url path did not match pattern', u.match('test/:middle/here'));
        },

        'test url.match returns true on match with variables': function ()
        {
            var u = url('http://www.example.com/test/path');

            assert('url path did not match pattern', u.match(':start/:end'));
        },

        'test url.match returns false on no match with variables': function ()
        {
            var u = url('http://www.example.com/test/path');

            assertFalse('url path did match pattern', u.match(':start/:middle/:end'));
        }
    };
});