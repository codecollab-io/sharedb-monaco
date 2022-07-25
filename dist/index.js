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
var bindings_1 = __importDefault(require("./bindings"));
var ShareDBMonaco = /** @class */ (function () {
    /**
     * ShareDBMonaco
     * @param {ShareDBMonacoOptions} opts - Options object
     * @param {string} opts.id - ShareDB document ID
     * @param {string} opts.namespace - ShareDB document namespace
     * @param {string} opts.sharePath - Path on ShareDB document to apply operations to.
     * @param {boolean} opts.viewOnly - Set model to view only mode
     * @param {monaco} opts.monaco (Optional) - Monaco objects for language inference
     * @param {Uri} opts.uri (Optional) - Uri for model creation
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    function ShareDBMonaco(opts) {
        var _this = this;
        this._editors = new Map();
        var id = opts.id, namespace = opts.namespace, sharePath = opts.sharePath, viewOnly = opts.viewOnly;
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
        this.connection = connection;
        if ('monaco' in opts) {
            this.monaco = opts.monaco;
            this.model = opts.monaco.editor.createModel('', undefined, opts.uri);
        }
        else
            this.model = opts.model;
        this._doc = doc;
        this._namespace = namespace;
        this._id = id;
        this._viewOnly = viewOnly;
        this._sharePath = sharePath;
        doc.subscribe(function (err) {
            if (err)
                throw err;
            if (doc.type === null)
                throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');
            _this.binding = new bindings_1.default({
                model: _this.model, path: sharePath,
                doc: doc,
                viewOnly: viewOnly,
                parent: _this,
            });
        });
    }
    Object.defineProperty(ShareDBMonaco.prototype, "viewOnly", {
        get: function () { return this._viewOnly; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ShareDBMonaco.prototype, "namespace", {
        get: function () { return this._namespace; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ShareDBMonaco.prototype, "id", {
        get: function () { return this._id; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ShareDBMonaco.prototype, "editors", {
        get: function () { return this._editors; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ShareDBMonaco.prototype, "doc", {
        get: function () { return this._doc; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ShareDBMonaco.prototype, "sharePath", {
        get: function () { return this._sharePath; },
        enumerable: false,
        configurable: true
    });
    ShareDBMonaco.prototype.setViewOnly = function (viewOnly) {
        var _a;
        (_a = this.binding) === null || _a === void 0 ? void 0 : _a.setViewOnly(viewOnly);
    };
    ShareDBMonaco.prototype.setModelUri = function (uri) {
        var _a;
        var _b = this, model = _b.model, doc = _b.doc, viewOnly = _b.viewOnly, sharePath = _b.sharePath, m = _b.monaco;
        if (!m)
            throw new Error("This method is only available if 'monaco' was set on instantiation.");
        var newModel = m.editor.createModel(model.getValue(), model.getLanguageId(), uri);
        // const { fsPath } = uri; // \\filename
        // const formatted = uri.toString(); // file:///filename
        /* const editStacks = model._commandManager._undoRedoService._editStacks

        const newEditStacks = new Map()

        function adjustEditStack(c) {
            c.actual.model = newModel
            c.resourceLabel = fsPath
            c.resourceLabels = [fsPath]
            c.strResource = formatted
            c.strResources = [formatted]
        }

        editStacks.forEach((s) => {
            s.resourceLabel = fsPath
            s.strResource = formatted

            s._future.forEach(adjustEditStack)
            s._past.forEach(adjustEditStack)

            newEditStacks.set(formatted, s)
        })

        newModel._commandManager._undoRedoService._editStacks = newEditStacks */
        model.dispose();
        var editors = Array.from(this.editors.values());
        var cursors = editors.map(function (e) { return e.getPosition(); });
        this.editors.forEach(function (e) { return e.setModel(newModel); });
        cursors.forEach(function (pos, i) { return !pos || editors[i].setPosition(pos); });
        (_a = this.binding) === null || _a === void 0 ? void 0 : _a.unlisten();
        this.binding = new bindings_1.default({
            model: newModel, path: sharePath,
            doc: doc,
            viewOnly: viewOnly,
            parent: this,
        });
        return newModel;
    };
    // Attach editor to ShareDB model
    ShareDBMonaco.prototype.add = function (codeEditor, options) {
        if (this.connection.state === 'disconnected')
            throw new Error('add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.');
        if (options && !this.monaco)
            console.warn("Supplying options to this function without passing 'monaco' in instantiation will have no effect.");
        if (this.editors.size === 0)
            this.resume();
        // Set model language
        if (options && this.monaco) {
            var langId = options.langId, model = options.model, uri = options.uri;
            if (uri && uri.path !== this.model.uri.path)
                this.setModelUri(uri);
            if (langId)
                this.monaco.editor.setModelLanguage(this.model, langId);
            else if (model)
                this.monaco.editor.setModelLanguage(this.model, model.getLanguageId());
        }
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
        this._doc = connection.get(namespace, id);
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
        this.model.dispose();
        // If connection was opened by this instance, close it.
        if (this.WS) {
            (_b = this.WS) === null || _b === void 0 ? void 0 : _b.close();
            this.connection.close();
        }
    };
    return ShareDBMonaco;
}());
exports.default = ShareDBMonaco;
