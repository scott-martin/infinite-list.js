/*global jQuery, Mustache*/
(function ($) {
    "use strict";

    var $list = $('#list')
        , $header = $('header')
        , itemTemplate = $('#item-template').html()
        , newItemTemplate = $('#new-item-template').html()
        , InfiniteTestApp;        

    function ItemModel (i, rand, id) {
        this.i = i;
        this.rand = rand;
        this.id = id;        
    }    

    InfiniteTestApp = {
        init: function () {                    
            this.$activate = $('#activate');
            this.$destroy = $('#destroy');
            
            this._activate();
            
            this.infiniteList = $list.data('plugin_infiniteList');
            
            this._attachHandlers();
        },
        _generate: function (num) {
            var i = $list.data('plugin_infiniteList').length()
                , end = i + num
                , rand
                , li
                , items = []
                , item;

            for (i; i < end; i++) {
                rand = this._randInt(100, 400);
                li = document.createElement('li');
                li.id = 'l' + i;
                li.className = 'item';
                li.style.height = rand + 'px';
                item = new ItemModel(i, rand, li.id);
                $(li).data('item', item);
                li.insertAdjacentHTML('beforeend', Mustache.render(itemTemplate, item));                
                items.push(li);              
            }            

            return items;
        },
        _attachHandlers: function () {
            $header.on('click', '#resize-multiple', this._resizeMultiple.bind(this))
                .on('click', '#generate', this._regenerate.bind(this))
                .on('click', '#append', this._addItems.bind(this, 'append'))
                .on('click', '#prepend', this._addItems.bind(this, 'prepend'))
                .on('click', '#destroy', this._destroy.bind(this))
                .on('click', '#activate', this._activate.bind(this));

            $list.on('click', 'button.delete', this._deleteItem)
                .on('click', 'button.shrink', this._resizeItem.bind(this, -15))
                .on('click', 'button.expand', this._resizeItem.bind(this, 100))
                .on('click', 'button.replace-element', this._replaceItem.bind(this))
                .on('click', 'button.replace-id', this._replaceId.bind(this));
        },
        _deleteItem: function (e) {
            var listItem = e.target.parentElement;
            $list.infiniteList('removeItem', listItem);
        },
        _activate: function () {
            $list.infiniteList({
                scrollContainer: window,
                itemElementType: 'li',
                itemClass: 'item'
            });
            this.$activate.prop('disabled', true);
            this.$destroy.prop('disabled', false);
        },
        _destroy: function () {
            $list.infiniteList('destroy');
            delete this.infiniteList;
            this.$activate.prop('disabled', false);
            this.$destroy.prop('disabled', true);
        },
        _resizeMultiple: function () {
            var randomsHash = {}
                , arrOfSizes = []
                , i = 0
                , resizedItems = []
                , numToResize = Math.floor(parseInt($('#num-to-generate').val(), 10) / 3)
                , children = this.infiniteList.children()
                , randPosition;                      

            for (i = 0; i < numToResize; i++) {             
                do {
                    randPosition = this._randInt(0, children.length-1);
                } while (randomsHash[randPosition]);
                
                randomsHash[randPosition] = children[randPosition];
                
                arrOfSizes.push(this._randInt(-15, 15));
            }
                
            i = 0;
            $.each(randomsHash, function (_, el) {                
                this._resize($(el), arrOfSizes[i++]);
                resizedItems.push(el);
            }.bind(this));

            $list.infiniteList('resizeItems', resizedItems);
        },
        _resizeItem: function (num, e) {
            var li = e.target.parentNode
                , $li = $(li);

            this._resize($li, num);

            $list.infiniteList('resizeItems', $(li));
        },
        _resize: function ($li, num) {   
            var height = parseInt($li[0].style.height, 10)
                , newHeight = height + num;
                
            $li[0].style.height = newHeight + 'px';
            $li.find('.item-height').text(newHeight);
        },
        _regenerate: function () {            
            $list.infiniteList('reset');    
            this._addItems('append');        
        },
        _randInt: function (min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },
        _addItems: function (method) {
            var amount = parseInt($('#num-to-generate').val(), 10);            
            $list.infiniteList(method, this._generate(amount));
            this.$destroy.prop('disabled', false);
        },
        _replaceItem: function (e) {
            var $el = $(e.target).closest('.item')
                , height = $el[0].style.height
                , newEl
                , item
                , oldId;

            newEl = document.createElement('li');
            newEl.id = $el[0].id + '-new';
            newEl.style.height = height;
            newEl.className = $el[0].className + ' new-item';
            item = $el.data('item');
            oldId = item.id;
            item.id = newEl.id;
            newEl.innerHTML = Mustache.render(newItemTemplate, item);          

            $list.infiniteList('replaceItem', oldId, newEl, true);
        },
        _replaceId: function (e) {
            var $el = $(e.target).closest('.item')
                , item = $el.data('item')
                , oldId = item.id;

            item.id = item.id + '-replaced';

            $el.html(Mustache.render(itemTemplate, item));
            
            $list.infiniteList('replaceId', oldId, item.id);
        }
    };

    window.testApp = Object.create(InfiniteTestApp);
    window.testApp.init();
}(jQuery));