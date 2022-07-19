/**
 * sharedb-monaco
 * ShareDB bindings for the Monaco Editor
 *
 * @name index.ts
 * @author Carl Ian Voller <carlvoller8@gmail.com>
 * @license MIT
 */

import WebSocket from 'reconnecting-websocket';
import sharedb from 'sharedb/lib/client';
import type { Socket } from 'sharedb/lib/sharedb';
import { editor } from 'monaco-editor';
import type { AttachOptions, ShareDBMonacoOptions } from './types';
import Bindings from './bindings';

class ShareDBMonaco {

    WS?: WebSocket;

    doc: sharedb.Doc;

    binding?: Bindings;

    private connection: sharedb.Connection;

    private namespace: string;

    private id: string;

    private model: editor.ITextModel;

    private editors: Map<string, editor.ICodeEditor> = new Map();

    /**
     * ShareDBMonaco
     * @param {ShareDBMonacoOptions} opts - Options object
     * @param {string} opts.id - ShareDB document ID
     * @param {string} opts.namespace - ShareDB document namespace
     * @param {string} opts.path - Path on ShareDB document to apply operations to.
     * @param {boolean} opts.viewOnly - Set model to view only mode
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    constructor(opts: ShareDBMonacoOptions) {

        const { id, namespace, path, viewOnly } = opts;

        // Parameter checks
        if (!id) throw new Error("'id' is required but not provided");
        if (!namespace) throw new Error("'namespace' is required but not provided");
        if (typeof viewOnly !== 'boolean') throw new Error("'viewOnly' is required but not provided");

        let connection: sharedb.Connection;

        if ('wsurl' in opts) {

            this.WS = new WebSocket(opts.wsurl);
            connection = new sharedb.Connection(this.WS as Socket);

        } else connection = opts.connection;

        // Get ShareDB Doc
        const doc = connection.get(opts.namespace, opts.id);

        this.doc = doc;
        this.connection = connection;
        this.namespace = namespace;
        this.id = id;
        this.model = editor.createModel('');

        doc.subscribe((err) => {

            if (err) throw err;

            if (doc.type === null) throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');

            this.binding = new Bindings({ model: this.model, path, doc, viewOnly, parent: this });

        });

    }

    get allEditors() {

        return this.editors;

    }

    // Attach editor to ShareDB model
    add(codeEditor: editor.ICodeEditor, options?: AttachOptions): editor.ITextModel {

        if (this.connection.state === 'disconnected') throw new Error('add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.');
        if (this.editors.size === 0) this.resume();

        // Set model language
        if (options?.langId) editor.setModelLanguage(this.model, options.langId);
        else if (options?.model) editor.setModelLanguage(this.model, options.model.getLanguageId());

        codeEditor.setModel(this.model);

        if (!this.editors.has(codeEditor.getId())) this.editors.set(codeEditor.getId(), codeEditor);
        return this.model;

    }

    // Pause doc subscriptions
    private pause() {

        this.binding?.pause();
        this.doc.unsubscribe(() => this.doc.destroy());

    }

    // Resume doc subscriptions
    private resume() {

        const { connection, namespace, id, binding } = this;

        this.doc = connection.get(namespace, id);

        this.doc.subscribe((err) => {

            if (err) throw err;

            if (this.doc.type === null) throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');

            binding?.resume(this.doc);

        });

    }

    // Detach model from ShareDBMonaco
    remove(id: string) {

        if (this.editors.has(id)) {

            // Forced ! here cause typescript can't recognise I used the has() operator previously.
            // https://github.com/microsoft/TypeScript/issues/9619
            this.editors.get(id)!.setModel(null);
            this.editors.delete(id);

        }
        if (this.editors.size === 0) this.pause();

    }

    close() {

        this.doc.destroy();
        this.binding?.unlisten();

        // If connection was opened by this instance, close it.
        if (this.WS) {

            this.WS?.close();
            this.connection.close();

        }

    }

}

export default ShareDBMonaco;
