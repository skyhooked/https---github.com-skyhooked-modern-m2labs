import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, updateUserPassword } from '@/libs/auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    try {
      await updateUserPassword(user.id, currentPassword, newPassword);
      
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully'
      });
      
    } catch (error: any) {
      // Handle specific errors from updateUserPassword
      if (error.message === 'Invalid current password') {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      throw error; // Re-throw other errors
    }
    
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
