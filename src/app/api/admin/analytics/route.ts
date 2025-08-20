import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const range = url.searchParams.get('range') || '30d';
    
    // Get all orders for analytics
    const orders = await getAllOrders();
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Filter orders by date range
    const filteredOrders = orders.filter(order => 
      new Date(order.createdAt) >= startDate
    );
    
    // Calculate analytics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate conversion rate (placeholder - would need visit data)
    const conversionRate = 2.5; // Placeholder percentage
    
    // Group orders by status
    const ordersByStatus = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate daily revenue for chart
    const dailyRevenue = filteredOrders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + order.total;
      return acc;
    }, {} as Record<string, number>);
    
    // Format daily revenue for chart
    const revenueChart = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date,
        revenue: Number(revenue.toFixed(2))
      }));
    
    // Top products (placeholder - would need order items data)
    const topProducts = [
      { name: 'The Bomber Overdrive', sales: Math.floor(totalOrders * 0.4), revenue: totalRevenue * 0.4 },
      { name: 'Delay Pedal', sales: Math.floor(totalOrders * 0.3), revenue: totalRevenue * 0.3 },
      { name: 'Reverb Pedal', sales: Math.floor(totalOrders * 0.2), revenue: totalRevenue * 0.2 },
      { name: 'Distortion Pedal', sales: Math.floor(totalOrders * 0.1), revenue: totalRevenue * 0.1 },
    ];
    
    return NextResponse.json({
      success: true,
      analytics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        conversionRate,
        ordersByStatus,
        revenueChart,
        topProducts,
        dateRange: range
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
