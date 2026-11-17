import express from 'express';
import { ChatClient } from './infrastructure/ChatClient.js';
import { SimpleVectorStore } from './infrastructure/SimpleVectorStore.js';
import { ToolTracker } from './ToolTracker.js';
import { OrderStatusTool } from './tools/OrderStatusTool.js';
import { DeliveryEstimateTool } from './tools/DeliveryEstimateTool.js';
import { RefundAmountTool } from './tools/RefundAmountTool.js';
import { SupportService } from './SupportService.js';
import { createSupportRouter } from './controllers/SupportController.js';

// Composition root: construct the application's dependencies once and connect them.
export async function createApp({ supportService, chatClient } = {}) {
  if (!supportService) {
    const client = chatClient ?? new ChatClient();
    const tracker = new ToolTracker();
    const vectorStore = new SimpleVectorStore(client);

    // Tools share a request-scoped tracker so evals and API responses can inspect tool use.
    supportService = new SupportService(
      client,
      vectorStore,
      new OrderStatusTool(tracker),
      new DeliveryEstimateTool(tracker),
      new RefundAmountTool(tracker),
      tracker,
    );
    await supportService.loadKnowledgeBase();
  }

  const app = express();

  // Parse JSON and form requests; Express enforces a modest body-size limit.
  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));

  app.get('/health', (_request, response) => response.json({ status: 'ok' }));
  app.use(createSupportRouter(supportService));
  app.locals.supportService = supportService;

  // Anything not handled above returns a consistent JSON 404 response.
  app.use((_request, response) => response.status(404).json({ error: 'Not found' }));

  return app;
}
