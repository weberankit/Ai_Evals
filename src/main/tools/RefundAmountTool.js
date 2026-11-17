// Example refund lookup tool. Replace this map with the real refund data source.
export class RefundAmountTool {
  static description = 'Get the approved refund amount for a specific order.';

  constructor(toolTracker) { this.toolTracker = toolTracker; }

  getRefundAmount(orderId) {
    const normalizedOrderId = orderId.trim().toUpperCase();
    const orders = {
      'ORD-103': 'The approved refund amount for ORD-103 is INR 4999.',
      'ORD-101': 'No refund has been approved for ORD-101.',
      'ORD-102': 'No refund has been approved for ORD-102.',
    };
    const result = orders[normalizedOrderId] ?? 'Refund information not found.';
    this.toolTracker.record('getRefundAmount', normalizedOrderId, result);
    return result;
  }
}
