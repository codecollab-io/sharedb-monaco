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
import type Monaco from 'monaco-editor';
import type { AttachOptions, ShareDBMonacoOptions } from './types';
declare class ShareDBMonaco {
    WS?: WebSocket;
    private model;
    private connection;
    private monaco?;
    private binding?;
    private _viewOnly;
    private _namespace;
    private _id;
    private _editors;
    private _doc;
    private _sharePath;
    get viewOnly(): boolean;
    get namespace(): string;
    get id(): string;
    get editors(): Map<string, Monaco.editor.ICodeEditor>;
    get doc(): sharedb.Doc<any>;
    get sharePath(): string;
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
    constructor(opts: ShareDBMonacoOptions);
    /**
     * Toggles the View-Only state of the bindings.
     * When set to true, will not publish any local changes
     * @param {boolean} viewOnly - Set to true to set to View-Only mode
     */
    setViewOnly(viewOnly: boolean): void;
    /**
     * Sets the Uri for the internal monaco model.
     * This will override any previously set language using setLangId
     * and will infer the new language from the uri.
     * @param {Monaco.Uri} uri - Set the Uri for the internal monaco model.
     */
    setModelUri(uri: Monaco.Uri): Monaco.editor.ITextModel;
    /**
     * Sets the language of the internal monaco model
     * @param {string} langId - The Language ID
     */
    setLangId(langId: string): void;
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
    add(codeEditor: Monaco.editor.ICodeEditor, opts?: AttachOptions): Monaco.editor.ITextModel;
    /**
     * @private
     * Syncs or "wakes" document subscriptions.
     * This method should not be used unless explicitly necessary
     */
    syncSubscriptions(): void;
    private pause;
    private resume;
    /**
     * Detach model from ShareDBMonaco
     * @async
     * @param {string} id - Editor ID from ICodeEditor.getId()
     */
    remove(id: string): Promise<void>;
    /**
     * Close model and clean up
     * Will also close the connection if connection was created by sharedb-monaco
     */
    close(): Promise<void>;
}
export default ShareDBMonaco;
