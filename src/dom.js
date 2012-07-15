define(['jquery'], function ($) {
    'use strict';

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
    $.containsComment = function(element, comment)
    {
		while ( (comment = comment.parentNode) ) {
			if (comment === element) {
				return true;
			}
		}
		
		return false;
	};
    
    return $;
});