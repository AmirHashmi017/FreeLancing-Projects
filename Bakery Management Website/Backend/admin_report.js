document.addEventListener('DOMContentLoaded', function() {
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    const generateBtn = document.getElementById('generateReportBtn');
    const downloadBtn = document.getElementById('downloadReportBtn');
    const previewDiv = document.getElementById('reportPreview');
    const previewContent = document.getElementById('previewContent');
    
    // Open report modal from navbar
    document.querySelector('#generatereport').addEventListener('click', function(e) {
        e.preventDefault();
        reportModal.show();
        
        // Reset modal state when opened
        previewDiv.style.display = 'none';
        downloadBtn.style.display = 'none';
        previewContent.innerHTML = '';
    });
    
    // Generate report button handler
    generateBtn.addEventListener('click', async function() {
        const timeframe = document.getElementById('timeframeSelect').value;
        const spinner = document.getElementById('reportSpinner');
        
        try {
            // Show loading state
            generateBtn.disabled = true;
            spinner.style.display = 'inline-block';
            
            // Fetch report data
            const response = await fetch(`http://localhost:3000/api/reports/revenue?timeframe=${timeframe}`);
            const reportData = await response.json();
            
            if (!response.ok) {
                throw new Error(reportData.error || 'Failed to generate report');
            }
            
            // Display preview
            displayReportPreview(reportData);
            previewDiv.style.display = 'block';
            
            // Generate PDF on server
            const pdfResponse = await fetch('http://localhost:3000/api/reports/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });
            
            const pdfData = await pdfResponse.json();
            
            if (!pdfResponse.ok) {
                throw new Error(pdfData.error || 'Failed to generate PDF');
            }
            
            // Enable download button
            downloadBtn.href = `http://localhost:3000/api/reports/download-pdf?filename=${pdfData.filename}`;
            downloadBtn.style.display = 'inline-block';
            
            // Show success message when download is clicked
            downloadBtn.addEventListener('click', function() {
                setTimeout(() => {
                    showMessage('success', 'PDF downloaded successfully!');
                }, 1000);
            });
            
            // Show success message for PDF generation
            showMessage('success', 'PDF generated successfully! Click Download to save.');
            
        } catch (error) {
            console.error('Report generation error:', error);
            previewContent.innerHTML = `
                <div class="alert alert-danger">
                    ${error.message}
                </div>
            `;
            showMessage('error', error.message);
        } finally {
            generateBtn.disabled = false;
            spinner.style.display = 'none';
        }
    });
    
    // Show message when modal is closed
    reportModal._element.addEventListener('hidden.bs.modal', function() {
        showMessage('success', 'Report PDF is ready for download!');
    });
    
    function displayReportPreview(reportData) {
        const totalRevenue = reportData.revenueData.reduce((sum, month) => sum + month.total_revenue, 0);
        const totalOrders = reportData.revenueData.reduce((sum, month) => sum + month.order_count, 0);
        
        let html = `
            <p><strong>Timeframe:</strong> ${formatTimeframe(reportData.timeframe)}</p>
            <p><strong>Period:</strong> ${formatDate(reportData.startDate)} to ${formatDate(reportData.endDate)}</p>
            <hr>
            <h6>Summary</h6>
            <ul>
                <li>Total Revenue: Rs. ${totalRevenue }</li>
                <li>Total Orders: ${totalOrders}</li>
                <li>Average Order Value: Rs. ${(totalRevenue / totalOrders) }</li>
            </ul>
            <hr>
            <h6>Top Products</h6>
            <ol>
        `;
        
        reportData.topProducts.forEach(product => {
            html += `
                <li>
                    ${product.product_name} - 
                    ${product.total_quantity} sold (Rs. ${product.total_revenue })
                </li>
            `;
        });
        
        html += `</ol>`;
        previewContent.innerHTML = html;
    }
    
    function formatTimeframe(timeframe) {
        const map = {
            '1month': 'Last 1 Month',
            '2months': 'Last 2 Months',
            '6months': 'Last 6 Months',
            '1year': 'Last 1 Year'
        };
        return map[timeframe] || timeframe;
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    // Message functions
    function showMessage(type, message) {
        const messageBox = document.getElementById('messageBox');
        const messageText = document.getElementById('messageText');
        
        messageBox.className = 'message-box show ' + type;
        messageText.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(hideMessage, 5000);
    }

    function hideMessage() {
        document.getElementById('messageBox').className = 'message-box';
    }
});