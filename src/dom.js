define(["jquery"], function ($) {
    "use strict";

    // TODO: unit test this function and document it
    $.containsComment = function(a, b)
    {
		while ( (b = b.parentNode) ) {
			if ( b === a ) {
				return true;
			}
		}
		return false;
	};
    
    return $;
});