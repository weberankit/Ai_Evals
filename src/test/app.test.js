import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../main/app.js';

async function withServer(app, callback) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('POST /chat sends message to service and returns JSON', async () => {
  const app = await createApp({
    supportService: {
      async chat(message) {
        return { answer: `Echo: ${message}`, retrievedDocuments: [], toolsUsed: [] };
      },
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      answer: 'Echo: Hello',
      retrievedDocuments: [],
      toolsUsed: [],
    });
  });
});

test('POST /chat rejects an empty message', async () => {
  const app = await createApp({ supportService: { async chat() { throw new Error('Should not run'); } } });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '   ' }),
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'message is required' });
  });
});

test('unknown Express routes return JSON 404', async () => {
  const app = await createApp({ supportService: { async chat() { return {}; } } });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/missing`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Not found' });
  });
});
