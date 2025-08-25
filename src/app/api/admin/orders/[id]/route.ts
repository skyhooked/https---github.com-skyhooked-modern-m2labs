import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder } from '@/libs/database-ecommerce';
import { EmailService } from '@/libs/email';
import { mailerLiteService } from '@/libs/mailerlite';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    // Send email notification if requested
if (data.sendEmailNotification && order?.customer?.email) {
  try {
    const emailService = new EmailService();
    
    // Different email templates based on status
    switch (data.status) {
      case 'shipped':
        await emailService.sendOrderShipped(order, data.trackingNumber);
        break;
      case 'delivered':
        // You can create a custom delivered email template
        await emailService.sendEmail({
          to: order.customer.email,
          subject: `Your M2 Labs order has been delivered! 🎸`,
          html: `
            <h2>Order Delivered!</h2>
            <p>Great news! Your order #${order.orderNumber} has been delivered.</p>
            <p>We hope you love your new gear. If you have any questions, please contact our support team.</p>
            <p>Rock on!<br>The M2 Labs Team</p>
          `,
          text: `Your M2 Labs order #${order.orderNumber} has been delivered!`
        });
        break;
      case 'cancelled':
        await emailService.sendEmail({
          to: order.customer.email,
          subject: `Order #${order.orderNumber} has been cancelled`,
          html: `
            <h2>Order Cancelled</h2>
            <p>Your order #${order.orderNumber} has been cancelled.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Thanks,<br>The M2 Labs Team</p>
          `,
          text: `Your order #${order.orderNumber} has been cancelled.`
        });
        break;
    }
    
    console.log(`✅ Order status email sent to ${order.customer.email} for status: ${data.status}`);
  } catch (error) {
    console.error('❌ Error sending order status email:', error);
    // Don't fail the API call if email fails
  }
}
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const order = await updateOrder(id, data);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
