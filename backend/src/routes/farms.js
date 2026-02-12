const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * GET /api/farms?userId=
 * List farms for the given user
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const farms = await prisma.farm.findMany({
      where: { userId: parseInt(userId) },
      include: { fields: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, farms });
  } catch (error) {
    console.error('Error fetching farms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/farms
 * Create a new farm (name, location, userId)
 */
router.post('/', async (req, res) => {
  try {
    const { name, location, userId } = req.body;

    if (!name) return res.status(400).json({ success: false, error: 'Farm name is required' });
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

    const farm = await prisma.farm.create({
      data: { name, location: location || '', userId: parseInt(userId) },
    });
    res.json({ success: true, farm });
  } catch (error) {
    console.error('Error creating farm:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/farms/:id/complete
 * Mark farm as completed (no further sampling allowed)
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const farmId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Verify ownership
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) return res.status(404).json({ success: false, error: 'Farm not found' });
    if (farm.userId !== parseInt(userId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const updatedFarm = await prisma.farm.update({
      where: { id: farmId },
      data: { completed: true },
    });

    res.json({ success: true, farm: updatedFarm });
  } catch (error) {
    console.error('Error marking farm complete:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/farms/:id
 * Delete a farm and all its fields
 */
router.delete('/:id', async (req, res) => {
  try {
    const farmId = parseInt(req.params.id);
    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) return res.status(404).json({ success: false, error: 'Farm not found' });

    // Delete all readings for all fields in this farm
    await prisma.sensorReading.deleteMany({
      where: { field: { farmId } },
    });

    // Delete all fields in this farm
    await prisma.field.deleteMany({
      where: { farmId },
    });

    // Delete the farm
    await prisma.farm.delete({ where: { id: farmId } });

    res.json({ success: true, message: 'Farm deleted successfully' });
  } catch (error) {
    console.error('Error deleting farm:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/farms/:id/fields
 * Add a new field to a farm
 */
router.post('/:id/fields', async (req, res) => {
  try {
    const farmId = parseInt(req.params.id);
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Field name required' });

    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    if (!farm) return res.status(404).json({ success: false, error: 'Farm not found' });

    const field = await prisma.field.create({ data: { name, location: location || '', userId: farm.userId, farmId: farm.id } });
    res.json({ success: true, field });
  } catch (error) {
    console.error('Error adding field:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
