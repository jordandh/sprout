define(["sprout/util", "sprout/base", "sprout/pubsub", "sprout/router", "sprout/dom"], function (_, base, pubsub, router, $) {
    "use strict";

    function startModule (module, config)
    {
        try {
            module.resources = {
                router: this.app.router,
                //config: this.config || {}
                config: _.defaults({}, this.config, config)
            };

            // If the component should be started based on a media query
            if (_.isString(this.media)) {
                this.mql = window.matchMedia(this.media);

                if (this.mql.matches) {
                    module.start();
                    this.appConfig.started = true;
                }

                this.mql.addListener(_.bind(onMediaQueryMatchChanged, null, this));
            }
            // Else start the component now
            else {
                module.start();
                this.appConfig.started = true;
            }
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

    function spawnComponent (options)
    {
        var module;

        options = options || {};

        module = this.modules[options.spawnId];

        if (module) {
            module.activate();
        }
        else {
            module = this.spawnableModule.create();
            this.modules[options.spawnId] = module;
            startModule.call(this, module, options.config);
        }
    }

    function startComponent ()
    {
        startModule.call(this, this.module);

        // If the component's module has already been downloaded and created then start it up
        // if (this.module) {
            // try {
            //     this.module.resources = {
            //         router: this.app.router,
            //         config: this.config || {}
            //     };

            //     // If the component should be started based on a media query
            //     if (_.isString(this.media)) {
            //         this.mql = window.matchMedia(this.media);

            //         if (this.mql.matches) {
            //             this.module.start();
            //             this.appConfig.started = true;
            //         }

            //         this.mql.addListener(_.bind(onMediaQueryMatchChanged, null, this));
            //     }
            //     // Else start the component now
            //     else {
            //         this.module.start();
            //         this.appConfig.started = true;
            //     }
            // }
            // catch (ex) {
            //     var error = {
            //         exception: ex,
            //         info: {
            //             action: "starting component",
            //             component: this
            //         }
            //     };
                
            //     if (error.info.component) {
            //         delete error.info.component.app;
            //     }

            //     pubsub.publish("error", error, this);
            // }
        // }
    }

    function stopComponent ()
    {
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

    /**
     * Adds and starts a component in the application.
     * @private
     * @param {Object} component The component to add to the application.
     */
    function addComponent (component)
    {
        var self = this;

        if (component.disabled) {
            return;
        }

        // Setup the component
        component.app = this;
        component.start = startComponent;
        component.stop = stopComponent;
        component.spawn = component.spawn ? spawnComponent : false;
        component.appConfig = {};

        this.get("components")[component.name] = component;

        // Start up child components (this has to go before the require call to insure that the child components exist when the parent component's start function is called)
        addComponents.call(this, component.components, true);

        require([component.path], function (module) {
            try {
                var route = component.route,
                    startMessage = component.start_message;

                if (_.isString(route)) {
                    route = [route];
                }

                // If this is not a spawnable component
                if (!component.spawn) {
                    // Else create the component's module now
                    component.module = module.create();
                }

                // If the component should be available to be spawned and started on demand
                if (component.spawn) {
                    component.spawnableModule = module;
                    component.modules = {};
                    self.spawnableComponents[component.name] = component;
                }
                // Else if the component should be started up from a matching route
                else if (_.isArray(route)) {
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

    function addComponents (components)
    {
        if (_.isArray(components)) {
            _.each(components, function (component) {
                addComponent.call(this, component);
            }, this);
        }
        else if (_.isObject(components) && !_.isEmpty(components)) {
            addComponent.call(this, components);
        }
    }

    function onMediaQueryMatchChanged (component, mql) {
        var action = "";

        try {
            if (mql.matches) {
                action = "starting";
                component.module.start();
                component.appConfig.started = true;
            }
            else {
                action = "stopping";
                component.module.stop();
                component.appConfig.started = false;
            }
        }
        catch (ex) {
            var error = {
                exception: ex,
                info: {
                    action: action ? action + " component based on media query" : "checking component for media query",
                    mediaQuery: component.media,
                    component: component
                }
            };
            
            if (error.info.component) {
                delete error.info.component.app;
            }

            pubsub.publish("error", error, this);
        }
    }

    function onStartComponent (e)
    {
        try {
            var componentName = e.info.component,
                component = this.spawnableComponents[componentName],
                spawnConfig = {},
                spawnId;

            if (!component) {
                throw new Error("Unable to spawn component. Component not found for " + componentName);
            }

            // Calculate the spawn id
            if (!_.isUndefined(e.info.spawnId)) {
                spawnId = e.info.spawnId;
            }
            else if (_.isElement(e.src)) {
                spawnId = $(e.src).data("spawnId");

                if (_.isUndefined(spawnId)) {
                    spawnId = _.uniqueId("s");
                    $(e.src).data("spawnId", spawnId);
                }

                spawnConfig.src = e.src;
            }

            // Build the spawn config
            _.each(e.info, function (value, key) {
                if (_.startsWith(key, 'config-')) {
                    spawnConfig[_.strRight(key, 'config-')] = value;
                }
            });

            // Spawn the component
            component.spawn({
                spawnId: spawnId,
                config: spawnConfig
            });
        }
        catch (ex) {
            var error = {
                exception: ex,
                info: {
                    action: "spawning component",
                    componentName: componentName
                }
            };

            if (error.info.component) {
                delete error.info.component.app;
            }

            pubsub.publish("error", error, this);
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
            this.spawnableComponents = {};
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

            pubsub.subscribe("start-component", onStartComponent, this);
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