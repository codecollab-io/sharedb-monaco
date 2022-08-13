# sharedb-monaco

[![](https://img.shields.io/npm/v/sharedb-monaco)](https://github.com/Portatolova/sharedb-monaco/blob/master/LICENSE)
[![](https://img.shields.io/github/license/codecollab-io/sharedb-monaco)](https://github.com/Portatolova/sharedb-monaco/blob/master/LICENSE)

Two-way bindings between [ShareDB](https://github.com/share/sharedb) and the [Monaco Editor](https://github.com/microsoft/monaco-editor)

Developed for the [CodeCollab](https://codecollab.io) project.

Tested and works well with [monaco-react](https://github.com/suren-atoyan/monaco-react).

This library also supports multi-editor support on the same document as well as Connection management to optimise network usage when no editors are attached.

## Install
Using NPM:
```
$ npm install sharedb-monaco
```

## Usage

Sample usage of this library in action
```Javascript
import ShareDBMonaco from "sharedb-monaco";
import monaco from "monaco-editor";

// Get a monaco editor (ICodeEditor) instance
let editor = monaco.editor.create(document.getElementById("editor"), {
    value: "print('Hello World!')",
    language: "python"
});

let binding = new ShareDBMonaco(options);
let model = binding.add(editor, attachOptions);
```
<br />

### `new ShareDBMonaco(options)`

* `options` **\<Object>**
  * `id` **\<string>** ID of the ShareDB document
  * `namespace` **\<string>**  namespace of document within ShareDB, to be equal to that on the server
  * `sharePath` **\<string>** Path on ShareDB JSON object to apply operations to. For example, if your ShareDB document is structured as ```{ foo: "", bar: "" }```, set ```sharePath: "foo"``` for ShareDBMonaco to apply operations to ```foo```
  * `connection` **\<shareDb.Connection>** | **\<string>** If a string is passed, it'll be passed to the constructor of `new Websocket(connection)`, otherwise it'll reuse the ShareDB Connection passed.
  * `viewOnly` **\<boolean>** Should this document ignore local writes. Default: `false`
  * `loadingText` **\<string>** Value to initialise monaco model with while loading the ShareDB document. Default: `"Loading..."`

  Either of the following options must also be supplied:
  * `monaco` **\<monaco>** The monaco object.
  * `uri` **\<monaco.Uri>** A Uri object for the new model.
  
  OR
  * `model` **\<monaco.editor.ITextModel>** The monaco model to bind the ShareDB document to.

Instantiating `ShareDBMonaco` without `monaco` and `uri` set and instead setting `model` will not allow you to use the `setLangId()` and `setModelUri()` methods. Language inference for the `add()` will also be disabled.

<br />

---
<br />

### `binding.add(editor[, attachOptions])`

Adds an `ICodeEditor` instance to the ShareDBMonaco bindings. All document changes will now be listened for and applied to this instance.

* `editor` **\<monaco.editor.ICodeEditor>** A monaco editor instance to bind listeners to.
* `attachOptions` **\<Object>**
  * `model` **\<monaco.editor.ITextModel>** ITextModel instance to infer languageId from.
  * `langId` **\<string>** Language Id to set the language mode for `editor`
  * `uri` **\<monaco.Uri>** Sets this Uri to the current ITextModel and infer language mode from Uri.
* Returns: **\<monaco.editor.ITextModel>**

`attachOption` will only have an effect if `ShareDBMonaco` was instantiated with `monaco` and `uri` set. Otherwise a warning will be thrown.

If `model`, `langId` and `uri` are set, first uri will be applied to the existing model, then the language mode of the model will be set to `langId`. If `langId` was not set, `model` will be used to infer the language mode. TLDR, the order of priority is:
1. `langId`
2. `model`
3. `uri`

NOTE: `attachOptions.model` does NOT replace the `editor`'s model. It is only used for language inference and nothing more.

<br />

---
<br />

### `binding.setViewOnly(viewOnly)`
Toggles the view-only state of the bindings.
* `viewOnly` **\<boolean>** Should this document ignore local writes.

<br />

---
<br />

### `binding.setModelUri(uri)`
Updates the Uri of the internal model.
Requires `ShareDBMonaco` to be instantiated with `monaco` and `uri`.
* `uri` **\<monaco.Uri>** New Uri to set to model
* Returns: **\<monaco.editor.ITextModel>**

NOTE: Updating the Uri actually creates a new model as monaco does not have any internal APIs that allows for Uri updating.

If `uri` matches the uri of the existing model, the model will not be recreated however `uri` will be used for language inference and the language mode will be updated.

<br />

---
<br />

### `binding.setLangId(langId)`
Sets the language of the internal monaco model
* `langId` **\<string>** The Language Id

<br />

---
<br />

### `binding.remove(id)`
Removes and detaches an `ICodeEditor` instance from this bindings with the specified id.
* `id` **\<string>** Id of the `ICodeEditor` instance from `ICodeEditor.getId()`
* Returns: **\<Promise>** If all editors have been removed, all document subscriptions will be removed. The **\<Promise>** will be fulfilled when all subscrptions have been closed.

<br />

---
<br />

### `binding.close()`
Closes all document subscriptions, detaches all `ICodeEditor` instances from the ShareDB model, destroys the model. If the `ShareDB.Connection` was created by this instance, it will be destroyed too.
* Returns: **\<Promise>** Fulfilled when all subscriptions have been closed.

<br />

---
<br />

## Plugins
If you would like to use this package with multi-cursor support powered by ShareDB's Presence API, you can check out [sharedb-monaco-cursor](https://github.com/codecollab-io/sharedb-monaco-cursors).

<br />

## Usage with Next.JS
Any component that uses this module needs to be dynamically loaded with `{ ssr: false }` set. This is due to an issue with the monaco editor requiring access to the `navigator` object that doesn't exist when the module is loaded on the server.

<br />

## License
[MIT](https://github.com/codecollab-io/sharedb-monaco/blob/master/LICENSE)