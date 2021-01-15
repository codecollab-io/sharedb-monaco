"use strict";
/**
 * @fileOverview
 * @name bindings.ts
 * @author Carl Voller <carlvoller8@gmail.com>
 * @license MIT
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Range_1 = require("./Range");
var Bindings = /** @class */ (function () {
    function Bindings(options) {
        this.suppress = false;
        this.editor = options.monaco;
        this.path = options.path;
        this.doc = options.doc;
        this.model = this.editor.getModel();
        this.lastValue = this.model.getValue();
        this.viewOnly = options.viewOnly;
        this.setInitialValue();
        this.onLocalChange = this.onLocalChange.bind(this);
        this.onRemoteChange = this.onRemoteChange.bind(this);
        this.listen();
    }
    // Sets the monaco editor's value to the ShareDB document's value
    Bindings.prototype.setInitialValue = function () {
        this.suppress = true;
        this.model.setValue(this.doc.data[this.path]);
        this.lastValue = this.doc.data[this.path];
        this.suppress = false;
    };
    // Listen for both monaco editor changes and ShareDB changes
    Bindings.prototype.listen = function () {
        if (!this.viewOnly) {
            this.editor.onDidChangeModelContent(this.onLocalChange);
        }
        this.doc.on('op', this.onRemoteChange);
    };
    // Stop listening for changes
    Bindings.prototype.unlisten = function () {
        if (!this.viewOnly) {
            this.editor.onDidChangeModelContent(function () { });
        }
        this.doc.on('op', this.onRemoteChange);
    };
    // Transform monaco content change delta to ShareDB Operation.
    Bindings.prototype.deltaTransform = function (delta) {
        var rangeOffset = delta.rangeOffset, rangeLength = delta.rangeLength, text = delta.text;
        var op;
        if (text.length > 0 && rangeLength === 0) {
            op = this.getInsertOp(rangeOffset, text);
        }
        else if (text.length > 0 && rangeLength > 0) {
            op = this.getReplaceOp(rangeOffset, rangeLength, text);
        }
        else if (text.length === 0 && rangeLength > 0) {
            op = this.getDeleteOp(rangeOffset, rangeLength);
        }
        else {
            throw new Error("Unexpected change: " + JSON.stringify(delta));
        }
        return op;
    };
    // Converts insert operation into json0 (sharedb-op)
    Bindings.prototype.getInsertOp = function (index, text) {
        var p = [this.path, index], a = "si", s = text;
        var op = { p: p };
        op[a] = s;
        return [op];
    };
    // Converts delete operation into json0 (sharedb-op)
    Bindings.prototype.getDeleteOp = function (index, length) {
        var text = this.lastValue.slice(index, index + length);
        var p = [this.path, index], a = "sd", s = text;
        var op = { p: p };
        op[a] = s;
        return [op];
    };
    // Converts replace operation into json0 (sharedb-op)
    Bindings.prototype.getReplaceOp = function (index, length, text) {
        var oldText = this.lastValue.slice(index, index + length);
        var p = [this.path, index], a1 = "sd", s1 = oldText, a2 = "si", s2 = text;
        var op1 = { p: p }, op2 = { p: p };
        op1[a1] = s1;
        op2[a2] = s2;
        return [op1, op2];
    };
    // Transforms ShareDB Operations to monaco deltas to be applied.
    Bindings.prototype.opTransform = function (ops) {
        var model = this.model;
        this.suppress = true;
        for (var i = 0; i < ops.length; i++) {
            var op = ops[i];
            var index = op.p[op.p.length - 1];
            var pos = model.getPositionAt(index);
            var start = pos;
            var edits = [];
            if ("sd" in op) {
                var end = model.getPositionAt(index + op.sd.length);
                edits.push({
                    range: new Range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                    text: "",
                    forceMoveMarkers: true
                });
            }
            if ("si" in op) {
                edits.push({
                    range: new Range_1.Range(start.lineNumber, start.column, start.lineNumber, start.column),
                    text: op.si,
                    forceMoveMarkers: true
                });
            }
            if (this.viewOnly) {
                this.editor.updateOptions({ readOnly: false });
            }
            this.editor.executeEdits("remote", edits);
            if (this.viewOnly) {
                this.editor.updateOptions({ readOnly: true });
            }
        }
        this.suppress = false;
    };
    // Handles local editor change events
    Bindings.prototype.onLocalChange = function (delta) {
        var _this = this;
        if (this.suppress) {
            return;
        }
        var ops = [];
        for (var i = 0; i < delta.changes.length; i++) {
            ops = ops.concat(this.deltaTransform(delta.changes[i]));
        }
        this.lastValue = this.model.getValue();
        this.doc.submitOp(ops, { source: true }, function (err) {
            if (err)
                throw err;
            if (_this.model.getValue() !== _this.doc.data[_this.path]) {
                _this.suppress = true;
                var cursor = _this.editor.getPosition();
                _this.model.setValue(_this.doc.data[_this.path]);
                if (cursor) {
                    _this.editor.setPosition(cursor);
                }
                _this.suppress = false;
            }
        });
    };
    // Handles remote operations from ShareDB
    Bindings.prototype.onRemoteChange = function (ops, source) {
        if (ops.length === 0) {
            return;
        }
        var opsPath = ops[0].p.slice(0, ops[0].p.length - 1).toString();
        if (source === true || opsPath !== this.path) {
            return;
        }
        this.opTransform(ops);
        this.lastValue = this.model.getValue();
    };
    return Bindings;
}());
exports.default = Bindings;
