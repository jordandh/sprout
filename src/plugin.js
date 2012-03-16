define("plugin", ["util", "base"], function (_, base) {
    "use strict";

    /**
     * @class plugin
     * Provides functionality for attaching plugins to base objects. Plugins add new functionality to existing objects.
     * Plugins can be attached to base objects by using the base.plug method. They can later be detached from a base object using the base.unplug method.
     * When a plugin is detached from a base object it automatically removes any attributes and members added through plugin's attach methods.
     * @extends base
     */
    return base.extend({
        /**
         * Initializes the plugin.
         * @param {Object} host The base object that this plugin is attaching to.
         */
        constructor: function (host)
        {
            base.constructor.call(this);
            
            this.attachedMembers = [];
            this.attachedAttributes = [];
            this.set("host", host, { force: true });
        },
        
        /**
         * Deinitializes the plugin.
         */
        destructor: function ()
        {
            var host = this.get("host");
            
            // Detach the members
            _.each(this.attachedMembers, function (name) {
                delete host[name];
            });
            this.attachedMembers = null;
            
            // Detach the attributes
            _.each(this.attachedAttributes, function (name) {
                if (host.values.hasOwnProperty(name)) {
                    delete host.values[name];
                }
                
                delete host.attributes[name];
            });
            this.attachedAttributes = null;
            
            base.destructor.call(this);
        },
        
        /**
         * The attributes for the plugin.
         * @property
         * @type Object
         */
        attributes:
        {
            host: {
                readOnly: true
            }
        },
        
        /**
         * The name of the plugin. This is used as a key by host objects to enforce only one instance of each plugin from being attached.
         * @property
         * @type String
         */
        name: "plugin",
        
        /**
         * Adds members to the host object. If the added member is a function then its context is bound to the instance of the plugin.
         * @param {Object} members The members to attach. The members are name/value pairs.
         */
        attachMembers: function (members)
        {
            _.each(members, function (member, name) {
                this.get("host")[name] = _.isFunction(member) ? _.bind(member, this) : member;
                this.attachedMembers.push(name);
            }, this);
        },
        
        /**
         * Adds attributes to the host object. The attribute's handler is set equal to the instance of the plugin.
         * @param {Object} members The attributes to attach. The members are name/config pairs. See base for more information about attributes.
         */
        attachAttributes: function (attributes)
        {
            var host = this.get("host");
            
            _.each(attributes, function (config, name) {
                config.handler = this;
                host.attributes[name] = config;
                this.attachedAttributes.push(name);
            }, this);
        },
        
        /**
         * Removes members from the host object.
         * @param {Array} names An array of member names to remove from the host object.
         */
        detachMembers: function (names)
        {
            var host = this.get("host");
            
            _.each(names, function (name) {
                delete host[name];
                _.remove(this.attachedMembers, name);
            }, this);
        },
        
        /**
         * Removes attributes from the host object.
         * @param {Array} names An array of attribute names to remove from the host object.
         */
        detachAttributes: function (names)
        {
            var host = this.get("host");
            
            _.each(names, function (name) {
                if (host.values.hasOwnProperty(name)) {
                    delete host.values[name];
                }
                
                delete host.attributes[name];
                
                _.remove(this.attachedAttributes, name);
            }, this);
        }
    });
});