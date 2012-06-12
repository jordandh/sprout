define("application", ["util", "base", "pubsub", "router"], function (_, base, pubsub, router) {
    "use strict";

    /**
     * Adds and starts a component in the application.
     * @private
     * @param {Object} component The component to add to the application.
     */
    function addComponent (component)
    {
        var rtr = this.router;

        this.get("components")[component.name] = component;

        require([component.path], function (module) {
            try {
                var comp = module.create();
                comp.start({
                    router: rtr
                });
                component.module = comp;
            }
            catch (ex) {
                pubsub.publish("error", {
                    exception: ex,
                    info: {
                        action: "starting component",
                        component: component
                    }
                }, this);
            }
        });
    }
    
    /**
     * @class application
     * Provides functionality for managing shared resources and components on a page.
     * @extends base
     */
    return base.extend({
        /**
         * Initializes the application.
         */
        constructor: function ()
        {
            base.constructor.call(this);
            this.set("components", {}, { force: true });
        },

        /**
         * The attributes for the application.
         * @property
         * @type Object
         */
        attributes: {
            /**
             * @cfg {Object} components The components registered with the application.
             * @readOnly
             */
            components: { readOnly: true }
        },

        /**
         * Starts up the application initializing shared resources and starting up components.
         * @param {Object} options
         * {Object} router The application's shared router. The component can use it to setup url routing.
         * {Object|Array} components Either one component or an array of components to start. A component is an object with two properties:
         * {
         *    name: "<string unique name of the module>",
         *    path: "<string path to the module>"
         * }
         */
        start: function (options)
        {
            var components;

            _.defaults(options, {
                components: null,
                routing: true,
                rootUrl: ""
            });

            // Start up the router
            if (options.routing) {
                this.router = router.create();
                this.router.start(options.rootUrl);
            }

            // Start up the components
            components = options.components;

            if (_.isArray(components)) {
                _.each(components, function (component) {
                    addComponent.call(this, component);
                }, this);
            }
            else if (_.isObject(components)) {
                addComponent.call(this, name, components[name]);
            }
        },

        /**
         * Stops and deregisters a component.
         * @param {String} name The name of the component to stop.
         */
        stop: function (name)
        {
            var components = this.get("components"),
                component = components[name];

            if (component) {
                if (component.module) {
                    try {
                        component.module.stop();
                        component.module.destroy();
                        component.module = null;
                    }
                    catch (ex) {
                        pubsub.publish("error", {
                            exception: ex,
                            info: {
                                action: "stopping component",
                                component: component
                            }
                        }, this);
                    }
                }

                delete components[name];
            }
        },

        /**
         * Restarts a component.
         * @param {String} name The name of the component to restart.
         */
        restart: function (name)
        {
            var components = this.get("components"),
                component = components[name];

            if (component && component.module) {
                component.module.stop();
                component.module.start();
            }
        }
    });
});