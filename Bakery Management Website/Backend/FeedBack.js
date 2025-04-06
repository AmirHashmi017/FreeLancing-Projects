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
  

// Form toggle functions

function openForm() {
    const username = localStorage.getItem('username');
    if (!username) {
      showMessage('Please sign in to submit feedback', 'error');
      return;
    }
    
    // document.getElementById('feedbackUsername').textContent = `Submitting as: ${username}`;
    document.getElementById('feedbackForm').style.display = 'block';
  }
  
  function closeForm() {
    document.getElementById('feedbackForm').style.display = 'none';
  }
  
  // Feedback submission
  async function submitFeedback(event) {
    event.preventDefault();
    
    const username = localStorage.getItem('username');
    const feedbacktext = document.getElementById('feedbackMessage').value;
  
    try {
      const response = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, feedbacktext })
      });
  
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
  
      const data = await response.json();
      showMessage('Feedback submitted!', 'success');
      document.getElementById('feedbackMessage').value="";
      closeForm();
  
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error');
      console.error('Submission error:', error);
    }
  }