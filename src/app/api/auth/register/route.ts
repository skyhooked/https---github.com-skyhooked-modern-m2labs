// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/libs/database';
import { validateEmail, validatePassword, signToken } from '@/libs/auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, dateOfBirth } = body || {};

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
      const user = await createUser({ email, password, firstName, lastName, phone, dateOfBirth });

      const token = await signToken({ sub: user.id, role: user.role, email: user.email });

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

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    } catch (error: any) {
      if (error?.message === 'User with this email already exists') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
