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
            update: function (element, value, name, not)
            {
                // If a 'not' operation then it can be assumed this is an attribute that either exists or does not exist on an element (disabled, required, etc)
                if (not) {
                    if (value) {
                        element.removeAttribute(name);
                    }
                    else {
                        element.setAttribute(name, "");
                    }
                }
                else {
                    if (value === false || value === null || _.isUndefined(value)) {
                        element.removeAttribute(name);
                    }
                    else {
                        element.setAttribute(name, value.toString());
                    }
                }
            }
        },

        "class": {
            update: function (element, value, name, not)
            {
                $(element).toggleClass(name, not ? !value : !!value);
            }
        },

        checked: {
            update: function (element, value, name, not)
            {
                if (element.type === "checkbox") {
                    element.checked = not ? !value : !!value;
                }
                else if (element.type === "radio") {
                    element.checked = (not ? value !== element.value : value === element.value);
                }
            }
        },

        value: {
            update: function (element, value)
            {
                $(element).val(value);
            }
        },

        foreach: {
            bindChildren: false,

            start: function (element, value, name, not, oldValue, metaData)
            {
                metaData.template = $(element).html();
                $(element).empty();
            },

            stop: function (element, value, name, not, oldValue, metaData)
            {
                delete metaData.template;
            },

            update: function (element, value, name, not, oldValue, metaData)
            {
                var listener;

                if (oldValue) {
                    oldValue.detachAfter("add", metaData.addListener);
                    oldValue.detachAfter("remove", metaData.removeListener);
                    oldValue.detachAfter("reset", metaData.resetListener);
                    oldValue.detachAfter("sort", metaData.sortListener);
                }

                if (value) {
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