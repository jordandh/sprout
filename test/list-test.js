TestCase("list", ["sprout/util", "sprout/list", "sprout/model", "sprout/collection", "sprout/database"], function (_, list, model, collection, database) {
    'use strict';

    var animal = model.extend();
    var animals = collection.extend({
        model: animal
    });

    var testList = list.extend({
        rootUrl: 'test/data/animals.json',
        repoName: 'animals',
        autoSyncChanges: false
    });

    var testListForOffsets = list.extend({
        rootUrl: 'test/data/animals-offset.json',
        repoName: 'animals',
        autoSyncChanges: false
    });

    var testListForSyncing = list.extend({
        rootUrl: 'test/data/animals.json',
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
        },

        "test list.changes": function ()
        {
            var lst = testList.create();

            // Make some changes
            lst.add([{
                id: 100,
                species: 'Tiger'
            }, {
                id: 101,
                species: 'Lion'
            }]);

            lst.move({
                from: 1,
                to: 0
            });

            lst.remove(lst.at(0));

            // Check those changes
            assertSame('changes.length is incorrect', 3, lst.changes.length);
            assertSame('changes[0] is not an add', 'add', lst.changes[0].action);
            assertSame('changes[0].items[0].id is incorrect', 100, lst.changes[0].items[0]);
            assertSame('changes[0].items[1].id is incorrect', 101, lst.changes[0].items[1]);
            assertSame('changes[0].at is incorrect', 0, lst.changes[0].at);
            assertSame('changes[1] is not a move', 'move', lst.changes[1].action);
            assertSame('changes[1].id is incorrect', 101, lst.changes[1].items[0]);
            assertSame('changes[1].at is incorrect', 0, lst.changes[1].at);
            assertSame('changes[2] is not a remove', 'remove', lst.changes[2].action);
            assertSame('changes[2].id is incorrect', 101, lst.changes[2].items[0]);
            assertSame('changes[2].at is incorrect', 0, lst.changes[2].at[0]);
        },

        "test list.syncChanges": function ()
        {
            expectAsserts(6);

            var lst = testList.create();

            // Make some changes
            lst.add([{
                id: 100,
                species: 'Tiger'
            }, {
                id: 101,
                species: 'Lion'
            }]);

            assertSame('changes.length is incorrect', 1, lst.changes.length);
            assertSame('changes[0] is not an add', 'add', lst.changes[0].action);
            assertSame('changes[0].items[0].id is incorrect', 100, lst.changes[0].items[0]);
            assertSame('changes[0].items[1].id is incorrect', 101, lst.changes[0].items[1]);

            // Sync the changes
            lst.after('syncChangesFailed', async(function () {
                assertSame('changes.length is incorrect after successfully syncing changes', 0, lst.changes.length);
            }));

            lst.syncChanges();

            assertSame('changes.length is incorrect', 0, lst.changes.length);
        },

        "test list.syncChanges fails": function ()
        {
            expectAsserts(6);

            var lst = testList.create();

            // Make some changes
            lst.add([{
                id: 100,
                species: 'Tiger'
            }, {
                id: 101,
                species: 'Lion'
            }]);

            assertSame('changes.length is incorrect', 1, lst.changes.length);
            assertSame('changes[0] is not an add', 'add', lst.changes[0].action);
            assertSame('changes[0].items[0].id is incorrect', 100, lst.changes[0].items[0]);
            assertSame('changes[0].items[1].id is incorrect', 101, lst.changes[0].items[1]);

            // Sync the changes
            lst.after('syncChangesFailed', async(function () {
                assertSame('changes.length is incorrect after failing to sync changes', 1, lst.changes.length);
            }));

            lst.syncChanges();

            assertSame('changes.length is incorrect', 0, lst.changes.length);
        }
    };
});