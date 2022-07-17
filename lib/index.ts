/**
 * sharedb-monaco
 * ShareDB bindings for the Monaco Editor
 * 
 * @name index.ts
 * @author Carl Ian Voller <carlvoller8@gmail.com>
 * @license MIT
 */

import WebSocket from "reconnecting-websocket";
import EventEmitter from "event-emitter-es6";
import sharedb from "sharedb/lib/client";
import { Socket } from "sharedb/lib/sharedb";
import { editor } from "monaco-editor";
import { ShareDBMonacoOptions } from "./types";
import Bindings from "./bindings";

declare interface ShareDBMonaco {
    on(event: "ready", listener: () => void): this;
    on(event: "close", listener: () => void): this;
}

class ShareDBMonaco extends EventEmitter {

    WS?: WebSocket;
    doc: sharedb.Doc;
    bindings: Map<string, Bindings> = new Map();
    
    private connection: sharedb.Connection;
    private namespace: string;
    private id: string;

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
            connection = new sharedb.Connection(this.WS as Socket);
        } else {
            connection = opts.connection;
        }
        
        // Get ShareDB Doc
        const doc = connection.get(opts.namespace, opts.id);

        doc.subscribe((err) => {
            if (err) throw err;

            if (doc.type === null) {
                throw new Error("ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.");
            }

            // Document has been initialised, emit 'ready' event
            this.emit("ready");
        });

        this.doc = doc;
        this.connection = connection;
        this.namespace = opts.namespace;
        this.id = opts.id;
    }

    // Attach model to ShareDBMonaco
    add(model: editor.ITextModel, path: string, viewOnly: boolean = false) {

        const { doc } = this;

        if(this.connection.state === "disconnected") { 
            throw new Error("add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.");
        }

        if (this.bindings.has(model.id)) return this.bindings.get(model.id);

        this.bindings.set(model.id, new Bindings({ model, path, doc, viewOnly }));

    }

    // Pause doc subscriptions
    pause() {
        console.log("PAUSING", this.id);
        this.bindings.forEach((binding) => binding.pause());
        this.doc.destroy();
    }

    // Resume doc subscriptions
    resume() {

        const { connection, namespace, id, bindings } = this;

        this.doc = connection.get(namespace, id);

        this.doc.subscribe((err) => {
            if (err) throw err;

            if (this.doc.type === null) {
                throw new Error("ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.");
            }

            bindings.forEach((binding) => binding.resume(this.doc));

        });

    }

    // Detach model from ShareDBMonaco
    remove(id: string) {
        if (this.bindings.has(id)) this.bindings.delete(id);
    }

    close() {

        this.doc.destroy();
        this.bindings.forEach((binding) => binding.unlisten());
        this.emit("close");

        // If connection was opened by this instance, close it.
        if (this.WS) {
            this.WS?.close();
            this.connection.close();
        }

    }
}

export default ShareDBMonaco;