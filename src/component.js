define("component", ["util", "base"], function (_, base) {
    "use strict";
    
    /**
     * @class component
     * Components are modules that run on a page. They can be started, stopped, and restarted in an application. Components are the pieces of an application that make it unique.
     * The component object is meant to be inherited from. Components should be started in an application by using the application object.
     * @extends base
     */
	return base.extend({
        /**
         * Starts up a component on a page. Child component objects should override this method to define its start up logic.
         */
        start: function ()
        {
        },

        /**
         * Stop a component on a page. Child component objects should override this method to define its stop logic.
         */
        stop: function ()
        {
        },

        /**
         * Restarts a component on a page. Child component objects should override this method to define its restart logic.
         */
        restarts: function ()
        {
        }
	});
});