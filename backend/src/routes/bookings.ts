import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest, requireRapper, requireStudio } from '../middleware/auth';

const router = Router();

// GET /api/bookings - Get user bookings
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userType = req.user!.userType;
  const {
    status,
    page = 1,
    limit = 10,
    sortBy = 'booking_date',
    order = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  let whereClause = '';
  const queryParams: any[] = [userId];
  let paramCount = 1;

  // Filter by user type
  if (userType === 'rapper') {
    whereClause = 'WHERE b.user_id = $1';
  } else if (userType === 'studio') {
    whereClause = 'WHERE s.user_id = $1';
  }

  // Add status filter
  if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status as string)) {
    paramCount++;
    whereClause += ` AND b.status = $${paramCount}`;
    queryParams.push(status);
  }

  // Validate sort options
  const validSortColumns = ['booking_date', 'created_at', 'total_amount'];
  const validOrders = ['asc', 'desc'];
  
  const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'booking_date';
  const sortOrder = validOrders.includes(order as string) ? (order as string) : 'desc';

  // Add pagination parameters
  paramCount++;
  const limitParam = paramCount;
  paramCount++;
  const offsetParam = paramCount;
  queryParams.push(Number(limit), offset);

  const query = `
    SELECT 
      b.*,
      s.name as studio_name,
      s.city as studio_city,
      s.state as studio_state,
      s.image_urls as studio_images,
      sr.name as room_name,
      u.first_name as rapper_first_name,
      u.last_name as rapper_last_name,
      u.email as rapper_email,
      COUNT(*) OVER() as total_count
    FROM bookings b
    JOIN studios s ON b.studio_id = s.id
    JOIN studio_rooms sr ON b.room_id = sr.id
    JOIN users u ON b.user_id = u.id
    ${whereClause}
    ORDER BY b.${sortColumn} ${sortOrder.toUpperCase()}
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const result = await pool.query(query, queryParams);
  const bookings = result.rows;
  const totalCount = bookings.length > 0 ? bookings[0].total_count : 0;

  res.json({
    success: true,
    data: {
      bookings: bookings.map(booking => ({
        id: booking.id,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalHours: parseFloat(booking.total_hours),
        hourlyRate: parseFloat(booking.hourly_rate),
        totalAmount: parseFloat(booking.total_amount),
        status: booking.status,
        specialRequests: booking.special_requests,
        studio: {
          id: booking.studio_id,
          name: booking.studio_name,
          city: booking.studio_city,
          state: booking.studio_state,
          images: booking.studio_images || []
        },
        room: {
          id: booking.room_id,
          name: booking.room_name
        },
        ...(userType === 'studio' && {
          rapper: {
            firstName: booking.rapper_first_name,
            lastName: booking.rapper_last_name,
            email: booking.rapper_email
          }
        }),
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalCount),
        pages: Math.ceil(Number(totalCount) / Number(limit))
      }
    }
  });
}));

// GET /api/bookings/:id - Get booking details
router.get('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userType = req.user!.userType;

  let whereClause = 'WHERE b.id = $1';
  const queryParams = [id];

  // Ensure user can only access their own bookings
  if (userType === 'rapper') {
    whereClause += ' AND b.user_id = $2';
    queryParams.push(userId.toString());
  } else if (userType === 'studio') {
    whereClause += ' AND s.user_id = $2';
    queryParams.push(userId.toString());
  }

  const result = await pool.query(`
    SELECT 
      b.*,
      s.name as studio_name,
      s.address as studio_address,
      s.city as studio_city,
      s.state as studio_state,
      s.phone as studio_phone,
      s.email as studio_email,
      s.image_urls as studio_images,
      sr.name as room_name,
      sr.description as room_description,
      sr.capacity as room_capacity,
      sr.equipment as room_equipment,
      u.first_name as rapper_first_name,
      u.last_name as rapper_last_name,
      u.email as rapper_email,
      u.phone as rapper_phone
    FROM bookings b
    JOIN studios s ON b.studio_id = s.id
    JOIN studio_rooms sr ON b.room_id = sr.id
    JOIN users u ON b.user_id = u.id
    ${whereClause}
  `, queryParams);

  if (result.rows.length === 0) {
    throw new AppError('Booking not found', 404);
  }

  const booking = result.rows[0];

  res.json({
    success: true,
    data: {
      booking: {
        id: booking.id,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalHours: parseFloat(booking.total_hours),
        hourlyRate: parseFloat(booking.hourly_rate),
        totalAmount: parseFloat(booking.total_amount),
        status: booking.status,
        specialRequests: booking.special_requests,
        studio: {
          id: booking.studio_id,
          name: booking.studio_name,
          address: booking.studio_address,
          city: booking.studio_city,
          state: booking.studio_state,
          phone: booking.studio_phone,
          email: booking.studio_email,
          images: booking.studio_images || []
        },
        room: {
          id: booking.room_id,
          name: booking.room_name,
          description: booking.room_description,
          capacity: booking.room_capacity,
          equipment: booking.room_equipment || []
        },
        rapper: {
          firstName: booking.rapper_first_name,
          lastName: booking.rapper_last_name,
          email: booking.rapper_email,
          phone: booking.rapper_phone
        },
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      }
    }
  });
}));

// POST /api/bookings - Create new booking
router.post('/', authenticate, requireRapper, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const {
    studioId,
    roomId,
    bookingDate,
    startTime,
    endTime,
    specialRequests
  } = req.body;

  // Validation
  if (!studioId || !roomId || !bookingDate || !startTime || !endTime) {
    throw new AppError('Studio ID, room ID, booking date, start time, and end time are required', 400);
  }

  // Validate date format and ensure it's in the future
  const bookingDateObj = new Date(bookingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDateObj < today) {
    throw new AppError('Booking date must be in the future', 400);
  }

  // Validate time format and calculate duration
  const startTimeObj = new Date(`2000-01-01T${startTime}`);
  const endTimeObj = new Date(`2000-01-01T${endTime}`);

  if (endTimeObj <= startTimeObj) {
    throw new AppError('End time must be after start time', 400);
  }

  const totalHours = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60 * 60);

  // Check if studio and room exist
  const roomResult = await pool.query(`
    SELECT sr.hourly_rate, s.name as studio_name, sr.name as room_name
    FROM studio_rooms sr
    JOIN studios s ON sr.studio_id = s.id
    WHERE sr.id = $1 AND sr.studio_id = $2 AND sr.is_active = true AND s.is_active = true
  `, [roomId, studioId]);

  if (roomResult.rows.length === 0) {
    throw new AppError('Studio room not found or not available', 404);
  }

  const room = roomResult.rows[0];
  const hourlyRate = parseFloat(room.hourly_rate);
  const totalAmount = totalHours * hourlyRate;

  // Check for booking conflicts
  const conflictCheck = await pool.query(`
    SELECT id FROM bookings
    WHERE room_id = $1 
    AND booking_date = $2 
    AND status IN ('pending', 'confirmed')
    AND (
      (start_time <= $3 AND end_time > $3) OR
      (start_time < $4 AND end_time >= $4) OR
      (start_time >= $3 AND end_time <= $4)
    )
  `, [roomId, bookingDate, startTime, endTime]);

  if (conflictCheck.rows.length > 0) {
    throw new AppError('Time slot is already booked', 409);
  }

  // Create booking
  const result = await pool.query(`
    INSERT INTO bookings (
      user_id, studio_id, room_id, booking_date, start_time, end_time,
      total_hours, hourly_rate, total_amount, special_requests, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
    RETURNING *
  `, [
    userId,
    studioId,
    roomId,
    bookingDate,
    startTime,
    endTime,
    totalHours,
    hourlyRate,
    totalAmount,
    specialRequests
  ]);

  const booking = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: {
      booking: {
        id: booking.id,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        totalHours: parseFloat(booking.total_hours),
        hourlyRate: parseFloat(booking.hourly_rate),
        totalAmount: parseFloat(booking.total_amount),
        status: booking.status,
        specialRequests: booking.special_requests,
        studio: {
          id: studioId,
          name: room.studio_name
        },
        room: {
          id: roomId,
          name: room.room_name
        },
        createdAt: booking.created_at
      }
    }
  });
}));

// PUT /api/bookings/:id - Update booking status (studio owners)
router.put('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user!.id;
  const userType = req.user!.userType;

  if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
    throw new AppError('Valid status is required', 400);
  }

  // Check if booking exists and user has permission
  let whereClause = 'WHERE b.id = $1';
  const queryParams = [id];

  if (userType === 'studio') {
    whereClause += ' AND s.user_id = $2';
    queryParams.push(userId.toString());
  } else if (userType === 'rapper') {
    // Rappers can only cancel their own bookings
    if (status !== 'cancelled') {
      throw new AppError('Rappers can only cancel bookings', 403);
    }
    whereClause += ' AND b.user_id = $2';
    queryParams.push(userId.toString());
  }

  const bookingCheck = await pool.query(`
    SELECT b.id, b.status
    FROM bookings b
    JOIN studios s ON b.studio_id = s.id
    ${whereClause}
  `, queryParams);

  if (bookingCheck.rows.length === 0) {
    throw new AppError('Booking not found or access denied', 404);
  }

  const currentBooking = bookingCheck.rows[0];

  // Validate status transitions
  const currentStatus = currentBooking.status;
  const validTransitions: { [key: string]: string[] } = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    cancelled: [],
    completed: []
  };

  if (!validTransitions[currentStatus]?.includes(status)) {
    throw new AppError(`Cannot change status from ${currentStatus} to ${status}`, 400);
  }

  // Update booking
  const result = await pool.query(`
    UPDATE bookings 
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [status, id]);

  const booking = result.rows[0];

  res.json({
    success: true,
    message: 'Booking status updated successfully',
    data: {
      booking: {
        id: booking.id,
        status: booking.status,
        updatedAt: booking.updated_at
      }
    }
  });
}));

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const userType = req.user!.userType;

  // Check if booking exists and user has permission
  let whereClause = 'WHERE b.id = $1';
  const queryParams = [id];

  if (userType === 'rapper') {
    whereClause += ' AND b.user_id = $2';
    queryParams.push(userId.toString());
  } else if (userType === 'studio') {
    whereClause += ' AND s.user_id = $2';
    queryParams.push(userId.toString());
  }

  const bookingCheck = await pool.query(`
    SELECT b.id, b.status, b.booking_date
    FROM bookings b
    JOIN studios s ON b.studio_id = s.id
    ${whereClause}
  `, queryParams);

  if (bookingCheck.rows.length === 0) {
    throw new AppError('Booking not found or access denied', 404);
  }

  const booking = bookingCheck.rows[0];

  // Can only cancel pending or confirmed bookings
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new AppError('Can only cancel pending or confirmed bookings', 400);
  }

  // Update booking status to cancelled
  await pool.query(`
    UPDATE bookings 
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = $1
  `, [id]);

  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  });
}));

export default router;