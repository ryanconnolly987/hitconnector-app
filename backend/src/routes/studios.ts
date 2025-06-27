import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest, requireStudio, optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/studios - Search and list studios
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    city,
    state,
    minPrice,
    maxPrice,
    rating,
    amenities,
    page = 1,
    limit = 10,
    sortBy = 'rating',
    order = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  let whereClause = 'WHERE s.is_active = true';
  const queryParams: any[] = [];
  let paramCount = 0;

  // Build dynamic WHERE clause
  if (city) {
    paramCount++;
    whereClause += ` AND LOWER(s.city) LIKE LOWER($${paramCount})`;
    queryParams.push(`%${city}%`);
  }

  if (state) {
    paramCount++;
    whereClause += ` AND LOWER(s.state) = LOWER($${paramCount})`;
    queryParams.push(state);
  }

  if (minPrice) {
    paramCount++;
    whereClause += ` AND s.hourly_rate_min >= $${paramCount}`;
    queryParams.push(Number(minPrice));
  }

  if (maxPrice) {
    paramCount++;
    whereClause += ` AND s.hourly_rate_max <= $${paramCount}`;
    queryParams.push(Number(maxPrice));
  }

  if (rating) {
    paramCount++;
    whereClause += ` AND s.rating >= $${paramCount}`;
    queryParams.push(Number(rating));
  }

  // Handle amenities filter
  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
    paramCount++;
    whereClause += ` AND s.amenities && $${paramCount}`;
    queryParams.push(amenitiesArray);
  }

  // Validate sort options
  const validSortColumns = ['rating', 'hourly_rate_min', 'created_at', 'name'];
  const validOrders = ['asc', 'desc'];
  
  const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : 'rating';
  const sortOrder = validOrders.includes(order as string) ? (order as string) : 'desc';

  // Add pagination parameters
  paramCount++;
  const limitParam = paramCount;
  paramCount++;
  const offsetParam = paramCount;
  queryParams.push(Number(limit), offset);

  const query = `
    SELECT 
      s.id,
      s.name,
      s.description,
      s.city,
      s.state,
      s.rating,
      s.review_count,
      s.hourly_rate_min,
      s.hourly_rate_max,
      s.amenities,
      s.image_urls,
      s.created_at,
      COUNT(*) OVER() as total_count
    FROM studios s
    ${whereClause}
    ORDER BY s.${sortColumn} ${sortOrder.toUpperCase()}
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const result = await pool.query(query, queryParams);
  const studios = result.rows;
  const totalCount = studios.length > 0 ? studios[0].total_count : 0;

  res.json({
    success: true,
    data: {
      studios: studios.map(studio => ({
        id: studio.id,
        name: studio.name,
        description: studio.description,
        city: studio.city,
        state: studio.state,
        rating: parseFloat(studio.rating) || 0,
        reviewCount: studio.review_count,
        priceRange: {
          min: parseFloat(studio.hourly_rate_min) || 0,
          max: parseFloat(studio.hourly_rate_max) || 0
        },
        amenities: studio.amenities || [],
        images: studio.image_urls || [],
        createdAt: studio.created_at
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

// GET /api/studios/:id - Get studio details
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(`
    SELECT 
      s.*,
      u.email as owner_email,
      COALESCE(
        json_agg(
          json_build_object(
            'id', sr.id,
            'name', sr.name,
            'description', sr.description,
            'hourlyRate', sr.hourly_rate,
            'capacity', sr.capacity,
            'equipment', sr.equipment,
            'images', sr.image_urls,
            'isActive', sr.is_active
          )
        ) FILTER (WHERE sr.id IS NOT NULL), 
        '[]'
      ) as rooms
    FROM studios s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN studio_rooms sr ON s.id = sr.studio_id AND sr.is_active = true
    WHERE s.id = $1 AND s.is_active = true
    GROUP BY s.id, u.email
  `, [id]);

  if (result.rows.length === 0) {
    throw new AppError('Studio not found', 404);
  }

  const studio = result.rows[0];

  res.json({
    success: true,
    data: {
      studio: {
        id: studio.id,
        name: studio.name,
        description: studio.description,
        address: studio.address,
        city: studio.city,
        state: studio.state,
        zipCode: studio.zip_code,
        latitude: studio.latitude ? parseFloat(studio.latitude) : null,
        longitude: studio.longitude ? parseFloat(studio.longitude) : null,
        phone: studio.phone,
        email: studio.email,
        website: studio.website,
        amenities: studio.amenities || [],
        priceRange: {
          min: parseFloat(studio.hourly_rate_min) || 0,
          max: parseFloat(studio.hourly_rate_max) || 0
        },
        rating: parseFloat(studio.rating) || 0,
        reviewCount: studio.review_count,
        images: studio.image_urls || [],
        rooms: studio.rooms,
        createdAt: studio.created_at,
        updatedAt: studio.updated_at
      }
    }
  });
}));

// POST /api/studios - Create studio (admin only or during signup)
router.post('/', authenticate, requireStudio, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    description,
    address,
    city,
    state,
    zipCode,
    latitude,
    longitude,
    phone,
    email,
    website,
    amenities,
    hourlyRateMin,
    hourlyRateMax,
    imageUrls
  } = req.body;

  const userId = req.user!.id;

  // Check if user already has a studio
  const existingStudio = await pool.query(
    'SELECT id FROM studios WHERE user_id = $1',
    [userId]
  );

  if (existingStudio.rows.length > 0) {
    throw new AppError('User already has a studio', 409);
  }

  // Validate required fields
  if (!name || !city || !state) {
    throw new AppError('Name, city, and state are required', 400);
  }

  const result = await pool.query(`
    INSERT INTO studios (
      user_id, name, description, address, city, state, zip_code, 
      latitude, longitude, phone, email, website, amenities, 
      hourly_rate_min, hourly_rate_max, image_urls
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `, [
    userId,
    name,
    description,
    address,
    city,
    state,
    zipCode,
    latitude,
    longitude,
    phone,
    email,
    website,
    amenities || [],
    hourlyRateMin,
    hourlyRateMax,
    imageUrls || []
  ]);

  const studio = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Studio created successfully',
    data: { studio }
  });
}));

// PUT /api/studios/:id - Update studio
router.put('/:id', authenticate, requireStudio, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if studio belongs to user
  const studioCheck = await pool.query(
    'SELECT id FROM studios WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (studioCheck.rows.length === 0) {
    throw new AppError('Studio not found or access denied', 404);
  }

  const {
    name,
    description,
    address,
    city,
    state,
    zipCode,
    latitude,
    longitude,
    phone,
    email,
    website,
    amenities,
    hourlyRateMin,
    hourlyRateMax,
    imageUrls
  } = req.body;

  const result = await pool.query(`
    UPDATE studios SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      address = COALESCE($3, address),
      city = COALESCE($4, city),
      state = COALESCE($5, state),
      zip_code = COALESCE($6, zip_code),
      latitude = COALESCE($7, latitude),
      longitude = COALESCE($8, longitude),
      phone = COALESCE($9, phone),
      email = COALESCE($10, email),
      website = COALESCE($11, website),
      amenities = COALESCE($12, amenities),
      hourly_rate_min = COALESCE($13, hourly_rate_min),
      hourly_rate_max = COALESCE($14, hourly_rate_max),
      image_urls = COALESCE($15, image_urls),
      updated_at = NOW()
    WHERE id = $16 AND user_id = $17
    RETURNING *
  `, [
    name,
    description,
    address,
    city,
    state,
    zipCode,
    latitude,
    longitude,
    phone,
    email,
    website,
    amenities,
    hourlyRateMin,
    hourlyRateMax,
    imageUrls,
    id,
    userId
  ]);

  const studio = result.rows[0];

  res.json({
    success: true,
    message: 'Studio updated successfully',
    data: { studio }
  });
}));

// DELETE /api/studios/:id - Delete studio
router.delete('/:id', authenticate, requireStudio, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  // Check if studio belongs to user
  const studioCheck = await pool.query(
    'SELECT id FROM studios WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (studioCheck.rows.length === 0) {
    throw new AppError('Studio not found or access denied', 404);
  }

  // Soft delete by setting is_active to false
  await pool.query(
    'UPDATE studios SET is_active = false, updated_at = NOW() WHERE id = $1',
    [id]
  );

  res.json({
    success: true,
    message: 'Studio deleted successfully'
  });
}));

export default router; 