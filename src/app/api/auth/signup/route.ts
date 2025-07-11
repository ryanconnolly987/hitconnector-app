import { NextRequest, NextResponse } from 'next/server';
import { createUser, UserCreateData } from '@/lib/user-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, name, role, studioName } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['rapper', 'studio'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "rapper" or "studio"' },
        { status: 400 }
      );
    }

    // Create user data
    const userData: UserCreateData = {
      email: email.trim(),
      password,
      name: name.trim(),
      role,
      studioName: studioName?.trim()
    };

    // Create user
    const newUser = await createUser(userData);

    // Generate mock token (in production, use proper JWT)
    const token = `token_${newUser.id}_${Date.now()}`;

    // Return user data (excluding password hash)
    const responseData = {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        studioId: newUser.studioId
      },
      studioId: newUser.studioId
    };

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 