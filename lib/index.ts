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
import type Monaco from 'monaco-editor';
import type { AttachOptions, ShareDBMonacoOptions } from './types';
import Bindings from './bindings';

class ShareDBMonaco {

    WS?: WebSocket;

    private model: Monaco.editor.ITextModel;

    private connection: sharedb.Connection;

    private monaco?: typeof Monaco;

    private binding?: Bindings;

    private _viewOnly: boolean;

    private _namespace: string;

    private _id: string;

    private _editors: Map<string, Monaco.editor.ICodeEditor> = new Map();

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
     * @param {string} opts.loadingText (Optional) - Text to show while ShareDB is loading
     * @param {Monaco} opts.monaco (Optional) - Monaco objects for language inference
     * @param {Uri} opts.uri (Optional) - Uri for model creation
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    constructor(opts: ShareDBMonacoOptions) {

        const { id, namespace, sharePath, viewOnly = false, loadingText } = opts;
        let { connection } = opts;

        // Parameter checks
        if (!id) throw new Error("'id' is required but not provided");
        if (!namespace) throw new Error("'namespace' is required but not provided");
        if (!connection) throw new Error("'connection' is required but not provided.");
        if (typeof viewOnly !== 'boolean') throw new Error("'viewOnly' should be a boolean");

        if (typeof connection === 'string') {

            this.WS = new WebSocket(connection);
            connection = new sharedb.Connection(this.WS as Socket);

        }

        // Get ShareDB Doc
        const doc = connection.get(opts.namespace, opts.id);

        this.connection = connection;

        if ('monaco' in opts) {

            this.monaco = opts.monaco;

            if (opts.uri) this.model = opts.monaco.editor.getModel(opts.uri) || opts.monaco.editor.createModel('', undefined, opts.uri);
            else this.model = opts.monaco.editor.createModel(loadingText || 'Loading...');

        } else this.model = opts.model;

        this._doc = doc;
        this._namespace = namespace;
        this._id = id;
        this._viewOnly = viewOnly || false;
        this._sharePath = sharePath;

        doc.subscribe((err) => {

            if (err) throw err;

            if (doc.type === null) throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');

            this.binding = new Bindings({
                model: this.model, path: sharePath, doc, viewOnly, parent: this,
            });

        });

    }

    /**
     * Toggles the View-Only state of the bindings.
     * When set to true, will not publish any local changes
     * @param {boolean} viewOnly - Set to true to set to View-Only mode
     */
    setViewOnly(viewOnly: boolean) {

        this.binding?.setViewOnly(viewOnly);

    }

    /**
     * Sets the Uri for the internal monaco model.
     * This will override any previously set language using setLangId
     * and will infer the new language from the uri.
     * @param {Monaco.Uri} uri - Set the Uri for the internal monaco model.
     */
    setModelUri(uri: Monaco.Uri): Monaco.editor.ITextModel {

        const { model, monaco } = this;

        if (!monaco) throw new Error("This method is only available if 'monaco' was set on instantiation.");

        // Only set new model language, do not replace model if uri is the same
        if (uri.path === model.uri.path) {

            const tempModel = monaco.editor.createModel('', '', monaco.Uri.file(`${Date.now()}/${uri.path}`));
            const lang = tempModel.getLanguageId();
            monaco.editor.setModelLanguage(model, lang);
            tempModel.dispose();

            return model;

        }

        // Dispose any existing models with this uri that may be lingering
        monaco.editor.getModel(uri)?.dispose();

        const newModel = monaco.editor.createModel(model.getValue(), undefined, uri);

        model.dispose();

        const editors = Array.from(this.editors.values());
        const cursors = editors.map((e) => e.getPosition());
        this.editors.forEach((e) => e.setModel(newModel));
        cursors.forEach((pos, i) => !pos || editors[i].setPosition(pos));

        if (this.binding) this.binding.model = newModel;

        this.model = newModel;

        return newModel;

    }

    /**
     * Sets the language of the internal monaco model
     * @param {string} langId - The Language ID
     */
    setLangId(langId: string) {

        const { monaco, model } = this;

        if (!monaco) throw new Error("This method is only available if 'monaco' was set on instantiation.");
        monaco.editor.setModelLanguage(model, langId);

    }

    /**
     * Attach editor to ShareDB Monaco model
     * If multiple language options are set, sharedb-monaco will prioritise them
     * in the order of: opts.langId > opts.model > opts.uri
     * @param {Monaco.editor.ICodeEditor} codeEditor - The editor instance
     * @param {AttachOptions} opts (Optional) - Language options
     * @param {Monaco.editor.ITextModel} opts.model (Optional) - Infer language mode from this model
     * @param {string} opts.langId (Optional) - Set language mode with this id
     * @param {Monaco.Uri} opts.uri (Optional) - Override existing model Uri
     */
    add(codeEditor: Monaco.editor.ICodeEditor, opts?: AttachOptions): Monaco.editor.ITextModel {

        const { connection, monaco, editors } = this;

        if (connection.state === 'disconnected') throw new Error('add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.');
        if (opts && !monaco) console.warn("Supplying options to this function without passing 'monaco' in instantiation will have no effect.");
        if (editors.size === 0) this.resume();

        // Set model language
        if (opts && monaco) {

            const { langId, model, uri } = opts;

            if (uri && uri.path !== this.model.uri.path) this.setModelUri(uri);

            if (langId) monaco.editor.setModelLanguage(this.model, langId);
            else if (model) monaco.editor.setModelLanguage(this.model, model.getLanguageId());

        }

        codeEditor.setModel(this.model);

        if (!editors.has(codeEditor.getId())) editors.set(codeEditor.getId(), codeEditor);
        return this.model;

    }

    /**
     * @private
     * Syncs or "wakes" document subscriptions.
     * This method should not be used unless explicitly necessary
     */
    syncSubscriptions() {

        const { editors, doc } = this;
        if (editors.size > 0 && !doc.subscribed) this.resume();

    }

    // Pause doc subscriptions to save bandwidth
    private async pause() {

        this.binding?.pause();

        await new Promise((resolve) => this.doc.unsubscribe(() => this.doc.destroy(resolve)));

    }

    // Resume doc subscriptions
    private resume() {

        this.doc.subscribe((err) => {

            if (err) throw err;

            if (this.doc.type === null) throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');

            this.binding?.resume();

        });

    }

    /**
     * Detach model from ShareDBMonaco
     * @async
     * @param {string} id - Editor ID from ICodeEditor.getId()
     */
    async remove(id: string) {

        const { editors } = this;

        if (editors.has(id)) {

            // Forced ! here cause typescript can't recognise I used the has() operator previously.
            // https://github.com/microsoft/TypeScript/issues/9619
            editors.get(id)!.setModel(null);
            editors.delete(id);

        }
        if (editors.size === 0) await this.pause();

    }

    /**
     * Close model and clean up
     * Will also close the connection if connection was created by sharedb-monaco
     */
    async close() {

        const { model, editors, WS, connection } = this;

        await this.pause();
        model.dispose();
        editors.forEach((e) => e.setModel(null));
        editors.clear();

        // If connection was opened by this instance, close it.
        if (WS) {

            WS?.close();
            connection.close();

        }

    }

}

export default ShareDBMonaco;
