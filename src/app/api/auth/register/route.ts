import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/libs/database';
import { validateEmail, validatePassword, generateToken } from '@/libs/auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, dateOfBirth } = body ?? {};

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const pwd = validatePassword(password);
    if (!pwd.isValid) {
      return NextResponse.json(
        { error: 'Password requirements not met', details: pwd.errors },
        { status: 400 }
      );
    }

    try {
      const user = await createUser({
        email,
        password,
        firstName,
        lastName,
        phone,
        dateOfBirth,
      });

      const token = await generateToken({ id: user.id, role: user.role, email: user.email });

      const response = NextResponse.json(
        {
          message: 'User created successfully',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified,
            role: user.role,
          },
        },
        { status: 201 }
      );

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    } catch (err: any) {
      if (err?.message === 'User with this email already exists') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
