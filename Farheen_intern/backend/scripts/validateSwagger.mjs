import swaggerSpec from '../src/config/swagger.js';

function collectRefs(obj, refs = []) {
  if (!obj || typeof obj !== 'object') return refs;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (key === '$ref' && typeof val === 'string') refs.push(val);
    else if (Array.isArray(val)) val.forEach((v) => collectRefs(v, refs));
    else if (typeof val === 'object') collectRefs(val, refs);
  }
  return refs;
}

const refs = collectRefs(swaggerSpec);
const uniqueRefs = Array.from(new Set(refs));
console.log('Found', refs.length, 'refs,', uniqueRefs.length, 'unique');

const missing = [];
for (const ref of uniqueRefs) {
  if (!ref.startsWith('#/')) continue; // external refs ignored
  // only handle local component refs like '#/components/schemas/Name'
  const parts = ref.slice(2).split('/');
  let node = swaggerSpec;
  let ok = true;
  for (const p of parts) {
    if (node && typeof node === 'object' && p in node) node = node[p];
    else {
      ok = false; break;
    }
  }
  if (!ok) missing.push(ref);
}

if (missing.length) {
  console.error('Missing local $ref targets:', missing);
  process.exit(2);
}

console.log('All local $ref targets exist.');
console.log('OpenAPI version:', swaggerSpec.openapi || swaggerSpec.swagger);
console.log('Paths:', Object.keys(swaggerSpec.paths || {}).length);
console.log('Schemas:', Object.keys((swaggerSpec.components && swaggerSpec.components.schemas) || {}).length);
