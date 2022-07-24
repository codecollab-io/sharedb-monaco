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
import type monaco from 'monaco-editor';
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
    get editors(): Map<string, monaco.editor.ICodeEditor>;
    get doc(): sharedb.Doc<any>;
    get sharePath(): string;
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
    constructor(opts: ShareDBMonacoOptions);
    setViewOnly(viewOnly: boolean): void;
    setModelUri(uri: monaco.Uri): monaco.editor.ITextModel;
    add(codeEditor: monaco.editor.ICodeEditor, options?: AttachOptions): monaco.editor.ITextModel;
    private pause;
    private resume;
    remove(id: string): void;
    close(): void;
}
export default ShareDBMonaco;
