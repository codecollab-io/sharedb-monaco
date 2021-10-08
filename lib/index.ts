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

declare interface ShareDBMonaco {
    on(event: 'ready', listener: () => void): this;
    on(event: 'close', listener: () => void): this;
}

class ShareDBMonaco extends EventEmitter {

    WS?: WebSocket;
    doc: sharedb.Doc;
    private connection: any;
    bindings?: Bindings;

    /**
     * ShareDBMonaco
     * @param {ShareDBMonacoOptions} opts - Options object
     * @param {string} opts.id - ShareDB document ID
     * @param {string} opts.namespace - ShareDB document namespace
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    constructor(opts: ShareDBMonacoOptions) {
        super();

        // Parameter checks
        if(!opts.id) { throw new Error("'id' is required but not provided"); }
        if(!opts.namespace) { throw new Error("'namespace' is required but not provided"); }

        let connection: sharedb.Connection;

        if ("wsurl" in opts) {
            this.WS = new WebSocket(opts.wsurl);
            connection = new sharedb.Connection(this.WS as any);
        } else {
            connection = opts.connection;
        }
        
        // Get ShareDB Doc
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
        this.connection = connection;
    }

    // Attach editor to ShareDBMonaco
    add(monaco: editor.ICodeEditor, path: string, viewOnly?: boolean) {

        if(this.connection.state === "disconnected") { 
            throw new Error("add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.");
        }

        let sharePath = path || "";
        this.bindings = new Bindings({
            monaco: monaco,
            path: sharePath,
            doc: this.doc,
            viewOnly: !!viewOnly
        });
    }

    close() {
        if(this.bindings) { this.bindings.unlisten(); }
        this.connection.close();
        this.emit("close");
        this.WS?.close();
    }
}

export default ShareDBMonaco;