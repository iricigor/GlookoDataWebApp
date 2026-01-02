// Shim that exports the native DOMException
// Node.js 16+ and modern browsers have native DOMException support
module.exports = globalThis.DOMException || DOMException;
