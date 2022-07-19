// Type definitions for sharedb-monaco
// Project: https://github.com/codecollab-io/sharedb-monaco
// Definitions by: Carl Voller <https://github.com/Portatolova>
// TypeScript Version: 4.7

import type { editor } from 'monaco-editor';
import sharedb from 'sharedb/lib/client';
import ShareDBMonaco from '..';

export type ShareDBMonacoOptions = {
    id: string;
    namespace: string;
    path: string;
    viewOnly: boolean;
    wsurl: string;
} | {
    id: string;
    namespace: string;
    path: string;
    viewOnly: boolean;
    connection: sharedb.Connection;
}

export type AttachOptions = {
    model?: editor.ITextModel;
    langId?: string;
}

export interface BindingsOptions {
    model: editor.ITextModel;
    path: string;
    doc: sharedb.Doc;
    viewOnly: boolean;
    parent: ShareDBMonaco;
}
