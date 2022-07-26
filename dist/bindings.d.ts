/**
 * @fileOverview
 * @name bindings.ts
 * @author Carl Voller <carlvoller8@gmail.com>
 * @license MIT
 */
import type monaco from 'monaco-editor';
import type { BindingsOptions } from './types';
declare class Bindings {
    private suppress;
    private path;
    private doc;
    private _model;
    private lastValue;
    private viewOnly;
    private parent;
    private listenerDisposable?;
    get model(): monaco.editor.ITextModel;
    set model(model: monaco.editor.ITextModel);
    constructor(options: BindingsOptions);
    setInitialValue(): void;
    listen(): void;
    unlisten(): void;
    pause(): void;
    resume(): void;
    deltaTransform(delta: monaco.editor.IModelContentChange): any[];
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
    onLocalChange(delta: monaco.editor.IModelContentChangedEvent): void;
    onRemoteChange(ops: Array<any>, source: any): void;
}
export default Bindings;
