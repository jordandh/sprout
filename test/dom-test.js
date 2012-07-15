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
		}
    };
});