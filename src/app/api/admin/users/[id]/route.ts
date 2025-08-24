import { NextRequest, NextResponse } from 'next/server';
import { updateUser, getDatabase } from '@/libs/database-d1';
export const runtime = 'edge'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    // Get database instance
    const db = getDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Validate the user exists
    const existingUser = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build the update query dynamically based on provided fields
    const allowedFields = ['firstName', 'lastName', 'email', 'role', 'isVerified'];
    const updateFields = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated timestamp
    updateFields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    
    // Add user ID for WHERE clause
    values.push(id);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.prepare(query).bind(...values).run();

    // Return the updated user (without password)
    const updatedUser = await db.prepare('SELECT id, firstName, lastName, email, role, isVerified, createdAt, updatedAt FROM users WHERE id = ?').bind(id).first();

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
