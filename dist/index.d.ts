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
import { editor } from "monaco-editor";
import { ShareDBMonacoOptions } from "./types";
import Bindings from "./bindings";
declare interface ShareDBMonaco {
    on(event: "ready", listener: () => void): this;
    on(event: "close", listener: () => void): this;
}
declare class ShareDBMonaco extends EventEmitter {
    WS?: WebSocket;
    doc: sharedb.Doc;
    bindings: Map<string, Bindings>;
    private connection;
    private namespace;
    private id;
    /**
     * ShareDBMonaco
     * @param {ShareDBMonacoOptions} opts - Options object
     * @param {string} opts.id - ShareDB document ID
     * @param {string} opts.namespace - ShareDB document namespace
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    constructor(opts: ShareDBMonacoOptions);
    add(model: editor.ITextModel, path: string, viewOnly?: boolean): Bindings | undefined;
    pause(): void;
    resume(): void;
    remove(id: string): void;
    close(): void;
}
export default ShareDBMonaco;
