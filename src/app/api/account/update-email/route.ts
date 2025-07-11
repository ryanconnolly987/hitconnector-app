import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUsers, findUserByEmail } from '@/lib/user-store';
import fs from 'fs';
import path from 'path';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, newEmail } = body;

    if (!userId || !newEmail) {
      return NextResponse.json(
        { error: 'User ID and new email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if new email is already in use by another user
    const existingUser = findUserByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'Email is already in use by another account' },
        { status: 409 }
      );
    }

    // Update user email in users.json
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    users[userIndex].email = newEmail.toLowerCase();
    saveUsers(users);

    // Also update email in extended profiles if exists
    const profilesPath = path.join(process.cwd(), 'data', 'rappers.json');
    if (fs.existsSync(profilesPath)) {
      const profilesData = fs.readFileSync(profilesPath, 'utf8');
      const profiles = JSON.parse(profilesData);
      
      if (profiles[userId]) {
        profiles[userId].email = newEmail.toLowerCase();
        fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully',
      user: {
        id: users[userIndex].id,
        name: users[userIndex].name,
        email: users[userIndex].email,
        role: users[userIndex].role
      }
    });

  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 