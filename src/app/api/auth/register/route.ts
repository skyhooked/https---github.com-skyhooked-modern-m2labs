import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/libs/database';
import { signToken } from '@/libs/auth';

export const runtime = 'edge';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const passwordIssues = (pwd: string): string[] => {
  const issues: string[] = [];
  if (pwd.length < 8) issues.push('at least 8 characters');
  if (!/[A-Z]/.test(pwd)) issues.push('one uppercase letter');
  if (!/[a-z]/.test(pwd)) issues.push('one lowercase letter');
  if (!/[0-9]/.test(pwd)) issues.push('one number');
  return issues;
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone, dateOfBirth } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const issues = passwordIssues(password);
    if (issues.length) {
      return NextResponse.json(
        { error: 'Password requirements not met', details: issues },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
    });

    // Create JWT (JwtInput shape: sub, role, email)
    const token = await signToken({ sub: user.id, role: user.role, email: user.email });

    // Response payload
    const res = NextResponse.json(
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

    // Set cookie to match getUserFromRequest()
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days (seconds)
      path: '/',
    });

    return res;
  } catch (error: any) {
    if (error?.message === 'User with this email already exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
