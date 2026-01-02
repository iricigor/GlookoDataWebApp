// Shim that exports the native DOMException
// Node.js 16+ and modern browsers have native DOMException support
// This shim is only used in Node.js 20+ environments where DOMException is guaranteed to exist
module.exports = globalThis.DOMException;
