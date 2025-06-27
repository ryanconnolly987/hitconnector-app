import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/profile - Get user profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const result = await pool.query(`
    SELECT 
      u.*,
      s.id as studio_id,
      s.name as studio_name,
      s.description as studio_description,
      s.city as studio_city,
      s.state as studio_state,
      s.rating as studio_rating,
      s.review_count as studio_review_count
    FROM users u
    LEFT JOIN studios s ON u.id = s.user_id AND s.is_active = true
    WHERE u.id = $1
  `, [userId]);

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isVerified: user.is_verified,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        ...(user.user_type === 'studio' && user.studio_id && {
          studio: {
            id: user.studio_id,
            name: user.studio_name,
            description: user.studio_description,
            city: user.studio_city,
            state: user.studio_state,
            rating: parseFloat(user.studio_rating) || 0,
            reviewCount: user.studio_review_count
          }
        })
      }
    }
  });
}));

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    firstName,
    lastName,
    phone,
    avatarUrl
  } = req.body;

  // Validate phone number if provided
  if (phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
    throw new AppError('Invalid phone number format', 400);
  }

  const result = await pool.query(`
    UPDATE users SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      phone = COALESCE($3, phone),
      avatar_url = COALESCE($4, avatar_url),
      updated_at = NOW()
    WHERE id = $5
    RETURNING id, email, user_type, first_name, last_name, phone, avatar_url, updated_at
  `, [firstName, lastName, phone, avatarUrl, userId]);

  const user = result.rows[0];

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        updatedAt: user.updated_at
      }
    }
  });
}));

// PUT /api/users/password - Change password
router.put('/password', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('Current password, new password, and confirm password are required', 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('New passwords do not match', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  // Get current password hash
  const userResult = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = userResult.rows[0];

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

// DELETE /api/users/account - Delete user account
router.delete('/account', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { password } = req.body;

  if (!password) {
    throw new AppError('Password is required to delete account', 400);
  }

  // Get user and verify password
  const userResult = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = userResult.rows[0];

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Password is incorrect', 400);
  }

  // Check for active bookings
  const activeBookingsResult = await pool.query(
    'SELECT COUNT(*) as count FROM bookings WHERE user_id = $1 AND status IN ($2, $3)',
    [userId, 'pending', 'confirmed']
  );

  const activeBookingsCount = parseInt(activeBookingsResult.rows[0].count);
  if (activeBookingsCount > 0) {
    throw new AppError('Cannot delete account with active bookings. Please cancel all bookings first.', 400);
  }

  // Begin transaction for account deletion
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Cancel all pending bookings
    await client.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE user_id = $2 AND status = $3',
      ['cancelled', userId, 'pending']
    );

    // Deactivate studios if user is a studio owner
    await client.query(
      'UPDATE studios SET is_active = false, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );

    // Delete user (this will cascade to related records due to foreign key constraints)
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// GET /api/users/:id - Get public user profile (for reviews, etc.)
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(`
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.user_type,
      u.avatar_url,
      u.created_at,
      s.id as studio_id,
      s.name as studio_name,
      s.rating as studio_rating,
      s.review_count as studio_review_count
    FROM users u
    LEFT JOIN studios s ON u.id = s.user_id AND s.is_active = true
    WHERE u.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        avatarUrl: user.avatar_url,
        memberSince: user.created_at,
        ...(user.user_type === 'studio' && user.studio_id && {
          studio: {
            id: user.studio_id,
            name: user.studio_name,
            rating: parseFloat(user.studio_rating) || 0,
            reviewCount: user.studio_review_count
          }
        })
      }
    }
  });
}));

export default router; 