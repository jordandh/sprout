define("base", ["util"], function (_) {
    var rgxNumber = /^\d+$/,
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
            var event = this.events[name.toLowerCase()];
            
            if (_.isObject(event)) {
                _.remove(event[type], function (info) {
                    return info.handler === handler && info.context === context;
                });
            }
        },
        /*
         * fire
         */
        fire = function (type, e, event)
        {
            _.each(event[type], function (eventInfo) {
                try {
                    eventInfo.handler.call(eventInfo.context, e);
                }
                catch (ex) {
                    // TODO: publish error?
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
            if (_.isFunction(validator) && !validator(newValue, name)) {
                this.fire("attributeInvalidated", { name: name, newValue: newValue, oldValue: oldValue });
                return false;
            }
            
            setter = attribute.setter;
            
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
         * setAttribute
         */
        setAttribute = function (name, value, options)
        {
            var attribute = this.getAttribute(name) || {},
                valueChanged = false,
                eventName = name + "Change",
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
                    event1 = this.events[eventName.toLowerCase()];
                    event2 = this.events.change;
                    
                    if (_.isObject(event1) || _.isObject(event2)) {
                        // Before handlers
                        e = {
                            name: eventName,
                            info: { name: name, oldValue: oldValue, newValue: value },
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
                        valueChanged = changeAttribute.call(this, attribute, name, oldValue, value);
                    }
                }
                else {
                    valueChanged = changeAttribute.call(this, attribute, name, oldValue, value);
                }
            }
            
            return valueChanged;
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
            if (this.values.hasOwnProperty(name)) {
                return this.values[name];
            }
            
            attribute = this.getAttribute(name);
            if (attribute) {
                return attribute.value;
            }
        },
        /**
         * @class base
         * Represents the base object to inherit from. Object inheritance is done through true prototypal inheritance instead of mimicking classical inheritance.
         * One does not need to understand the details in how these two styles differ in order to use this inheritance model.
         * For more information on both inheritance styles visit http://javascript.crockford.com/prototypal.html
         * There are two key methods on the base object used for following the prototypal inheritance model: new and extend.
         * Calling new on the base object will return an object whose prototype points to base. Or in other words new returns an instance of base.
         * <pre><code>
         *     var obj = base.new();
         * </code></pre>
         * Calling extend on the base object will return an object whose prototype points to base. This may sound identical to the new method and that is because they are identical.
         * In prototypal inheritance you are inheriting from objects so creating and inheriting from an object are the same thing.
         * <pre><code>
         *     var animal = base.extend();
         * </code></pre>
         * Now the extend and new methods do differ in parameters. The extend method optionally takes an object of methods and properties to add to the newly created object.
         * <pre><code>
         *     var animal = base.extend({
         *         speak: function () { console.log("..."); }
         *     });
         * </code></pre>
         * The animal object now contains the speak method and all methods/properties inherited from base.
         * An animal instance can be created by calling new on the animal object.
         * <pre><code>
         *     var pet = animal.new();
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
         * When an object is made using the new method its constructor method is automatically called. This method is named constructor and can be overridden by any child objects.
         * When an object is destroyed the destructor method is called. This method is named destructor and can also be overridden just like any other method.
         *
         * Attributes
         * {Object} value The initial value of the attribute.
         * {Function} validator A function to be called when the attribute is set. If the function returns false then the attribute's value is not changed. It is passed two parameters: the new value and the name of the attribute.
         * {Function} setter A function to be called when the attribute value is being set. It is passed three parameters: the enw value, the current value, and the name of the attribute. If this function is defined then it is responsible for updating the attribute's value.
         * {Function} getter A function to be called when the attribute value is being retrieved. It is passed two parameters: the current value and the name of the attribute.
         * {Boolean} readOnly If true then the attribute's value cannot be changed from its initial value. The default value is false.
         * {Object} handler The attribute change callback is normally called on the object that owns the attribute. This overrides that context and instead the handler's function is called. This is primarily used by plugins.
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
            new: function (attributes)
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
             * Initializes the object.
             */
            constructor: function ()
            {
                this.attributes = {};
                this.values = {
                    plugins: {}
                };
                this.events = {};
            },
            
            /**
             * Deinitializes the object.
             */
            destructor: function ()
            {
                // Destroy any plugins on this object
                _.each(this.get("plugins"), function (plugin) {
                    plugin.destroy();
                });
                
                // Loop through all values that have been defined as attributes and delete them
                _.each(getAttributes.call(this), function (attribute, name) {
                    if (this.values.hasOwnProperty(name)) {
                        delete this.values[name];
                    }
                }, this);
                
                this.attributes = null;
                this.events = null;
                this.values = {
                    destroyed: true
                };
            },
            
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
                    readOnly: true
                },
                /**
                 * @cfg {Array} plugins The plugins attached to the instance of this object.
                 * @default undefined
                 * @readOnly
                 */
                plugins: {
                    readOnly: true
                }
            },
            
            /**
             * Destroys the object causing its destructor to be called.
             */
            destroy: function ()
            {
                if (this.get("destroyed")) {
                    throw {
                        name: "DestroyError",
                        message: "This object has already been destroyed."
                    };
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
                        plugins[e.info.plugin.name] = e.info.plugin.new(this);
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
                        return getValue.call(this, name);
                    }
                }
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
            }
        };
    
    return base;
});