/**
 * @fileOverview
 * @name bindings.ts
 * @author Carl Voller <carlvoller8@gmail.com>
 * @license MIT
 */

import type monaco from 'monaco-editor';
import sharedb from 'sharedb/lib/client';
import ShareDBMonaco from '.';
import type { BindingsOptions } from './types';
import { Range } from './api';

class Bindings {

    private suppress: boolean;

    private path: string;

    private doc: sharedb.Doc;

    private _model: monaco.editor.ITextModel;

    private lastValue: string;

    private viewOnly: boolean;

    private parent: ShareDBMonaco;

    private listenerDisposable?: monaco.IDisposable;

    get model() { return this._model; }

    set model(model: monaco.editor.ITextModel) {

        const editors = Array.from(this.parent.editors.values());
        const cursors = editors.map((editor) => editor.getPosition());
        this._model = model;
        this.suppress = true;
        this.unlisten();
        this.listen();
        this.suppress = false;
        cursors.forEach((pos, i) => !pos || editors[i].setPosition(pos));

    }

    constructor(options: BindingsOptions) {

        this.suppress = false;

        const { path, doc, model, viewOnly, parent } = options;

        this.path = path;
        this.doc = doc;
        this._model = model;
        this.lastValue = model.getValue();
        this.viewOnly = viewOnly;
        this.parent = parent;

        this.setInitialValue();

        this.onLocalChange = this.onLocalChange.bind(this);
        this.onRemoteChange = this.onRemoteChange.bind(this);

        this.listen();

    }

    // Sets the monaco editor's value to the ShareDB document's value
    setInitialValue() {

        if (this.model.getValue() === this.doc.data[this.path]) return;

        this.suppress = true;
        this.model.setValue(this.doc.data[this.path]);
        this.lastValue = this.doc.data[this.path];
        this.suppress = false;

    }

    // Listen for both monaco editor changes and ShareDB changes
    listen() {

        const { viewOnly, model } = this;

        this.listenerDisposable?.dispose();
        if (!viewOnly) this.listenerDisposable = model.onDidChangeContent(this.onLocalChange);
        this.doc.on('op', this.onRemoteChange);

    }

    // Stop listening for changes
    unlisten() {

        if (!this.viewOnly) this.listenerDisposable?.dispose();
        this.doc.off('op', this.onRemoteChange);

    }

    // Pause connections
    pause() {

        this.unlisten();

    }

    // Resume connections
    resume(doc: sharedb.Doc) {

        this.doc = doc;
        this.listen();

        this.setInitialValue();

    }

    // Transform monaco content change delta to ShareDB Operation.
    deltaTransform(delta: monaco.editor.IModelContentChange) {

        const { rangeOffset: offset, rangeLength: length, text } = delta;

        let op: Array<any>;
        if (text.length > 0 && length === 0) op = this.getInsertOp(offset, text);
        else if (text.length > 0 && length > 0) op = this.getReplaceOp(offset, length, text);
        else if (text.length === 0 && length > 0) op = this.getDeleteOp(offset, length);
        else throw new Error(`Unexpected change: ${JSON.stringify(delta)}`);

        return op;

    }

    // Converts insert operation into json0 (sharedb-op)
    getInsertOp(index: number, text: string) {

        const [p, a, s] = [[this.path, index], 'si', text];

        const op = { p, [a]: s };
        return [op];

    }

    // Converts delete operation into json0 (sharedb-op)
    getDeleteOp(index: number, length: number) {

        const text = this.lastValue.slice(index, index + length);
        const [p, a, s] = [[this.path, index], 'sd', text];

        const op = { p, [a]: s };
        return [op];

    }

    // Converts replace operation into json0 (sharedb-op)
    getReplaceOp(index: number, length: number, text: string) {

        const oldText = this.lastValue.slice(index, index + length);

        const [p, a1, s1, a2, s2] = [[this.path, index], 'sd', oldText, 'si', text];

        const op1 = { p, [a1]: s1 };
        const op2 = { p, [a2]: s2 };
        return [op1, op2];

    }

    // Transforms ShareDB Operations to monaco deltas to be applied.
    opTransform(ops: Array<any>) {

        const { model, viewOnly } = this;
        this.suppress = true;

        for (let i = 0; i < ops.length; i += 1) {

            const op = ops[i];
            const index = op.p[op.p.length - 1];
            const pos = model.getPositionAt(index);
            const start = pos;

            const edits: Array<monaco.editor.IIdentifiedSingleEditOperation> = [];

            if ('sd' in op) {

                const { lineNumber, column } = model.getPositionAt(index + op.sd.length);
                const range = new Range(start.lineNumber, start.column, lineNumber, column);
                edits.push({
                    range,
                    text: '',
                    forceMoveMarkers: true,
                });

            }

            if ('si' in op) {

                const insertRange = new Range(
                    start.lineNumber,
                    start.column,
                    start.lineNumber,
                    start.column,
                );

                edits.push({
                    range: insertRange,
                    text: op.si,
                    forceMoveMarkers: true,
                });

            }

            // this.model.applyEdits(edits, true);

            /* this.model.pushEditOperations(
                edits.map((edit) => new Selection(
                    edit.range.startLineNumber, edit.range.startColumn
                     edit.range.startLineNumber, edit.range.startColumn)),
                edits,
                (inverseEditOperations) => inverseEditOperations.map((op) => {
                    const start = model.getOffsetAt(op.range.getStartPosition());
                    const end = model.getOffsetAt(op.range.getEndPosition());

                    if ()
                })
            ); */

            if (this.parent.editors.size === 0) return this.model.applyEdits(edits);

            this.parent.editors.forEach((editor) => {

                if (viewOnly) editor.updateOptions({ readOnly: false });
                editor.executeEdits('remote', edits);
                if (viewOnly) editor.updateOptions({ readOnly: true });

            });

            /* if(this.viewOnly) { this.editor.updateOptions({ readOnly: false }); }
            this.editor.executeEdits("remote", edits);
            if(this.viewOnly) { this.editor.updateOptions({ readOnly: true }); } */

        }
        this.suppress = false;

    }

    setViewOnly(viewOnly: boolean) {

        this.viewOnly = viewOnly;
        this.unlisten();
        this.listen();

    }

    // Handles local editor change events
    onLocalChange(delta: monaco.editor.IModelContentChangedEvent) {

        if (this.suppress) return;

        console.log("DELTAS", delta.changes);

        const ops = delta.changes.map((change) => this.deltaTransform(change)).flat();

        console.log(ops);

        this.lastValue = this.model.getValue();

        this.doc.submitOp(ops, { source: true }, (err) => {

            if (err) throw err;
            if (this.model.getValue() !== this.doc.data[this.path]) {

                this.suppress = true;
                const cursors: Array<monaco.Position | null> = [];
                const editors = Array.from(this.parent.editors.values());

                editors.forEach((editor) => cursors.push(editor.getPosition()));
                this.model.setValue(this.doc.data[this.path]);
                cursors.forEach((pos, i) => !pos || editors[i].setPosition(pos));
                // if(cursor) { this.editor.setPosition(cursor); }
                this.suppress = false;

            }

        });

    }

    // Handles remote operations from ShareDB
    onRemoteChange(ops: Array<any>, source: any) {

        if (ops.length === 0) return;

        const opsPath = ops[0].p.slice(0, ops[0].p.length - 1).toString();

        if (source === true || opsPath !== this.path) return;

        this.opTransform(ops);

        this.lastValue = this.model.getValue();

    }

}

export default Bindings;
