const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * GET /api/farms
 * List farms for the admin user (or all farms)
 */
router.get('/', async (req, res) => {
  try {
    let adminUser = await prisma.user.findUnique({ where: { email: 'admin@farm.local' } });
    if (!adminUser) {
      adminUser = await prisma.user.create({ data: { name: 'Admin', email: 'admin@farm.local', password: 'admin123' } });
    }

    const farms = await prisma.farm.findMany({ where: { userId: adminUser.id }, include: { fields: true }, orderBy: { createdAt: 'asc' } });
    res.json({ success: true, farms });
  } catch (error) {
    console.error('Error fetching farms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/farms
 * Create a new farm (name, location)
 */
router.post('/', async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Farm name is required' });

    let adminUser = await prisma.user.findUnique({ where: { email: 'admin@farm.local' } });
    if (!adminUser) {
      adminUser = await prisma.user.create({ data: { name: 'Admin', email: 'admin@farm.local', password: 'admin123' } });
    }

    const farm = await prisma.farm.create({ data: { name, location: location || '', userId: adminUser.id } });
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
    const farm = await prisma.farm.update({ where: { id: farmId }, data: { completed: true } });
    res.json({ success: true, farm });
  } catch (error) {
    console.error('Error marking farm complete:', error);
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
