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
            this.pubsubHandles = [];
        },

        /**
         * Stop a component on a page. Child component objects should override this method to define its stop logic.
         * @param {Object} resources
         * {Object} router The application's shared router. The component can use it to setup url routing.
         */
        stop: function ()
        {
            _.each(this.pubsubHandles, function (handle) {
                pubsub.unsubscribe(handle);
            });

            this.pubsubHandles = null;
        },

        /**
         * Publishes a message using the pubsub module.
         * @param {String} message The name of the message being published.
         * @param {Object} info An object that contains information about the message.
         * @param {Object} src The object that is publishing the event.
         */
        publish: function (message, info, src)
        {
            pubsub.publish(message, info, src);
        },

        /**
         * Adds a listener to a pubsub message. The handler function is passed an event object. The event object contains name, src, and info member properties.
         * The name property is the name of the message. The src property is the object that published the event. And the info property contains information related to the event.
         * @param {String} message The name of the message being published.
         * @param {Function} handler A callback function to call whenever the message is published.
         * @param {Object} context (Optional) The context to run the handler in.
         * @return {Array} Returns a handle that can be used to unsubscribe from a message.
         */
        subscribe: function (message, handler, context)
        {
            this.pubsubHandles.push(pubsub.subscribe(message, handler, context || this));
        },

        /**
         * Removes a listener from a pubsub message. Only handles returned by subscribe should be used with this function.
         * @param {Array} handle The handle returned by pubsub.subscribe.
         */
        unsubscribe: function (handle)
        {
            pubsub.unsubscribe(handle);
        },

        failed: function (error)
        {
            try {
                var err = {
                    exception: error,
                    info: {
                        action: "component failed",
                        component: this
                    }
                };

                if (err.info.component) {
                    delete err.info.component.app;
                }

                // TODO: this puts the component into a failed state. An Application object can detect that the component is in a failed state and do something about it. (e.g. restart it or report an error)
                pubsub.publish("error", err, this);
            }
            catch (ex) {
            }
        }
	});
});