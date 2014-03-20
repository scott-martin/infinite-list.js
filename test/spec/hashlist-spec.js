/*global describe, jQuery, beforeEach, it, expect*/
(function ($) {
    'use strict';

    var HashList = $.fn.infiniteList.HashList;

    describe('HashList', function () {
        var arr, list;

        beforeEach(function () {
            arr = [{ id: 2 }, { id: 'a' }, { id: 2 }, { id: 'c'}];
            list = new HashList();
            list.insert(0, arr);
        });

        describe('.contains()', function () {
            var item = { id: 'z' };

            it('should return true when contains the item', function() {
                list.push(item);
                expect(list.contains(item)).toBe(true);
            });
            it('should return false when does not contain the item', function () {
                expect(list.contains(item)).toBe(false);
            });
        });

        describe('.elementAt(index)', function () {
            it('should return item with id \'a\' at index 1', function () {
                var item = arr[1];
                expect(list.elementAt(1)).toBe(item);
            });
            it('should return undefined when there is nothing at that index', function () {
                expect(list.elementAt(15)).toBe(undefined);
            });
        });

        describe('.empty()', function () {
            it('should remove all items from the collection', function () {
                expect(list.length()).toBe(4);
                list.empty();
                expect(list.length()).toBe(0);
            });
        });

        describe('.forEach(func, context)', function () {
            it('should iterate through each item in the list from first to last', function () {
                var j = 0
                    , expects = 0;

                list.forEach(function (item, i) {
                    expect(i).toBe(j);
                    expect(item).toBe(arr[j]);
                    j++;
                    expects += 2;
                });

                expect(expects).toBe(8);
            });
        });

        describe('.get(id)', function () {
            it('returns the item with the given id', function () {
                var item = arr[1];

                expect(list.get('a')).toBe(item);
            });
            it('returns undefined if no item exists with the given id', function () {
                expect(list.get('zalwiej2342')).toBe(undefined);
            });
        });

        describe('.last()', function () {
            it('returns the last item in the list', function () {
                expect(list.last()).toBe(arr[3]);
            });
        });

        describe('.length()', function () {
            it('returns the length of the list', function () {
                expect(list.length()).toBe(4);
            });
        });

        describe('.push(item)', function () {
            it('places an item at the end of the list', function () {
                var item = { id: 'z' };
                expect(list.length()).toBe(4);
                list.push(item);
                expect(list.length()).toBe(5);
                expect(list.last()).toBe(item);
            });
        });

        describe('.reHash(oldId, newId)', function () {
            it('should change the id of an item', function () {
                var item = list.get('a');
                list.reHash('a', 'A');
                expect(item.id).toBe('A');
            });
            it('should remove the old property from the hash and create a new one', function () {
                var item = list.get('a');
                expect(list._itemHash.a).toBe(item);
                list.reHash('a', 'A');
                expect(list._itemHash.a).toBe(undefined);
                expect(list._itemHash.A).toBe(item);
            });
        });

        describe('.remove(item)', function () {
            it('should remove the item from the list', function () {
                var item = list.get(2);
                list.remove(item);
                expect(list.get(2)).toBe(undefined);
                expect(list.length()).toBe(3);
            });
        });

        describe('.toArray()', function () {
            it('should return a copy of the internal array', function () {
                var arr = list.toArray(), i;
                expect(arr).not.toBe(list._itemList);
                for(i = 0; i < arr.length; i++) {
                    expect(arr[i]).toBe(list._itemList[i]);
                }
                expect(i).toBe(4);
            });
        });

        describe('.insert(...)', function () {
            var item1 = { id: 'x' }
                , item2 = { id: 'y' };

            it('should insert an arbitrary number of arguments into the list at the specified index', function () {
                list.insert(1, item1, item2);
                expect(list.elementAt(1)).toBe(item1);
                expect(list.elementAt(2)).toBe(item2);
            });
            it('should splice in an array at the specified index', function () {
                var arr = [ item1, item2 ];
                list.insert(1, arr);
                expect(list.elementAt(1)).toBe(item1);
                expect(list.elementAt(2)).toBe(item2);
            });
        });
    });

}(jQuery));