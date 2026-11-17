// Example order-status tool. In a real app this would read from an order system.
export class OrderStatusTool {
  static description = 'Get current order status. Use only for a specific order status question, not delivery dates.';

  constructor(toolTracker) { this.toolTracker = toolTracker; }

  getOrderStatus(orderId) {
    const normalizedOrderId = orderId.trim().toUpperCase();
    const orders = {
      'ORD-101': 'Order ORD-101 status is SHIPPED. It has not been delivered yet.',
      'ORD-102': 'Order ORD-102 status is DELIVERED. It was delivered 20 days ago.',
      'ORD-103': 'Order ORD-103 status is DELIVERED. A refund has been approved.',
    };
    const result = orders[normalizedOrderId] ?? 'Order not found.';
    this.toolTracker.record('getOrderStatus', normalizedOrderId, result);
    return result;
  }
}
