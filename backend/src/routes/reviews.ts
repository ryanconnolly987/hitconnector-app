import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest, requireRapper, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/reviews/studio/:studioId - Get reviews for a studio
router.get('/studio/:studioId', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { studioId } = req.params;
  const {
    page = 1,
    limit = 10,
    rating,
    sortBy = 'created_at',
    order = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  let whereClause = 'WHERE r.studio_id = $1';
  const queryParams: any[] = [studioId];
  let paramCount = 1;

  // Filter by rating
  if (rating) {
    paramCount++;
    whereClause += ` AND r.rating = $${paramCount}`;
    queryParams.push(Number(rating));
  }

  // Validate sort options
  const validSortColumns = ['created_at', 'rating', 'title'];
  const validOrders = ['asc', 'desc'];
  
  const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
  const sortOrder = validOrders.includes(order as string) ? (order as string) : 'desc';

  // Add pagination parameters
  paramCount++;
  const limitParam = paramCount;
  paramCount++;
  const offsetParam = paramCount;
  queryParams.push(Number(limit), offset);

  const query = `
    SELECT 
      r.*,
      u.first_name as reviewer_first_name,
      u.last_name as reviewer_last_name,
      u.avatar_url as reviewer_avatar,
      s.name as studio_name,
      COUNT(*) OVER() as total_count
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN studios s ON r.studio_id = s.id
    ${whereClause}
    ORDER BY r.${sortColumn} ${sortOrder.toUpperCase()}
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const result = await pool.query(query, queryParams);
  const reviews = result.rows;
  const totalCount = reviews.length > 0 ? reviews[0].total_count : 0;

  // Get studio rating summary
  const summaryResult = await pool.query(`
    SELECT 
      AVG(rating) as average_rating,
      COUNT(*) as total_reviews,
      COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
      COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
      COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
      COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
      COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
    FROM reviews 
    WHERE studio_id = $1
  `, [studioId]);

  const summary = summaryResult.rows[0];

  res.json({
    success: true,
    data: {
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        reviewer: {
          firstName: review.reviewer_first_name,
          lastName: review.reviewer_last_name,
          avatar: review.reviewer_avatar
        },
        createdAt: review.created_at,
        updatedAt: review.updated_at
      })),
      summary: {
        averageRating: parseFloat(summary.average_rating) || 0,
        totalReviews: Number(summary.total_reviews),
        distribution: {
          5: Number(summary.five_star),
          4: Number(summary.four_star),
          3: Number(summary.three_star),
          2: Number(summary.two_star),
          1: Number(summary.one_star)
        }
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalCount),
        pages: Math.ceil(Number(totalCount) / Number(limit))
      }
    }
  });
}));

// GET /api/reviews/:id - Get review details
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(`
    SELECT 
      r.*,
      u.first_name as reviewer_first_name,
      u.last_name as reviewer_last_name,
      u.avatar_url as reviewer_avatar,
      s.name as studio_name,
      s.city as studio_city,
      s.state as studio_state
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN studios s ON r.studio_id = s.id
    WHERE r.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new AppError('Review not found', 404);
  }

  const review = result.rows[0];

  res.json({
    success: true,
    data: {
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        reviewer: {
          firstName: review.reviewer_first_name,
          lastName: review.reviewer_last_name,
          avatar: review.reviewer_avatar
        },
        studio: {
          id: review.studio_id,
          name: review.studio_name,
          city: review.studio_city,
          state: review.studio_state
        },
        bookingId: review.booking_id,
        createdAt: review.created_at,
        updatedAt: review.updated_at
      }
    }
  });
}));

