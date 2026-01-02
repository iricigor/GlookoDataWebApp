# NPM Shims

This directory contains local npm package shims used to override deprecated dependencies.

## node-domexception

This shim replaces the deprecated `node-domexception@1.0.0` package with a minimal wrapper that exports the platform's native `DOMException` class.

### Why?

The `node-domexception` package was deprecated with the message: "Use your platform's native DOMException instead"

Since Node.js 16+ and modern browsers have native `DOMException` support, we don't need the deprecated package. However, some dependencies (like `swagger-ui-react` → `swagger-client` → `node-fetch-commonjs`) still depend on it.

### Solution

We use npm overrides to replace `node-domexception` with this local shim that simply exports the native `DOMException`:

```javascript
module.exports = globalThis.DOMException || DOMException;
```

This eliminates the deprecation warning during `npm install` while maintaining compatibility with packages that expect the `node-domexception` module.

### Files

- `node-domexception/` - The shim package source
- `../node-domexception-1.0.0.tgz` - Packed tarball referenced in package.json overrides

### Maintenance

If you need to update the shim:
1. Modify files in `.npm-shims/node-domexception/`
2. Run: `npm pack .npm-shims/node-domexception` and move the generated .tgz file to the root directory
3. Update package.json override if the tarball name changes
4. Run: `npm install` to apply changes
