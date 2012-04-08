define("application", ["util", "base"], function (_, base) {
    "use strict";

    /**
     * Adds and starts a component in the application.
     * @private
     * @param {String} name The name of the module to add.
     * @param {Object} component The component to add to the application.
     */
    function addComponent (component)
    {
        this.get("components")[component.name] = component;

        require([component.path], function (module) {
            var comp = module.new();
            comp.start();
            component.module = comp;
        });
    }
    
    /**
     * @class application
     * Provides functionality for managing components on a page.
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
             * @cfg {Object} components The unique client id of this model.
             * @readOnly
             */
            components: { readOnly: true }
        },

        /**
         * Registers and starts one or more components with the application.
         * @param {Object|Array} components Either one component or an array of components to start. A component is an object with two properties:
         * {
         *    name: "<string unique name of the module>",
         *    path: "<string path to the module>"
         * }
         */
        start: function (components)
        {
            if (_.isArray(components)) {
                _.each(components, function (component) {
                    addComponent.call(this, component);
                }, this);
            }
            else {
                addComponent.call(this, name, components[name]);
            }
        },

        /**
         * Stops and deregisters a module.
         * @param {String} name The name of the module to stop.
         */
        stop: function (name)
        {
            var components = this.get("components"),
                component = components[name];

            if (component) {
                if (component.module) {
                    component.module.stop();
                    component.module.destroy();
                    component.module = null;
                }

                delete components[name];
            }
        },

        /**
         * Restarts a module.
         * @param {String} name The name of the module to restart.
         */
        restart: function (name)
        {
            var components = this.get("components");

            _.each(this.get("components"), function (component) {
                if (component.module) {
                    component.module.restart();
                }
            });
        }
    });
});