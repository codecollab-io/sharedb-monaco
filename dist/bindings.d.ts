/**
 * @fileOverview
 * @name bindings.ts
 * @author Carl Voller <carlvoller8@gmail.com>
 * @license MIT
 */
import { editor as IEditorTypes } from 'monaco-editor';
import sharedb from 'sharedb/lib/client';
import type { BindingsOptions } from './types';
declare class Bindings {
    private suppress;
    private path;
    private doc;
    private _model;
    private lastValue;
    private viewOnly;
    private parent;
    get model(): IEditorTypes.ITextModel;
    set model(model: IEditorTypes.ITextModel);
    constructor(options: BindingsOptions);
    setInitialValue(): void;
    listen(): void;
    unlisten(): void;
    pause(): void;
    resume(doc: sharedb.Doc): void;
    deltaTransform(delta: IEditorTypes.IModelContentChange): any[];
    getInsertOp(index: number, text: string): {
        [x: string]: string | (string | number)[];
        p: (string | number)[];
    }[];
    getDeleteOp(index: number, length: number): {
        [x: string]: string | (string | number)[];
        p: (string | number)[];
    }[];
    getReplaceOp(index: number, length: number, text: string): {
        [x: string]: string | (string | number)[];
        p: (string | number)[];
    }[];
    opTransform(ops: Array<any>): void;
    setViewOnly(viewOnly: boolean): void;
    onLocalChange(delta: IEditorTypes.IModelContentChangedEvent): void;
    onRemoteChange(ops: Array<any>, source: any): void;
}
export default Bindings;
