function showMessage(text, type = 'success') {
    const box = document.getElementById('messageBox');
    const textEl = document.getElementById('messageText');
    
    box.className = `message-box ${type}`;
    textEl.textContent = text;
    box.classList.add('show');
    
    // Auto-hide after 5 seconds
    setTimeout(hideMessage, 5000);
    
  }

  function showOrderConfirmation(totalAmount) {
    // Set the total amount in modal
    document.getElementById('modalTotalAmount').textContent = 'Rs. ' + totalAmount;
    
    // Show modal
    const modal = document.getElementById('orderConfirmationModal');
    modal.style.display = 'block';
    
    // OK button handler
    document.getElementById('confirmOkBtn').onclick = function() {
      modal.style.display = 'none';
      window.location.reload(); // Reload the page
    };
    
    // Close modal when clicking outside
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
        window.location.reload();
      }
    }
  }
  
  function hideMessage() {
    const box = document.getElementById('messageBox');
    box.classList.remove('show');
  }

// Function to handle checkout form submission
async function handleCheckout(event) {
    event.preventDefault();
    
    // Get cart data from localStorage
    const cartString = localStorage.getItem("cart");
    const cart = JSON.parse(cartString) || [];
    
    // Get user data from localStorage
    const username = localStorage.getItem("username");
    
    // Get form values
    const email = document.getElementById("ShippingEmail").value;
    const name = document.getElementById("name").value;
    const shippingAddress = document.getElementById("ShippingAddress").value;
    
    // Calculate total price
    const totalAmount = cart.reduce((total, item) => {
      return total + (item.productPrice * item.productQuantity);
    }, 0);
    
    // Prepare items array for API
    const items = cart.map(item => ({
      name: item.productName,
      price: item.productPrice,
      quantity: item.productQuantity
    }));
    
    // Validate inputs
    if (!username) {
      window.location.href = '../SignIn.html';
      return;
    }
    
    if (cart.length === 0) {
    showMessage("Your cart is empty", "error");
      return;
    }
    
    if (!email || !name || !shippingAddress) {
    showMessage("Please fill all required fields", "error");
      return;
    }
  
    try {
      // Submit to API
      const response = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          name,
          shipping_address: shippingAddress,
          total_amount: totalAmount,
          items
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Order failed');
      }
      
      // Success handling
      
      
      // Clear cart and redirect
      localStorage.removeItem("cart");
      showOrderConfirmation(totalAmount);
    //   setTimeout(() => {
    //     window.location.href = 'order-confirmation.html'; // Your confirmation page
    //   }, 1500);
      
    } catch (error) {
      console.error('Checkout error:', error);
      showMessage(error.message, 'error');
    }
  }
  
