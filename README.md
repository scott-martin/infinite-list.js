infinite-list.js
================

infinite-list.js is a jQuery plugin that makes long scrolling lists more efficient. It works by taking items in and out of the dom as they are scrolled in and out of view, similar to the technique used in the iOS UITableView. 

If you have an infinitely loading feed of items or simply a really long list of items, then this plugin can help improve the performance of your page.

Checkout the demo to see it in action: http://peoplematter.github.io/infinite-list.js/

Getting Started
---------------

To get started, apply the infite-list plugin to the container element of your list:

```javascript
$('#list-of-items').infiniteList();
```

This would apply the infinite-list to `#list-of-items` with the default options.

Options
-------

Here is an example of all of the available options (listed are the defaults).

```javascript
$('#list-of-items').infiniteList({
    scrollContainer: window,
    itemClass: '',
    itemElementType: 'div'    
    topGutter: 300, //px
    bottomGutter: 300,    
});
```

* `scrollContainer` - should be the element that the scrollbar is on. The infinite-list can be used on lists that scroll in the window or lists that scroll inside of another element.
* `itemClass` - is necessary if your items have a common class name that you use for any styles affecting layout (height, margin, etc.). Note this is the class name and _not_ a css selector. This can also be a space separated string of class names (e.g. "list-item item-type-1").
* `itemElementType` - is the type of element of your list-items. Can be `div`, `li`, or just about anything.
* `topGutter` and `bottomGutter` - refer to the amount of pixels outside the viewport of the container element that you want items to be added/removed from the dom.

Methods
-------

What sets infinite-list.js apart from other solutions is the ability to continually change the list. You can add items, remove items, and resize items and infinite-list will take care of recalculating it's internals efficiently. 

### `append($els)`
`$els` - HTML string, jQuery, or Array of Elements.

Appends the provided items to the end of the list.

### `prepend($els)`
`$els` - HTML string, jQuery, or Array of Elements.

Prepends the provided items to the beginning of the list.

### `resizeItems($els)`
`$els` - Array of Elements or jQuery

If you have caused a change in the height of one or many of your list-items, tell infinite-list to recalculate the sizes of the provided items. 

### `find(selector)`
`selector` - any valid jQuery selector

Find any element within the list as if the entire list was in the dom. See http://api.jquery.com/find/ for more info. Returns a jQuery object of the matching elements.

### `removeItem($el)`
`$el` - jQuery or Element

Removes the provided list item from the infinite-list.

### `children()`

Returns a jQuery object of every item in the list, in order, regardless of visibility.

### `last()`

Returns the last element in the list as a jQuery object.

### `visible()`

Returns a jQuery object of only the elements that are currently in the dom.

### `length()`

Returns the number of items in the list.

### `replaceId(oldId, newId)`
`oldId, newId` - string

Use this if you need to change the id of a list item.

### `replaceItem(oldId, newElement, dontResize)`
`oldId` - string
`newElement` - string or jQuery or Element
`dontResize` (optional) - boolean

Replace an existing list-item with a new item. Pass `dontResize` as true if you know there is no need for the list to update its size calculations (if the new element is the exact same size as the old one).

### `reset()`

Removes all items from the list

### `destroy()`

Places all items back in the dom and destroys the plugin.
