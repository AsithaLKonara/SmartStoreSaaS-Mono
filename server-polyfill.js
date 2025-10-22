// Polyfill for 'self' in Node.js environment
// This fixes "ReferenceError: self is not defined" during Next.js build

if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
  global.self = global;
}

if (typeof globalThis !== 'undefined' && typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}




