define("controller", ["util", "base"], function (_, base) {
    "use strict";
    
    // TODO: I dont think the controller object needs to do very much. Most of the logic will probably be in the objects that inherit from controller (e.g. list controller)

    /**
     * @class controller
     * A controller binds models and collections to one or more views.
     * @extends base
     */
    return base.extend({
        render: function (parentNode)
        {
        }
    });
});