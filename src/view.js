define("view", ["util", "base"], function (_, base) {
    "use strict";
    
    // TODO: I dont think the view object needs to do very much. Most of the logic will probably be in the objects that inherit from view (e.g. listview)
    // TODO: should a view have its own element that contains all its widgets? or should it just add its widgets to its parentNode?

    /**
     * @class view
     * A view binds a model or collection to one or more widgets.
     * @extends base
     */
    return base.extend({
        render: function (parentNode)
        {
        }
    });
});