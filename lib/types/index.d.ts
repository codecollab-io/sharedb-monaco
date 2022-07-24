// Type definitions for sharedb-monaco
// Project: https://github.com/codecollab-io/sharedb-monaco
// Definitions by: Carl Voller <https://github.com/Portatolova>
// TypeScript Version: 4.7

import type * as monaco from 'monaco-editor';
import sharedb from 'sharedb/lib/client';
import ShareDBMonaco from '..';

export type ShareDBMonacoOptions = ({
    id: string;
    namespace: string;
    sharePath: string;
    viewOnly: boolean;
    wsurl: string;
} | {
    id: string;
    namespace: string;
    sharePath: string;
    viewOnly: boolean;
    connection: sharedb.Connection;
}) & ({
    monaco: typeof monaco;
    uri: monaco.Uri;
} | {
    model: monaco.editor.ITextModel
})

export type AttachOptions = {
    model?: monaco.editor.ITextModel;
    langId?: string;
}

export interface BindingsOptions {
    model: monaco.editor.ITextModel;
    path: string;
    doc: sharedb.Doc;
    viewOnly: boolean;
    parent: ShareDBMonaco;
}
