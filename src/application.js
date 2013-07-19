define(["sprout/util", "sprout/base", "sprout/pubsub", "sprout/router"], function (_, base, pubsub, router) {
    "use strict";

    /**
     * Adds and starts a component in the application.
     * @private
     * @param {Object} component The component to add to the application.
     * @param {Boolean} waitToStart (Optional) Whether or not the component should wait to start until explicity told to. Defaults to false.
     */
    function addComponent (component, waitToStart)
    {
        if (component.disabled) {
            return;
        }

        // Setup the component
        component.app = this;
        component.start = startComponent;
        component.stop = stopComponent;
        component.appConfig = {
            waitToStart: waitToStart,
            doNotStart: false
        };

        this.get("components")[component.name] = component;

        // Start up child components (this has to go before the require call to insure that the child components exist when the parent component's start function is called)
        addComponents.call(this, component.components, true);

        require([component.path], function (module) {
            try {
                var route = component.route,
                    startMessage = component.start_message;

                component.module = module.create();

                // If the component should not wait to start (usually the case for child components) AND the component should start at all (usually the case when a parent component is stopped before its child components are started)
                if (!component.appConfig.waitToStart && !component.appConfig.doNotStart) {
                    if (_.isString(route)) {
                        route = [route];
                    }

                    // If the component should be started up from a matching route
                    if (_.isArray(route)) {
                        component.routeNames = [];

                        _.each(route, function (url) {
                            var routeName = _.uniqueId(component.name + '.') + '.' + url;
                            component.routeNames.push(routeName);

                            component.app.router.add(routeName, {
                                path: url,
                                start: function () {
                                    // There are cases where a component can start up before one of the routes is added for the component. So check the component's started state
                                    if (!component.appConfig.started) {
                                        // Start up the component
                                        component.start();
                                    }

                                    // Remove the route now that the component has been started. But wait to do so after processing all the routes for this component
                                    _.defer(function () {
                                        _.each(component.routeNames, _.bind(component.app.router.remove, component.app.router));
                                    });
                                }
                            });
                        });
                    }
                    // Else if the component should be started up from a message being published
                    else if (_.isString(startMessage)) {
                        pubsub.subscribe(startMessage, function () {
                            // Start up the component
                            if (!component.appConfig.started) {
                                component.start();
                            }
                        });
                    }
                    // Else start the component now
                    else {
                        component.start();
                    }
                }
            }
            catch (ex) {
                var error = {
                    exception: ex,
                    info: {
                        action: "adding component",
                        component: this
                    }
                };

                if (error.info.component) {
                    delete error.info.component.app;
                }

                pubsub.publish("error", error, this);
            }
        });
    }

    function addComponents (components, waitToStart)
    {
        if (_.isArray(components)) {
            _.each(components, function (component) {
                addComponent.call(this, component, waitToStart);
            }, this);
        }
        else if (_.isObject(components) && !_.isEmpty(components)) {
            addComponent.call(this, components, waitToStart);
        }
    }

    function stopComponent ()
    {
        this.appConfig.doNotStart = true;

        if (this.module) {
            try {
                this.module.stop();
                this.module.resources = null;
            }
            catch (ex) {
                var error = {
                    exception: ex,
                    info: {
                        action: "stopping component",
                        component: this
                    }
                };

                if (error.info.component) {
                    delete error.info.component.app;
                }

                pubsub.publish("error", error, this);
            }
        }
    }

    function startComponent ()
    {
        var component = this;

        // If the component has not been downloaded yet from the require call then change its start up config to not wait to start once it is downloaded
        this.appConfig.waitToStart = false;

        // If the component's module has already been downloaded and created then start it up
        if (this.module) {
            try {
                this.module.resources = {
                    router: this.app.router,
                    config: this.config || {},
                    startComponents: function () {
                        _.each(component.components, function (childComponent) {
                            childComponent.start();
                        });
                    },
                    stopComponents: function () {
                        _.each(component.components, function (childComponent) {
                            childComponent.stop();
                        });
                    }
                };

                this.module.start();
                this.appConfig.started = true;
            }
            catch (ex) {
                var error = {
                    exception: ex,
                    info: {
                        action: "starting component",
                        component: this
                    }
                };
                
                if (error.info.component) {
                    delete error.info.component.app;
                }

                pubsub.publish("error", error, this);
            }
        }
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
                uniqueRouter: false,
                rootUrl: ""
            });

            // Start up the router
            if (options.routing) {
                if (options.uniqueRouter) {
                    this.router = router.create();
                }
                else {
                    this.router = router.defaultRouter;
                }

                this.router.start(options.rootUrl);
            }

            // Start up the components
            addComponents.call(this, options.components, false);
        },

        /**
         * Stops and deregisters a component.
         * @param {String} name The name of the component to stop.
         */
        stop: function (name)
        {
            var component = this.get("components")[name];

            if (component) {
                component.stop();
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