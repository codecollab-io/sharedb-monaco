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
     * @param {string} opts.wsurl - URL for ShareDB Server API
     */
    function ShareDBMonaco(opts) {
        var _this = _super.call(this) || this;
        // Parameter checks
        if (!opts.id) {
            throw new Error("'id' is required but not provided");
        }
        if (!opts.namespace) {
            throw new Error("'namespace' is required but not provided");
        }
        if (!opts.wsurl) {
            throw new Error("'wsurl' is required but not provided");
        }
        _this.WS = new reconnecting_websocket_1.default(opts.wsurl);
        // Get ShareDB Doc
        var connection = new client_1.default.Connection(_this.WS);
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
        return _this;
    }
    // Attach editor to ShareDBMonaco
    ShareDBMonaco.prototype.add = function (monaco, path, viewOnly) {
        if (this.connection.state === "disconnected") {
            throw new Error("add() called after close(). You cannot attach an editor once you have closed the ShareDB Connection.");
        }
        var sharePath = path || "";
        this.bindings = new bindings_1.default({
            monaco: monaco,
            path: sharePath,
            doc: this.doc,
            viewOnly: !!viewOnly
        });
    };
    ShareDBMonaco.prototype.close = function () {
        if (this.bindings) {
            this.bindings.unlisten();
        }
        this.connection.close();
        this.emit("close");
    };
    return ShareDBMonaco;
}(event_emitter_es6_1.default));
exports.default = ShareDBMonaco;
