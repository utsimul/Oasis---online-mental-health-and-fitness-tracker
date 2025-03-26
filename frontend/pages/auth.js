class AuthManager {
  constructor() {
    this.API_BASE_URL = "http://localhost:5001/api";
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const signInForm = document.getElementById("signInForm");
    if (signInForm) {
      signInForm.addEventListener("submit", this.handleSignIn.bind(this));
    }

    const signUpForm = document.getElementById("signUpForm");
    if (signUpForm) {
      signUpForm.addEventListener("submit", this.handleSignUp.bind(this));
    }
  }

  async handleSignIn(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      console.log("Attempting login with:", { email });
      
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log("Login response:", result);

      if (response.ok) {
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        window.location.href = "index.html";
      } else {
        this.showError(result.message || "Invalid credentials", "signInForm");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showError("Network error. Please try again.", "signInForm");
    }
  }

  async handleSignUp(event) {
    event.preventDefault();
    const userData = {
      nickname: document.getElementById("nickname").value.trim(),
      fullname: document.getElementById("fullname").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value
    };

    // Validate inputs
    if (!this.validateSignUpData(userData)) return;

    try {
      console.log("Attempting registration with:", userData);
      
      const response = await fetch(`${this.API_BASE_URL}/users`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      console.log("Registration response:", result);

      if (response.ok) {
        this.showSuccess("Account created successfully! Redirecting...", "signUpForm");
        setTimeout(() => {
          window.location.href = "signin.html";
        }, 1500);
      } else {
        this.showError(result.message || "Registration failed. Please try again.", "signUpForm");
      }
    } catch (error) {
      console.error("Signup error:", error);
      this.showError("Network error. Please try again.", "signUpForm");
    }
  }

  validateSignUpData(data) {
    // Check required fields
    if (!data.nickname || !data.fullname || !data.email || !data.password) {
      this.showError("All fields are required", "signUpForm");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      this.showError("Please enter a valid email address", "signUpForm");
      return false;
    }

    // Validate password
    if (!this.validatePassword(data.password)) {
      this.showError(
        "Password must be at least 8 characters with uppercase, lowercase, and number",
        "signUpForm"
      );
      return false;
    }

    // Check password match
    if (data.password !== data.confirmPassword) {
      this.showError("Passwords do not match", "signUpForm");
      return false;
    }

    return true;
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
    let errorDiv = form.querySelector(".error-message");

    if (!errorDiv) {
      errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      form.prepend(errorDiv); // Add at top of form
    }

    errorDiv.textContent = message;
    errorDiv.style.color = "#ff4444";
    errorDiv.style.marginBottom = "15px";
    errorDiv.style.display = "block";

    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }

  showSuccess(message, formId) {
    const form = document.getElementById(formId);
    let successDiv = form.querySelector(".success-message");

    if (!successDiv) {
      successDiv = document.createElement("div");
      successDiv.className = "success-message";
      form.prepend(successDiv);
    }

    successDiv.textContent = message;
    successDiv.style.color = "#00C851";
    successDiv.style.marginBottom = "15px";
    successDiv.style.display = "block";

    setTimeout(() => {
      successDiv.style.display = "none";
    }, 5000);
  }

  static checkAuth() {
    const protectedRoutes = ["index.html", "dashboard.html"]; // Add your protected routes
    const currentRoute = window.location.pathname.split("/").pop();
    
    if (protectedRoutes.includes(currentRoute) && !localStorage.getItem("authToken")) {
      window.location.href = "signin.html";
    }
    
    // If on auth pages but already logged in, redirect to home
    if (["signin.html", "signup.html"].includes(currentRoute) && localStorage.getItem("authToken")) {
      localStorage.setItem('authToken', token);
      window.location.href = 'index.html';
    }
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new AuthManager();
  AuthManager.checkAuth();
});