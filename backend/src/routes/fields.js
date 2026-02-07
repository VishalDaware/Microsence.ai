// API routes for field management
const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * POST /api/fields/create
 * Create a new field for a user
 */
router.post('/create', async (req, res) => {
  try {
    const { userId, name, location } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        error: 'User ID and field name are required',
      });
    }

    const field = await prisma.field.create({
      data: {
        userId,
        name,
        location: location || null,
      },
    });

    res.json({
      success: true,
      message: 'Field created successfully',
      field,
    });
  } catch (error) {
    console.error('Error creating field:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/fields/list
 * Get all fields for a user
 */
router.get('/list', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const fields = await prisma.field.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'asc' },
      include: {
        readings: {
          select: { id: true },
        },
      },
    });

    // Add reading count to each field
    const fieldsWithCount = fields.map((field) => ({
      ...field,
      readingCount: field.readings.length,
      readings: undefined,
    }));

    res.json({
      success: true,
      fields: fieldsWithCount,
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/fields/update
 * Update a field
 */
router.put('/update', async (req, res) => {
  try {
    const { fieldId, name, location } = req.body;

    if (!fieldId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Field ID and name are required',
      });
    }

    const field = await prisma.field.update({
      where: { id: parseInt(fieldId) },
      data: {
        name,
        location: location || null,
      },
    });

    res.json({
      success: true,
      message: 'Field updated successfully',
      field,
    });
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/fields/delete
 * Delete a field and all its readings
 */
router.delete('/delete', async (req, res) => {
  try {
    const { fieldId } = req.body;

    if (!fieldId) {
      return res.status(400).json({
        success: false,
        error: 'Field ID is required',
      });
    }

    // Delete all readings for this field first
    await prisma.sensorReading.deleteMany({
      where: { fieldId: parseInt(fieldId) },
    });

    // Then delete the field
    await prisma.field.delete({
      where: { id: parseInt(fieldId) },
    });

    res.json({
      success: true,
      message: 'Field deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting field:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
