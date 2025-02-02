class AuthManager {
  constructor() {
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const signInForm = document.getElementById('signInForm');
    if (signInForm) {
      signInForm.addEventListener('submit', this.handleSignIn.bind(this));
    }

    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
      signUpForm.addEventListener('submit', this.handleSignUp.bind(this));
    }
  }

  handleSignIn(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      window.location.href = 'index.html';
    } else {
      this.showError('Invalid email or password', 'signInForm');
    }
  }

  handleSignUp(event) {
    event.preventDefault();
    const nickname = document.getElementById('nickname').value;
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!this.validatePassword(password)) {
      this.showError('Password must meet the requirements', 'signUpForm');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Passwords do not match', 'signUpForm');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(user => user.email === email)) {
      this.showError('Email already exists', 'signUpForm');
      return;
    }

    const newUser = {
      id: Date.now(),
      nickname,
      fullname,
      email,
      password
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    window.location.href = 'index.html';
  }

  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
  }

  showError(message, formId) {
    const form = document.getElementById(formId);
    let errorDiv = form.querySelector('.error-message');
    
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      form.appendChild(errorDiv);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  }

  static checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser && !window.location.href.includes('signin.html') && !window.location.href.includes('signup.html')) {
      window.location.href = 'signin.html';
    }
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
  AuthManager.checkAuth();
});