// Instrumentation file - runs before app initialization
// This fixes "self is not defined" error in Node.js server environment

export async function register() {
  // Polyfill 'self' for server-side rendering
  if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
    (global as any).self = global;
  }
  
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).self === 'undefined') {
    (globalThis as any).self = globalThis;
  }
  
  console.log('✅ Server polyfill applied: self is now defined');
}




