import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, findUserByEmail } from '@/lib/user-store';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user by email first
    const user = findUserByEmail(email.trim().toLowerCase());
    
    // Use consistent error message for security (don't reveal if user exists)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if role matches (if provided)
    if (role && user.role !== role) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // At this point, authentication is successful
    console.log(`✅ Successful login for user: ${user.email} (${user.role})`);

    // Generate mock token (in production, use proper JWT)
    const token = `token_${user.id}_${Date.now()}`;

    // Return user data (excluding password hash)
    const responseData = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studioId: user.studioId
      },
      studioId: user.studioId
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('❌ Login error:', error);
    
    // Always return 500 for unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 