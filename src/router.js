define(["sprout/util", "sprout/base", "sprout/dom", "sprout/history", "sprout/pubsub"], function (_, base, $, history, pubsub) {
    "use strict";

    var namedParam = /:\w+/g,
        splatParam = /\*\w+/g,
        escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g,
        pathStripper = /^[#\/]/,
        trailingStripper = /\/$/;

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

        var route = {
            name: name
        };
        _.extend(route, routeConfig, {
            path: _.isRegExp(routeConfig.path) ? routeConfig.path : toPathRegExp(routeConfig.path)
        });
        
        this.routes[name] = route;

        return route;
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

    function matchRoute (routePath)
    {
        var path = getRelativePath();

        // Match the rootUrl portion of the routePath
        path = path.replace(pathStripper, "").replace(trailingStripper, "");
        if (_.startsWith(path, this.rootUrl)) {
            path = path.substring(this.rootUrl.length).replace(pathStripper, "");
        }

        // Make the routePath a regexp
        routePath = _.isRegExp(routePath) ? routePath : toPathRegExp(routePath);

        // Match route to the path
        if (routePath.test(path)) {
            return {
                path: routePath,
                parameters: routePath.exec(path).slice(1)
            };
        }
    }

    function matchRoutes (path, routes)
    {
        var matches = [];

        // Match the rootUrl portion of the path
        path = path.replace(pathStripper, "").replace(trailingStripper, "");
        if (_.startsWith(path, this.rootUrl)) {
            path = path.substring(this.rootUrl.length).replace(pathStripper, "");
        }

        // Match routes to the path
        _.each(routes, function (route) {
            if (route.path.test(path)) {
                matches.push({
                    route: route,
                    parameters: route.path.exec(path).slice(1)
                });
            }
        });

        return matches;
    }

    function startRoutes (path, routes, appendMatches)
    {
        var matches = matchRoutes.call(this, getRelativePath(), routes);

        if (appendMatches) {
            this.matchedRoutes = this.matchedRoutes.concat(matches);
        }
        else {
            this.matchedRoutes = matches;
        }

        _.each(matches, function (match) {
            if (_.isFunction(match.route.start)) {
                try {
                    match.route.start.apply(match.route.context, [match.route.name].concat(match.parameters));
                }
                catch (ex) {
                    pubsub.publish("error", {
                        exception: ex,
                        info: {
                            source: "router.startRoutes",
                            match: match,
                            path: path,
                            routes: routes,
                            appendMatches: appendMatches,
                            matches: matches,
                            matchedRoutes: this.matchedRoutes
                        }
                    }, this);
                }
            }
        }, this);
    }

    function stopMatchedRoutes ()
    {
        _.each(this.matchedRoutes, function (match) {
            if (_.isFunction(match.route.stop)) {
                try {
                    match.route.stop.apply(match.route.context, match.parameters);
                }
                catch (ex) {
                    pubsub.publish("error", {
                        exception: ex,
                        info: {
                            source: "router.stopMatchedRoutes",
                            match: match,
                            path: getRelativePath(),
                            matchedRoutes: this.matchedRoutes
                        }
                    }, this);
                }
            }
        }, this);
    }

    function getRelativePath ()
    {
        return history.getState().url.replace(history.getRootUrl(), "");
    }

    function afterPathChanged ()
    {
        stopMatchedRoutes.call(this);
        startRoutes.call(this, getRelativePath(), this.routes);
    }

    var router = base.extend({
        /**
         * Initializes the router.
         */
        constructor: function ()
        {
            base.constructor.call(this);
            this.routes = {};
            this.rootUrl = "";
            this.matchedRoutes = [];
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
            this.matchedRoutes = null;

            base.destructor.call(this);
        },

        start: function (rootUrl)
        {
            var match;

            // If already started then just return
            if (this.boundListener) {
                return;
            }

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
            this.matchedRoutes = [];
        },

        /**
         * path, start, stop, context
         */
        add: function (routes)
        {
            var addedRoutes = this.boundListener ? {} : null,
                addedRoute;

            if (_.isObject(routes)) {
                _.each(routes, function (route, name) {
                    addedRoute = addRoute.call(this, name, route);

                    if (addedRoutes) {
                        addedRoutes[name.toLowerCase()] = addedRoute;
                    }
                }, this);
            }
            else if (_.isString(routes)) {
                addedRoute = addRoute.call(this, routes, arguments[1]);

                if (addedRoutes) {
                    addedRoutes[routes.toLowerCase()] = addedRoute;
                }
            }

            // If routing has already started then run the newly added routes if they match the current path
            if (addedRoutes) {
                startRoutes.call(this, getRelativePath(), addedRoutes, true);
            }
        },

        remove: function (name)
        {
            removeRoute.call(this, name);
        },

        match: function (path)
        {
            return matchRoutes.call(this, path, this.routes);
        },

        matchRoute: function (routePath)
        {
            return matchRoute.call(this, routePath);
        },

        navigate: function (path, title)
        {
            if (!_.startsWith(path, this.rootUrl)) {
                path = _.joinPaths('/', this.rootUrl, path);
            }

            if (history.enabled) {
                history.pushState(null, title || document.title, path);
                return true;
            }
            else {
                document.location = path;
            }

            return false;
        }
    });

    router.defaultRouter = router.create();

    return router;
});