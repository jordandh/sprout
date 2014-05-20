TestCase("list", ["sprout/util", "sprout/list", "sprout/model", "sprout/collection", "sprout/database"], function (_, list, model, collection, database) {
    'use strict';

    var animal = model.extend();
    var animals = collection.extend({
        model: animal
    });

    var testList = list.extend({
        rootUrl: 'animals.json',
        repoName: 'animals'
    });

    var testListForOffsets = list.extend({
        rootUrl: 'animals-offset.json',
        repoName: 'animals'
    });

    return {
        setUp: function () {
            var db = database.get(database.defaultDatabaseName);

            db.set('animals', animals.create([
                {
                    id: 0,
                    species: 'Rabbit'
                }, {
                    id: 1,
                    species: 'Snake'
                }, {
                    id: 2,
                    species: 'Frog'
                }
            ]));
        },

        "test list.parse": function ()
        {
            var lst = testList.create();

            // Parse the attributes that would come from a sync (fetch)
            lst.parse({
                itemIds: [0, 1, 2],
                offset: 0,
                limit: 10
            });

            assertSame('lst.count has incorrect value', 3, lst.get('count'));
            assert('lst[0] is not an animal model', animal.isPrototypeOf(lst.at(0)));
            assert('lst[1] is not an animal model', animal.isPrototypeOf(lst.at(1)));
            assert('lst[2] is not an animal model', animal.isPrototypeOf(lst.at(2)));
        },

        "test list.parse beyond the end of the collection": function ()
        {
            var lst = testList.create();

            // Parse the attributes that would come from a sync (fetch)
            lst.parse({
                itemIds: [0, 1, 2],
                offset: 3,
                limit: 10
            });

            assertSame('lst.count has incorrect value', 3, lst.get('count'));
            assertUndefined('lst[0] is not undefined', lst.at(0));
            assertUndefined('lst[1] is not undefined', lst.at(1));
            assertUndefined('lst[2] is not undefined', lst.at(2));
            assert('lst[3] is not an animal model', animal.isPrototypeOf(lst.at(3)));
            assert('lst[4] is not an animal model', animal.isPrototypeOf(lst.at(4)));
            assert('lst[5] is not an animal model', animal.isPrototypeOf(lst.at(5)));
        },

        "test list.fetch": function ()
        {
            expectAsserts(4);

            var lst = testList.create();

            // Parse the attributes that would come from a sync (fetch)
            lst.fetch({
                data: {
                    offset: 0,
                    limit: 10
                }
            }).done(async(function () {
                assertSame('lst.count has incorrect value', 3, lst.get('count'));
                assert('lst[0] is not an animal model', animal.isPrototypeOf(lst.at(0)));
                assert('lst[1] is not an animal model', animal.isPrototypeOf(lst.at(1)));
                assert('lst[2] is not an animal model', animal.isPrototypeOf(lst.at(2)));
            }));
        },

        "test list.fetch beyond the end of the collection": function ()
        {
            expectAsserts(7);

            var lst = testListForOffsets.create();

            // Parse the attributes that would come from a sync (fetch)
            lst.fetch({
                data: {
                    offset: 3,
                    limit: 10
                }
            }).done(async(function () {
                assertSame('lst.count has incorrect value', 3, lst.get('count'));
                assertUndefined('lst[0] is not undefined', lst.at(0));
                assertUndefined('lst[1] is not undefined', lst.at(1));
                assertUndefined('lst[2] is not undefined', lst.at(2));
                assert('lst[3] is not an animal model', animal.isPrototypeOf(lst.at(3)));
                assert('lst[4] is not an animal model', animal.isPrototypeOf(lst.at(4)));
                assert('lst[5] is not an animal model', animal.isPrototypeOf(lst.at(5)));
            }));
        }
    };
});