TestCase("views/listview", ["util", "jquery", "model", "collection", "views/listview"], function (_, $, model, collection, listview) {
    var animal = model.extend({
        attributes: {
            name: {},
            age: {}
        }
    });
    
    var animals = collection.extend({
        model: animal
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

        "test listview": function ()
        {
            var col = animals.new([{
                    name: "Spot",
                    age: 8
                }, {
                    name: "Stripe",
                    age: 10
                }
            ]);

            var lv = listview.new();
            lv.set("collection", col);

            lv.render(this.element);
        }
    };
});