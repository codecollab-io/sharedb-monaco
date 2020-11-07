"use strict";
/**
 * @fileOverview
 * @name bindings.ts
 * @author Carl Voller <carlvoller8@gmail.com>
 * @license MIT
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var monaco = __importStar(require("monaco-editor"));
var Bindings = /** @class */ (function () {
    function Bindings(options) {
        this.suppress = false;
        this.editor = options.monaco;
        this.path = options.path;
        this.doc = options.doc;
        this.model = this.editor.getModel();
        this.lastValue = this.model.getValue();
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
        this.editor.onDidChangeModelContent(this.onLocalChange);
        this.doc.on('op', this.onRemoteChange);
    };
    // Stop listening for changes
    Bindings.prototype.unlisten = function () {
        this.editor.onDidChangeModelContent(function () { });
        this.doc.on('op', this.onRemoteChange);
    };
    // Transform monaco content change delta to ShareDB Operation.
    Bindings.prototype.deltaTransform = function (delta) {
        var rangeOffset = delta.rangeOffset, rangeLength = delta.rangeLength, text = delta.text;
        console.log(delta);
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
        return op;
    };
    // Converts delete operation into json0 (sharedb-op)
    Bindings.prototype.getDeleteOp = function (index, length) {
        var text = this.lastValue.slice(index, index + length);
        var p = [this.path, index], a = "sd", s = text;
        var op = { p: p };
        op[a] = s;
        return op;
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
                    range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                    text: "",
                    forceMoveMarkers: true
                });
            }
            if ("si" in op) {
                edits.push({
                    range: new monaco.Range(start.lineNumber, start.column, start.lineNumber, start.column),
                    text: op.si,
                    forceMoveMarkers: true
                });
            }
            this.editor.executeEdits("remote", edits);
        }
        this.suppress = false;
    };
    // Handles local editor change events
    Bindings.prototype.onLocalChange = function (delta) {
        if (this.suppress) {
            return;
        }
        var op = this.deltaTransform(delta.changes[0]);
        this.lastValue = this.model.getValue();
        this.doc.submitOp(op, { source: true }, function (err) {
            if (err)
                throw err;
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
