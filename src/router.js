define("router", ["util", "base", "dom", "jquery.history"], function (_, base, $, history) {
    "use strict";

    var namedParam    = /:\w+/g,
        splatParam    = /\*\w+/g,
        escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g,
        pathStripper = /^[#\/]/;

    function hasPathRegExp (path)
    {
        return namedParam.test(path) || splatParam.test(path);
    }

    function toPathRegExp (path)
    {
        return new RegExp('^' + path.replace(escapeRegExp, '\\$&').replace(namedParam, '([^\/]+)').replace(splatParam, '(.*?)') + '$');
    }

    function toRootUrlRegExp (path)
    {
        return new RegExp('^' + path.replace(escapeRegExp, '\\$&').replace(namedParam, '([^\/]+)').replace(splatParam, '(.*?)'));
    }

    function addRoute (name, routeConfig)
    {
        name = name.toLowerCase();

        if (!_.isUndefined(this.routes[name])) {
            throw new Error("Route name '" + name + "' already exists.");
        }

        var route = {};
        _.extend(route, routeConfig, {
            path: _.isRegExp(routeConfig.path) ? routeConfig.path : toPathRegExp(routeConfig.path)
        });
        
        this.routes[name] = route;
    }

    function removeRoute (name)
    {
        if (this.routes) {
            name = name.toLowerCase();

            if (!_.isUndefined(this.routes[name])) {
                delete this.routes[name];
            }
        }
    }

    function getRelativePath ()
    {
        return history.getState().url.replace(history.getRootUrl(), "");
    }

    function afterPathChanged ()
    {
        console.log("Path changed to " + getRelativePath());
        _.each(this.match(getRelativePath()), function (match) {
            match.route.start.apply(match.route.context, match.parameters);
        });
    }

    return base.extend({
        /**
         * Initializes the router.
         */
        constructor: function ()
        {
            base.constructor.call(this);
            this.routes = {};
            this.rootUrl = "";
            this.boundListener = null;
        },

        /**
         * Deinitializes the router.
         */
        destructor: function ()
        {
            this.stop();
            this.routes = null;
            this.rootUrl = null;

            base.destructor.call(this);
        },

        start: function (rootUrl)
        {
            var match;

            this.boundListener = _.bind(afterPathChanged, this);
            $(window).bind("statechange", this.boundListener);

            if (_.isString(rootUrl) && hasPathRegExp(rootUrl)) {
                rootUrl = toRootUrlRegExp(rootUrl);
            }

            if (_.isRegExp(rootUrl)) {
                match = rootUrl.exec(getRelativePath());

                if (!_.isArray(match)) {
                    throw new Error("Unable to match root url '" + rootUrl + "'");
                }

                this.rootUrl = match[0];
            }
            else if (_.isString(rootUrl)) {
                this.rootUrl = rootUrl;
            }
        },

        stop: function ()
        {
            if (this.boundListener) {
                $(window).off("popstate", this.boundListener);
                this.boundListener = null;
            }

            this.routes = {};
            this.rootUrl = "";
        },

        /**
         * path, start, stop, context
         */
        add: function (routes)
        {
            if (_.isObject(routes)) {
                _.each(routes, function (route, name) {
                    addRoute.call(this, name, route);
                }, this);
            }
            else if (_.isString(routes)) {
                addRoute.call(this, routes, arguments[1]);
            }

            // TODO: if this.hist has been started check to see if any of the newly added routes match the current url. If one does then run it
        },

        remove: function (name)
        {
            removeRoute.call(this, name);
        },

        match: function (path)
        {
            var routes = [];

            // Match the rootUrl portion of the path
            path = path.replace(pathStripper, "");
            if (_.startsWith(path, this.rootUrl)) {
                path = path.substring(this.rootUrl.length).replace(pathStripper, "");
            }

            // Match routes to the path
            _.each(this.routes, function (route) {
                if (route.path.test(path)) {
                    routes.push({
                        route: route,
                        parameters: route.path.exec(path).slice(1)
                    });
                }
            });

            return routes;
        },

        navigate: function (path)
        {
            if (!_.startsWith(path, this.rootUrl)) {
                path = _.joinPaths(this.rootUrl, path);
            }

            history.pushState(null, null, path);
        }
    });
});