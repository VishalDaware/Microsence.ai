const express = require('express');
const PDFDocument = require('pdfkit');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * POST /api/reports/generate-pdf
 * Generate a PDF report from report data
 * Body: { userId, farmId, fieldId?, reportData, farmName, userName, fieldData, chartImages }
 */
router.post('/generate-pdf', async (req, res) => {
  try {
    const { userId, farmId, reportData, farmName, userName, fieldData, chartImages } = req.body;

    if (!userId || !farmId) {
      return res.status(400).json({ success: false, error: 'userId and farmId are required' });
    }

    // Verify user and farm ownership
    const farm = await prisma.farm.findUnique({
      where: { id: parseInt(farmId) },
      include: { fields: true }
    });

    if (!farm) {
      return res.status(404).json({ success: false, error: 'Farm not found' });
    }

    if (farm.userId !== parseInt(userId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    // Set response headers for PDF download
    const filename = `soil-report-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe document to response
    doc.pipe(res);

    const colors = {
      primary: '#3E5F44',
      secondary: '#5E936C',
      lightBg: '#E8FFD7',
    };

    // ===== HEADER =====
    doc.fillColor(colors.primary).fontSize(24).font('Helvetica-Bold');
    doc.text('Soil Health Report', { align: 'left' });

    doc.fillColor(colors.secondary).fontSize(14).font('Helvetica');
    doc.text(farmName || 'Selected Farm', { align: 'left' });

    // Meta info
    doc.fontSize(10).fillColor(colors.secondary);
    doc.text(`Farmer: ${userName || 'Current User'}`, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    if (farm.fields && farm.fields.length > 0) {
      doc.text(`Fields: ${farm.fields.map(f => f.name).join(', ')}`, { align: 'right' });
    }

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(colors.secondary);
    doc.moveDown(0.5);

    // ===== SUMMARY CARDS =====
    doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary);
    doc.text('Report Summary', { underline: true });
    doc.moveDown(0.3);

    const summaryData = [
      { label: 'Total Readings', value: reportData?.totalReadings ?? '--' },
      { label: 'Avg Moisture', value: reportData?.avgMoisture ? `${reportData.avgMoisture}%` : '--' },
      { label: 'Health Score', value: reportData?.healthScore != null ? `${reportData.healthScore}/100` : '--' },
    ];

    doc.fontSize(10).font('Helvetica');
    summaryData.forEach((item, idx) => {
      if (idx > 0) doc.text(' ');
      doc.fillColor(colors.secondary).text(item.label + ':', { continued: true });
      doc.fillColor(colors.primary).font('Helvetica-Bold').text(' ' + item.value);
      doc.font('Helvetica');
    });

    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke(colors.secondary);
    doc.moveDown();

    // ===== FIELDS OVERVIEW TABLE =====
    if (farm.fields && farm.fields.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary);
      doc.text('Fields Overview', { underline: true });
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica');
      const tableTop = doc.y;
      const tableHeight = 20;
      const col1X = 40;
      const col2X = 200;

      // Header
      doc.rect(col1X, tableTop, 150, tableHeight).fill(colors.lightBg);
      doc.rect(col2X, tableTop, 315, tableHeight).fill(colors.lightBg);

      doc.fillColor(colors.primary).font('Helvetica-Bold');
      doc.text('Field', col1X + 5, tableTop + 4, { width: 140 });
      doc.text('Status', col2X + 5, tableTop + 4, { width: 305 });

      // Rows
      let rowY = tableTop + tableHeight;
      farm.fields.forEach((field, idx) => {
        const rowHeight = 30;
        doc.rect(col1X, rowY, 150, rowHeight).stroke(colors.secondary);
        doc.rect(col2X, rowY, 315, rowHeight).stroke(colors.secondary);

        doc.fillColor(colors.primary).font('Helvetica');
        doc.text(field.name, col1X + 5, rowY + 5, { width: 140 });
        doc.text('Latest readings included in detailed export', col2X + 5, rowY + 5, { width: 305, height: 20 });

        rowY += rowHeight;
      });

      doc.moveDown();
    }

    // ===== FIELD READINGS TABLE =====
    if (fieldData && fieldData.length > 0) {
      doc.moveDown();
      doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.primary);
      doc.text('Field Readings Table', { underline: true });
      doc.moveDown(0.3);

      // Table headers
      const headers = ['Field', 'Moisture (%)', 'Temp (°C)', 'CO₂ (ppm)', 'Nitrate (mg/L)', 'pH', 'Last Updated'];
      const colWidths = [60, 50, 50, 50, 60, 30, 120];
      const tableStartY = doc.y;

      doc.fontSize(8).font('Helvetica-Bold').fillColor(colors.primary);
      let colX = 40;
      headers.forEach((header, idx) => {
        doc.rect(colX, tableStartY, colWidths[idx], 18).fill(colors.lightBg);
        doc.fillColor(colors.primary);
        doc.text(header, colX + 2, tableStartY + 4, {
          width: colWidths[idx] - 4,
          align: 'center',
        });
        colX += colWidths[idx];
      });

      // Table rows
      let rowY = tableStartY + 18;
      doc.fontSize(7).font('Helvetica').fillColor(colors.primary);

      fieldData.forEach((row) => {
        const rowHeight = 16;
        colX = 40;

        // Draw borders
        headers.forEach((_, idx) => {
          doc.rect(colX, rowY, colWidths[idx], rowHeight).stroke(colors.secondary);
          colX += colWidths[idx];
        });

        // Fill data
        colX = 40;
        const rowData = [
          row.fieldName,
          row.soilMoisture,
          row.temperature,
          row.co2,
          row.nitrate,
          row.ph,
          row.timestamp ? new Date(row.timestamp).toLocaleDateString() : 'N/A',
        ];

        rowData.forEach((data, idx) => {
          doc.text(String(data), colX + 2, rowY + 2, {
            width: colWidths[idx] - 4,
            align: 'center',
            height: rowHeight - 4,
          });
          colX += colWidths[idx];
        });

        rowY += rowHeight;

        // Add new page if table gets too tall
        if (rowY > 700) {
          doc.addPage();
          rowY = 40;
        }
      });
    }

    // ===== CHARTS SECTION =====
    if (chartImages && Object.keys(chartImages).length > 0) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').fillColor(colors.primary);
      doc.text('Field Comparison Charts', { underline: true });
      doc.moveDown(0.5);

      const chartOrder = ['moisture', 'temperature', 'co2', 'nitrate', 'ph', 'health'];
      const chartLabels = {
        moisture: 'Soil Moisture across Fields',
        temperature: 'Temperature across Fields',
        co2: 'CO₂ across Fields',
        nitrate: 'Nitrate across Fields',
        ph: 'pH across Fields',
        health: 'Overall Soil Health across Fields',
      };

      let chartsOnPage = 0;
      const chartsPerPage = 2; // 2 charts per page

      chartOrder.forEach((chartKey) => {
        if (!chartImages[chartKey]) return;

        // Add new page every 2 charts
        if (chartsOnPage > 0 && chartsOnPage % chartsPerPage === 0) {
          doc.addPage();
          chartsOnPage = 0;
        }

        // Add chart label
        doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.primary);
        doc.text(chartLabels[chartKey], { align: 'center' });
        doc.moveDown(0.2);

        // Add chart image
        try {
          doc.image(chartImages[chartKey], {
            fit: [530, 280],
            align: 'center',
          });
        } catch (e) {
          doc.fontSize(10).fillColor(colors.secondary);
          doc.text(`Unable to render ${chartLabels[chartKey]}`, { align: 'center' });
        }

        doc.moveDown(0.3);
        chartsOnPage++;
      });
    }

    // ===== FOOTER =====
    doc.moveDown();
    doc.fontSize(8).fillColor(colors.secondary);
    doc.text('Generated by Microsence.ai - Agricultural Monitoring System', { align: 'center' });
    doc.text(`Report generated on ${new Date().toLocaleString()}`, { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ success: false, error: 'Failed to generate PDF', details: err.message });
  }
});

module.exports = router;
