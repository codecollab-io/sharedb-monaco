// Type definitions for sharedb-monaco
// Project: https://github.com/codecollab-io/sharedb-monaco
// Definitions by: Carl Voller <https://github.com/Portatolova>
// TypeScript Version: 4.7

import type * as monaco from 'monaco-editor';
import sharedb from 'sharedb/lib/client';
import ShareDBMonaco from '..';

export type ShareDBMonacoOptions = {
    id: string;
    namespace: string;
    sharePath: string;
    connection?: sharedb.Connection | string;
    viewOnly?: boolean;
    loadingText?: string;
} & ({
    monaco: typeof monaco;
    uri: monaco.Uri;
} | {
    model: monaco.editor.ITextModel
})

export type AttachOptions = {
    model?: monaco.editor.ITextModel;
    langId?: string;
    uri?: monaco.Uri;
}

export interface BindingsOptions {
    model: monaco.editor.ITextModel;
    path: string;
    doc: sharedb.Doc;
    viewOnly: boolean;
    parent: ShareDBMonaco;
}
