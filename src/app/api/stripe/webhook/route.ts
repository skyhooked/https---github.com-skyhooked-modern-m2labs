import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/libs/stripe';
import { updateOrder, clearCart, getOrderById } from '@/libs/database-ecommerce';
import Stripe from 'stripe';
import { EmailService } from '@/libs/email';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!signature || !endpointSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }
    
    let event: Stripe.Event;
    
    try {
      event = constructWebhookEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Handle the webhook event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }
      
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent);
        break;
      }
      
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDisputeCreated(dispute);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        // For future subscription handling
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      
      case 'customer.subscription.deleted': {
        // For future subscription handling
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ========================================
// WEBHOOK HANDLERS
// ========================================

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }
    
    // Update order status to 'processing' and payment status to 'paid'
    await updateOrder(orderId, {
      status: 'processing',
      paymentStatus: 'paid',
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge as string,
      paymentMethod: paymentIntent.payment_method_types[0]
    });
    
    console.log(`Payment succeeded for order ${orderId} - order updated`);
    
    // Clear user's cart (if cartId is provided in metadata)
    const cartId = paymentIntent.metadata.cartId;
    if (cartId) {
      try {
        await clearCart(cartId);
        console.log(`Cart ${cartId} cleared after successful payment`);
      } catch (error) {
        console.error('Error clearing cart:', error);
        // Don't fail the webhook if cart clearing fails
      }
    }
    
// Send order confirmation email
try {
  const emailService = new EmailService();
  const order = await getOrderById(orderId);
  if (order && order.email) {
    await emailService.sendOrderConfirmation(order);
    console.log('✅ Order confirmation email sent for order:', orderId);
  }
} catch (error) {
  console.error('❌ Error sending order confirmation email:', error);
  // Don't fail the webhook if email fails
}
    // TODO: Update inventory quantities
    // TODO: Create warranty records for eligible products
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }
    
    // Update order payment status to 'failed'
    await updateOrder(orderId, {
      paymentStatus: 'failed'
    });
    
    console.log(`Payment failed for order ${orderId} - order updated`);
    
    // TODO: Send payment failed email to customer
    // TODO: Optionally restore cart items for retry
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('No orderId found in payment intent metadata');
      return;
    }
    
    // Update order status to 'cancelled'
    await updateOrder(orderId, {
      status: 'cancelled',
      paymentStatus: 'failed'
    });
    
    console.log(`Payment canceled for order ${orderId} - order updated`);
    
    // TODO: Restore inventory if it was reserved
    
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  try {
    const chargeId = dispute.charge as string;
    const amount = dispute.amount;
    const reason = dispute.reason;
    
    console.log(`Dispute created for charge ${chargeId}: ${reason} - $${amount / 100}`);
    
    // TODO: Create support ticket for dispute
    // TODO: Send notification to admin
    // TODO: Update order with dispute information
    
  } catch (error) {
    console.error('Error handling dispute creation:', error);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    // Type assertion to access subscription property
    const invoiceWithSub = invoice as any;
    const subscriptionId = typeof invoiceWithSub.subscription === 'string' 
      ? invoiceWithSub.subscription 
      : invoiceWithSub.subscription?.id;
    const customerId = typeof invoice.customer === 'string' 
      ? invoice.customer 
      : invoice.customer?.id;
    
    if (subscriptionId) {
      console.log(`Invoice paid for subscription ${subscriptionId}`);
    }
    
    // TODO: Update subscription status
    // TODO: Send invoice receipt email
    
  } catch (error) {
    console.error('Error handling invoice payment:', error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id;
    
    if (customerId) {
      console.log(`Subscription canceled for customer ${customerId}`);
    }
    
    // TODO: Update subscription status in database
    // TODO: Send cancellation confirmation email
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}
