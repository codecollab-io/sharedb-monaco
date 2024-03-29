"use strict";
/**
 * @fileOverview
 * @name bindings.ts
 * @author Carl Voller <carlvoller8@gmail.com>
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = require("./api");
var Bindings = /** @class */ (function () {
    function Bindings(options) {
        this.suppress = false;
        var path = options.path, doc = options.doc, model = options.model, viewOnly = options.viewOnly, parent = options.parent;
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
    Object.defineProperty(Bindings.prototype, "model", {
        get: function () { return this._model; },
        set: function (model) {
            var editors = Array.from(this.parent.editors.values());
            var cursors = editors.map(function (editor) { return editor.getPosition(); });
            this._model = model;
            this.suppress = true;
            this.unlisten();
            this.listen();
            this.suppress = false;
            cursors.forEach(function (pos, i) { return !pos || editors[i].setPosition(pos); });
        },
        enumerable: false,
        configurable: true
    });
    // Sets the monaco editor's value to the ShareDB document's value
    Bindings.prototype.setInitialValue = function () {
        if (this.model.getValue() === this.doc.data[this.path])
            return;
        this.suppress = true;
        this.model.setValue(this.doc.data[this.path]);
        this.lastValue = this.doc.data[this.path];
        this.suppress = false;
    };
    // Listen for both monaco editor changes and ShareDB changes
    Bindings.prototype.listen = function () {
        var _a;
        var _b = this, viewOnly = _b.viewOnly, model = _b.model;
        (_a = this.listenerDisposable) === null || _a === void 0 ? void 0 : _a.dispose();
        if (!viewOnly)
            this.listenerDisposable = model.onDidChangeContent(this.onLocalChange);
        this.doc.removeAllListeners('op');
        this.doc.on('op', this.onRemoteChange);
    };
    // Stop listening for changes
    Bindings.prototype.unlisten = function () {
        var _a;
        if (!this.viewOnly)
            (_a = this.listenerDisposable) === null || _a === void 0 ? void 0 : _a.dispose();
        this.doc.removeAllListeners('op');
    };
    // Pause connections
    Bindings.prototype.pause = function () {
        this.unlisten();
    };
    // Resume connections
    Bindings.prototype.resume = function () {
        this.listen();
        this.setInitialValue();
    };
    // Transform monaco content change delta to ShareDB Operation.
    Bindings.prototype.deltaTransform = function (delta) {
        var offset = delta.rangeOffset, length = delta.rangeLength, text = delta.text;
        var op;
        if (text.length > 0 && length === 0)
            op = this.getInsertOp(offset, text);
        else if (text.length > 0 && length > 0)
            op = this.getReplaceOp(offset, length, text);
        else if (text.length === 0 && length > 0)
            op = this.getDeleteOp(offset, length);
        else
            throw new Error("Unexpected change: ".concat(JSON.stringify(delta)));
        return op;
    };
    // Converts insert operation into json0 (sharedb-op)
    Bindings.prototype.getInsertOp = function (index, text) {
        var _a;
        var _b = [[this.path, index], 'si', text], p = _b[0], a = _b[1], s = _b[2];
        var op = (_a = { p: p }, _a[a] = s, _a);
        return [op];
    };
    // Converts delete operation into json0 (sharedb-op)
    Bindings.prototype.getDeleteOp = function (index, length) {
        var _a;
        var text = this.lastValue.slice(index, index + length);
        var _b = [[this.path, index], 'sd', text], p = _b[0], a = _b[1], s = _b[2];
        var op = (_a = { p: p }, _a[a] = s, _a);
        return [op];
    };
    // Converts replace operation into json0 (sharedb-op)
    Bindings.prototype.getReplaceOp = function (index, length, text) {
        var _a, _b;
        var oldText = this.lastValue.slice(index, index + length);
        var _c = [[this.path, index], 'sd', oldText, 'si', text], p = _c[0], a1 = _c[1], s1 = _c[2], a2 = _c[3], s2 = _c[4];
        var op1 = (_a = { p: p }, _a[a1] = s1, _a);
        var op2 = (_b = { p: p }, _b[a2] = s2, _b);
        return [op1, op2];
    };
    // Transforms ShareDB Operations to monaco deltas to be applied.
    Bindings.prototype.opTransform = function (ops) {
        var _a = this, model = _a.model, viewOnly = _a.viewOnly;
        this.suppress = true;
        var _loop_1 = function (i) {
            var op = ops[i];
            var index = op.p[op.p.length - 1];
            var pos = model.getPositionAt(index);
            var start = pos;
            var edits = [];
            if ('sd' in op) {
                var _b = model.getPositionAt(index + op.sd.length), lineNumber = _b.lineNumber, column = _b.column;
                var range = new api_1.Range(start.lineNumber, start.column, lineNumber, column);
                edits.push({
                    range: range,
                    text: '',
                    forceMoveMarkers: true,
                });
            }
            if ('si' in op) {
                var insertRange = new api_1.Range(start.lineNumber, start.column, start.lineNumber, start.column);
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
            if (this_1.parent.editors.size === 0)
                return { value: this_1.model.applyEdits(edits) };
            this_1.parent.editors.forEach(function (editor) {
                if (viewOnly)
                    editor.updateOptions({ readOnly: false });
                editor.executeEdits('remote', edits);
                if (viewOnly)
                    editor.updateOptions({ readOnly: true });
            });
        };
        var this_1 = this;
        for (var i = 0; i < ops.length; i += 1) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        this.suppress = false;
    };
    Bindings.prototype.setViewOnly = function (viewOnly) {
        this.viewOnly = viewOnly;
        this.unlisten();
        this.listen();
    };
    // Handles local editor change events
    Bindings.prototype.onLocalChange = function (delta) {
        var _this = this;
        if (this.suppress)
            return;
        if (!this.doc.subscribed)
            this.parent.syncSubscriptions();
        var ops = delta.changes.map(function (change) { return _this.deltaTransform(change); }).flat();
        this.lastValue = this.model.getValue();
        this.doc.submitOp(ops, { source: true }, function (err) {
            if (err)
                throw err;
            if (_this.model.getValue() !== _this.doc.data[_this.path]) {
                _this.suppress = true;
                var cursors_1 = [];
                var editors_1 = Array.from(_this.parent.editors.values());
                editors_1.forEach(function (editor) { return cursors_1.push(editor.getPosition()); });
                _this.model.setValue(_this.doc.data[_this.path]);
                cursors_1.forEach(function (pos, i) { return !pos || editors_1[i].setPosition(pos); });
                // if(cursor) { this.editor.setPosition(cursor); }
                _this.suppress = false;
            }
        });
    };
    // Handles remote operations from ShareDB
    Bindings.prototype.onRemoteChange = function (ops, source) {
        if (ops.length === 0)
            return;
        var opsPath = ops[0].p.slice(0, ops[0].p.length - 1).toString();
        if (source === true || opsPath !== this.path)
            return;
        this.opTransform(ops);
        this.lastValue = this.model.getValue();
    };
    return Bindings;
}());
exports.default = Bindings;
