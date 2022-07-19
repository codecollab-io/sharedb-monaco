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
import { editor } from 'monaco-editor';
import type { AttachOptions, ShareDBMonacoOptions } from './types';
import Bindings from './bindings';
declare class ShareDBMonaco {
    WS?: WebSocket;
    doc: sharedb.Doc;
    binding?: Bindings;
    private connection;
    private namespace;
    private id;
    private model;
    private editors;
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
    constructor(opts: ShareDBMonacoOptions);
    get allEditors(): Map<string, editor.ICodeEditor>;
    add(codeEditor: editor.ICodeEditor, options?: AttachOptions): editor.ITextModel;
    private pause;
    private resume;
    remove(id: string): void;
    close(): void;
}
export default ShareDBMonaco;
