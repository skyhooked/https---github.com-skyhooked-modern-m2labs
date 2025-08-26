import { NextRequest, NextResponse } from 'next/server';
import { createUser, initializeDatabase } from '@/libs/database-d1';
import { validateEmail, validatePassword, signToken } from '@/libs/auth';
import { mailerLiteService } from '@/libs/mailerlite';

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  // Initialize database on first request
  await initializeDatabase();
  
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, dateOfBirth } = body ?? {};

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const pw = validatePassword(password);
    if (!pw.isValid) {
      return NextResponse.json(
        { error: 'Password requirements not met', details: pw.errors },
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

      const token = await signToken({
        sub: user.id,
        role: user.role,
        email: user.email,
      });

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
        });

        // Add user to MailerLite and send welcome email
        try {
          await mailerLiteService.addSubscriber(
            user.email,
            user.firstName,
            user.lastName,
            ["163751569503814829"] // Customers group
          );
          
          // Send welcome email
          await mailerLiteService.sendCampaignEmail({
            to: user.email,
            subject: 'Welcome to M2 Labs! 🎸',
            html: `
              <h2>Welcome to M2 Labs, ${user.firstName}!</h2>
              <p>Thanks for joining the M2 Labs family. We're excited to have you!</p>
              <p>You now have access to:</p>
              <ul>
                <li>Exclusive product updates</li>
                <li>Special member discounts</li>
                <li>Order tracking and history</li>
                <li>Priority customer support</li>
              </ul>
              <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/shop">Shop Now</a></p>
              <p>Rock on!<br>The M2 Labs Team</p>
            `,
            campaignName: `Welcome: ${user.email}`
          });
          
          console.log('✅ Welcome email sent to new user:', user.email);
        } catch (error) {
          console.error('❌ Error sending welcome email:', error);
          // Don't fail registration if email fails
        }

        return NextResponse.json(
          {
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
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
