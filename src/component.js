define(['sprout/util', 'sprout/base', 'sprout/pubsub', 'sprout/env'], function (_, base, pubsub, env) {
    'use strict';

    function getLocalStorage ()
    {
        try {
            return env.localStorageEnabled() ? localStorage : null;
        }
        catch (ex) { /* empty */ }
    }

    function loadSettings ()
    {
        var localStorage = getLocalStorage.call(this);

        if (localStorage) {
            return _.extend({}, JSON.parse(localStorage[this.settings] || null), JSON.parse(localStorage[this.settings + '-' + this.get('id')] || null));
        }

        return null;
    }

    function afterAttributeChanged (e)
    {
        var localStorage = getLocalStorage.call(this),
            attribute = this.getAttribute(e.info.name),
            data = {},
            storageName;

        if (localStorage && attribute && attribute.storage) {
            // If the attribute that was just set is a global storage value
            if (attribute.storage === 'global') {
                // Then grab all the global storage values to store
                storageName = this.settings;

                _.each(this.get(), function (value, name) {
                    var attribute = this.getAttribute(name);

                    if (attribute && attribute.storage === 'global') {
                        data[name] = value;
                    }
                }, this);
            }
            // Else if the attribute that was just set is an instance storage value
            else if (attribute.storage === 'instance') {
                // Then grab all the instance storage values to store
                storageName = this.settings + '-' + this.get('id');

                _.each(this.get(), function (value, name) {
                    var attribute = this.getAttribute(name);

                    if (attribute && attribute.storage === 'instance') {
                        data[name] = value;
                    }
                }, this);
            }

            // If there is no data to store then delete this key from storage
            if (_.isEmpty(data)) {
                localStorage.removeItem(storageName);
            }
            // Else add the data to storage
            else {
                localStorage[storageName] = JSON.stringify(data);
            }
        }
    }

    function reportError (error, action)
    {
        try {
            var err = {
                exception: error,
                info: {
                    action: action,
                    componentName: this.name,
                    functionName: error.functionName
                }
            };

            pubsub.publish('error', err, this);
        }
        catch (ex) {}
    }

    function exceptionWrap (func, name)
    {
        return function () {
            try {
                return func.apply(this, arguments);
            }
            catch (ex) {
                reportError.call(this, _.extend(ex, {
                    functionName: name
                }), 'component errored');
            }
        };
    }

    /**
     * @class component
     * Components are modules that run on a page. They can be started, stopped, and restarted in an application. Components are the pieces of an application that make it unique.
     * The component object is meant to be inherited from. Components should be started in an application by using the application object.
     * @extends base
     */
    return base.extend({
        extend: function (members)
        {
            _.each(_.functions(members), function (name) {
                members[name] = exceptionWrap(members[name], name);
            });

            return base.extend.call(this, members);
        },

        mixin: function (members)
        {
            _.each(_.functions(members), function (name) {
                members[name] = exceptionWrap(members[name], name);
            });

            return base.mixin.call(this, members);
        },

        /**
         * Starts up a component on a page. Child component objects should override this method to define its start up logic.
         * @param {Object} resources
         * {Object} router The application's shared router. The component can use it to setup url routing.
         */
        start: function ()
        {
            this.pubsubHandles = [];

            if (this.settings) {
                this.set(loadSettings.call(this));
                this.after('change', afterAttributeChanged, this);
            }
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
         * Called on a spawned component if the component has already been started but was trigged to start again.
         * Child component objects should override this method to define its activate logic.
         */
        activate: function ()
        {
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
            // TODO: this puts the component into a failed state. An Application object can detect that the component is in a failed state and do something about it. (e.g. restart it or report an error)
            reportError.call(this, error, 'component failed');
        }
    });
});