// POST /api/reviews - Create new review
router.post('/', authenticate, requireRapper, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    studioId,
    bookingId,
    rating,
    title,
    comment
  } = req.body;

  // Validation
  if (!studioId || !rating) {
    throw new AppError('Studio ID and rating are required', 400);
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be an integer between 1 and 5', 400);
  }

  // Verify booking exists and belongs to user (if provided)
  if (bookingId) {
    const bookingResult = await pool.query(
      'SELECT id, status FROM bookings WHERE id = $1 AND user_id = $2 AND studio_id = $3',
      [bookingId, userId, studioId]
    );

    if (bookingResult.rows.length === 0) {
      throw new AppError('Booking not found or access denied', 404);
    }

    const booking = bookingResult.rows[0];
    
    // Only allow reviews for completed bookings
    if (booking.status !== 'completed') {
      throw new AppError('Can only review completed bookings', 400);
    }

    // Check if review already exists for this booking
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE booking_id = $1',
      [bookingId]
    );

    if (existingReview.rows.length > 0) {
      throw new AppError('Review already exists for this booking', 409);
    }
  } else {
    // If no booking specified, check if user has ever booked this studio
    const userBookingResult = await pool.query(
      'SELECT id FROM bookings WHERE user_id = $1 AND studio_id = $2 AND status = $3',
      [userId, studioId, 'completed']
    );

    if (userBookingResult.rows.length === 0) {
      throw new AppError('You must complete a booking at this studio before leaving a review', 400);
    }

    // Check if user has already reviewed this studio (without specific booking)
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE user_id = $1 AND studio_id = $2 AND booking_id IS NULL',
      [userId, studioId]
    );

    if (existingReview.rows.length > 0) {
      throw new AppError('You have already reviewed this studio', 409);
    }
  }

  // Verify studio exists
  const studioResult = await pool.query(
    'SELECT id, name FROM studios WHERE id = $1 AND is_active = true',
    [studioId]
  );

  if (studioResult.rows.length === 0) {
    throw new AppError('Studio not found', 404);
  }

  const studio = studioResult.rows[0];

  // Create review
  const result = await pool.query(`
    INSERT INTO reviews (user_id, studio_id, booking_id, rating, title, comment)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [userId, studioId, bookingId || null, rating, title, comment]);

  const review = result.rows[0];

  // Update studio rating and review count
  await updateStudioRating(studioId);

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: {
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        studio: {
          id: studioId,
          name: studio.name
        },
        bookingId: review.booking_id,
        createdAt: review.created_at
      }
    }
  });
}));

// PUT /api/reviews/:id - Update review
router.put('/:id', authenticate, requireRapper, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const { rating, title, comment } = req.body;

  // Check if review exists and belongs to user
  const reviewResult = await pool.query(
    'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (reviewResult.rows.length === 0) {
    throw new AppError('Review not found or access denied', 404);
  }

  const existingReview = reviewResult.rows[0];

  // Validate rating if provided
  if (rating && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new AppError('Rating must be an integer between 1 and 5', 400);
  }

  // Update review
  const result = await pool.query(`
    UPDATE reviews SET
      rating = COALESCE($1, rating),
      title = COALESCE($2, title),
      comment = COALESCE($3, comment),
      updated_at = NOW()
    WHERE id = $4 AND user_id = $5
    RETURNING *
  `, [rating, title, comment, id, userId]);

  const review = result.rows[0];

  // Update studio rating if rating changed
  if (rating && rating !== existingReview.rating) {
    await updateStudioRating(existingReview.studio_id);
  }

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: {
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        updatedAt: review.updated_at
      }
    }
  });
}));

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', authenticate, requireRapper, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if review exists and belongs to user
  const reviewResult = await pool.query(
    'SELECT studio_id FROM reviews WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (reviewResult.rows.length === 0) {
    throw new AppError('Review not found or access denied', 404);
  }

  const review = reviewResult.rows[0];

  // Delete review
  await pool.query('DELETE FROM reviews WHERE id = $1', [id]);

  // Update studio rating
  await updateStudioRating(review.studio_id);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
}));

// Helper function to update studio rating
async function updateStudioRating(studioId: number): Promise<void> {
  const result = await pool.query(`
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(*) as review_count
    FROM reviews 
    WHERE studio_id = $1
  `, [studioId]);

  const { avg_rating, review_count } = result.rows[0];

  await pool.query(`
    UPDATE studios 
    SET rating = $1, review_count = $2, updated_at = NOW()
    WHERE id = $3
  `, [
    avg_rating ? parseFloat(avg_rating) : 0,
    Number(review_count),
    studioId
  ]);
}

export default router; 