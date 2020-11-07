/**
 * sharedb-monaco
 * ShareDB bindings for the Monaco Editor
 * 
 * @name index.ts
 * @author Carl Ian Voller <carlvoller8@gmail.com>
 * @license MIT
 */

import WebSocket from 'reconnecting-websocket';
import EventEmitter from "event-emitter-es6";
import sharedb from 'sharedb/lib/client';
import { editor } from "monaco-editor";
import { ShareDBMonacoOptions } from "./types";
import Bindings from "./bindings";

class ShareDBMonaco extends EventEmitter {

    WS: WebSocket;
    doc: sharedb.Doc;
    bindings?: Bindings;

    /**
     * ShareDBMonaco
     * @param {ShareDBMonacoOptions} opts - Options object
     * @param {string} opts.id - ShareDB document ID
     * @param {string} opts.namespace - ShareDB document namespace
     * @param {string} opts.wsurl - URL for ShareDB Server API
     */
    constructor(opts: ShareDBMonacoOptions) {
        super();

        // Parameter checks
        if(!opts.id) { throw new Error("'id' is required but not provided"); }
        if(!opts.namespace) { throw new Error("'namespace' is required but not provided"); }
        if(!opts.wsurl) { throw new Error("'wsurl' is required but not provided"); }

        this.WS = new WebSocket(opts.wsurl);
        
        // Get ShareDB Doc
        const connection = new sharedb.Connection(this.WS as any);
        const doc = connection.get(opts.namespace, opts.id);

        doc.subscribe((err: any) => {
            if (err) throw err;

            if (doc.type === null) {
                throw new Error("ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.");
            }

            // Document has been initialised, emit 'ready' event
            this.emit("ready");
        });

        this.doc = doc;
    }

    // Attach editor to ShareDBMonaco
    add(monaco: editor.ICodeEditor, path: string) {
        let sharePath = path || "";
        this.bindings = new Bindings({
            monaco: monaco,
            path: sharePath,
            doc: this.doc
        });
    }
}

export default ShareDBMonaco;