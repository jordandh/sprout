define("pubsub", ["util", "module"], function (_, Module) {
    var topics = [];
    
    /**
     * @class pubsub
     * Provides functionality for publishing messages at a global application level. Messages can be listened to by anyone by subscribing to them.
     * @singleton
     */
    return {
        /**
         * Publishes a message that will invoke any callbacks that have subscribed to the message.
         * @param {String} message The name of the message being published.
         * @param {Object} info An object that contains information about the message.
         * @param {Object} src The object that is publishing the event.
         */
        publish: function (message, info, src)
        {
            var topic = topics[message];
            if (topic) {
                var e = {
                    name: message,
                    src: src,
                    info: info
                };
                
                _.each(topic, function (listenerInfo) {
                    try {
                        listenerInfo.handler.call(listenerInfo.context, e);
                    }
                    catch (ex) {
                    }
                });
            }
        },
        
        /**
         * Adds a listener to a message. The handler function is passed an event object. The event object contains name, src, and info member properties.
         * The name property is the name of the message. The src property is the object that published the event. And the info property contains information related to the event.
         * @param {String} message The name of the message being published.
         * @param {Function} handler A callback function to call whenever the message is published.
         * @param {Object} context (Optional) The context to run the handler in.
         * @return {Array} Returns a handle that can be used to unsubscribe from a message.
         */
        subscribe: function (message, handler, context)
        {
            var topic = topics[message];
            if (!topic) {
                topic = [];
                topics[message] = topic;
            }
            
            topic.push({
                handler: handler,
                context: context
            });
            
            return [message, handler, context];
        },
        
        /**
         * Removes a listener from a message. Only handles returned by pubsub.subscribe should be used with this function.
         * @param {Array} handle The handle returned by pubsub.subscribe.
         */
        unsubscribe: function (handle)
        {
            var topic = topics[handle[0]];
            if (topic) {
                _.remove(topic, function (item) {
                    return item.handler === handle[1] && item.context === handle[2];
                });
            }
        }
    };
});