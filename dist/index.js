"use strict";
/**
 * sharedb-monaco
 * ShareDB bindings for the Monaco Editor
 *
 * @name index.ts
 * @author Carl Ian Voller <carlvoller8@gmail.com>
 * @license MIT
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var reconnecting_websocket_1 = __importDefault(require("reconnecting-websocket"));
var event_emitter_es6_1 = __importDefault(require("event-emitter-es6"));
var client_1 = __importDefault(require("sharedb/lib/client"));
var bindings_1 = __importDefault(require("./bindings"));
var ShareDBMonaco = /** @class */ (function (_super) {
    __extends(ShareDBMonaco, _super);
    /**
     * ShareDBMonaco
     * @param {ShareDBMonacoOptions} opts - Options object
     * @param {string} opts.id - ShareDB document ID
     * @param {string} opts.namespace - ShareDB document namespace
     * @param {string} opts.wsurl (Optional) - URL for ShareDB Server API
     * @param {sharedb.Connection} opts.connection (Optional) - ShareDB Connection instance
     */
    function ShareDBMonaco(opts) {
        var _this = _super.call(this) || this;
        _this.bindings = new Map();
        // Parameter checks
        if (!opts.id) {
            throw new Error("'id' is required but not provided");
        }
        if (!opts.namespace) {
            throw new Error("'namespace' is required but not provided");
        }
        var connection;
        if ("wsurl" in opts) {
            _this.WS = new reconnecting_websocket_1.default(opts.wsurl);
            connection = new client_1.default.Connection(_this.WS);
        }
        else {
            connection = opts.connection;
        }
        // Get ShareDB Doc
        var doc = connection.get(opts.namespace, opts.id);
        doc.subscribe(function (err) {
            if (err)
                throw err;
            if (doc.type === null) {
                throw new Error("ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.");
            }
            // Document has been initialised, emit 'ready' event
            _this.emit("ready");
        });
        _this.doc = doc;
        _this.connection = connection;
        _this.namespace = opts.namespace;
        _this.id = opts.id;
        return _this;
    }
    // Attach model to ShareDBMonaco
    ShareDBMonaco.prototype.add = function (model, path, viewOnly) {
        if (viewOnly === void 0) { viewOnly = false; }
        var doc = this.doc;
        if (this.connection.state === "disconnected") {
            throw new Error("add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.");
        }
        if (this.bindings.has(model.id))
            return this.bindings.get(model.id);
        this.bindings.set(model.id, new bindings_1.default({ model: model, path: path, doc: doc, viewOnly: viewOnly }));
    };
    // Pause doc subscriptions
    ShareDBMonaco.prototype.pause = function () {
        console.log("PAUSING", this.id);
        this.bindings.forEach(function (binding) { return binding.pause(); });
        this.doc.destroy();
    };
    // Resume doc subscriptions
    ShareDBMonaco.prototype.resume = function () {
        var _this = this;
        var _a = this, connection = _a.connection, namespace = _a.namespace, id = _a.id, bindings = _a.bindings;
        this.doc = connection.get(namespace, id);
        this.doc.subscribe(function (err) {
            if (err)
                throw err;
            if (_this.doc.type === null) {
                throw new Error("ShareDB document uninitialized. Check if the id is correct and you have initialised the document on the server.");
            }
            bindings.forEach(function (binding) { return binding.resume(_this.doc); });
        });
    };
    // Detach model from ShareDBMonaco
    ShareDBMonaco.prototype.remove = function (id) {
        if (this.bindings.has(id))
            this.bindings.delete(id);
    };
    ShareDBMonaco.prototype.close = function () {
        var _a;
        this.doc.destroy();
        this.bindings.forEach(function (binding) { return binding.unlisten(); });
        this.emit("close");
        // If connection was opened by this instance, close it.
        if (this.WS) {
            (_a = this.WS) === null || _a === void 0 ? void 0 : _a.close();
            this.connection.close();
        }
    };
    return ShareDBMonaco;
}(event_emitter_es6_1.default));
exports.default = ShareDBMonaco;
