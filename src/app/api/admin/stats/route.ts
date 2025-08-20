import { NextRequest, NextResponse } from 'next/server';
import { getSupportTickets, getAllProducts } from '@/libs/database-ecommerce';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Fetch support ticket stats
    const allTickets = await getSupportTickets({});
    const openTickets = allTickets.filter(t => t.status === 'open');
    const resolvedTickets = allTickets.filter(t => t.status === 'resolved');
    
    // Fetch product stats
    const products = await getAllProducts({});
    const activeProducts = products.filter(p => p.isActive);
    
    // TODO: Add these when the functions are implemented
    // Users and warranty claims will be implemented later
    let totalUsers = 0;
    let verifiedUsers = 0;
    let openClaims = 0;
    let processedClaims = 0;

    const stats = {
      support: {
        totalTickets: allTickets.length,
        openTickets: openTickets.length,
        resolvedTickets: resolvedTickets.length,
        inProgressTickets: allTickets.filter(t => t.status === 'in_progress').length,
      },
      products: {
        totalProducts: products.length,
        activeProducts: activeProducts.length,
        inStockProducts: activeProducts.length, // TODO: Implement actual stock tracking
      },
      users: {
        totalUsers,
        verifiedUsers,
      },
      warranty: {
        openClaims,
        processedClaims,
      },
      orders: {
        totalOrders: 0, // TODO: Implement when orders system is ready
        pendingOrders: 0,
      },
      newsletter: {
        subscribers: 0, // TODO: Implement newsletter stats
        campaigns: 0,
      }
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
