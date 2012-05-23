define("databindings", ["util", "dom"], function (_, $) {
    "use strict";

    var foreachExpando = "__cid__";

    function renderItem (element, model, template, at)
    {
        var itemElements = $("<div></div>").html(template).children(),
            cid = model.get("cid");

        if (_.isNumber(at)) {
            if (at === 0) {
                itemElements.prependTo(element);
            }
            else {
                $('> tr', element).eq(at - 1).after(itemElements);
            }
        }
        else {
            itemElements.appendTo(element);
        }

        itemElements.each(function () {
            this[foreachExpando] = cid;
            databindings.databind.applyBindings(model, this);
        });
    }

    function resetItems (element, col, metaData)
    {
        var template = metaData.template;

        // Remove the bindings from the existing foreach items
        $(element).children().each(function () {
            databindings.databind.removeBindings(this);
        });

        $(element).empty();

        col.each(function (model) {
            renderItem(element, model, template);
        }, this);
    }

    /**
     * Handler for when models are added to the foreach's collection.
     * @private
     * @param {Object} e The event object.
     */
    function afterModelsAdded (element, metaData, e)
    {
        var template = metaData.template,
            at = e.info.options.at;

        _.each(e.info.items, function (model, index) {
            renderItem(element, model, template, at);
        }, this);
    }

    /**
     * Handler for when models are removed from the foreach's collection.
     * @private
     * @param {Object} e The event object.
     */
    function afterModelsRemoved (element, metaData, e)
    {
        var itemElements = $(element).children();

        // If there is a list view then remove each model from it
        _.each(e.info.items, function (model) {
            var cid = model.get("cid");

            // Remove the item from the dom
            itemElements.each(function () {
                if (this[foreachExpando] === cid) {
                    databindings.databind.removeBindings(this);
                    $(this).remove();
                    return false;
                }
            });
        }, this);
    }

    /**
     * Handler for when the foreach's collection is reset.
     * @private
     */
    function afterReset (element, metaData, e)
    {
        resetItems(element, e.src, metaData);
    }

    /**
     * Handler for when the foreach's collection is sorted.
     * @private
     */
    function afterSort (element, metaData, e)
    {
        resetItems(element, e.src, metaData);
    }

    function afterValueChanged (element, metaData)
    {
        var el = $(element);

        // TODO: might not want to do this (same thing for afterCheckedChanged)
        // Setting the value on the view model might be rejected if the value did not validate. If that happens then update the element's value to stay in sync with the view model.
        if (!metaData.viewModel.set(metaData.attributeName, el.val())) {
            el.val(metaData.viewModel.get(metaData.attributeName));
        }
    }

    function afterCheckedChanged (element, info, metaData)
    {
        var el, value;

        if (element.type === "checkbox") {
            if (!metaData.viewModel.set(metaData.attributeName, info["!"] ? !element.checked : element.checked)) {
                value = metaData.viewModel.get(metaData.attributeName);
                element.checked = info["!"] ? !value : !!value;
            }
        }
        else if (element.type === "radio") {
            el = $(element);
            if (!metaData.viewModel.set(metaData.attributeName, el.val())) {
                element.checked = (metaData.viewModel.get(metaData.attributeName) === el.val());
            }
        }
    }
    
    var databindings = {
        text: {
            update: function (element, value)
            {
                $(element).text(value);
            }
        },

        html: {
            update: function (element, value)
            {
                $(element).html(value);
            }
        },

        attr: {
            update: function (element, value, oldValue, viewModel, attributeName, info, metaData)
            {
                // If a '!' operation then it can be assumed this is an attribute that either exists or does not exist on an element (disabled, required, etc)
                if (info["!"]) {
                    if (value) {
                        element.removeAttribute(info.key);
                    }
                    else {
                        element.setAttribute(info.key, "");
                    }
                }
                else {
                    if (value === false || value === null || _.isUndefined(value)) {
                        element.removeAttribute(info.key);
                    }
                    else {
                        element.setAttribute(info.key, value.toString());
                    }
                }
            }
        },

        "class": {
            update: function (element, value, oldValue, viewModel, attributeName, info, metaData)
            {
                $(element).toggleClass(info.key, info["!"] ? !value : !!value);
            }
        },

        checked: {
            start: function (element, value, info, metaData)
            {
                // If this is two-way binding
                if (!info["-"]) {
                    var listener = _.bind(afterCheckedChanged, null, element, info, metaData);
                    metaData.checkedListener = listener;
                    $(element).change(listener);
                }
            },

            stop: function (element, metaData)
            {
                if (_.isFunction(metaData.checkedListener)) {
                    $(element).unbind("change", metaData.checkedListener);
                }

                delete metaData.checkedListener;
                delete metaData.viewModel;
                delete metaData.attributeName;
            },

            update: function (element, value, oldValue, viewModel, attributeName, info, metaData)
            {
                // If this is two-way binding
                if (!info["-"]) {
                    metaData.viewModel = viewModel;
                    metaData.attributeName = attributeName;
                }

                if (element.type === "checkbox") {
                    element.checked = info["!"] ? !value : !!value;
                }
                else if (element.type === "radio") {
                    element.checked = (value === $(element).val());
                }
            }
        },

        value: {
            start: function (element, value, info, metaData)
            {
                // If this is two-way binding
                if (!info["-"]) {
                    var listener = _.bind(afterValueChanged, null, element, metaData);
                    metaData.changeListener = listener;
                    $(element).change(listener);
                }
            },

            stop: function (element, metaData)
            {
                if (_.isFunction(metaData.changeListener)) {
                    $(element).unbind("change", metaData.changeListener);
                }

                delete metaData.changeListener;
                delete metaData.viewModel;
                delete metaData.attributeName;
            },

            update: function (element, value, oldValue, viewModel, attributeName, info, metaData)
            {
                // If this is two-way binding
                if (!info["-"]) {
                    metaData.viewModel = viewModel;
                    metaData.attributeName = attributeName;
                }

                $(element).val(value);
            }
        },

        foreach: {
            bindChildren: false,

            start: function (element, value, info, metaData)
            {
                metaData.template = $(element).html();
                $(element).empty();
            },

            stop: function (element, metaData)
            {
                var viewModel = metaData ? metaData.viewModel : null;

                if (viewModel) {
                    viewModel.detachAfter("add", metaData.addListener);
                    viewModel.detachAfter("remove", metaData.removeListener);
                    viewModel.detachAfter("reset", metaData.resetListener);
                    viewModel.detachAfter("sort", metaData.sortListener);
                }

                delete metaData.viewModel;
                delete metaData.template;
                delete metaData.addListener;
                delete metaData.removeListener;
                delete metaData.resetListener;
                delete metaData.sortListener;
            },

            update: function (element, value, oldValue, viewModel, attributeName, info, metaData)
            {
                var listener;

                // TODO: test to make sure oldValue is the collection and not something else
                if (oldValue) {
                    oldValue.detachAfter("add", metaData.addListener);
                    oldValue.detachAfter("remove", metaData.removeListener);
                    oldValue.detachAfter("reset", metaData.resetListener);
                    oldValue.detachAfter("sort", metaData.sortListener);
                }

                if (value) {
                    metaData.viewModel = value;

                    listener = _.bind(afterModelsAdded, null, element, metaData);
                    metaData.addListener = listener;
                    value.after("add", listener);

                    listener = _.bind(afterModelsRemoved, null, element, metaData);
                    metaData.removeListener = listener;
                    value.after("remove", listener);

                    listener = _.bind(afterReset, null, element, metaData);
                    metaData.resetListener = listener;
                    value.after("reset", listener);

                    listener = _.bind(afterSort, null, element, metaData);
                    metaData.sortListener = listener;
                    value.after("sort", listener);
                }

                resetItems(element, value, metaData);
            }
        }
    };

    return databindings;
});