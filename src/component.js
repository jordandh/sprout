define(["sprout/util", "sprout/base", "sprout/pubsub"], function (_, base, pubsub) {
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
         * @param {Object} resources
         * {Object} router The application's shared router. The component can use it to setup url routing.
         */
        start: function ()
        {
        },

        /**
         * Stop a component on a page. Child component objects should override this method to define its stop logic.
         * @param {Object} resources
         * {Object} router The application's shared router. The component can use it to setup url routing.
         */
        stop: function ()
        {
        },

        failed: function (error)
        {
            try {
                // TODO: this puts the component into a failed state. An Application object can detect that the component is in a failed state and do something about it. (e.g. restart it or report an error)
                pubsub.publish("error", {
                    exception: error,
                    info: {
                        action: "component failed",
                        component: this
                    }
                }, this);
            }
            catch (ex) {
            }
        }
	});
});