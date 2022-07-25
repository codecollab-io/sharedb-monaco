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
import type monaco from 'monaco-editor';
import type { AttachOptions, ShareDBMonacoOptions } from './types';
import Bindings from './bindings';

class ShareDBMonaco {

    WS?: WebSocket;

    private model: monaco.editor.ITextModel;

    private connection: sharedb.Connection;

    private monaco?: typeof monaco;

    private binding?: Bindings;

    private _viewOnly: boolean;

    private _namespace: string;

    private _id: string;

    private _editors: Map<string, monaco.editor.ICodeEditor> = new Map();

    private _doc: sharedb.Doc;

    private _sharePath: string;

    get viewOnly() { return this._viewOnly; }

    get namespace() { return this._namespace; }

    get id() { return this._id; }

    get editors() { return this._editors; }

    get doc() { return this._doc; }

    get sharePath() { return this._sharePath; }

    /**
     * ShareDBMonaco
     * @param {ShareDBMonacoOptions} opts - Options object
     * @param {string} opts.id - ShareDB document ID
     * @param {string} opts.namespace - ShareDB document namespace
     * @param {string} opts.sharePath - Path on ShareDB document to apply operations to.
     * @param {boolean} opts.viewOnly - Set model to view only mode
     * @param {monaco} opts.monaco (Optional) - Monaco objects for language inference
     * @param {Uri} opts.uri (Optional) - Uri for model creation
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    constructor(opts: ShareDBMonacoOptions) {

        const { id, namespace, sharePath, viewOnly } = opts;

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

        this.connection = connection;

        if ('monaco' in opts) {

            this.monaco = opts.monaco;
            this.model = opts.monaco.editor.createModel('', undefined, opts.uri);

        } else this.model = opts.model;

        this._doc = doc;
        this._namespace = namespace;
        this._id = id;
        this._viewOnly = viewOnly;
        this._sharePath = sharePath;

        doc.subscribe((err) => {

            if (err) throw err;

            if (doc.type === null) throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');

            this.binding = new Bindings({
                model: this.model, path: sharePath, doc, viewOnly, parent: this,
            });

        });

    }

    setViewOnly(viewOnly: boolean) {

        this.binding?.setViewOnly(viewOnly);

    }

    setModelUri(uri: monaco.Uri) {

        const { model, doc, viewOnly, sharePath, monaco: m } = this;

        if (!m) throw new Error("This method is only available if 'monaco' was set on instantiation.");

        const newModel = m.editor.createModel(model.getValue(), model.getLanguageId(), uri);

        // const { fsPath } = uri; // \\filename
        // const formatted = uri.toString(); // file:///filename

        /* const editStacks = model._commandManager._undoRedoService._editStacks

        const newEditStacks = new Map()

        function adjustEditStack(c) {
            c.actual.model = newModel
            c.resourceLabel = fsPath
            c.resourceLabels = [fsPath]
            c.strResource = formatted
            c.strResources = [formatted]
        }

        editStacks.forEach((s) => {
            s.resourceLabel = fsPath
            s.strResource = formatted

            s._future.forEach(adjustEditStack)
            s._past.forEach(adjustEditStack)

            newEditStacks.set(formatted, s)
        })

        newModel._commandManager._undoRedoService._editStacks = newEditStacks */

        model.dispose();

        const editors = Array.from(this.editors.values());
        const cursors = editors.map((e) => e.getPosition());
        this.editors.forEach((e) => e.setModel(newModel));
        cursors.forEach((pos, i) => !pos || editors[i].setPosition(pos));

        this.binding?.unlisten();
        this.binding = new Bindings({
            model: newModel, path: sharePath, doc, viewOnly, parent: this,
        });

        return newModel;

    }

    // Attach editor to ShareDB model
    add(codeEditor: monaco.editor.ICodeEditor, options?: AttachOptions): monaco.editor.ITextModel {

        if (this.connection.state === 'disconnected') throw new Error('add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.');
        if (options && !this.monaco) console.warn("Supplying options to this function without passing 'monaco' in instantiation will have no effect.");
        if (this.editors.size === 0) this.resume();

        // Set model language
        if (options && this.monaco) {

            const { langId, model, uri } = options;

            if (uri && uri.path !== this.model.uri.path) this.setModelUri(uri);

            if (langId) this.monaco.editor.setModelLanguage(this.model, langId);
            else if (model) this.monaco.editor.setModelLanguage(this.model, model.getLanguageId());

        }

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

        this._doc = connection.get(namespace, id);

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
        this.model.dispose();

        // If connection was opened by this instance, close it.
        if (this.WS) {

            this.WS?.close();
            this.connection.close();

        }

    }

}

export default ShareDBMonaco;
