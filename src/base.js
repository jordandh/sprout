define(["sprout/util", "sprout/pubsub"], function (_, pubsub) {
    "use strict";

    var rgxNumber = /^\d+$/,
        invokeBindHandler = function (handler, context, oldValue, newValue)
        {
            try {
                handler.call(context, {
                    name: 'bind',
                    info: { oldValue: oldValue, newValue: newValue },
                    src: this
                });
            }
            catch (ex) {
                pubsub.publish("error", {
                    exception: ex,
                    info: {
                        handler: handler,
                        context: context
                    }
                }, this);
            }
        },
        afterChainedListenerValueChanged = function (eventInfo, nameChain, e)
        {
            var oldValue = e.info.oldValue,
                newValue = e.info.newValue,
                oldBoundValue, newBoundValue;

            // Unbind old value
            if (nameChain.length > 0 && oldValue) {
                oldValue.unbind(nameChain, eventInfo.handler, eventInfo.context);
                oldBoundValue = oldValue.get(nameChain);
            }

            // Rebind new value
            if (nameChain.length > 0 && newValue) {
                newValue.bind(nameChain, eventInfo.handler, eventInfo.context);
                newBoundValue = newValue.get(nameChain);
            }

            if (nameChain.length === 0) {
                oldBoundValue = oldValue;
                newBoundValue = newValue;
            }

            // Invoke the handler because a change occurred
            invokeBindHandler.call(this, eventInfo.handler, eventInfo.context, oldBoundValue, newBoundValue);
        },
        /*
         * addChainedListener
         */
        addChainedListener = function (name, nameChain, handler, context)
        {
            var value = this.get(name),
                listener, event, eventInfo;

            // Setup the event state
            event = this.bindEvents[name] || { after: [] };
            this.bindEvents[name] = event;

            eventInfo = {
                handler: handler,
                context: context,
                name: name,
                nameChain: nameChain
            };

            // Listen to the value changing
            eventInfo.listener = _.bind(afterChainedListenerValueChanged, this, eventInfo, nameChain);
            this.after(name + 'Change', eventInfo.listener);

            // Bind the next item in the chain
            if (nameChain.length > 0) {
                if (value) {
                    value.bind(nameChain, handler, context);
                }
            }

            // Store the event state
            event.after.push(eventInfo);
        },
        /*
         * removeChainedListener
         */
        removeChainedListener = function (name, nameChain, handler, context)
        {
            var event, value;

            if (this.bindEvents) {
                event = this.bindEvents[name];

                if (_.isObject(event)) {
                    _.remove(event.after, function (info) {
                        if (info.handler === handler && info.context === context) {
                            this.detachAfter(name + 'Change', info.listener);
                            return true;
                        }
                    }, this);
                }
            }

            // Unbind the next item in the chain
            if (nameChain.length > 0) {
                value = this.get(name);
                if (value) {
                    value.unbind(nameChain, handler, context);
                }
            }
        },
        /*
         * addListener
         */
        addListener = function (type, name, handler, context)
        {
            name = name.toLowerCase();

            var event = this.events[name] || {
                before: [],
                on: [],
                after: []
            };

            this.events[name] = event;

            event[type].push({
                handler: handler,
                context: context
            });
        },
        /*
         * removeListener
         */
        removeListener = function (type, name, handler, context)
        {
            if (this.events) {
                var event = this.events[name.toLowerCase()];

                if (_.isObject(event)) {
                    _.remove(event[type], function (info) {
                        return info.handler === handler && info.context === context;
                    });
                }
            }
        },
        /*
         * fire
         */
        fire = function (type, e, event)
        {
            // Clone the array of events handler objects in case some event handlers are removed during the fire event
            _.each(_.clone(event[type]), function (eventInfo) {
                try {
                    eventInfo.handler.call(eventInfo.context, e);
                }
                catch (ex) {
                    pubsub.publish("error", {
                        exception: ex,
                        info: {
                            type: type,
                            e: e,
                            event: event,
                            eventInfo: eventInfo
                        }
                    }, this);
                }
            });
        },
        /*
         * changeAttribute
         */
        changeAttribute = function (attribute, name, oldValue, newValue)
        {
            var validator = attribute.validator,
                setter, handler, callback;

            // Validate the value
            if (_.isFunction(validator) && !validator.call(this, newValue, name)) {
                this.fire("attributeInvalidated", { name: name, newValue: newValue, oldValue: oldValue });
                return false;
            }

            setter = attribute.set;

            // Set the value
            if (_.isFunction(setter)) {
                newValue = setter.call(this, newValue, oldValue, name);
                if (_.isUndefined(newValue)) {
                    return false;
                }
            }

            this.values[name] = newValue;

            handler = attribute.handler || this;
            callback = handler[name + "Changed"];
            if (_.isFunction(callback)) {
                callback.call(handler, newValue, oldValue);
            }

            return true;
        },
        /*
         * fireAttributeChange
         */
        fireAttributeChange = function (type, e, event)
        {
            if (event) {
                fire.call(this, type, e, event);
            }
        },
        /*
         * getAttributes
         */
        getAttributes = function ()
        {
            var attributes = {};

            // Grab the values for each attribute in the prototype chain starting from the bottom up
            _.each(_.prototypes(this).reverse(), function (obj) {
                _.each(obj.attributes, function (attribute, name) {
                    attributes[name] = attribute;
                });
            });

            return attributes;
        },
        /*
         * getValue
         */
        getValue = function (name)
        {
            var attribute = this.getAttribute(name),
                getter;

            if (attribute) {
                getter = attribute.get;
                if (_.isFunction(getter)) {
                    return getter.call(this, name);
                }
            }

            if (this.values.hasOwnProperty(name)) {
                return this.values[name];
            }

            if (attribute) {
                return attribute.value;
            }
        },
        /*
         * hasAttribute
         */
        hasAttribute = function (name)
        {
            return this.values.hasOwnProperty(name) || this.getAttribute(name);
        },
        /*
         * setAttribute
         */
        setAttribute = function (name, value, options)
        {
            var attribute = this.getAttribute(name) || {},
                valueChanged = false,
                oldValue, event1, event2, e;

            options = options || {};
            _.defaults(options, {
                silent: false,
                force: false
            });

            if (_.isUndefined(attribute) || (attribute.readOnly && !options.force)) {
                return false;
            }

            oldValue = getValue.call(this, name);

            if (oldValue !== value) {
                if (!options.silent) {
                    //valueChanged = fireAttributeChangeEvents.call(this, attribute, name, oldValue, value);
                    valueChanged = this.fireAttributeChangeEvents(attribute, name, oldValue, value);
                }
                else {
                    valueChanged = changeAttribute.call(this, attribute, name, oldValue, value);
                }
            }

            return valueChanged;
        },
        /*
         * setupAttributes
         */
        setupAttributes = function (attributes)
        {
            // Loop through all the attributes and setup any dependencies for computable attributes
            _.each(attributes, function (attribute, name) {
                this.setupAttribute(name, attribute);
            }, this);
        },
        /*
         * afterDependencyChanged
         */
        afterDependencyChanged = function (attribute, name, e)
        {
            //fireAttributeChangeEvents.call(this, attribute, name, null, attribute.get.call(this));
            this.fireAttributeChangeEvents(attribute, name, null, attribute.get.call(this));
        },
        /**
         * @class base
         * Represents the base object to inherit from. Object inheritance is done through true prototypal inheritance instead of mimicking classical inheritance.
         * One does not need to understand the details in how these two styles differ in order to use this inheritance model.
         * For more information on both inheritance styles visit http://javascript.crockford.com/prototypal.html
         * There are two key methods on the base object used for following the prototypal inheritance model: create and extend.
         * Calling create on the base object will return an object whose prototype points to base. Or in other words create returns an instance of base.
         * <pre><code>
         *     var obj = base.create();
         * </code></pre>
         * Calling extend on the base object will return an object whose prototype points to base. This may sound identical to the create method and that is because they are identical.
         * In prototypal inheritance you are inheriting from objects so creating and inheriting from an object are the same thing.
         * <pre><code>
         *     var animal = base.extend();
         * </code></pre>
         * Now the extend and create methods do differ in parameters. The extend method optionally takes an object of methods and properties to add to the newly created object.
         * <pre><code>
         *     var animal = base.extend({
         *         speak: function () { console.log("..."); }
         *     });
         * </code></pre>
         * The animal object now contains the speak method and all methods/properties inherited from base.
         * An animal instance can be created by calling create on the animal object.
         * <pre><code>
         *     var pet = animal.create();
         * </code></pre>
         * The cat object is created and its prototype points to animal and animal's prototype points to base. Or in other words the cat object is an instance of an animal object.
         *
         * Overriding methods is done simply by defining a new method with the same name when calling extend.
         * <pre><code>
         *     var cat = animal.extend({
         *         speak: function () { console.log("meow"); }
         *     });
         * </code></pre>
         * Often times the parent's method will need to be called from the overridden method. With prototypal inheritance this is straightforward and simpler than in classical inheritance.
         * <pre><code>
         *     var cat = animal.extend({
         *         speak: function () {
         *             console.log("meow");
         *             animal.speak.call(this);
         *         }
         *     });
         * </code></pre>
         * To call the parent's method you simply call the method on the parent object using call or apply passing in this as the context.
         * That wraps up how prototypal inheritance is used via the base object.
         * The base object provides other functionality including attributes, events, constructors/destructors, plugins, and reference counting.
         * When an object is made using the create method its constructor method is automatically called. This method is named constructor and can be overridden by any child objects.
         * When an object is destroyed the destructor method is called. This method is named destructor and can also be overridden just like any other method.
         * <br/><br/>
         * <b>Attribute</b>
         * <pre>
         * Attribute Properties
         * {Object} value The initial value of the attribute.
         * {Function} validator A function to be called when the attribute is set. If the function returns false then the attribute's value is not changed. It is passed two parameters: the new value and the name of the attribute.
         * {Function} set A function to be called when the attribute value is being set. It is passed three parameters: the enw value, the current value, and the name of the attribute. If this function is defined then it is responsible for updating the attribute's value.
         * {Function} get A function to be called when the attribute value is being retrieved. It is passed two parameters: the current value and the name of the attribute.
         * {Boolean} readOnly If true then the attribute's value cannot be changed from its initial value. The default value is false.
         * {Object} handler The attribute change callback is normally called on the object that owns the attribute. This overrides that context and instead the handler's function is called. This is primarily used by plugins.
         * {Array|String} uses The attribute names that this attribute is dependent on for its value. Defining this property make the attribute a computable attribute.
         * </pre>
         * A computable attribute is an attribute whose value is calculated from other attributes on the object. An attribute is considered computable if the 'uses' property is defined on it.
         * The values in 'uses' should be the name of the other attributes that the computable is dependent on. Change event handlers are automatically attached to all the attributes listed in 'uses'.
         * Whenever one of the dependent attributes is changed a change event is also fired for the computable attribute. A computable attribute should also define a 'get' property.
         * The 'get' property will use the values of the dependent attributes.
         */
        /**
         * @event destroy
         * Fires when the object is being destroyed.
         */
        /**
         * @event plug
         * Fires when a plugin is being attached.
         * @param {Object} plugin The plugin being attached.
         */
        /**
         * @event unplug
         * Fires when a plugin is being detached.
         * @param {Object} plugin The plugin being detached.
         */
        /**
         * @event attributeInvalidated
         * Fires when an attribute value has been invalidated.
         * @param {String} name The name of the attribute that was invalidated.
         * @param {Object} oldValue The current value of the attribute.
         * @param {Object} newValue The value that was invalidated when the attribute was being set.
         */
        base = {
            /**
             * Creates a new instance of this object.
             * @param {Object} attributes A key/value hash of atrributes to set on the object after it is created.
             * @return {Object} Returns a new instance of this object.
             */
            create: function (attributes)
            {
                var instance = _.create(this);
                instance.constructor.apply(instance, arguments);

                if (attributes) {
                    instance.set(attributes);
                }

                return instance;
            },

            /**
             * Creates a new object that inherits from this object.
             * @param {Object} members A key/value hash of methods and properties that are added to the new object.
             * @return {Object} Returns an object that inherits from this object.
             */
            extend: function (members)
            {
                return _.create(this, members);
            },

            /**
             * Mixes in the members with this object.
             * If members contains a property named attributes then those attributes are added to this object's current attributes property.
             * @param {Object} members A key/value hash of methods and properties that are added to this object.
             */
            mixin: function (members)
            {
                var attributes = members.attributes;
                delete members.attributes;

                _.extend(this, members);

                if (attributes) {
                    _.extend(this.attributes, attributes);
                }
            },

            /**
             * Creates a new object that extends from this object instance. Any new members override the origin object's members. Any new attributes are added to the proxy object.
             * This function is useful when you want to treat an object like the origin object but add some extra functionality on top of it.
             * The proxy safely adds the functionality without changing the origin object. This way anything already using the origin object does not have access to the new proxy members.
             * And anything given the proxy object thinks it has the origin object.
             * @param {Object} members A key/value hash of methods and properties that are added to the proxy object.
             * @return {Object} Returns an object that is a proxy of this object.
             */
            proxy: function (members)
            {
                var proxy = this.extend(members);

                if (members.attributes) {
                    proxy.addAttribute(members.attributes);
                }

                return proxy;
            },

            /**
             * Initializes the object.
             */
            constructor: function ()
            {
                this.attributes = {};
                this.values = {
                    plugins: {}
                };
                this.events = {};
                this.bindEvents = {};

                // Loop through all the attributes and setup any dependencies for computable attributes
                setupAttributes.call(this, getAttributes.call(this));
            },

            /**
             * Deinitializes the object.
             */
            destructor: function ()
            {
                // Stop any attribute timers
                _.each(this.attributeTimers, function (timer) {
                    clearInterval(timer);
                });
                this.attributeTimers = null;

                // Destroy any plugins on this object
                _.each(this.get("plugins"), function (plugin) {
                    plugin.destroy();
                });

                // Unbind any bindEvents
                _.each(this.bindEvents, function (event) {
                    _.each(event.after, function (info) {
                        this.unbind(info.name + '.' + info.nameChain, info.handler, info.context);
                    }, this);
                }, this);

                // Loop through all values that have been defined as attributes and delete them
                _.each(getAttributes.call(this), function (attribute, name) {
                    if (this.values.hasOwnProperty(name)) {
                        var value = this.values[name];

                        // If the attribute should auto-destroy the value then do so
                        if (attribute.destroy && _.isObject(this.values[name]) && _.isFunction(value.destroy)) {
                            value.destroy();
                        }

                        delete this.values[name];
                    }
                }, this);

                this.attributes = null;
                this.events = null;
                this.bindEvents = null;
                this.values = {
                    destroyed: true
                };
            },

            /*
             * Support for non-ES5 browsers
             */
            prototypeObject: Object.prototype,

            /**
             * The attributes for the object.
             * @property
             * @type Object
             */
            attributes:
            {
                /**
                 * @cfg {Boolean} destroyed Whether or not this object instance has been destroyed.
                 * @default false
                 * @readOnly
                 */
                destroyed: {
                    value: false,
                    readOnly: true,
                    enum: false
                },
                /**
                 * @cfg {Array} plugins The plugins attached to the instance of this object.
                 * @default undefined
                 * @readOnly
                 */
                plugins: {
                    readOnly: true,
                    enum: false
                }
            },

            /**
             * Destroys the object causing its destructor to be called.
             */
            destroy: function ()
            {
                if (this.get("destroyed")) {
                    throw new Error("This object has already been destroyed.");
                }

                this.fire("destroy", null, function () {
                    this.destructor();
                });
            },

            /**
             * Adds a plugin to this object. Only one instance of a plugin can be attached to an object at a time. Any attempts to attach the same plugin multiple times will be ignored.
             * @param {Object} plugin A plugin object to create an instance of and attach to this object.
             */
            plug: function (plugin)
            {
                this.fire("plug", { plugin: plugin }, function (e) {
                    var plugins = this.get("plugins");

                    if (_.isUndefined(plugins[e.info.plugin.name])) {
                        plugins[e.info.plugin.name] = e.info.plugin.create(this);
                    }
                });
            },

            /**
             * Removes a plugin from this object.
             * @param {Object} plugin A plugin object to detach from this object.
             */
            unplug: function (plugin)
            {
                this.fire("unplug", { plugin: plugin }, function (e) {
                    var plugins = this.get("plugins");

                    if (!_.isUndefined(plugins[e.info.plugin.name])) {
                        plugins[e.info.plugin.name].destroy();
                        delete plugins[e.info.plugin.name];
                    }
                });
            },

            /**
             * Sets the value of one or more attributes. This function has two signatures (name, value, options) and (attributes, options).
             * @param {String} name The name of the attribute to set.
             * @param {String} value The value of the attribute.
             * @param {Object} attributes An object of key/value pairs to set.
             * @param {Object} options (Optional)
             * @options
             * {Boolean} silent If true then no event is fired. The default value is false.
             * {Boolean} force If true then the attribute's value is set even if it is read only. The default value is false.
             * @return {Boolean|undefined} If an attribute name and value were passed as parameters then this returns whether or not the attribute value was successfully changed. Otherwise undefined is returned.
             */
            set: function (name)
            {
                var options;

                if (_.isObject(name)) {
                    options = arguments[1];
                    _.each(name, function (value, name) {
                        setAttribute.call(this, name, value, options);
                    }, this);
                }
                else {
                    return setAttribute.call(this, name, arguments[1], arguments[2]);
                }
            },

            /**
             * Retrieves the value of an attribute.
             * @param {String} name The name of the attribute.
             * @return {Object} Returns the value of the attribute if it exists, otherwise returns undefined.
             */
            get: function (name)
            {
                var names = _.isString(name) ? name.split(".") : null,
                    attribute, value, values;

                if (names && names.length > 1) {
                    name = names.shift();
                    value = this.get(name);

                    if (base.isPrototypeOf(value)) {
                        return value.get(names.join("."));
                    }
                }
                else if (_.isUndefined(name)) {
                    values = {};

                    // Grab the values for each attribute in the prototype chain starting from the bottom up
                    _.each(_.prototypes(this).reverse(), function (obj) {
                        _.each(obj.attributes, function (attribute, name) {
                            values[name] = attribute.value;
                        });
                    });

                    // Add the values unique to this instance and return the result
                    return _.extend(values, this.values);
                }
                else {
                    if (_.isNumber(name) || rgxNumber.test(name)) {
                        if (_.isFunction(this.at)) {
                            return this.at(parseInt(name, 10));
                        }
                    }
                    else {
                        value = getValue.call(this, name);

                        if (_.isUndefined(value) && _.isFunction(this.miss) && !hasAttribute.call(this, name)) {
                            return this.miss(name);
                        }

                        return value;
                    }
                }
            },

            /**
             * Adds attributes to the object instance.
             * @param {String|Object} attributes The name of the attribute or an object containing a map of attribute names to attribute configuration objects.
             * @param {Object} config (Optional) The configuration for the attribute if the first parameter is a string.
             * @param {Object} attribute The attribute's configuration.
             */
            addAttribute: function (attributes)
            {
                if (_.isString(attributes)) {
                    var name = attributes;
                    attributes = {};
                    attributes[name] = arguments[1];
                }

                _.extend(this.attributes, attributes);
                setupAttributes.call(this, attributes);
            },

            /**
             * Retrieves an attribute that belongs to this object.
             * @param {String} name The name of the attribute.
             * @return {Object|undefined} Returns the attribute object if it exists on the object, otherwise undefined is returned.
             */
            getAttribute: function (name)
            {
                var attribute;

                // Move down the prototype chain searching for the attribute
                _.all(_.prototypes(this), function (obj) {
                    // If this object in the chain has the attribute then end the search
                    if (obj.hasOwnProperty("attributes") && _.isObject(obj.attributes)) {
                        attribute = obj.attributes[name];

                        if (attribute) {
                            return false;
                        }
                    }

                    return true;
                });

                return attribute;
            },

            /**
             * When an attribute is added to the object instance during construction or via addAttribute this method is called.
             * Any initialization work needed by that attribute is done here.
             * @private
             * @param {String} name The name of the attribute.
             * @param {Object} attribute The attribute's configuration.
             */
            setupAttribute: function (name, attribute)
            {
                var uses = attribute.uses,
                    timer = attribute.timer;

                // Setup the uses property
                if (_.isString(uses)) {
                    uses = [uses];
                }

                if (_.isArray(uses)) {
                    _.each(uses, function (dependency) {
                        this.after(dependency + "Change", _.bind(afterDependencyChanged, this, attribute, name));
                    }, this);
                }

                // Set up the timer property
                if (_.isNumber(timer)) {
                    this.attributeTimers = this.attributeTimers || [];
                    this.attributeTimers.push(setInterval(_.bind(afterDependencyChanged, this, attribute, name), timer));
                }
            },

            /*
             * Causes a change event to fire for an attribute. Changes the value of the attribute if the event's default action is not prevented.
             * @private
             * @param {Object} attribute The attribute's configuration object.
             * @param {String} name THe name of the attribute.
             * @param {Object} oldValue The old value of the attribute.
             * @param {Object} newValue The new value of the attribute.
             */
            fireAttributeChangeEvents: function (attribute, name, oldValue, newValue)
            {
                var eventName = name + "Change",
                    event1 = this.events[eventName.toLowerCase()],
                    event2 = this.events.change,
                    valueChanged = false,
                    e;

                if (_.isObject(event1) || _.isObject(event2)) {
                    // Before handlers
                    e = {
                        name: eventName,
                        info: { name: name, oldValue: oldValue, newValue: newValue },
                        src: this,
                        preventDefault: false
                    };
                    fireAttributeChange.call(this, "before", e, event1);

                    e.name = "change";
                    fireAttributeChange.call(this, "before", e, event2);

                    if (!e.preventDefault) {
                        valueChanged = changeAttribute.call(this, attribute, name, oldValue, e.info.newValue);

                        // On handlers
                        e.name = eventName;
                        fireAttributeChange.call(this, "on", e, event1);
                        e.name = "change";
                        fireAttributeChange.call(this, "on", e, event2);

                        // After handlers
                        e.name = eventName;
                        fireAttributeChange.call(this, "after", e, event1);
                        e.name = "change";
                        fireAttributeChange.call(this, "after", e, event2);
                    }
                }
                else {
                    valueChanged = changeAttribute.call(this, attribute, name, oldValue, newValue);
                }

                return valueChanged;
            },

            /**
             * Fires an event notifying each listener. The defaultAction and preventedAction functions are normally passed one argument: the event object that represents the event.
             * If async is true then a function is passed to the defaultAction function as the second parameter. Calling this function will trigger the after event.
             * The structure of the event object:
             * <pre><code>
             *  {
             *      name: "<the name of the event>"
             *      src: <the object that fired the event>
             *      info: <an object containing information unique to the event>
             *      preventDefault: <whether or not the event has been cancelled by a before handler>
             *  }
             * </code></pre>
             * @param {String} name The name of the event to publish.
             * @param {Object} info (Optional) Data that gets associated with the event. In the event object that is passed to listeners this is the info member.
             * @param {Function} defaultAction (Optional) If preventDefault is not called on the event then this function is called. This function carries out the default action for the event.
             * @param {Function} preventedAction (Optional) If preventDefault is called on the event then this function is called. This function can carry out clean up duties if necessary.
             * @param {Boolean} async (Optional) Whether or not this event is asynchronous (e.g. an ajax request). If true then the after event is not fired and a function is returned that when called will trigger the after event.
             */
            fire: function (name, info, defaultAction, preventedAction, async)
            {
                var event = this.events[name],
                    e = {
                        name: name,
                        info: info,
                        src: this,
                        preventDefault: false
                    };

                if (_.isObject(event)) {
                    // Before handlers
                    fire.call(this, "before", e, event);

                    if (e.preventDefault) {
                        if (_.isFunction(preventedAction)) {
                            preventedAction.call(this, e);
                        }
                    }
                    else {
                        // On handlers
                        fire.call(this, "on", e, event);

                        if (_.isFunction(defaultAction)) {
                            defaultAction.call(this, e, async ? _.bind(function () { fire.call(this, "after", e, event); }, this) : void 0);
                        }

                        // After handlers
                        if (!async) {
                            fire.call(this, "after", e, event);
                        }
                    }
                }
                else {
                    if (_.isFunction(defaultAction)) {
                        defaultAction.call(this, e, async ? function () {} : void 0);
                    }
                }
            },

            /**
             * Attaches a callback to an event that is called before the event's default action occurs. The callback function is passed an event object:
             * <pre><code>
             *  {
             *      name: "<the name of the event>"
             *      src: <the object that fired the event>
             *      info: <an object containing information unique to the event>
             *      preventDefault: false
             *  }
             * </code></pre>
             * The event object's preventDefault property can be set to true in order to prevent the default action of the event from occuring.
             * This also prevents the on and after event handlers from being called because it is as if the event never happened.
             * This is the only chance in the event's lifetime to cancel it.
             * @param {String} name The name of the event to attach to.
             * @param {Function} handler The callback function to call when the event occurs.
             * @param {Object} context (Optional) The context to invoke the callback in.
             */
            before: function (name, handler, context)
            {
                addListener.call(this, "before", name, handler, context);
            },

            /**
             * Attaches a callback to an event that is called before the event's default action occurs. The callback function is passed an event object:
             * <pre><code>
             *  {
             *      name: "<the name of the event>"
             *      src: <the object that fired the event>
             *      info: <an object containing information unique to the event>
             *      preventDefault: false
             *  }
             * </code></pre>
             * The event can no longer be cancelled at this point so the event object's preventDefault property is ignored.
             * @param {String} name The name of the event to attach to.
             * @param {Function} handler The callback function to call when the event occurs.
             * @param {Object} context (Optional) The context to invoke the callback in.
             */
            on: function (name, handler, context)
            {
                addListener.call(this, "on", name, handler, context);
            },

            /**
             * Attaches a callback to an event that is called after the event's default action occurs. The callback function is passed an event object:
             * <pre><code>
             *  {
             *      name: "<the name of the event>"
             *      src: <the object that fired the event>
             *      info: <an object containing information unique to the event>
             *      preventDefault: false
             *  }
             * </code></pre>
             * The event can no longer be cancelled at this point so the event object's preventDefault property is ignored.
             * @param {String} name The name of the event to attach to.
             * @param {Function} handler The callback function to call when the event occurs.
             * @param {Object} context (Optional) The context to invoke the callback in.
             */
            after: function (name, handler, context)
            {
                addListener.call(this, "after", name, handler, context);
            },

            /**
             * Detaches a callback from an event that was attached using base.before.
             * @param {String} name The name of the event to detach from.
             * @param {Function} handler The callback function to call when the event occurs.
             * @param {Object} context (Optional) The context to invoke the callback in.
             */
            detachBefore: function (name, handler, context)
            {
                removeListener.call(this, "before", name, handler, context);
            },

            /**
             * Detaches a callback from an event that was attached using base.on.
             * @param {String} name The name of the event to detach from.
             * @param {Function} handler The callback function to call when the event occurs.
             * @param {Object} context (Optional) The context to invoke the callback in.
             */
            detachOn: function (name, handler, context)
            {
                removeListener.call(this, "on", name, handler, context);
            },

            /**
             * Detaches a callback from an event that was attached using base.after.
             * @param {String} name The name of the event to detach from.
             * @param {Function} handler The callback function to call when the event occurs.
             * @param {Object} context (Optional) The context to invoke the callback in.
             */
            detachAfter: function (name, handler, context)
            {
                removeListener.call(this, "after", name, handler, context);
            },

            bind: function (name, handler, context)
            {
                var names = name.split(".");

                // if (names && names.length > 1) {
                //     addChainedListener.call(this, names.shift(), names.join("."), name, handler, context);
                // }
                // else {
                //     addListener.call(this, "after", name, handler, context);
                // }

                addChainedListener.call(this, names.shift(), names.join("."), handler, context);
            },

            unbind: function (name, handler, context)
            {
                var names = name.split(".");

                // if (names && names.length > 1) {
                //     removeChainedListener.call(this, names.shift(), names.join("."), name, handler, context);
                // }
                // else {
                //     removeListener.call(this, "after", name, handler, context);
                // }

                removeChainedListener.call(this, names.shift(), names.join("."), handler, context);
            }
        };

    return base;
});