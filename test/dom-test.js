TestCase('dom', ['sprout/dom'], function ($) {
    return {
		'test dom.containsComment': function () {
			$(document.body).append('<!-- comment test -->');

			var comment = document.body.lastChild;
			assertSame('last child of body is not a comment', 8, comment.nodeType);
			assert('comment was not found in body', $.containsComment(document.body, comment));
			$(comment).remove();
		},

		'test dom.containsComment returns false when comment is not in the element': function () {
			$(document.body).append('<!-- comment test -->');

			var comment = document.body.lastChild;
			$(comment).remove();
			assertSame('last child of body is not a comment', 8, comment.nodeType);
			assertFalse('comment was found in body', $.containsComment(document.body, comment));
		},

		'test $.fn.html without a leading comment node': function () {
			var node = $('<div></div>').appendTo(document.body).html('<span>test</span>');

			assertSame('node is missing children', 1, node.children().length);
			assertSame('node has incorrect child', 1, $('span', node).length);
			assertSame('node has incorrect text', 'test', $('span', node).text());

			node.remove();
		},

		'test $.fn.html with a leading comment node': function () {
			var node = $('<div></div>').appendTo(document.body).html('<!-- comment here --><span>test</span>');

			assertSame('node is missing content', 2, node.contents().length);
			assertSame('node is missing comment', 8, node.contents().eq(0).get(0).nodeType);
			assertSame('node is missing children', 1, node.children().length);
			assertSame('node has incorrect child', 1, $('span', node).length);
			assertSame('node has incorrect text', 'test', $('span', node).text());

			node.remove();

			
		},

		'test $.fn.html with a function': function () {
			var node = $('<div><span>before</span></div>').appendTo(document.body);

			assertSame('node is missing children', 1, node.children().length);
			assertSame('node has incorrect child', 1, $('span', node).length);
			assertSame('node has incorrect text', 'before', $('span', node).text());


			node.html(function () {
				return '<span>after</span>';
			});

			assertSame('node is missing children', 1, node.children().length);
			assertSame('node has incorrect child', 1, $('span', node).length);
			assertSame('node has incorrect text', 'after', $('span', node).text());

			node.remove();
		}
    };
});