/**
 * @fileOverview
 * @name bindings.ts
 * @author Carl Voller <carlvoller8@gmail.com>
 * @license MIT
 */
import { editor } from "monaco-editor";
import { BindingsOptions } from "./types";
declare class Bindings {
    private suppress;
    private editor;
    private path;
    private doc;
    private model;
    private lastValue;
    private viewOnly;
    constructor(options: BindingsOptions);
    setInitialValue(): void;
    listen(): void;
    unlisten(): void;
    deltaTransform(delta: editor.IModelContentChange): any[];
    getInsertOp(index: number, text: string): any[];
    getDeleteOp(index: number, length: number): any[];
    getReplaceOp(index: number, length: number, text: string): any[];
    opTransform(ops: Array<any>): void;
    onLocalChange(delta: editor.IModelContentChangedEvent): void;
    onRemoteChange(ops: Array<any>, source: any): void;
}
export default Bindings;
