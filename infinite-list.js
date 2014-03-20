/*global requestAnimationFrame, jQuery */
;(function ($, window, document) {
    // The $container element should be position: relative, the $list element should NOT be position relative.
    // Currently does not support a top margin on list items, but does work with bottom margins
    // For ie9 support, you must polyfill requestAnimationFrame

    'use strict';

    var pluginName = 'infiniteList'
        , defaults = {
            topGutter: 300, //px
            bottomGutter: 300,
            itemClass: '',
            itemElementType: 'div'
        }
        , ListItem;

    ListItem = {
        init: function (el, index, top) {
            this.el = el;
            this.$el = $(el);
            this.id = el.id;
            this.top = top || el.offsetTop;
            this.height = el.offsetHeight;
            this.bottom = this.top + this.height;
            this.index = index;
        },
        inView: function (scrollTop) {
            return !this.beforeView(scrollTop) && !this.afterView(scrollTop);
        },
        // TODO: I think I'm incorrectly comparing top > scrollTop, because top here is relative to the $list,
        // and not relative to the $container - and scrollTop is relative to the $container not the $list, should fix this.
        afterView: function (scrollTop) {
            return this.top > (scrollTop + this._clientHeight + this.options.bottomGutter);
        },
        beforeView: function (scrollTop) {
            return this.bottom < (scrollTop !== 0 ? scrollTop - this.options.topGutter : 0);
        }
    };

    // A hybrid collection type for fast lookups
    function HashList () {
        this._itemHash = {};
        this._itemList = [];
    }
    HashList.prototype = {
        contains: function (item) {
            return !!this._itemHash[item.id];
        },
        elementAt: function (index) {
            return this._itemList[index];
        },
        empty: function () {
            this._itemHash = {};
            this._itemList.length = 0;
        },
        forEach: function (func, thisArg) {
            return this._itemList.forEach(func, thisArg);
        },
        get: function (id) {
            return this._itemHash[id];
        },
        last: function () {
            return this._itemList[this._itemList.length - 1];
        },
        length: function () {
            return this._itemList.length;
        },
        push: function (item) {
            this._itemList.push(item);
            this._itemHash[item.id] = item;
        },
        reHash: function (oldId, newId) {
            var item = this._itemHash[oldId];
            item.id = newId;
            delete this._itemHash[oldId];
            this._itemHash[newId] = item;
        },
        remove: function (item) {
            if (this.contains(item)) {
                this._itemList.splice(this._itemList.indexOf(item), 1);
                delete this._itemHash[item.id];
            }
        },
        toArray: function (start, end) {
            return this._itemList.slice(start, end);
        },
        unshift: function (item) {
            this._itemList.unshift(item);
            this._itemHash[item.id] = item;
        },
        insert: function (index /*, item, item, item or [item1, item2, item3]*/ ) {
            var items, args = arguments;

            if (Array.isArray(args[1])) {
                items = args[1];
            } else {
                items = Array.prototype.slice.call(args, 1);
            }

            if (index === 0) {
                // unshift to beginning
                Array.prototype.unshift.apply(this._itemList, items);
            } else if (index === this.length() - 1) {
                // push to end
                Array.prototype.push.apply(this._itemList, items);
            } else {
                // splice into any position
                Array.prototype.splice.apply(this._itemList, [index, 0].concat(items));
            }

            items.forEach(function (item) {
                this._itemHash[item.id] = item;
            }, this);
        }
    };

    function InfiniteList(element, options) {
        var viewportHeight;

        this.options = $.extend({}, defaults, options);
        this.$list = $(element);
        this.$container = this.options.scrollContainer instanceof $ ? this.options.scrollContainer : $(this.options.scrollContainer);
        this.container = this.$container[0];
        this.$front = $('<' + this.options.itemElementType + ' id="inf-front-spacer" />');
        this.$rear = $('<' + this.options.itemElementType + ' id="inf-rear-spacer" />');

        viewportHeight = document.documentElement.clientHeight;
        this._containerIsWindow = this.container === window;
        this._clientHeight = this._containerIsWindow ? viewportHeight : Math.min(this.container.clientHeight, viewportHeight);

        // The offset of the list to its scroll container, the scroll container should most likely be position: relative.
        this.options.topGutter += this.$list[0].offsetTop;
        this._rearHeight = 0;
        this._frontHeight = 0;
        this._prevScrollTop = this._scrollTop;
        this._lastReadScrollTop = this._prevScrollTop;

        this._visibleItems = new HashList();
        this._itemList = new HashList();

        this.ListItem = Object.create(ListItem, { options: { value: this.options }, _clientHeight: { value: this._clientHeight }});

        this.init();
    }
    InfiniteList.prototype = {
        // Items already in the list will be parsed
        init: function () {
            var $tmpEl;

            // get top/bottom margins of list elements
            $tmpEl = $('<' + this.options.itemElementType + ' class="' + this.options.itemClass + '" />').appendTo(this.$list);
            this.ListItem.marginTop = parseInt($tmpEl.css('margin-top'), 10);
            this.ListItem.marginBottom = parseInt($tmpEl.css('margin-bottom'), 10);
            $tmpEl.remove();

            if (this.$list[0].children.length) {
                this.append(Array.prototype.slice.call(this.$list[0].children));
            }

            this.$list.prepend(this.$front)
                .append(this.$rear);

            this.$container.on('scroll.' + pluginName, function () {
                if (!this._rafing && this._itemList.length()) {
                    this._lastReadScrollTop = this._scrollTop;
                    requestAnimationFrame(this._scroll.bind(this));
                    this._rafing = true;
                }
            }.bind(this));
        },

        // Takes an HTML string, jQuery, or Array of Elements.
        append: function ($els) {
            var els
                , item
                , lastIndex
                , scrollTop
                , outsideView = false
                , toDetach = []
                , prevItem = this._itemList.last() || {};

            els = this._parseArgument($els);
            lastIndex = this._itemList.length() - 1;
            scrollTop = this._scrollTop;

            this.$rear.before(els);

            this.$list.trigger('beforeadd.infinitelist', [$(els)]);

            els.forEach(function (el, i) {
                item = Object.create(this.ListItem);
                item.init(el, i + lastIndex + 1, prevItem.bottom + this.ListItem.marginBottom);
                this._itemList.push(item);
                if (outsideView || item.afterView(scrollTop)) {
                    toDetach.push(item.el);
                    outsideView = true;
                } else {
                    this._visibleItems.push(item);
                }
                prevItem = item;
            }, this);

            $(toDetach).detach();

            this._rearHeight = this._itemList.last().bottom - this._visibleItems.last().bottom;
            this.$rear[0].style.height = this._rearHeight + 'px';
        },

        // Takes an HTML string, jQuery, or Array of Elements.
        prepend: function ($els) {
            var newItems = []
                , scrollTop = this._scrollTop
                , item
                , prevItem
                , els = this._parseArgument($els)
                , prevFirstItem = this._itemList.elementAt(0);

            this.$list.prepend(els);

            this.$list.trigger('beforeadd.infinitelist', [$(els)]);

            els.forEach(function (el, i) {
                item = Object.create(this.ListItem);
                item.init(el, i, prevItem ? prevItem.bottom + this.ListItem.marginBottom : 0);
                newItems.push(item);
                prevItem = item;
            }, this);

            $(els).detach();

            this._itemList.insert(0, newItems);
            this._reCalcPositions(els.length);
            this._reIndexItems(0);

            if (this._visibleItems.length()) {
                this._frontHeight = this._visibleItems.elementAt(0).top;
                this.$front[0].style.height = this._frontHeight + 'px';

                // Trying to be intelligent about the scroll position
                this._scrollTop = this._visibleItems.elementAt(0) !== prevFirstItem ?
                    scrollTop + item.bottom + this.ListItem.marginBottom : scrollTop;
                this._prevScrollTop = this._scrollTop;
            }

            this._prevScrollTop++; // so the scroll is "up"
            this._scroll();
        },

        // Returns a jQuery object of every item in the list, in order, regardless of visibility
        children: function () {
            var children = [];

            this._itemList.forEach(function (item) {
                children.push(item.el);
            });

            return $(children);
        },

        // Places all items back in the dom and destroys the plugin
        destroy: function () {
            this.$list.html(this.children())
                .removeData('plugin_' + pluginName)
                .off('.' + pluginName);
        },

        // Find any element within the list as if the entire list was in the dom
        // Takes a selector string
        // Returns a jQuery object
        find: function (selector) {
            var result = [];

            this._itemList.forEach(function (item) {
                Array.prototype.push.apply(result, item.$el.find(selector).addBack(selector));
            });

            return $(result);
        },

        // Returns the last element in the list as a jQuery object
        last: function () {
            var last = this._itemList.last();

            return last ? last.$el : $();
        },

        // Returns a jQuery object of only the visible elements
        visible: function () {
            var els = [];

            this._visibleItems.forEach(function (item) {
                els.push(item.el);
            });

            return $(els);
        },

        // Takes jQuery or Element
        removeItem: function ($el) {
            var el = $el instanceof $ ? $el[0] : $el
                , item = this._itemList.get(el.id);

            this._itemList.remove(item);
            this._visibleItems.remove(item);

            item.$el.remove();

            this._reCalcPositions(item.index);
            this._reIndexItems(item.index);

            if (this._itemList.length()) {
                this._scroll(this._scrollTop);
            }
        },

        replaceId: function (oldId, newId) {
            var item = this._itemList.get(oldId);

            item.el.id = newId;
            if (this._visibleItems.contains(item)) {
                this._visibleItems.reHash(oldId, newId);
            }
            this._itemList.reHash(oldId, newId);
        },

        // Takes
        //   oldId - string
        //   newElement - String or jQuery or Element
        //   dontResize (optional) - boolean
        replaceItem: function (oldId, newElement, dontResize) {
            var item = this._itemList.get(oldId)
                , $newElement = $(newElement);

            item.$el.replaceWith($newElement);
            item.$el = $newElement;
            item.el = item.$el[0];

            this.replaceId(oldId, item.el.id);

            if (!dontResize) {
                this.resizeItems(item.$el);
            }
        },

        // Force recalculation of every item's position (and height?, would be expensive)
        // TODO: implement
        refresh: function () {

        },

        // Removes all items from the list
        reset: function () {
            this._itemList.empty();
            this._visibleItems.empty();
            this._frontHeight = 0;
            this._rearHeight = 0;
            this.$list.empty()
                .prepend(this.$front)
                .append(this.$rear);
            this.$rear[0].style.height = '';
            this.$front[0].style.height = '';
        },

        // Takes an Array of Elements or jQuery
        resizeItems: function ($els) {
            var els = $els instanceof $ ? $els.get() : $els
                , item
                , toAppend = []
                , $toAppend
                , lowestIndex = this._itemList.length() - 1;

            els.forEach(function _findNotVisible (el) {
                item = this._itemList.get(el.id);
                lowestIndex = Math.min(lowestIndex, item.index);
                if (!this._visibleItems.contains(item)) {
                    toAppend.push(el);
                }
            }, this);

            $toAppend = $(toAppend).appendTo(this.$list);

            this.$list.trigger('beforeresize.infinitelist');

            els.forEach(function _getHeights (el) {
                item = this._itemList.get(el.id);
                item.height = el.offsetHeight;
            }, this);

            $toAppend.detach();

            this._reCalcPositions(lowestIndex);
            this._scroll(this._scrollTop);
        },

        length: function () {
            return this._itemList.length();
        },

        _reCalcPositions: function (startIndex) {
            var itemsSublist = this._itemList.toArray(startIndex)
                , prevItem = this._itemList.elementAt(startIndex - 1);

            itemsSublist.forEach(function _reCalcPositions (item) {
                item.top = prevItem ? prevItem.bottom + this.ListItem.marginBottom : 0;
                item.bottom = item.height + item.top;
                prevItem = item;
            }, this);
        },

        _reIndexItems: function (startIndex) {
            var i = 0
                , length = this._itemList.length();

            for (i = startIndex; i < length; i++) {
                this._itemList.elementAt(i).index = i;
            }
        },

        // Divide and conquer
        _scroll: function () {
            var items
                , scrollTop = this._lastReadScrollTop
                , down = this._prevScrollTop <= scrollTop
                , start, end, i
                , outOfView = false
                , item
                , change = false;

            if (!this._visibleItems.length()) {
                start = 0;
                end = this._itemList.length();
            } else if (down) {
                start = this._visibleItems.elementAt(0).index;
                end = this._itemList.length();
            } else {
                start = 0;
                end = this._visibleItems.last().index + 1;
            }

            items = this._itemList.toArray(start, end);

            if (down) {
                for (i = 0; i < items.length && !outOfView; i++) {
                    item = items[i];
                    if (this._visibleItems.contains(item)) {
                        if (item.beforeView(scrollTop)) {
                            item.$el.detach();
                            this._visibleItems.remove(item);
                            change = true;
                        }
                    } else if (item.inView(scrollTop)) {
                        this.$rear.before(item.el);
                        this._visibleItems.push(item);
                        change = true;
                    } else if (item.afterView(scrollTop)) {
                        outOfView = true;
                    }
                }
            } else {
                for (i = items.length - 1; i >= 0 && !outOfView; i--) {
                    item = items[i];
                    if (this._visibleItems.contains(item)) {
                        if (item.afterView(scrollTop)) {
                            item.$el.detach();
                            this._visibleItems.remove(item);
                            change = true;
                        }
                    } else if (item.inView(scrollTop)) {
                        this.$front.after(item.el);
                        this._visibleItems.unshift(item);
                        change = true;
                    } else if (item.beforeView(scrollTop)) {
                        outOfView = true;
                    }
                }
            }
            this._frontHeight = this._visibleItems.elementAt(0).top;
            this._rearHeight = Math.max(this._itemList.last().bottom - this._visibleItems.last().bottom - this.ListItem.marginBottom, 0);

            if (change) {
                this.$front[0].style.height = this._frontHeight + 'px';
                this.$rear[0].style.height = this._rearHeight + 'px';
            }

            this._prevScrollTop = scrollTop;

            this._rafing = false;
        },

        get  _scrollTop() {
            return this._containerIsWindow ? this.container.pageYOffset : this.container.scrollTop;
        },

        set _scrollTop(value) {
            if (this._containerIsWindow) {
                window.scroll(0, value);
            } else {
                this.container.scrollTop = value;
            }
            this._lastReadScrollTop = value;
        },

        _parseArgument: function ($els) {
            var els = [];

            if (typeof $els === 'string') {
                els = $('<span>' + $els + '</span>').find('.' + this.options.itemClass.split(' ')[0]).get();
            } else if (Array.isArray($els)) {
                els = $els;
            } else if ($els instanceof $) {
                els = $els.get();
            }

            return els;
        }
    };

    $.fn[pluginName] = function (options) {
        var args = arguments, result;

        this.each(function () {
            var instance = $.data(this, 'plugin_' + pluginName);
            if (!instance) {
                $.data(this, 'plugin_' + pluginName, new InfiniteList(this, options));
            } else if (typeof options === 'string' && options[0] !== '_' && $.isFunction(instance[options])) {
                result = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                if (result !== undefined) {
                    // break out of each loop
                    return false;
                }
            }
        });

        return result !== undefined ? result : this;
    };

    $.fn[pluginName].HashList = HashList;
}(jQuery, window, document));