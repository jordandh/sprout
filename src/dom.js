define(['jquery'], function ($) {
    'use strict';

    var html = $.fn.html,
		slice = Array.prototype.slice,
		commentStart = '<!--';

    /**
     * @class dom
     * Provides functionality for interacting with the dom. This module is jquery with extra functionality added on.
     * @singleton
     */
    /**
     * Returns whether or not a comment element is inside the node tree of another element.
     * @param {Object} element The element to check inside of.
     * @param {Object} comment The comment element to check for.
     * @return {Boolean} Returns true if the comment element is in the node tree of the element.
     */
    $.containsComment = function(element, comment) {
		while ( (comment = comment.parentNode) ) {
			if (comment === element) {
				return true;
			}
		}
		
		return false;
	};

	// IE8 will not insert comment nodes properly when they are the first element.
	// So override jQuery's html function to clean the html if it starts with a comment node.
	$.fn.html = function (value) {
		if (typeof value === 'string' && value.length >= commentStart.length && value.slice(0, commentStart.length) === commentStart) {
			return html.apply(this, [$.clean([value])].concat(slice.call(arguments, 1)));
		}

		return html.apply(this, arguments);
	};
    
    return $;
});