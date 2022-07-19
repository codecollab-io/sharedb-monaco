"use strict";
/**
 * sharedb-monaco
 * ShareDB bindings for the Monaco Editor
 *
 * @name index.ts
 * @author Carl Ian Voller <carlvoller8@gmail.com>
 * @license MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var reconnecting_websocket_1 = __importDefault(require("reconnecting-websocket"));
var client_1 = __importDefault(require("sharedb/lib/client"));
var monaco_editor_1 = require("monaco-editor");
var bindings_1 = __importDefault(require("./bindings"));
var ShareDBMonaco = /** @class */ (function () {
    /**
     * ShareDBMonaco
     * @param {ShareDBMonacoOptions} opts - Options object
     * @param {string} opts.id - ShareDB document ID
     * @param {string} opts.namespace - ShareDB document namespace
     * @param {string} opts.path - Path on ShareDB document to apply operations to.
     * @param {boolean} opts.viewOnly - Set model to view only mode
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    function ShareDBMonaco(opts) {
        var _this = this;
        this.editors = new Map();
        var id = opts.id, namespace = opts.namespace, path = opts.path, viewOnly = opts.viewOnly;
        // Parameter checks
        if (!id)
            throw new Error("'id' is required but not provided");
        if (!namespace)
            throw new Error("'namespace' is required but not provided");
        if (typeof viewOnly !== 'boolean')
            throw new Error("'viewOnly' is required but not provided");
        var connection;
        if ('wsurl' in opts) {
            this.WS = new reconnecting_websocket_1.default(opts.wsurl);
            connection = new client_1.default.Connection(this.WS);
        }
        else
            connection = opts.connection;
        // Get ShareDB Doc
        var doc = connection.get(opts.namespace, opts.id);
        this.doc = doc;
        this.connection = connection;
        this.namespace = namespace;
        this.id = id;
        this.model = monaco_editor_1.editor.createModel('');
        doc.subscribe(function (err) {
            if (err)
                throw err;
            if (doc.type === null)
                throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');
            _this.binding = new bindings_1.default({ model: _this.model, path: path, doc: doc, viewOnly: viewOnly, parent: _this });
        });
    }
    Object.defineProperty(ShareDBMonaco.prototype, "allEditors", {
        get: function () {
            return this.editors;
        },
        enumerable: false,
        configurable: true
    });
    // Attach editor to ShareDB model
    ShareDBMonaco.prototype.add = function (codeEditor, options) {
        if (this.connection.state === 'disconnected')
            throw new Error('add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.');
        if (this.editors.size === 0)
            this.resume();
        // Set model language
        if (options === null || options === void 0 ? void 0 : options.langId)
            monaco_editor_1.editor.setModelLanguage(this.model, options.langId);
        else if (options === null || options === void 0 ? void 0 : options.model)
            monaco_editor_1.editor.setModelLanguage(this.model, options.model.getLanguageId());
        codeEditor.setModel(this.model);
        if (!this.editors.has(codeEditor.getId()))
            this.editors.set(codeEditor.getId(), codeEditor);
        return this.model;
    };
    // Pause doc subscriptions
    ShareDBMonaco.prototype.pause = function () {
        var _this = this;
        var _a;
        (_a = this.binding) === null || _a === void 0 ? void 0 : _a.pause();
        this.doc.unsubscribe(function () { return _this.doc.destroy(); });
    };
    // Resume doc subscriptions
    ShareDBMonaco.prototype.resume = function () {
        var _this = this;
        var _a = this, connection = _a.connection, namespace = _a.namespace, id = _a.id, binding = _a.binding;
        this.doc = connection.get(namespace, id);
        this.doc.subscribe(function (err) {
            if (err)
                throw err;
            if (_this.doc.type === null)
                throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');
            binding === null || binding === void 0 ? void 0 : binding.resume(_this.doc);
        });
    };
    // Detach model from ShareDBMonaco
    ShareDBMonaco.prototype.remove = function (id) {
        if (this.editors.has(id)) {
            // Forced ! here cause typescript can't recognise I used the has() operator previously.
            // https://github.com/microsoft/TypeScript/issues/9619
            this.editors.get(id).setModel(null);
            this.editors.delete(id);
        }
        if (this.editors.size === 0)
            this.pause();
    };
    ShareDBMonaco.prototype.close = function () {
        var _a, _b;
        this.doc.destroy();
        (_a = this.binding) === null || _a === void 0 ? void 0 : _a.unlisten();
        // If connection was opened by this instance, close it.
        if (this.WS) {
            (_b = this.WS) === null || _b === void 0 ? void 0 : _b.close();
            this.connection.close();
        }
    };
    return ShareDBMonaco;
}());
exports.default = ShareDBMonaco;
