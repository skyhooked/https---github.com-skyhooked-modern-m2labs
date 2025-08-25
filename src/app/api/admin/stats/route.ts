import { NextRequest, NextResponse } from 'next/server';
import { getSupportTickets, getAllProducts, getAllDistributors, getAllOrders } from '@/libs/database-ecommerce';
import { getArtists, getUsers } from '@/libs/database-d1';

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
    
    // Fetch distributor stats
    const distributors = await getAllDistributors({});
    const activeDistributors = distributors.filter(d => d.status === 'active');
    
    // Fetch artist stats
    const artists = await getArtists();
    const featuredArtists = artists.filter(a => a.featured);
    
    // Fetch user stats (with fallback in case users table doesn't exist yet)
    let totalUsers = 0;
    let verifiedUsers = 0;
    try {
      const users = await getUsers();
      totalUsers = users.length;
      verifiedUsers = users.filter(u => u.isVerified).length;
    } catch (error) {
      console.warn('Could not fetch user stats (users table may not exist yet):', error);
    }
    
    // Fetch order stats
    const orders = await getAllOrders({});
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => !['cancelled', 'refunded'].includes(o.status));
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    
    // TODO: Add warranty claims when implemented
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
      artists: {
        totalArtists: artists.length,
        featuredArtists: featuredArtists.length,
        unverifiedArtists: artists.length - featuredArtists.length,
      },
      distributors: {
        totalDistributors: distributors.length,
        activeDistributors: activeDistributors.length,
        premiumDistributors: distributors.filter(d => d.tier === 'premium' || d.tier === 'exclusive').length,
        totalOutstanding: distributors.reduce((sum, d) => sum + d.currentBalance, 0),
      },
      warranty: {
        openClaims,
        processedClaims,
      },
      orders: {
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue: totalRevenue,
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
