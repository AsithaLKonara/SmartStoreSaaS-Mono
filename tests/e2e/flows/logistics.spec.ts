import { test, expect } from '../utils/test-base';
import { getAuthToken } from '../utils/auth';
import { resetDatabase, seedDatabase, createTestOrganization } from '../utils/test-data';

test.describe('Real-World Logistics, Fulfillment, and Payment Webhook Systems', () => {
  let adminToken: string;
  let customerToken: string;
  let organizationId: string;

  test.beforeEach(async ({ request }) => {
    await resetDatabase(request);
    const seed = await seedDatabase(request, 'full');
    adminToken = await getAuthToken(request, 'tenantAdmin');
    customerToken = await getAuthToken(request, 'customer');
    organizationId = seed.organization.id;
  });

  test('Webhook & Fulfillment: Real-world payment confirmation, duplicate validation, and successful fulfillment', async ({ request }) => {
    // 1. Create a product and a customer order
    const productResponse = await request.post('/api/test/create-product', {
      data: {
        name: 'Logistics Hoodie',
        sku: 'LOG-HD',
        price: 50.00,
        organizationId
      }
    });
    const product = await productResponse.json();

    const customerResponse = await request.post('/api/customers', {
      headers: { 
        'X-Organization-Id': organizationId,
        'Authorization': `Bearer ${adminToken}`
      },
      data: {
        name: 'Logan Logistics',
        email: 'logan@logistics.com',
        phone: '999888777'
      }
    });
    const { data: customer } = await customerResponse.json();

    const orderResponse = await request.post('/api/test/create-order', {
      data: {
        customerId: customer.id,
        organizationId,
        items: [{ productId: product.product.id, quantity: 2, price: 50.00 }]
      }
    });
    const order = await orderResponse.json();
    const orderId = order.order.id;

    // Verify initial state is PENDING
    const getInitialOrder = await request.get(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const initialOrderData = await getInitialOrder.json();
    expect(initialOrderData.data.status).toBe('PENDING');

    // Attempt to fulfill order while unpaid -> should reject with 400
    const prematureFulfill = await request.patch(`/api/orders/${orderId}/fulfill`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        trackingNumber: 'TRK-PREMATURE',
        carrier: 'UPS'
      }
    });
    expect(prematureFulfill.status()).toBe(400);

    // 2. Simulate Stripe Payment Success Webhook
    const stripeId = `ch_${Math.random().toString(36).substring(7)}`;
    const webhookPayload = {
      id: `evt_${Math.random().toString(36).substring(7)}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: stripeId,
          amount: 10000, // $100.00 in cents
          currency: 'usd',
          metadata: {
            orderId,
            organizationId
          }
        }
      }
    };

    const webhookResponse = await request.post('/api/webhooks/stripe', {
      headers: {
        // Omitting stripe-signature in dev/test context to trigger signature fallback
      },
      data: webhookPayload
    });
    expect(webhookResponse.status()).toBe(200);

    // Verify order updated to PROCESSING (PAID) and Payment record exists
    const getPaidOrder = await request.get(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const paidOrderData = await getPaidOrder.json();
    expect(paidOrderData.data.status).toBe('PROCESSING');
    expect(paidOrderData.data.payments).toHaveLength(1);
    expect(paidOrderData.data.payments[0].status).toBe('PAID');
    expect(Number(paidOrderData.data.payments[0].amount)).toBe(100.00);

    // 3. Idempotency Check: Post the duplicate webhook again
    const duplicateWebhookResponse = await request.post('/api/webhooks/stripe', {
      data: webhookPayload
    });
    expect(duplicateWebhookResponse.status()).toBe(200);

    // Check payments again -> count should still be 1 (no duplicates)
    const checkDuplicateOrder = await request.get(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const duplicateOrderData = await checkDuplicateOrder.json();
    expect(duplicateOrderData.data.payments).toHaveLength(1);

    // 4. Unauthorized Fulfillment Attempt (as standard Customer) -> should return 403
    const unauthorizedFulfill = await request.patch(`/api/orders/${orderId}/fulfill`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        trackingNumber: 'TRK-123456',
        carrier: 'FedEx'
      }
    });
    expect(unauthorizedFulfill.status()).toBe(403);

    // 5. Authorized Fulfillment Attempt (as Tenant Admin) -> should succeed
    const fulfillResponse = await request.patch(`/api/orders/${orderId}/fulfill`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        trackingNumber: 'TRK-987654',
        carrier: 'FedEx'
      }
    });
    expect(fulfillResponse.status()).toBe(200);

    // Verify order is now SHIPPED, with updated carrier/tracking fields
    const getFulfilledOrder = await request.get(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const fulfilledOrderData = await getFulfilledOrder.json();
    expect(fulfilledOrderData.data.status).toBe('SHIPPED');
    expect(fulfilledOrderData.data.trackingNumber).toBe('TRK-987654');
    expect(fulfilledOrderData.data.carrier).toBe('FedEx');
    expect(fulfilledOrderData.data.shippedAt).not.toBeNull();
  });

  test('Webhook Failure: Simulating failed payment', async ({ request }) => {
    // 1. Create product and order
    const productResponse = await request.post('/api/test/create-product', {
      data: { name: 'Failure Item', sku: 'FAIL-ITEM', price: 10.00, organizationId }
    });
    const product = await productResponse.json();

    const customerResponse = await request.post('/api/customers', {
      headers: { 
        'X-Organization-Id': organizationId,
        'Authorization': `Bearer ${adminToken}`
      },
      data: { name: 'Fail Customer', email: 'fail@customer.com', phone: '00000' }
    });
    const { data: customer } = await customerResponse.json();

    const orderResponse = await request.post('/api/test/create-order', {
      data: {
        customerId: customer.id,
        organizationId,
        items: [{ productId: product.product.id, quantity: 1, price: 10.00 }]
      }
    });
    const order = await orderResponse.json();
    const orderId = order.order.id;

    // 2. Simulate Stripe Payment Fail Webhook
    const stripeId = `ch_fail_${Math.random().toString(36).substring(7)}`;
    const failedPayload = {
      id: `evt_fail_${Math.random().toString(36).substring(7)}`,
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: stripeId,
          amount: 1000,
          currency: 'usd',
          metadata: { orderId, organizationId }
        }
      }
    };

    const webhookResponse = await request.post('/api/webhooks/stripe', {
      data: failedPayload
    });
    expect(webhookResponse.status()).toBe(200);

    // Order status should still be PENDING (unpaid) or FAILED payment
    const checkFailedOrder = await request.get(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const failedOrderData = await checkFailedOrder.json();
    expect(failedOrderData.data.status).toBe('PENDING'); // Not updated to processing
    expect(failedOrderData.data.payments).toHaveLength(1);
    expect(failedOrderData.data.payments[0].status).toBe('FAILED');
  });

  test('SRE Edge Cases: Deduplicated webhook, Concurrent Checkout and Double Fulfillment', async ({ request }) => {
    // 1. Create a product with stock = 1
    const productResponse = await request.post('/api/test/create-product', {
      data: {
        name: 'Limited SRE Hoodie',
        sku: 'SRE-LIM-1',
        price: 80.00,
        stock: 1,
        organizationId
      }
    });
    const productData = await productResponse.json();
    const productId = productData.product.id;

    const customerResponse = await request.post('/api/customers', {
      headers: { 
        'X-Organization-Id': organizationId,
        'Authorization': `Bearer ${adminToken}`
      },
      data: {
        name: 'Concurrent Buyer',
        email: 'concurrent@buyer.com',
        phone: '123'
      }
    });
    const { data: customer } = await customerResponse.json();

    // 2. Perform concurrent checkouts!
    // Since we set stock to 1, sending two checkout requests concurrently should result in exactly one successful order creation
    // and one failed request (500 or 400 with Insufficient stock message) because of our atomic updateMany stock check!
    const orderPayload = {
      customerId: customer.id,
      organizationId,
      items: [{ productId, quantity: 1, price: 80.00 }],
      subtotal: 80.00,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 80.00
    };

    console.log('[SRE TEST] Initiating concurrent orders for stock = 1...');
    const [res1, res2] = await Promise.all([
      request.post('/api/orders', {
        headers: { 
          'X-Organization-Id': organizationId,
          'Authorization': `Bearer ${adminToken}`
        },
        data: orderPayload
      }),
      request.post('/api/orders', {
        headers: { 
          'X-Organization-Id': organizationId,
          'Authorization': `Bearer ${adminToken}`
        },
        data: orderPayload
      })
    ]);

    const statuses = [res1.status(), res2.status()];
    console.log('[SRE TEST] Concurrent checkouts returned statuses:', statuses);

    // One MUST succeed (201) and the other MUST fail (400 or 500)
    expect(statuses).toContain(201);
    expect(statuses.some(s => s >= 400)).toBe(true);

    // Get the ID of the successful order
    let successfulOrderId = '';
    if (res1.status() === 201) {
      const resData = await res1.json();
      successfulOrderId = resData.data.id;
    } else if (res2.status() === 201) {
      const resData = await res2.json();
      successfulOrderId = resData.data.id;
    }

    expect(successfulOrderId).not.toBe('');

    // 3. Double Fulfillment Prevention SRE Test
    // Process payment success first
    const stripeId = `ch_sre_${Math.random().toString(36).substring(7)}`;
    const eventId = `evt_sre_${Math.random().toString(36).substring(7)}`;
    const webhookPayload = {
      id: eventId,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: stripeId,
          amount: 8000,
          currency: 'usd',
          metadata: {
            orderId: successfulOrderId,
            organizationId
          }
        }
      }
    };

    // First webhook delivery
    const webhookRes1 = await request.post('/api/webhooks/stripe', { data: webhookPayload });
    expect(webhookRes1.status()).toBe(200);
    const webhookData1 = await webhookRes1.json();
    expect(webhookData1.data?.duplicated).toBeUndefined(); // Initial success

    // Second webhook delivery (Deduplication / Idempotence test)
    const webhookRes2 = await request.post('/api/webhooks/stripe', { data: webhookPayload });
    expect(webhookRes2.status()).toBe(200);
    const webhookData2 = await webhookRes2.json();
    expect(webhookData2.data.duplicated).toBe(true); // Should return duplicated: true immediately from ProcessedWebhookEvent table

    // Fulfill once
    const fulfill1 = await request.patch(`/api/orders/${successfulOrderId}/fulfill`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { trackingNumber: 'TRK-SRE-1', carrier: 'FedEx' }
    });
    expect(fulfill1.status()).toBe(200);

    // Fulfill again (Double fulfillment prevention check) -> should reject with illegal transition (SHIPPED to SHIPPED is illegal)
    const fulfill2 = await request.patch(`/api/orders/${successfulOrderId}/fulfill`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { trackingNumber: 'TRK-SRE-2', carrier: 'FedEx' }
    });
    expect(fulfill2.status()).toBe(400); // Bad Request / Validation violation
  });
});
