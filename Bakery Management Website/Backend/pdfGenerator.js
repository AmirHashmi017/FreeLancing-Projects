const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
function showMessage(text, type = 'success') {
    const box = document.getElementById('messageBox');
    const textEl = document.getElementById('messageText');
    
    box.className = `message-box ${type}`;
    textEl.textContent = text;
    box.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(hideMessage, 5000);
    
  }
  
  function hideMessage() {
    const box = document.getElementById('messageBox');
    box.classList.remove('show');
  }
function generateRevenueReportPDF(reportData, filePath) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        // Add styling constants
        const colors = {
            primary: '#3366cc',   // For main headings
            secondary: '#6699cc', // For subheadings and accents
            text: '#000000',      // Black for all regular text
            border: '#dddddd'     // Light gray for borders
        };
        
        // Track pages manually
        let pageCount = 0;
        doc.on('pageAdded', () => pageCount++);

        // Header with styling
        doc.fontSize(24).fillColor(colors.primary).text('Sweet Byte Bakers', { align: 'center' });
        doc.fontSize(18).fillColor(colors.secondary).text('Revenue Report', { align: 'center' });
        doc.moveDown();

        // Report Period - in black text
        doc.fontSize(12).fillColor(colors.text)
           .text(`Report Period: ${formatDate(reportData.startDate)} to ${formatDate(reportData.endDate)}`, { align: 'center' });
        doc.moveDown(2);

        // Summary Statistics
        addSectionHeader(doc, 'Summary Statistics', colors.primary);
        
        // Calculate summary statistics
        const rawTotalRevenue = reportData.revenueData.reduce((sum, month) => sum + month.total_revenue, 0);
        const totalRevenue = Math.round(rawTotalRevenue);
        const totalOrders = reportData.revenueData.reduce((sum, month) => sum + month.order_count, 0);
        const avgOrderValue = totalOrders > 0 ? Math.round(rawTotalRevenue / totalOrders) : 0;
        
        // Create a summary box (now just a bordered box without fill)
        const boxTop = doc.y;
        doc.rect(50, boxTop, 500, 80).stroke(colors.border);
        doc.fillColor(colors.text); // Set text color to black
        
        // Add summary content
        doc.fontSize(14).text(`Total Revenue: Rs. ${formatNumber(totalRevenue)}`, 70, boxTop + 15);
        doc.text(`Total Orders: ${formatNumber(totalOrders)}`, 70, boxTop + 35);
        doc.text(`Average Order Value: Rs. ${formatNumber(avgOrderValue)}`, 70, boxTop + 55);
        doc.moveDown(4);

        // Monthly Revenue Chart
        addSectionHeader(doc, 'Monthly Revenue', colors.primary);
        
        // Table Header with styling
        const tableTop = doc.y + 10;
        const colWidths = [100, 100, 150, 150];
        const colPos = [50, 150, 250, 400];
        
        // Draw table header background
        doc.rect(50, tableTop - 5, 500, 25).fillAndStroke(colors.secondary, colors.secondary);
        
        // Header text (white on colored background)
        doc.fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('Month', colPos[0], tableTop, { width: colWidths[0] });
        doc.text('Orders', colPos[1], tableTop, { width: colWidths[1] });
        doc.text('Revenue', colPos[2], tableTop, { width: colWidths[2], align: 'right' });
        doc.text('Avg. Order', colPos[3], tableTop, { width: colWidths[3], align: 'right' });
        
        let rowY = tableTop + 25;
        
        // Table Rows - no background color
        doc.font('Helvetica').fillColor(colors.text); // Black text
        reportData.revenueData.forEach((month) => {
            const monthRevenue = Math.round(month.total_revenue);
            const monthOrders = month.order_count;
            const monthAvgOrder = monthOrders > 0 ? Math.round(month.total_revenue / monthOrders) : 0;
            
            doc.text(month.month, colPos[0], rowY, { width: colWidths[0] });
            doc.text(formatNumber(monthOrders), colPos[1], rowY, { width: colWidths[1] });
            doc.text(`Rs. ${formatNumber(monthRevenue)}`, colPos[2], rowY, { width: colWidths[2], align: 'right' });
            doc.text(`Rs. ${formatNumber(monthAvgOrder)}`, colPos[3], rowY, { width: colWidths[3], align: 'right' });
            
            rowY += 25;
        });
        
        // Border for the entire table
        doc.rect(50, tableTop - 5, 500, rowY - tableTop + 5).stroke(colors.border);
        doc.moveDown(4);

        // Top Products on new page
        doc.addPage();
        addSectionHeader(doc, 'Top Selling Products', colors.primary);
        
        // Product table header
        const prodTableTop = doc.y + 10;
        const prodColWidths = [250, 100, 150];
        const prodColPos = [50, 300, 400];
        
        // Draw table header background
        doc.rect(50, prodTableTop - 5, 500, 25).fillAndStroke(colors.secondary, colors.secondary);
        
        // Header text (white on colored background)
        doc.fillColor('#ffffff').font('Helvetica-Bold');
        doc.text('Product', prodColPos[0], prodTableTop, { width: prodColWidths[0] });
        doc.text('Quantity', prodColPos[1], prodTableTop, { width: prodColWidths[1], align: 'right' });
        doc.text('Revenue', prodColPos[2], prodTableTop, { width: prodColWidths[2], align: 'right' });
        
        let prodRowY = prodTableTop + 25;
        
        // Product table rows - no background color
        doc.font('Helvetica').fillColor(colors.text);
        if (reportData.topProducts && Array.isArray(reportData.topProducts)) {
            reportData.topProducts.forEach((product) => {
                const productName = product.product_name || product.name;
                const totalQuantity = Math.round(product.total_quantity);
                const totalRevenue = Math.round(product.total_revenue);
                
                doc.text(productName, prodColPos[0], prodRowY, { width: prodColWidths[0] });
                doc.text(formatNumber(totalQuantity), prodColPos[1], prodRowY, { width: prodColWidths[1], align: 'right' });
                doc.text(`Rs. ${formatNumber(totalRevenue)}`, prodColPos[2], prodRowY, { width: prodColWidths[2], align: 'right' });
                
                prodRowY += 25;
            });
        }
        
        // Border for the entire table
        doc.rect(50, prodTableTop - 5, 500, prodRowY - prodTableTop + 5).stroke(colors.border);

        // Footer with date and page numbers
        doc.on('pageAdded', () => {
            const pages = doc.bufferedPageRange();
            for (let i = 0; i < pages.count; i++) {
                doc.switchToPage(i);
                
                // Page numbers in secondary color
                doc.fontSize(10).fillColor(colors.secondary)
                   .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 50, { align: 'center' });
                
                // Generation date in black text
                if (i === pages.count - 1) {
                    doc.fontSize(10).fillColor(colors.text)
                       .text(`Report generated on: ${formatDate(reportData.generatedAt)}`, 50, doc.page.height - 70, { align: 'right' });
                }
            }
        });

        doc.end();
       
        stream.on('finish', () => {
            showMessage("PDF generated and downloaded successfully.See Reports Folder.")
            resolve(filePath);
        });
        stream.on('error', reject);
    });
}

// Helper function to format section headers (keeps colored headers)
function addSectionHeader(doc, title, color) {
    doc.fontSize(16).fillColor(color).text(title, { underline: true });
    doc.fillColor('#000000').moveDown(); // Reset to black for following text
}

// Helper function to format dates
function formatDate(date) {
    if (!date) return "N/A";
    try {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return "Invalid Date";
    }
}

// Helper function to format numbers with commas
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = { generateRevenueReportPDF };