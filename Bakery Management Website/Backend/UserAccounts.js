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

async function handleSignup(event) {
    event.preventDefault();
    
  
    const formData = {
      name: document.getElementById('fname').value.trim(),
      email: document.getElementById('mail').value.trim(),
      mobilenumber: document.getElementById('num').value.trim(),
      username: document.getElementById('userN').value.trim(),
      password: document.getElementById('pass').value
    };
  
    if (!formData.username || !formData.password) {
      showMessage('Username and password are required', 'error');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed. Please try again.');
      }

      showMessage('Account created successfully!', 'success');
      setTimeout(() => {
        window.location.href = '../SignIn.html'; // Change to your post-login page
      }, 1500);

      
      
    } catch (error) {
      console.error('Signup error:', error);
      showMessage(error.message,'error');
    }
  }

  async function handleSignin(event) {
    event.preventDefault();
    
    // Get form values
    const username = document.getElementById('userNL').value;
    const password = document.getElementById('passNL').value;

    if(username=="admin123" && password=="123")
    {
      
      
        window.location.href = '../admins_order.html'; 
        return;
      
    }
  
    try {
      // Show loading state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing In...';
  
      const response = await fetch('http://localhost:3000/api/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
  
      // Store username in localStorage
      localStorage.setItem('username', data.user.username);
      
  
      // Show success message
      showMessage('Login successful!', 'success');
      
      // Redirect after delay
      setTimeout(() => {
        window.location.href = '../Homepage.html'; // Change to your post-login page
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      showMessage(error.message, 'error');
    } finally {
      // Reset button state
      const submitBtn = event.target.querySelector('button[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  }