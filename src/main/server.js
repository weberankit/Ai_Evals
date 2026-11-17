import { createApp } from './app.js';

// Keep listening separate from app construction so tests can create the Express app without a port.
const app = await createApp();
const port = Number(process.env.PORT ?? 8080);
app.listen(port, '127.0.0.1', () => {
  console.log(`Express support agent listening on http://localhost:${port}`);
});
