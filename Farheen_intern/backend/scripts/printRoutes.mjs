import app from '../src/app.js';

function listRoutes(app) {
  const routes = [];
  const router = app._router || app.router || app;
  const stack = router?.stack || [];
  for (const layer of stack) {
    // express 4/5 route layers
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods || {}).join(',');
      routes.push({ path, methods });
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      for (const nested of layer.handle.stack) {
        if (nested.route) {
          const path = nested.route.path;
          const methods = Object.keys(nested.route.methods || {}).join(',');
          routes.push({ path: layer.regexp && layer.regexp.source ? `${layer.regexp.source} -> ${path}` : path, methods });
        }
      }
    } else if (layer.name === 'serveStatic' || layer.name === 'serve') {
      routes.push({ path: layer.regexp?.toString() || '<static>', methods: 'GET' });
    }
  }

  return routes;
}

console.log('Listing routes:');
console.log('app._router:', !!app._router);
if (app._router) {
  console.log('stack length:', app._router.stack.length);
}
console.dir(listRoutes(app), { depth: 5 });
console.log('\napp keys:');
console.log(Object.getOwnPropertyNames(app).sort());
const router = app._router || app.router || app;
console.log('\nRouter stack (detailed):');
if (router && router.stack) {
  for (const [i, layer] of router.stack.entries()) {
    console.log(i, 'name=', layer.name || '<anonymous>', 'path=', layer.route?.path || layer.regexp?.toString?.() || '<none>');
  }
} else {
  console.log('No router stack present');
}

// Perform an internal request to /api-docs using supertest to see what the app returns
try {
  const request = (await import('supertest')).default;
  const res = await request(app).get('/api-docs');
  const resJson = await request(app).get('/api-docs').set('Accept', 'application/json');
  console.log('\nInternal GET /api-docs status:', res.status);
  console.log('Headers:', res.headers['content-type']);
  console.log('Body (first 500 chars):');
  const text = res.text || JSON.stringify(res.body);
  console.log(text && text.substring ? text.substring(0, 500) : text);
} catch (err) {
  console.error('Error performing internal request to /api-docs:', err.message);
}
try {
  const request = (await import('supertest')).default;
  const res2 = await request(app).get('/api-docs/');
  const res2Json = await request(app).get('/api-docs/').set('Accept', 'application/json');
  console.log('\nInternal GET /api-docs/ status:', res2.status);
  console.log('Headers:', res2.headers['content-type']);
  console.log('Body starts with:');
  const text2 = res2.text || JSON.stringify(res2.body);
  console.log(text2 && text2.substring ? text2.substring(0, 200) : text2);
  console.log('\nInternal GET /api-docs/ Accept:application/json status:', res2Json.status);
  console.log('Body:', res2Json.body && Object.keys(res2Json.body).length ? JSON.stringify(res2Json.body).substring(0,200) : '<no-json>');
} catch (err) {
  console.error('Error performing internal request to /api-docs/:', err.message);
}
try {
  const request = (await import('supertest')).default;
  const res3 = await request(app).head('/api-docs');
  console.log('\nInternal HEAD /api-docs status:', res3.status);
} catch (err) {
  console.error('Error performing internal HEAD to /api-docs:', err.message);
}
