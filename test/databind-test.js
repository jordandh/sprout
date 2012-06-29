TestCase("databind", ["sprout/util", "sprout/dom", "sprout/databind", "sprout/model", "sprout/collection", "sprout/viewmodel"], function (_, $, databind, model, collection, viewmodel) {
    var Author = model.extend({
        attributes: {
            fullName: {
                get: function () {
                    return this.get("firstName") + " " + this.get("lastName");
                },
                uses: ["firstName", "lastName"]
            }
        }
    });

    var Authors = collection.extend({
        model: Author
    });

    var AuthorsViewModel = viewmodel.extend({
    })

    return {
        setUp: function () {
            this.node = $("<div></div>").appendTo(document.body);
            this.element = this.node.get(0);

            this.author = Author.create({
                firstName: "William",
                lastName: "Riker",
                title: "<b>Number One</b>",
                url: "/Riker",
                away: true,
                popular: true,
                rank: "Commander"
            });

            this.authors = Authors.create([{
                    firstName: "William",
                    lastName: "Riker",
                    title: "<b>Number One</b>",
                    url: "/Riker",
                    away: true,
                    popular: true
                }, {
                    firstName: "Deanna",
                    lastName: "Troi",
                    title: "<b>Counselor</b>",
                    url: "/Troi",
                    away: true,
                    popular: true
                }, {
                    firstName: "Beverly",
                    lastName: "Crusher",
                    title: "<b>Doctor</b>",
                    url: "/Crusher",
                    away: true,
                    popular: true
                }
            ]);

            this.authorsViewModel = AuthorsViewModel.create();
            this.authorsViewModel.set("authors", this.authors);
        },

        tearDown: function () {
            this.node.remove();
            this.node = null;
            this.element = null;
            this.author.destroy();
            this.author = null;
            this.authors.destroy();
            this.authors = null;
            this.authorsViewModel.destroy();
            this.authorsViewModel = null;
        },

        "test databind.applyBindings": function () {
            var template = "<span data-bind='text: firstName'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            var metaData = databind.getMetaData($("span", this.element).get(0));
            assertObject("element metaData does not exist", metaData);

            var binderMetaData = metaData["text:firstName"];
            assertObject("2nd binder metaData does not exist", binderMetaData);

            binderMetaData = metaData["text:.firstName"];
            assertObject("1st binder metaData does not exist", binderMetaData);

            assertFunction("1st binder metaData does not have a listener", binderMetaData.listener);

            var listeners = this.author.events.firstnamechange.after;
            var foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }

            assert("meta data function is not a listener on the view model", foundListener);
        },

        "test databind.removeBindings": function () {
            var template = "<span data-bind='text: firstName'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            var metaData = databind.getMetaData($("span", this.element).get(0));
            assertObject("element metaData does not exist", metaData);

            var binderMetaData = metaData["text:firstName"];
            assertObject("2nd binder metaData does not exist", binderMetaData);

            binderMetaData = metaData["text:.firstName"];
            assertObject("1st binder metaData does not exist", binderMetaData);

            assertFunction("1st binder metaData does not have a listener", binderMetaData.listener);

            var listeners = this.author.events.firstnamechange.after;
            var foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }

            assert("meta data function is not a listener on the view model", foundListener);

            databind.removeBindings(this.element);

            metaData = databind.getMetaData($("span", this.element).get(0));
            assertUndefined("element metaData exists after bindings were removed", metaData);

            listeners = this.author.events.firstnamechange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }

            assertFalse("meta data listener function was not removed from the view model", foundListener);
        },

        "test databind.databindings are removed if element is removed from dom": function () {
            var template = "<span data-bind='text: firstName'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            var boundElement = $("span", this.element).get(0);

            var metaDataKey = boundElement.__databind__;
            assertString("element data key is not on element", metaDataKey);
            assertObject("element medtaData key does not map to its metaData in the metaData store", databind.metaData[metaDataKey]);

            var metaData = databind.getMetaData($("span", this.element).get(0));
            assertObject("element metaData does not exist", metaData);

            var binderMetaData = metaData["text:firstName"];
            assertObject("2nd binder metaData does not exist", binderMetaData);

            binderMetaData = metaData["text:.firstName"];
            assertObject("1st binder metaData does not exist", binderMetaData);

            var binderListener = binderMetaData.listener;
            assertFunction("1st binder metaData does not have a listener", binderListener);

            var listeners = this.author.events.firstnamechange.after;
            var foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderListener) {
                    foundListener = true;
                    break;
                }
            }

            assert("meta data function is not a listener on the view model", foundListener);

            this.node.remove();

            assertFalse("bound element is still in the dom", $.contains(document.body, boundElement));
            assertString("element data key is still on element after dom removal but before binding removal", boundElement.__databind__);
            assertSame("element data key does not match data key before dom removal", metaDataKey, boundElement.__databind__);

            this.author.set("firstName", "Will");

            assertNull("element data key was not removed from element after removal", boundElement.__databind__);
            assertUndefined("element medtaData key was not removed from element metaData store", databind.metaData[metaDataKey]);

            listeners = this.author.events.firstnamechange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderListener) {
                    foundListener = true;
                    break;
                }
            }

            assertFalse("meta data listener function was not removed from the view model", foundListener);
        },

        "test databind.databindings are removed for chain if element is removed from dom": function () {
            var template = "<span data-bind='text: friend.firstName, title: firstName'></span>";

            this.node.html(template);

            var friend = Author.create({
                firstName: "Jean Luc",
                lastName: "Picard",
                title: "<b>Captain</b>",
                url: "/Picard",
                away: true,
                popular: true
            });

            this.author.set("friend", friend);

            databind.applyBindings(this.author, this.element);

            var boundElement = $("span", this.element).get(0);

            var metaDataKey = boundElement.__databind__;
            assertString("element data key is not on element", metaDataKey);
            assertObject("element medtaData key does not map to its metaData in the metaData store", databind.metaData[metaDataKey]);

            var metaData = databind.getMetaData($("span", this.element).get(0));
            assertObject("element metaData does not exist", metaData);

            var binderMetaData3 = metaData["text:firstName"];
            assertObject("3rd binder metaData does not exist", binderMetaData3);

            var binderMetaData2 = metaData["text:friend.firstName"];
            assertObject("2nd binder metaData does not exist", binderMetaData2);

            var binderMetaData1 = metaData["text:.friend.firstName"];
            assertObject("1st binder metaData does not exist", binderMetaData1);

            var titleBinderMetaData2 = metaData["title:firstName"];
            assertObject("2nd title binder metaData does not exist", binderMetaData2);

            var titleBinderMetaData1 = metaData["title:.firstName"];
            assertObject("1st title binder metaData does not exist", binderMetaData1);

            var binderListener2 = binderMetaData2.listener;
            assertFunction("2nd binder metaData does not have a listener", binderListener2);

            var binderListener1 = binderMetaData1.listener;
            assertFunction("1st binder metaData does not have a listener", binderListener1);

            var titleBinderListener1 = titleBinderMetaData1.listener;
            assertFunction("1st title binder metaData does not have a listener", titleBinderListener1);

            var listeners = this.author.events.friendchange.after;
            var foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderListener1) {
                    foundListener = true;
                    break;
                }
            }
            assert("meta data listener1 is not attached to the view model", foundListener);

            listeners = friend.events.firstnamechange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderListener2) {
                    foundListener = true;
                    break;
                }
            }
            assert("meta data listener2 is not attached to the friend view model", foundListener);

            listeners = this.author.events.firstnamechange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === titleBinderListener1) {
                    foundListener = true;
                    break;
                }
            }
            assert("meta data title listener is not attached to the view model", foundListener);

            this.node.remove();

            assertFalse("bound element is still in the dom", $.contains(document.body, boundElement));
            assertString("element data key is still on element after dom removal but before binding removal", boundElement.__databind__);
            assertSame("element data key does not match data key before dom removal", metaDataKey, boundElement.__databind__);

            //this.author.set("friend", null);
            this.author.set("firstName", "Will");

            assertNull("element data key was not removed from element after removal", boundElement.__databind__);
            assertUndefined("element medtaData key was not removed from element metaData store", databind.metaData[metaDataKey]);

            listeners = this.author.events.friendchange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderListener1) {
                    foundListener = true;
                    break;
                }
            }
            assertFalse("meta data listener1 was not removed from the view model", foundListener);

            listeners = friend.events.firstnamechange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderListener2) {
                    foundListener = true;
                    break;
                }
            }
            assertFalse("meta data listener2 was not removed from the friend view model", foundListener);

            listeners = this.author.events.firstnamechange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === titleBinderListener1) {
                    foundListener = true;
                    break;
                }
            }
            assertFalse("meta data title listener was not removed from the view model", foundListener);
        },

        "test databindings.text": function () {
            var template = "<span data-bind='text: firstName'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound text value is incorrect", this.author.get("firstName"), $("span", this.element).text());

            this.author.set("firstName", "Will");

            assertSame("data bound text value is incorrect after change", "Will", $("span", this.element).text());
        },

        "test databindings.html": function () {
            var template = "<span data-bind='html: title'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound html value is incorrect", this.author.get("title").toLowerCase(), $("span", this.element).html().toLowerCase());

            this.author.set("title", "<i>Number One</i>");

            assertSame("data bound html value is incorrect after change", "<i>Number One</i>".toLowerCase(), $("span", this.element).html().toLowerCase());
        },

        "test databindings.attr": function () {
            var template = "<a data-bind='href: url'></a>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound attr value is incorrect", this.author.get("url"), $("a", this.element).attr("href"));

            this.author.set("url", "/William");

            assertSame("data bound attr value is incorrect after change", "/William", $("a", this.element).attr("href"));
        },

        "test databindings.attr remove with boolean": function () {
            var template = "<input data-bind='disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", false);

            assertFalse("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.attr remove with null": function () {
            var template = "<input data-bind='disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", null);

            assertFalse("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.attr remove with undefined": function () {
            var template = "<input data-bind='disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", void(0));

            assertFalse("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.!attr remove with boolean": function () {
            var template = "<input data-bind='!disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", false);

            assert("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.!attr remove with null": function () {
            var template = "<input data-bind='!disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", null);

            assert("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.!attr remove with undefined": function () {
            var template = "<input data-bind='!disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", void(0));

            assert("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.!attr remove with zero": function () {
            var template = "<input data-bind='!disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", 0);

            assert("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.!attr remove with empty string": function () {
            var template = "<input data-bind='!disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", "");

            assert("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.!attr remove with NaN": function () {
            var template = "<input data-bind='!disabled: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound attr value is incorrect", $("input", this.element).get(0).hasAttribute("disabled"));

            this.author.set("away", NaN);

            assert("data bound attr value is incorrect after change", $("input", this.element).get(0).hasAttribute("disabled"));
        },

        "test databindings.className": function () {
            var template = "<span data-bind='.hidden: away'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound class value is incorrect", $("span", this.element).hasClass("hidden"));

            this.author.set("away", false);

            assertFalse("data bound class value is incorrect after change", $("span", this.element).hasClass("hidden"));
        },

        "test databindings.className with multiple binds": function () {
            var template = "<span data-bind='.hidden: away, .popular: popular'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound class.hidden value is incorrect", $("span", this.element).hasClass("hidden"));
            assert("data bound class.popular value is incorrect", $("span", this.element).hasClass("popular"));

            this.author.set("away", false);

            assertFalse("data bound class.hidden value is incorrect after change", $("span", this.element).hasClass("hidden"));
            assert("data bound class.popular value is incorrect", $("span", this.element).hasClass("popular"));

            this.author.set("popular", false);

            assertFalse("data bound class.hidden value is incorrect after change", $("span", this.element).hasClass("hidden"));
            assertFalse("data bound class.popular value is incorrect after change", $("span", this.element).hasClass("popular"));
        },

        "test databindings.!className": function () {
            var template = "<span data-bind='!.visible: away'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound class value is incorrect", $("span", this.element).hasClass("visible"));

            this.author.set("away", false);

            assert("data bound class value is incorrect after change", $("span", this.element).hasClass("visible"));
        },

        "test databindings.class": function () {
            var template = "<span data-bind='class: rank'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound class value is incorrect", $("span", this.element).hasClass("Commander"));

            this.author.set("rank", "Captain");

            assertFalse("data bound class value has old class name", $("span", this.element).hasClass("Commander"));
            assert("data bound class value does not have new class name", $("span", this.element).hasClass("Captain"));
        },

        "test databindings.checked on checkbox with boolean": function () {
            var template = "<input type='checkbox' data-bind='checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", false);

            assertFalse("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.checked on checkbox with null": function () {
            var template = "<input type='checkbox' data-bind='checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", null);

            assertFalse("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.checked on checkbox with undefined": function () {
            var template = "<input type='checkbox' data-bind='checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", void(0));

            assertFalse("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.checked on checkbox with zero": function () {
            var template = "<input type='checkbox' data-bind='checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", 0);

            assertFalse("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.checked on checkbox with empty string": function () {
            var template = "<input type='checkbox' data-bind='checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", "");

            assertFalse("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.checked on checkbox with NaN": function () {
            var template = "<input type='checkbox' data-bind='checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", NaN);

            assertFalse("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.!checked on checkbox with boolean": function () {
            var template = "<input type='checkbox' data-bind='!checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", false);

            assert("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.!checked on checkbox with null": function () {
            var template = "<input type='checkbox' data-bind='!checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", null);

            assert("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.!checked on checkbox with undefined": function () {
            var template = "<input type='checkbox' data-bind='!checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", void(0));

            assert("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.!checked on checkbox with zero": function () {
            var template = "<input type='checkbox' data-bind='!checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", 0);

            assert("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.!checked on checkbox with empty string": function () {
            var template = "<input type='checkbox' data-bind='!checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", "");

            assert("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.!checked on checkbox with NaN": function () {
            var template = "<input type='checkbox' data-bind='!checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertFalse("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            this.author.set("away", NaN);

            assert("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
        },

        "test databindings.checked on checkbox for two way binding": function () {
            var template = "<input type='checkbox' data-bind='checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value is incorrect", $("input", this.element).prop("checked"));

            $("input", this.element).prop("checked", false);
            $("input", this.element).eq(0).change();

            assertFalse("data bound checked value is incorrect after change", $("input", this.element).prop("checked"));
            assertFalse("data bound checked value did not bind back to model", this.author.get("away"));
        },

        "test databindings.checked on radio button": function () {
            var template = "<form><input type='radio' name='radio-test' value='William' data-bind='checked: firstName'><input type='radio' name='radio-test' value='Will' data-bind='checked: firstName'></input></form>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value on 1st radio button is incorrect", $("input", this.element).eq(0).prop("checked"));
            assertFalse("data bound checked value on 2nd radio button is incorrect", $("input", this.element).eq(1).prop("checked"));

            this.author.set("firstName", "Will");

            assertFalse("data bound checked value on 1st radio button is incorrect after change", $("input", this.element).eq(0).prop("checked"));
            assert("data bound checked value on 2nd radio button is incorrect after change", $("input", this.element).eq(1).prop("checked"));
        },

        "test databindings.checked on radio button for two way binding": function () {
            var template = "<form><input type='radio' name='radio-test' value='William' data-bind='checked: firstName'><input type='radio' name='radio-test' value='Will' data-bind='checked: firstName'></input></form>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value on 1st radio button is incorrect", $("input", this.element).eq(0).prop("checked"));
            assertFalse("data bound checked value on 2nd radio button is incorrect", $("input", this.element).eq(1).prop("checked"));

            $("input", this.element).eq(1).prop("checked", true);
            $("input", this.element).eq(1).change();

            assertFalse("data bound checked value on 1st radio button is incorrect after change", $("input", this.element).eq(0).prop("checked"));
            assert("data bound checked value on 2nd radio button is incorrect after change", $("input", this.element).eq(1).prop("checked"));
            assertSame("data bound checked value did not bind back to model", "Will", this.author.get("firstName"));
        },

        "test databindings.-checked on radio button for one way binding": function () {
            var template = "<form><input type='radio' name='radio-test' value='William' data-bind='-checked: firstName'><input type='radio' name='radio-test' value='Will' data-bind='-checked: firstName'></input></form>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assert("data bound checked value on 1st radio button is incorrect", $("input", this.element).eq(0).prop("checked"));
            assertFalse("data bound checked value on 2nd radio button is incorrect", $("input", this.element).eq(1).prop("checked"));

            $("input", this.element).eq(1).prop("checked", true);
            $("input", this.element).eq(1).change();

            assertFalse("data bound checked value on 1st radio button is incorrect after change", $("input", this.element).eq(0).prop("checked"));
            assert("data bound checked value on 2nd radio button is incorrect after change", $("input", this.element).eq(1).prop("checked"));
            assertSame("data bound checked value did not bind back to model", "William", this.author.get("firstName"));
        },

        "test databind.checked removeBindings": function () {
            var template = "<input type='checkbox' data-bind='checked: away'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            var metaData = databind.getMetaData($("input", this.element).get(0));
            assertObject("element metaData does not exist", metaData);

            var binderMetaData2 = metaData["checked:away"];
            assertObject("2nd binder metaData does not exist", binderMetaData2);

            var binderMetaData = metaData["checked:.away"];
            assertObject("1st binder metaData does not exist", binderMetaData);

            assertFunction("1st binder metaData does not have a listener", binderMetaData.listener);
            assertFunction("2nd binder metaData does not have an element checked listener", binderMetaData2.checkedListener);
            assertObject("2nd binder metaData does not have a viewModel", binderMetaData2.viewModel);
            assertString("2nd binder metaData does not have an attributeName", binderMetaData2.attributeName);

            var listeners = this.author.events.awaychange.after;
            var foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }

            assert("meta data function is not a listener on the view model", foundListener);
            assertSame("meta data checked listener is not attached to the element", 1, $("input", this.element).data("events").change.length);

            databind.removeBindings(this.element);

            metaData = databind.getMetaData($("input", this.element).get(0));
            assertUndefined("element metaData exists after bindings were removed", metaData);

            listeners = this.author.events.awaychange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }

            assertFalse("meta data listener function was not removed from the view model", foundListener);
            assertUndefined("meta data checked listener was not detached from the element", $("input", this.element).data("events"));
        },

        "test databindings.value on text box": function () {
            var template = "<input type='text' data-bind='value: firstName'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound input.value value is incorrect", this.author.get("firstName"), $("input", this.element).val());

            this.author.set("firstName", "Will");

            assertSame("data bound input.value value is incorrect after change", "Will", $("input", this.element).val());
        },

        "test databindings.value on text box for two way binding": function () {
            var template = "<input type='text' data-bind='value: firstName'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound input.value value is incorrect", this.author.get("firstName"), $("input", this.element).val());

            $("input", this.element).val("Will");
            $("input", this.element).change();

            assertSame("data bound input.value value is incorrect after change", "Will", $("input", this.element).val());
            assertSame("data bound checked value did not bind back to model", "Will", this.author.get("firstName"));
        },

        "test databindings.-value on text box for one way binding": function () {
            var template = "<input type='text' data-bind='-value: firstName'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound input.value value is incorrect", this.author.get("firstName"), $("input", this.element).val());
            
            $("input", this.element).val("Will");
            $("input", this.element).change();

            assertSame("data bound input.value value is incorrect after change", "Will", $("input", this.element).val());
            assertSame("data bound checked value did not bind back to model", "William", this.author.get("firstName"));
        },

        "test databind.value removeBindings": function () {
            var template = "<input type='text' data-bind='value: firstName'></input>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            var metaData = databind.getMetaData($("input", this.element).get(0));
            assertObject("element metaData does not exist", metaData);

            var binderMetaData2 = metaData["value:firstName"];
            assertObject("2nd binder metaData does not exist", binderMetaData2);

            var binderMetaData = metaData["value:.firstName"];
            assertObject("1st binder metaData does not exist", binderMetaData);

            assertFunction("1st binder metaData does not have a listener", binderMetaData.listener);
            assertFunction("2nd binder metaData does not have an element checked listener", binderMetaData2.changeListener);
            assertObject("2nd binder metaData does not have a viewModel", binderMetaData2.viewModel);
            assertString("2nd binder metaData does not have an attributeName", binderMetaData2.attributeName);

            var listeners = this.author.events.firstnamechange.after;
            var foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }

            assert("meta data function is not a listener on the view model", foundListener);
            assertSame("meta data change listener is not attached to the element", 1, $("input", this.element).data("events").change.length);

            databind.removeBindings(this.element);

            metaData = databind.getMetaData($("input", this.element).get(0));
            assertUndefined("element metaData exists after bindings were removed", metaData);

            listeners = this.author.events.firstnamechange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }

            assertFalse("meta data listener function was not removed from the view model", foundListener);
            assertUndefined("meta data changed listener was not detached from the element", $("input", this.element).data("events"));
        },

        "test databindings.text computed": function () {
            var template = "<span data-bind='text: fullName'></span>";

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound text value is incorrect", this.author.get("fullName"), $("span", this.element).text());

            this.author.set("firstName", "Will");

            assertSame("data bound text value is incorrect after change", "Will Riker", $("span", this.element).text());
        },

        "test databindings.text with model chain changing value": function () {
            var template = "Author: <span data-bind='text: fullName'></span><br>Friend: <span data-bind='text: friend.fullName'></span>";

            var friend = Author.create({
                firstName: "Jean Luc",
                lastName: "Picard",
                title: "<b>Captain</b>",
                url: "/Picard",
                away: true,
                popular: true
            });

            this.author.set("friend", friend);

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound text value is incorrect", this.author.get("fullName"), $("span", this.element).eq(0).text());
            assertSame("data bound text value is incorrect", "Jean Luc Picard", $("span", this.element).eq(1).text());

            friend.set("firstName", "Gene Luck");

            assertSame("data bound text value is incorrect", this.author.get("fullName"), $("span", this.element).eq(0).text());
            assertSame("data bound text value is incorrect", "Gene Luck Picard", $("span", this.element).eq(1).text());
        },

        "test databindings.text with model chain changing chain": function () {
            var template = "Author: <span data-bind='text: fullName'></span><br>Friend: <span data-bind='text: friend.fullName'></span>";

            var friend = Author.create({
                firstName: "Jean Luc",
                lastName: "Picard",
                title: "<b>Captain</b>",
                url: "/Picard",
                away: true,
                popular: true
            });

            this.author.set("friend", friend);

            this.node.html(template);

            databind.applyBindings(this.author, this.element);

            assertSame("data bound text value is incorrect", this.author.get("fullName"), $("span", this.element).eq(0).text());
            assertSame("data bound text value is incorrect", "Jean Luc Picard", $("span", this.element).eq(1).text());

            friend = Author.create({
                firstName: "Geordi",
                lastName: "La Forge",
                title: "<b>Chief Engineer</b>",
                url: "/LaForge",
                away: true,
                popular: true
            });

            this.author.set("friend", friend);

            assertSame("data bound text value is incorrect", this.author.get("fullName"), $("span", this.element).eq(0).text());
            assertSame("data bound text value is incorrect", "Geordi La Forge", $("span", this.element).eq(1).text());

            friend.set("firstName", "Jordy");

            assertSame("data bound text value is incorrect", this.author.get("fullName"), $("span", this.element).eq(0).text());
            assertSame("data bound text value is incorrect", "Jordy La Forge", $("span", this.element).eq(1).text());
        },

        "test databindings.foreach": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());
        },

        "test databindings.foreach with multiple top level elements": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: firstName'></td></tr><tr><td data-bind='text: lastName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 6, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Riker", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Deanna", cells.eq(2).text());
            assertSame("cell 3 value is incorrect", "Troi", cells.eq(3).text());
            assertSame("cell 4 value is incorrect", "Beverly", cells.eq(4).text());
            assertSame("cell 5 value is incorrect", "Crusher", cells.eq(5).text());
        },

        "test databindings.foreach item added": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authors.add({
                firstName: "Jean Luc",
                lastName: "Picard",
                title: "<b>Captain</b>",
                url: "/Picard",
                away: true,
                popular: true
            });

            assertSame("data bound foreach item count is incorrect after add", 4, table.prop("rows").length);

            cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());
            assertSame("cell 3 value is incorrect", "Jean Luc Picard", cells.eq(3).text());
        },

        "test databindings.foreach item inserted": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authors.add({
                firstName: "Jean Luc",
                lastName: "Picard",
                title: "<b>Captain</b>",
                url: "/Picard",
                away: true,
                popular: true
            }, { at: 1 });

            assertSame("data bound foreach item count is incorrect after add", 4, table.prop("rows").length);

            cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Jean Luc Picard", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Deanna Troi", cells.eq(2).text());
            assertSame("cell 3 value is incorrect", "Beverly Crusher", cells.eq(3).text());
        },

        "test databindings.foreach item inserted at front": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authors.add({
                firstName: "Jean Luc",
                lastName: "Picard",
                title: "<b>Captain</b>",
                url: "/Picard",
                away: true,
                popular: true
            }, { at: 0 });

            assertSame("data bound foreach item count is incorrect after add", 4, table.prop("rows").length);

            cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "Jean Luc Picard", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "William Riker", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Deanna Troi", cells.eq(2).text());
            assertSame("cell 3 value is incorrect", "Beverly Crusher", cells.eq(3).text());
        },

        "test databindings.foreach item removed": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authors.remove(this.authors.at(1));

            assertSame("data bound foreach item count is incorrect", 2, table.prop("rows").length);

            cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Beverly Crusher", cells.eq(1).text());
        },

        "test databindings.foreach item removed from front": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authors.remove(this.authors.at(0));

            assertSame("data bound foreach item count is incorrect", 2, table.prop("rows").length);

            cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "Deanna Troi", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Beverly Crusher", cells.eq(1).text());
        },

        "test databindings.foreach collection reset with no items": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authors.reset();

            assertSame("data bound foreach item count is incorrect", 0, table.prop("rows").length);
        },

        "test databindings.foreach collection reset with new items": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authors.reset([{
                firstName: "Jean Luc",
                lastName: "Picard",
                title: "<b>Captain</b>",
                url: "/Picard",
                away: true,
                popular: true
            }, {
                firstName: "Geordi",
                lastName: "La Forge",
                title: "<b>Chief Engineer</b>",
                url: "/LaForge",
                away: true,
                popular: true
            }]);

            assertSame("data bound foreach item count is incorrect", 2, table.prop("rows").length);

            cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "Jean Luc Picard", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Geordi La Forge", cells.eq(1).text());
        },

        "test databindings.foreach collection sorted": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authors.sortBy(function (mod) {
                return mod.get("lastName");
            });

            cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "Beverly Crusher", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "William Riker", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Deanna Troi", cells.eq(2).text());
        },

        "test databind.foreach removeBindings": function () {
            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            databind.applyBindings(this.authorsViewModel, this.element);

            var metaData = databind.getMetaData($("tbody", this.element).get(0));
            assertObject("element metaData does not exist", metaData);

            var binderMetaData2 = metaData["foreach:authors"];
            assertObject("2nd binder metaData does not exist", binderMetaData2);

            var binderMetaData = metaData["foreach:.authors"];
            assertObject("1st binder metaData does not exist", binderMetaData);

            assertFunction("1st binder metaData does not have a listener", binderMetaData.listener);
            assertFunction("2nd binder metaData does not have a collection add listener", binderMetaData2.addListener);
            assertFunction("2nd binder metaData does not have a collection remove listener", binderMetaData2.removeListener);
            assertFunction("2nd binder metaData does not have a collection reset listener", binderMetaData2.resetListener);
            assertFunction("2nd binder metaData does not have a collection sort listener", binderMetaData2.sortListener);
            assertString("2nd binder metaData does not have a template", binderMetaData2.template);

            var listeners = this.authorsViewModel.events.authorschange.after;
            var foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }
            assert("meta data listener is not on the view model", foundListener);

            listeners = this.authorsViewModel.get("authors").events.add.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData2.addListener) {
                    foundListener = true;
                    break;
                }
            }
            assert("meta data add listener is not on the view model", foundListener);

            listeners = this.authorsViewModel.get("authors").events.remove.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData2.removeListener) {
                    foundListener = true;
                    break;
                }
            }
            assert("meta data remove listener is not on the view model", foundListener);

            listeners = this.authorsViewModel.get("authors").events.reset.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData2.resetListener) {
                    foundListener = true;
                    break;
                }
            }
            assert("meta data reset listener is not on the view model", foundListener);

            listeners = this.authorsViewModel.get("authors").events.sort.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData2.sortListener) {
                    foundListener = true;
                    break;
                }
            }
            assert("meta data sort listener is not on the view model", foundListener);

            databind.removeBindings(this.element);

            metaData = databind.getMetaData($("tbody", this.element).get(0));
            assertUndefined("element metaData exists after bindings were removed", metaData);

            listeners = this.authorsViewModel.events.authorschange.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData.listener) {
                    foundListener = true;
                    break;
                }
            }
            assertFalse("meta data listener function was not removed from the view model", foundListener);

            isteners = this.authorsViewModel.get("authors").events.add.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData2.addListener) {
                    foundListener = true;
                    break;
                }
            }
            assertFalse("meta data add listener was not removed from the view model", foundListener);

            listeners = this.authorsViewModel.get("authors").events.remove.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData2.removeListener) {
                    foundListener = true;
                    break;
                }
            }
            assertFalse("meta data remove listener was not removed from the view model", foundListener);

            listeners = this.authorsViewModel.get("authors").events.reset.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData2.resetListener) {
                    foundListener = true;
                    break;
                }
            }
            assertFalse("meta data reset listener was not removed from the view model", foundListener);

            listeners = this.authorsViewModel.get("authors").events.sort.after;
            foundListener = false;

            for (var i = 0, length = listeners.length; i < length; i += 1) {
                if (listeners[i].handler === binderMetaData2.sortListener) {
                    foundListener = true;
                    break;
                }
            }
            assertFalse("meta data sort listener was not removed from the view model", foundListener);
        },

        "test databindings.foreach-render event": function () {
            expectAsserts(13);

            var error = null;

            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            this.authorsViewModel.after('foreach-render', function (e) {
                try {
                    assertObject('event item model has incorrect value', e.info.model);
                    assertUndefined('event item at has incorrect value', e.info.at);
                    assertObject('event item nodes has incorrect value', e.info.nodes);
                }
                catch (ex) {
                    error = ex;
                }
            });

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            if (error !== null) {
                throw error;
            }
        },

        "test databindings.foreach-reset event": function () {
            expectAsserts(10);

            var error = null;

            var template = "<table><tbody data-bind='foreach: authors'><tr><td data-bind='text: fullName'></td></tr></tbody></table>";

            this.node.html(template);

            this.authorsViewModel.after('foreach-reset', function (e) {
                try {
                    assertObject('event item viewModel has incorrect value', e.info.viewModel);
                    assertObject('event item element has incorrect value', e.info.element);
                    assertObject('event item collection has incorrect value', e.info.collection);
                }
                catch (ex) {
                    error = ex;
                }
            });

            databind.applyBindings(this.authorsViewModel, this.element);

            var table = $("table", this.element);

            assertSame("data bound foreach item count is incorrect", 3, table.prop("rows").length);

            var cells = $("td", this.element);

            assertSame("cell 0 value is incorrect", "William Riker", cells.eq(0).text());
            assertSame("cell 1 value is incorrect", "Deanna Troi", cells.eq(1).text());
            assertSame("cell 2 value is incorrect", "Beverly Crusher", cells.eq(2).text());

            this.authorsViewModel.get('authors').reset();

            if (error !== null) {
                throw error;
            }
        }
    };
});