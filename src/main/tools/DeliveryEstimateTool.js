// Example delivery tool. Replace this in a real app with a carrier/order-system call.
export class DeliveryEstimateTool {
  static description = 'Get the expected delivery date for a specific order.';

  constructor(toolTracker) { this.toolTracker = toolTracker; }

  getDeliveryEstimate(orderId) {
    const normalizedOrderId = orderId.trim().toUpperCase();
    const orders = {
      'ORD-101': 'Order ORD-101 is expected to be delivered on 15 October 2026.',
      'ORD-102': 'Order ORD-102 has already been delivered.',
      'ORD-103': 'Order ORD-103 has already been delivered.',
    };
    const result = orders[normalizedOrderId] ?? 'Delivery information not found.';
    this.toolTracker.record('getDeliveryEstimate', normalizedOrderId, result);
    return result;
  }
}
