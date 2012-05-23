define("databind", ["util", "dom", "databindings"], function (_, $, databindings) {
    "use strict";

    var dataBindAttributeName = "data-bind",
        elementExpando = "__databind__",
        elementMetaDataStore = {},
        bindingOperators = ["!", "-"],
        databind;

    /*
     * Binding Meta Data Functions
     */
    function createMetaData (element, binder, binderTypeKey, attributeNameChain)
    {
        var metaDataKey = element[elementExpando],
            binderKey = binderTypeKey + ":" + attributeNameChain.join("."),
            elementMetaData, binderMetaData;

        if (!_.isString(metaDataKey)) {
            metaDataKey = element.nodeName + ":" + new Date().getTime();
            element[elementExpando] = metaDataKey;
        }

        elementMetaData = elementMetaDataStore[metaDataKey];

        if (!_.isObject(elementMetaData)) {
            elementMetaData = {};
            elementMetaDataStore[metaDataKey] = elementMetaData;
        }

        binderMetaData = elementMetaData[binderKey];
        if (!_.isObject(binderMetaData)) {
            binderMetaData = {};
            elementMetaData[binderKey] = binderMetaData;
        }

        binderMetaData.binder = binder;

        return binderMetaData;
    }

    function getMetaData (element, binder, binderTypeKey, attributeNameChain, createIfNotFound)
    {
        var metaDataKey = element[elementExpando],
            elementMetaData, binderMetaData;

        if (_.isString(metaDataKey)) {
            elementMetaData = elementMetaDataStore[metaDataKey];

            if (_.isObject(elementMetaData)) {
                binderMetaData = elementMetaData[binderTypeKey + ":" + attributeNameChain.join(".")];

                if (_.isObject(binderMetaData)) {
                    return binderMetaData;
                }
            }
        }

        if (createIfNotFound) {
            return createMetaData(element, binder, binderTypeKey, attributeNameChain);
        }

        return null;
    }

    function removeMetaData (element)
    {
        var metaDataKey = element[elementExpando],
            elementMetaData;

        if (_.isString(metaDataKey)) {
            elementMetaData = elementMetaDataStore[metaDataKey];

            if (_.isObject(elementMetaData)) {
                _.each(elementMetaData, function (binderMetaData) {
                    if (_.isFunction(binderMetaData.listener) && _.isObject(binderMetaData.model) && _.isString(binderMetaData.eventName)) {
                        binderMetaData.model.detachAfter(binderMetaData.eventName, binderMetaData.listener);
                    }

                    if (_.isObject(binderMetaData.binder) && _.isFunction(binderMetaData.binder.stop)) {
                        binderMetaData.binder.stop(element, binderMetaData);
                    }
                });
            }

            delete elementMetaDataStore[metaDataKey];
            element[elementExpando] = null;
        }
    }

    function getElementMetaData (element)
    {
        var metaDataKey = element[elementExpando];

        if (_.isString(metaDataKey)) {
            return elementMetaDataStore[metaDataKey];
        }
    }

    /*
     * Data Binder Functions
     */
    //function attachBinder (binder, binderKey, notBinding, element, viewModel, attributeNameChain)
    function attachBinder (binder, viewModel, attributeNameChain, binderInfo)
    {
        var listener, metaData;

        if (attributeNameChain.length > 1) {
            //listener = _.bind(updateBinder, null, binder, binderKey, notBinding, element, viewModel, attributeNameChain.slice(1));
            listener = _.bind(updateBinder, null, binder, viewModel, attributeNameChain.slice(1), binderInfo);
            
            metaData = getMetaData(binderInfo.element, binder, binderInfo.key, attributeNameChain, true);
            metaData.eventName = attributeNameChain[1] + "Change";
            metaData.listener = listener;
            metaData.model = viewModel;

            viewModel.after(attributeNameChain[1] + "Change", listener);
            //viewModel.on("destroy", _.bind(detachBinder, null, binder, binderKey, notBinding, element, viewModel, attributeNameChain));
            viewModel.on("destroy", _.bind(detachBinder, null, binder, viewModel, attributeNameChain, binderInfo));

            //attachBinder(binder, binderKey, notBinding, element, viewModel.get(attributeNameChain[1]), attributeNameChain.slice(1));
            attachBinder(binder, viewModel.get(attributeNameChain[1]), attributeNameChain.slice(1), binderInfo);

            if (attributeNameChain.length === 2) {
                //startBinder(binder, binderKey, notBinding, element, viewModel, [attributeNameChain[1]]);
                //updateBinder(binder, binderKey, notBinding, element, viewModel, [attributeNameChain[1]]);
                startBinder(binder, viewModel, [attributeNameChain[1]], binderInfo);
                updateBinder(binder, viewModel, [attributeNameChain[1]], binderInfo);
            }
        }
    }

    //function startBinder (binder, binderKey, notBinding, element, viewModel, attributeNameChain)
    function startBinder (binder, viewModel, attributeNameChain, binderInfo)
    {
        if (_.isFunction(binder.start)) {
            binder.start(binderInfo.element, viewModel.get(attributeNameChain[0]), binderInfo, getMetaData(binderInfo.element, binder, binderInfo.key, attributeNameChain, true));
        }
    }

    //function updateBinder (binder, binderKey, notBinding, element, viewModel, attributeNameChain, e)
    function updateBinder (binder, viewModel, attributeNameChain, binderInfo, e)
    {
        var oldViewModel = e ? e.info.oldValue : null;

        if (attributeNameChain.length > 1) {
            if (oldViewModel) {
                detachBinder(binder, oldViewModel, attributeNameChain, binderInfo);
            }
            attachBinder(binder, viewModel.get(attributeNameChain[0]), attributeNameChain, binderInfo);
        }
        else {
            //binder.update(binderInfo.element, viewModel.get(attributeNameChain[0]), binderInfo.key, binderInfo.not, oldViewModel, getMetaData(binderInfo.element, binder, binderInfo.key, attributeNameChain, true));
            binder.update(binderInfo.element, viewModel.get(attributeNameChain[0]), oldViewModel, viewModel, attributeNameChain[0], binderInfo, getMetaData(binderInfo.element, binder, binderInfo.key, attributeNameChain, true));
        }
    }

    //function detachBinder (binder, binderKey, notBinding, element, viewModel, attributeNameChain)
    function detachBinder (binder, viewModel, attributeNameChain, binderInfo)
    {
        if (attributeNameChain.length > 1) {
            var metaData = getMetaData(binderInfo.element, binder, binderInfo.key, attributeNameChain);
            if (metaData && metaData.listener) {
                viewModel.detachAfter(attributeNameChain[1] + "Change", metaData.listener);
                delete metaData.eventName;
                delete metaData.listener;
                delete metaData.model;
            }
            
            detachBinder(binder, viewModel.get(attributeNameChain[1]), attributeNameChain.slice(1), binderInfo);
        }
    }

    /*
     * Element Attribute Parsing Functions
     */
    var restoreCapturedTokensRegex = /\@ko_token_(\d+)\@/g;
    function restoreTokens (string, tokens)
    {
        var prevValue = null;
        while (string != prevValue) { // Keep restoring tokens until it no longer makes a difference (they may be nested)
            prevValue = string;
            string = string.replace(restoreCapturedTokensRegex, function (match, tokenIndex) {
                return tokens[tokenIndex];
            });
        }
        return string;
    }

    function parseBindingsObject (objectLiteralString)
    {
        // A full tokeniser+lexer would add too much weight to this library, so here's a simple parser
        // that is sufficient just to split an object literal string into a set of top-level key-value pairs

        var str = _.trim(objectLiteralString);
        if (str.length < 3)
            return [];
        if (str.charAt(0) === "{")// Ignore any braces surrounding the whole object literal
            str = str.substring(1, str.length - 1);

        // Pull out any string literals and regex literals
        var tokens = [];
        var tokenStart = null, tokenEndChar;
        for (var position = 0; position < str.length; position++) {
            var c = str.charAt(position);
            if (tokenStart === null) {
                switch (c) {
                    case '"':
                    case "'":
                    case "/":
                        tokenStart = position;
                        tokenEndChar = c;
                        break;
                }
            } else if ((c == tokenEndChar) && (str.charAt(position - 1) !== "\\")) {
                var token = str.substring(tokenStart, position + 1);
                tokens.push(token);
                var replacement = "@ko_token_" + (tokens.length - 1) + "@";
                str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                position -= (token.length - replacement.length);
                tokenStart = null;
            }
        }

        // Next pull out balanced paren, brace, and bracket blocks
        tokenStart = null;
        tokenEndChar = null;
        var tokenDepth = 0, tokenStartChar = null;
        for (var position = 0; position < str.length; position++) {
            var c = str.charAt(position);
            if (tokenStart === null) {
                switch (c) {
                    case "{": tokenStart = position; tokenStartChar = c;
                              tokenEndChar = "}";
                              break;
                    case "(": tokenStart = position; tokenStartChar = c;
                              tokenEndChar = ")";
                              break;
                    case "[": tokenStart = position; tokenStartChar = c;
                              tokenEndChar = "]";
                              break;
                }
            }

            if (c === tokenStartChar)
                tokenDepth++;
            else if (c === tokenEndChar) {
                tokenDepth--;
                if (tokenDepth === 0) {
                    var token = str.substring(tokenStart, position + 1);
                    tokens.push(token);
                    var replacement = "@ko_token_" + (tokens.length - 1) + "@";
                    str = str.substring(0, tokenStart) + replacement + str.substring(position + 1);
                    position -= (token.length - replacement.length);
                    tokenStart = null;
                }
            }
        }

        // Now we can safely split on commas to get the key/value pairs
        var result = [];
        var keyValuePairs = str.split(",");
        for (var i = 0, j = keyValuePairs.length; i < j; i++) {
            var pair = keyValuePairs[i];
            var colonPos = pair.indexOf(":");
            if ((colonPos > 0) && (colonPos < pair.length - 1)) {
                var key = pair.substring(0, colonPos);
                var value = pair.substring(colonPos + 1);
                result.push({ 'key': restoreTokens(key, tokens), 'value': restoreTokens(value, tokens) });
            } else {
                result.push({ 'unknown': restoreTokens(pair, tokens) });
            }
        }
        return result;
    }


    var javaScriptAssignmentTarget = /^[\_$a-z][\_$a-z0-9]*(\[.*?\])*(\.[\_$a-z][\_$a-z0-9]*(\[.*?\])*)*$/i;
    var javaScriptReservedWords = ["true", "false"];

    function isWriteableValue(expression) {
        if (_.indexOf(javaScriptReservedWords, ko.utils.stringTrim(expression).toLowerCase()) >= 0)
            return false;
        return expression.match(javaScriptAssignmentTarget) !== null;
    }

    function ensureQuoted(key) {
        var trimmedKey = _.trim(key);
        switch (trimmedKey.length && trimmedKey.charAt(0)) {
            case "'":
            case '"':
                return key;
            default:
                return "'" + trimmedKey + "'";
        }
    }

    function buildEvalWithinScopeFunction (expression, scopeLevels) {
        // Build the source for a function that evaluates "expression"
        // For each scope variable, add an extra level of "with" nesting
        // Example result: with(sc[1]) { with(sc[0]) { return (expression) } }
        var functionBody = "return (" + expression + ")";
        for (var i = 0; i < scopeLevels; i++) {
            functionBody = "with(sc[" + i + "]) { " + functionBody + " } ";
        }
        return new Function("sc", functionBody);
    }

    function insertPropertyAccessorsIntoJson (objectLiteralStringOrKeyValueArray) {
        var keyValueArray = typeof objectLiteralStringOrKeyValueArray === "string"
            ? parseBindingsObject(objectLiteralStringOrKeyValueArray)
            : objectLiteralStringOrKeyValueArray;
        var resultStrings = [], propertyAccessorResultStrings = [];

        var keyValueEntry;
        for (var i = 0; keyValueEntry = keyValueArray[i]; i++) {
            if (resultStrings.length > 0)
                resultStrings.push(",");

            if (keyValueEntry['key']) {
                var quotedKey = ensureQuoted(keyValueEntry['key']), val = keyValueEntry['value'];
                resultStrings.push(quotedKey);
                resultStrings.push(":");
                resultStrings.push(val);

                if (isWriteableValue(ko.utils.stringTrim(val))) {
                    if (propertyAccessorResultStrings.length > 0)
                        propertyAccessorResultStrings.push(", ");
                    propertyAccessorResultStrings.push(quotedKey + " : function(__ko_value) { " + val + " = __ko_value; }");
                }
            } else if (keyValueEntry['unknown']) {
                resultStrings.push(keyValueEntry['unknown']);
            }
        }

        var combinedResult = resultStrings.join("");
        if (propertyAccessorResultStrings.length > 0) {
            var allPropertyAccessors = propertyAccessorResultStrings.join("");
            combinedResult = combinedResult + ", '_ko_property_writers' : { " + allPropertyAccessors + " } ";
        }

        return combinedResult;
    }


    function getElementBindingsString (element)
    {
        if (element.nodeType === 1) {
            return element.getAttribute(dataBindAttributeName);
        }
    }

    function getElementBindings (element)
    {
        var bindingString = getElementBindingsString(element);

        /*if (bindingString) {
            var json = "{" + insertPropertyAccessorsIntoJson(bindingString) + "}";
            var func = buildEvalWithinScopeFunction(json, 0);
            var result = func();
            //console.log(json);
            console.log(result);
        }*/


        return bindingString ? parseBindingsObject(bindingString) : null;
    }

    function getBindingOperators (key)
    {
        var ops = {};

        for (var i = 0, length = bindingOperators.length; i < length; i += 1) {
            ops[bindingOperators[i]] = false;
        }

        key = _.trim(key);

        while (key && _.indexOf(bindingOperators, key.charAt(0)) !== -1) {
            ops[key.charAt(0)] = true;
            key = key.substring(1);
        }

        return {
            key: key,
            ops: ops
        };
    }

    /*
     * Element Binding Functions
     */
    function bindElement (element, viewModel)
    {
        var bindings = getElementBindings(element),
            childNodes = element.childNodes,
            bindChildren = true;

        _.each(bindings, function (binding) {
            var operators = getBindingOperators(binding.key),
                bindingInfo, binder;

            //binding.key = operators.key;
            bindingInfo = operators.ops;
            bindingInfo.key = operators.key;
            bindingInfo.element = element;
            //binding.key = _.trim(binding.key);

            /*if (_.startsWith(binding.key, "!")) {
                not = true;
                binding.key = binding.key.substring(1);
            }*/

            if (_.startsWith(bindingInfo.key, ".")) {
                binder = databindings["class"];
                bindingInfo.key = bindingInfo.key.substring(1);
            }
            else {
                binder = databindings[bindingInfo.key];
            }

            if (!_.isObject(binder)) {
                binder = databindings["attr"];
            }

            if (_.isBoolean(binder.bindChildren)) {
                bindChildren &= binder.bindChildren;
            }

            //attachBinder(binder, binding.key, not, element, viewModel, [null].concat(_.trim(binding.value).split(".")));
            /*attachBinder(binder, viewModel, [null].concat(_.trim(binding.value).split(".")), {
                key: binding.key,
                not: not,
                element: element
            });*/
            attachBinder(binder, viewModel, [null].concat(_.trim(binding.value).split(".")), bindingInfo);
        });

        // Bind children
        if (bindChildren) {
            for (var i = 0, length = childNodes.length; i < length; i += 1) {
                bindElement(childNodes[i], viewModel);
            }
        }
    }

    function unbindElement (element)
    {
        var childNodes = element.childNodes;
        
        removeMetaData(element);

        // Unbind children
        for (var i = 0, length = childNodes.length; i < length; i += 1) {
            unbindElement(childNodes[i]);
        }
    }
    
    databind = {
        // TODO: this is good for debugging but should it be exposed?
        metaData: elementMetaDataStore,
        getMetaData: getElementMetaData,

        /**
         * Override or append to in order to add new operators to bindings. Defaults to ["!", "-"]
         */
        bindingOperators: bindingOperators,

        applyBindings: function (viewModel, element)
        {
            bindElement(element || document.body, viewModel);
        },

        removeBindings: function (element)
        {
            unbindElement(element || document.body);
        }
    };

    databindings.databind = databind;

    return databind;
});