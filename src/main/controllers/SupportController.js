import { Router } from 'express';

// Controller translates HTTP input into a service call and service output into HTTP JSON.
export function createSupportRouter(supportService) {
  const router = Router();

  router.post('/chat', async (request, response, next) => {
    const message = request.body?.message ?? request.query.message;

    if (typeof message !== 'string' || !message.trim()) {
      return response.status(400).json({ error: 'message is required' });
    }

    try {
      const result = await supportService.chat(message.trim());
      return response.json(result);
    } catch (error) {
      return next(error);
    }
  });

  // Route-local error handling keeps model/provider failures from becoming unhandled rejections.
  router.use((error, _request, response, _next) => {
    console.error(error.message);
    return response.status(502).json({ error: 'Unable to generate a support response' });
  });

  return router;
}
