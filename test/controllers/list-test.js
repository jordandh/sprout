TestCase("controllers/list", ["util", "dom", "model", "collection", "viewcontroller", "controllers/list"], function (_, $, model, collection, viewController, listcontroller) {
    var animal = model.extend({
        attributes: {
            name: {},
            age: {}
        }
    });
    
    var animals = collection.extend({
        model: animal
    });

    var animalController = viewController.extend({
        attributes: {
            model: { value: null }
        },

        render: function (parentNode)
        {
            var ani = this.get("model");
            $(parentNode).html("<span>" + ani.get("name") + " is " + ani.get("age") + " years old.</span>");
        }
    });

    var shortController = viewController.extend({
        attributes: {
            model: { value: null }
        },

        render: function (parentNode)
        {
            var ani = this.get("model");
            $(parentNode).html("<span>" + ani.get("name") + " [" + ani.get("age") + "]</span>");
        }
    });

    return {
        setUp: function ()
        {
            this.node = $("<div></div>").appendTo(document.body);
            this.element = this.node.get(0);
        },

        tearDown: function ()
        {
            this.node.remove();
            this.node = null;
            this.element = null;
        },

        "test listcontroller.render": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listcontroller.new();
            lv.set("collection", col);
            lv.set("itemController", animalController);

            lv.render(this.element);

            var l = lv.get("list"),
                items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 2, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Spot is 8 years old.</span>", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "<span>Stripe is 10 years old.</span>", items.get(1).innerHTML);
        },

        "test listcontroller.collection add before render": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listcontroller.new();
            lv.set("collection", col);
            lv.set("itemController", animalController);

            col.add({
                name: "Dot",
                age: "2"
            });

            lv.render(this.element);

            var l = lv.get("list"),
                items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Spot is 8 years old.</span>", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "<span>Stripe is 10 years old.</span>", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "<span>Dot is 2 years old.</span>", items.get(2).innerHTML);
        },

        "test listcontroller.collection add after render": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listcontroller.new();
            lv.set("collection", col);
            lv.set("itemController", animalController);

            lv.render(this.element);

            var l = lv.get("list"),
                items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 2, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Spot is 8 years old.</span>", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "<span>Stripe is 10 years old.</span>", items.get(1).innerHTML);

            col.add({
                name: "Dot",
                age: "2"
            });

            items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Spot is 8 years old.</span>", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "<span>Stripe is 10 years old.</span>", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "<span>Dot is 2 years old.</span>", items.get(2).innerHTML);
        },

        "test listcontroller.collection remove before render": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listcontroller.new();
            lv.set("collection", col);
            lv.set("itemController", animalController);

            col.remove(col.find(function (item) {
                return item.get("name") === "Spot";
            }));

            lv.render(this.element);

            var l = lv.get("list"),
                items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 1, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Stripe is 10 years old.</span>", items.get(0).innerHTML);
        },

        "test listcontroller.collection remove after render": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listcontroller.new();
            lv.set("collection", col);
            lv.set("itemController", animalController);

            lv.render(this.element);

            col.remove(col.find(function (item) {
                return item.get("name") === "Spot";
            }));

            var l = lv.get("list"),
                items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 1, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Stripe is 10 years old.</span>", items.get(0).innerHTML);
        },

        "test listcontroller.collection reset before render": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listcontroller.new();
            lv.set("collection", col);
            lv.set("itemController", animalController);

            col.reset([{
                    name: "Dot",
                    age: 2
                }, {
                    name: "Pixel",
                    age: 4
                }, {
                    name: "Voxel",
                    age: 8
                }
            ]);

            lv.render(this.element);

            var l = lv.get("list"),
                items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Dot is 2 years old.</span>", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "<span>Pixel is 4 years old.</span>", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "<span>Voxel is 8 years old.</span>", items.get(2).innerHTML);
        },

        "test listcontroller.collection reset after render": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listcontroller.new();
            lv.set("collection", col);
            lv.set("itemController", animalController);

            lv.render(this.element);

            col.reset([{
                    name: "Dot",
                    age: 2
                }, {
                    name: "Pixel",
                    age: 4
                }, {
                    name: "Voxel",
                    age: 8
                }
            ]);

            var l = lv.get("list"),
                items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 3, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Dot is 2 years old.</span>", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "<span>Pixel is 4 years old.</span>", items.get(1).innerHTML);
            assertSame("The item's content is incorrect", "<span>Voxel is 8 years old.</span>", items.get(2).innerHTML);
        },

        "test listcontroller.itemController": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listcontroller.new();
            lv.set("collection", col);
            lv.set("itemController", animalController);

            lv.render(this.element);

            var l = lv.get("list"),
                items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 2, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Spot is 8 years old.</span>", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "<span>Stripe is 10 years old.</span>", items.get(1).innerHTML);

            lv.set("itemController", shortController);

            items = $("li", l.get("contentNode"));

            assertSame("The list does not have the correct number of elements in the dom", 2, l.get("contentNode").childNodes.length);
            assertSame("The item's content is incorrect", "<span>Spot [8]</span>", items.get(0).innerHTML);
            assertSame("The item's content is incorrect", "<span>Stripe [10]</span>", items.get(1).innerHTML);
        }
    };
});