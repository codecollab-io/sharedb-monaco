"use strict";
/**
 * sharedb-monaco
 * ShareDB bindings for the Monaco Editor
 *
 * @name index.ts
 * @author Carl Ian Voller <carlvoller8@gmail.com>
 * @license MIT
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
     * @param {string} opts.loadingText (Optional) - Text to show while ShareDB is loading
     * @param {Monaco} opts.monaco (Optional) - Monaco objects for language inference
     * @param {Uri} opts.uri (Optional) - Uri for model creation
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    function ShareDBMonaco(opts) {
        var _this = this;
        this._editors = new Map();
        var id = opts.id, namespace = opts.namespace, sharePath = opts.sharePath, _a = opts.viewOnly, viewOnly = _a === void 0 ? false : _a, loadingText = opts.loadingText;
        var connection = opts.connection;
        // Parameter checks
        if (!id)
            throw new Error("'id' is required but not provided");
        if (!namespace)
            throw new Error("'namespace' is required but not provided");
        if (!connection)
            throw new Error("'connection' is required but not provided.");
        if (typeof viewOnly !== 'boolean')
            throw new Error("'viewOnly' should be a boolean");
        if (typeof connection === 'string') {
            this.WS = new reconnecting_websocket_1.default(connection);
            connection = new client_1.default.Connection(this.WS);
        }
        // Get ShareDB Doc
        var doc = connection.get(opts.namespace, opts.id);
        this.connection = connection;
        if ('monaco' in opts) {
            this.monaco = opts.monaco;
            if (opts.uri)
                this._model = opts.monaco.editor.getModel(opts.uri) || opts.monaco.editor.createModel('', undefined, opts.uri);
            else
                this._model = opts.monaco.editor.createModel(loadingText || 'Loading...');
        }
        else
            this._model = opts.model;
        this._doc = doc;
        this._namespace = namespace;
        this._id = id;
        this._viewOnly = viewOnly || false;
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
    Object.defineProperty(ShareDBMonaco.prototype, "model", {
        get: function () { return this._model; },
        enumerable: false,
        configurable: true
    });
    /**
     * Toggles the View-Only state of the bindings.
     * When set to true, will not publish any local changes
     * @param {boolean} viewOnly - Set to true to set to View-Only mode
     */
    ShareDBMonaco.prototype.setViewOnly = function (viewOnly) {
        var _a;
        (_a = this.binding) === null || _a === void 0 ? void 0 : _a.setViewOnly(viewOnly);
    };
    /**
     * Sets the Uri for the internal monaco model.
     * This will override any previously set language using setLangId
     * and will infer the new language from the uri.
     * @param {Monaco.Uri} uri - Set the Uri for the internal monaco model.
     */
    ShareDBMonaco.prototype.setModelUri = function (uri) {
        var _a;
        var _b = this, model = _b.model, monaco = _b.monaco;
        if (!monaco)
            throw new Error("This method is only available if 'monaco' was set on instantiation.");
        // Only set new model language, do not replace model if uri is the same
        if (uri.path === model.uri.path) {
            var tempModel = monaco.editor.createModel('', '', monaco.Uri.file("".concat(Date.now(), "/").concat(uri.path)));
            var lang = tempModel.getLanguageId();
            monaco.editor.setModelLanguage(model, lang);
            tempModel.dispose();
            return model;
        }
        // Dispose any existing models with this uri that may be lingering
        (_a = monaco.editor.getModel(uri)) === null || _a === void 0 ? void 0 : _a.dispose();
        var newModel = monaco.editor.createModel(model.getValue(), undefined, uri);
        model.dispose();
        var editors = Array.from(this.editors.values());
        var cursors = editors.map(function (e) { return e.getPosition(); });
        this.editors.forEach(function (e) { return e.setModel(newModel); });
        cursors.forEach(function (pos, i) { return !pos || editors[i].setPosition(pos); });
        if (this.binding)
            this.binding.model = newModel;
        this._model = newModel;
        return newModel;
    };
    /**
     * Sets the language of the internal monaco model
     * @param {string} langId - The Language ID
     */
    ShareDBMonaco.prototype.setLangId = function (langId) {
        var _a = this, monaco = _a.monaco, model = _a.model;
        if (!monaco)
            throw new Error("This method is only available if 'monaco' was set on instantiation.");
        monaco.editor.setModelLanguage(model, langId);
    };
    /**
     * Attach editor to ShareDB Monaco model
     * If multiple language options are set, sharedb-monaco will prioritise them
     * in the order of: opts.langId > opts.model > opts.uri
     * @param {Monaco.editor.ICodeEditor} codeEditor - The editor instance
     * @param {AttachOptions} opts (Optional) - Language options
     * @param {Monaco.editor.ITextModel} opts.model (Optional) - Infer language mode from this model
     * @param {string} opts.langId (Optional) - Set language mode with this id
     * @param {Monaco.Uri} opts.uri (Optional) - Override existing model Uri
     */
    ShareDBMonaco.prototype.add = function (codeEditor, opts) {
        var _a = this, connection = _a.connection, monaco = _a.monaco, editors = _a.editors;
        if (connection.state === 'disconnected')
            throw new Error('add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.');
        if (opts && !monaco)
            console.warn("Supplying options to this function without passing 'monaco' in instantiation will have no effect.");
        if (editors.size === 0)
            this.resume();
        // Set model language
        if (opts && monaco) {
            var langId = opts.langId, model = opts.model, uri = opts.uri;
            if (uri && uri.path !== this.model.uri.path)
                this.setModelUri(uri);
            if (langId)
                monaco.editor.setModelLanguage(this.model, langId);
            else if (model)
                monaco.editor.setModelLanguage(this.model, model.getLanguageId());
        }
        codeEditor.setModel(this.model);
        if (!editors.has(codeEditor.getId()))
            editors.set(codeEditor.getId(), codeEditor);
        return this.model;
    };
    /**
     * @private
     * Syncs or "wakes" document subscriptions.
     * This method should not be used unless explicitly necessary
     */
    ShareDBMonaco.prototype.syncSubscriptions = function () {
        var _a = this, editors = _a.editors, doc = _a.doc;
        if (editors.size > 0 && !doc.subscribed)
            this.resume();
    };
    // Pause doc subscriptions to save bandwidth
    ShareDBMonaco.prototype.pause = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        (_a = this.binding) === null || _a === void 0 ? void 0 : _a.pause();
                        return [4 /*yield*/, new Promise(function (resolve) { return _this.doc.unsubscribe(function () { return _this.doc.destroy(resolve); }); })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Resume doc subscriptions
    ShareDBMonaco.prototype.resume = function () {
        var _this = this;
        this.doc.subscribe(function (err) {
            var _a;
            if (err)
                throw err;
            if (_this.doc.type === null)
                throw new Error('ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.');
            (_a = _this.binding) === null || _a === void 0 ? void 0 : _a.resume();
        });
    };
    /**
     * Detach model from ShareDBMonaco
     * @async
     * @param {string} id - Editor ID from ICodeEditor.getId()
     */
    ShareDBMonaco.prototype.remove = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var editors;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        editors = this.editors;
                        if (editors.has(id)) {
                            // Forced ! here cause typescript can't recognise I used the has() operator previously.
                            // https://github.com/microsoft/TypeScript/issues/9619
                            editors.get(id).setModel(null);
                            editors.delete(id);
                        }
                        if (!(editors.size === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.pause()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Close model and clean up
     * Will also close the connection if connection was created by sharedb-monaco
     */
    ShareDBMonaco.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, model, editors, WS, connection;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, model = _a.model, editors = _a.editors, WS = _a.WS, connection = _a.connection;
                        return [4 /*yield*/, this.pause()];
                    case 1:
                        _b.sent();
                        model.dispose();
                        editors.forEach(function (e) { return e.setModel(null); });
                        editors.clear();
                        // If connection was opened by this instance, close it.
                        if (WS) {
                            WS === null || WS === void 0 ? void 0 : WS.close();
                            connection.close();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return ShareDBMonaco;
}());
exports.default = ShareDBMonaco;
