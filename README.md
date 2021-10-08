# sharedb-monaco

[![](https://img.shields.io/npm/v/sharedb-monaco)](https://github.com/Portatolova/sharedb-monaco/blob/master/LICENSE)
[![](https://img.shields.io/github/license/codecollab-io/sharedb-monaco)](https://github.com/Portatolova/sharedb-monaco/blob/master/LICENSE)

Two-way bindings between [ShareDB](https://github.com/share/sharedb) and the [Monaco Editor](https://github.com/microsoft/monaco-editor)

Developed for the [CodeCollab](https://codecollab.io) project.

Tested and works well with [monaco-react](https://github.com/suren-atoyan/monaco-react).

## Install
Using NPM:
```
$ npm install sharedb-monaco
```

## Usage

Sample usage of this library in action
```Javascript
import ShareDBMonaco from "sharedb-monaco";
import { editor } from "monaco-editor";

// Get a monaco editor (ICodeEditor) instance
let editor = editor.create(document.getElementById("editor"), {
    value: "print('Hello World!')",
    language: "python"
});

let binding = new ShareDBMonaco(options);

// Attach editor when document is initialised
binding.on("ready", () => {
    binding.add(editor, path);
});

```

### ShareDBMonaco Options
  * `opts.id` ID of the ShareDB document
  * `options.namespace` namespace of document within ShareDB, to be equal to that on the server
  * `options.wsurl` (Optional) Websocket URL for ShareDB Server API
  * `options.connection` (Optional) ShareDB Connection object. Pass this to reuse an existing Connection.

NOTE: Either `options.wsurl` or `options.connection` has to be set.

### ShareDBMonaco Instance
#### Events
  * `ready` Emitted when ShareDB document has initialised and ShareDBMonaco is ready for an editor to be attached.
  * `close` Emitted when the `close()` method is called.

#### Methods
`add(editor, path, viewOnly?)`:
Attaches an editor to the ShareDBMonaco instance

Parameters:
  * `editor` An instance of the monaco editor (iCodeEditor).
  * `path` Path on ShareDB JSON object to apply operations to. For example, if your ShareDB document is structured as ```{ foo: "", bar: "" }```, set ```path = "foo"``` for ShareDBMonaco to apply operations to ```foo```
  * `viewOnly (OPTIONAL)` Is the editor in viewOnly mode. Operations are treated differently for viewOnly editors.

`close()`: Closes the ShareDB and WebSocket connections between the server and this ShareDBMonaco instance. Also detaches any listeners on the editor.


## License
[MIT](https://github.com/codecollab-io/sharedb-monaco/blob/master/LICENSE)