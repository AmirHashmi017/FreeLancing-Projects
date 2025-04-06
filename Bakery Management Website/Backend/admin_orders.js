document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar on mobile
    document.getElementById('sidebarToggle').addEventListener('click', function() {
        document.body.classList.toggle('sidebar-toggled');
    });

    // Load all orders
    loadAllOrders();

    // Search functionality
    document.getElementById('searchOrders').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const orderCards = document.querySelectorAll('.order-card');
        
        orderCards.forEach(card => {
            const orderText = card.textContent.toLowerCase();
            card.style.display = orderText.includes(searchTerm) ? 'block' : 'none';
        });
    });

    // Status update modal handlers
    const statusModal = new bootstrap.Modal(document.getElementById('statusModal'));
    let currentOrderId = null;

    // Set up modal when edit button is clicked
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('update-status-btn')) {
            currentOrderId = e.target.dataset.orderId;
            const currentStatus = e.target.dataset.currentStatus;
            
            document.getElementById('currentOrderId').value = currentOrderId;
            document.getElementById('statusSelect').value = currentStatus;
            statusModal.show();
        }
    });

    // Save status changes
    document.getElementById('saveStatusBtn').addEventListener('click', async function() {
        const newStatus = document.getElementById('statusSelect').value;
        
        try {
            const response = await fetch(`http://localhost:3000/api/orders/${currentOrderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_status: newStatus
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status');
            }

            // Refresh orders after successful update
            loadAllOrders();
            statusModal.hide();
            
            // Show success message
            showAlert('Status updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            showAlert(`Error: ${error.message}`, 'danger');
        }
    });
});

async function loadAllOrders() {
    const container = document.getElementById('orders-container');
    
    try {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        const response = await fetch('http://localhost:3000/api/orders');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load orders');
        }

        displayOrders(data.orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Error loading orders: ${error.message}
                <button onclick="loadAllOrders()" class="btn btn-sm btn-outline-danger ms-3">Retry</button>
            </div>
        `;
    }
}

function displayOrders(orders) {
    const container = document.getElementById('orders-container');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                No orders found
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        const orderDate = new Date(order.order_date).toLocaleString();
        const statusClass = `status-${order.order_status.replace(' ', '-')}`;
        
        // Format items
        const itemsList = order.items.map(item => 
            `<li class="list-group-item d-flex justify-content-between">
                <span>${item.name} × ${item.quantity}</span>
                <span>Rs. ${(item.price * item.quantity) }</span>
            </li>`
        ).join('');

        return `
            <div class="card order-card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-0">Order #${order.order_id}</h5>
                        <small class="text-muted">${orderDate}</small>
                    </div>
                    <div>
                        <span class="order-status-badge ${statusClass} me-2">
                            ${order.order_status.toUpperCase()}
                        </span>
                        <button class="btn btn-sm btn-outline-primary update-status-btn" 
                                data-order-id="${order.order_id}"
                                data-current-status="${order.order_status}">
                            <i class="bi bi-pencil"></i> Update
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Customer Details</h6>
                            <p class="mb-1"><strong>Name:</strong> ${order.username}</p>
                            <p class="mb-1"><strong>Email:</strong> ${order.email}</p>
                            <p><strong>Address:</strong> ${order.shipping_address.replace(/\n/g, '<br>')}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>Order Items</h6>
                            <ul class="list-group mb-3">
                                ${itemsList}
                            </ul>
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Total:</h5>
                                <h4 class="mb-0">Rs. ${order.total_amount }</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const header = document.querySelector('.admin-header');
    header.insertAdjacentElement('afterend', alert);
    
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 150);
    }, 3000);
}