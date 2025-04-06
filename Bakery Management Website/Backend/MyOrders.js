document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch user orders
        const response = await fetch(`http://localhost:3000/api/orders/${username}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load orders');
        }

        displayOrders(data.orders);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('orders-container').innerHTML = `
            <div class="alert alert-danger">
                Error loading orders: ${error.message}
                <button onclick="window.location.reload()" class="btn btn-sm btn-outline-danger ms-3">Retry</button>
            </div>
        `;
    }
});

function displayOrders(orders) {
    const container = document.getElementById('orders-container');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet.</p>
                <a href="/" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        // Format order date
        const orderDate = new Date(order.order_date).toLocaleString();
        
        // Get status class
        const statusClass = `status-${order.order_status.replace(' ', '-')}`;
        
        // Format items
        const itemsHtml = order.items.map(item => `
            <div class="order-item row">
                <div class="col-md-6">${item.name}</div>
                <div class="col-md-2 text-end">${item.quantity}</div>
                <div class="col-md-2 text-end">Rs. ${item.price}</div>
                <div class="col-md-2 text-end">Rs. ${(item.price * item.quantity)}</div>
            </div>
        `).join('');

        return `
            <div class="card order-card mb-4">
                <div class="order-header d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0">Order #${order.order_id}</h5>
                        <small class="d-block">${orderDate}</small>
                    </div>
                    <span class="order-status ${statusClass}">
                        ${order.order_status.toUpperCase()}
                    </span>
                </div>
                <div class="card-body">
                    <div class="row fw-bold mb-2">
                        <div class="col-md-6">Item</div>
                        <div class="col-md-2 text-end">Qty</div>
                        <div class="col-md-2 text-end">Price</div>
                        <div class="col-md-2 text-end">Total</div>
                    </div>
                    ${itemsHtml}
                    <hr>
                    <div class="row mt-3">
                        <div class="col-md-6 order-details">
                            <p><strong>Shipping Address:</strong></p>
                            <p>${order.shipping_address.replace(/\n/g, '<br>')}</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <h5 class="mb-3">Order Total: Rs. ${order.total_amount}</h5>
                            
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}