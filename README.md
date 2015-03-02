# inline-edit
Edit any element inline

Example: http://mattmccloskey.github.io/inline-edit.js/example/

#### Package Managers
````
// Bower
bower install --save inline-edit.js
````

How to Use
----------
```javascript
new InlineEdit(element, [object options]);

// OR
$(element).enterEdit();
 ```

#### Events
These events are fired both from the class instance, and the element it's editing
```javascript
var editor = new InlineEdit($(element));

editor.addEvents({ 'onChange': function(newValue, oldValue){} });
// OR
$(element).addEvents({ 'onChange': function(newValue, oldValue){} });
```

Event Name | Description
---------- | -----------
enterEdit | When editing begins.
leaveEdit | When the editor is destroyed.
onChange | When the value of the element changes. Fired after leaveEdit.
keydown | Fired on keydown while editing.
