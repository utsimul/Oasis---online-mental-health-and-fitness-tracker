class AuthManager {
  constructor() {
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
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        window.location.href = "index.html";
      } else {
        this.showError(result.message || "Invalid email or password", "signInForm");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showError("An error occurred while signing in", "signInForm");
    }
  }

  async handleSignUp(event) {
    event.preventDefault();
    const nickname = document.getElementById("nickname").value;
    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!this.validatePassword(password)) {
      this.showError("Password must meet the requirements", "signUpForm");
      return;
    }

    if (password !== confirmPassword) {
      this.showError("Passwords do not match", "signUpForm");
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, fullname, email, password }),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        window.location.href = "index.html";
      } else {
        this.showError(result.message || "Signup failed", "signUpForm");
      }
    } catch (error) {
      console.error("Signup error:", error);
      this.showError("An error occurred while creating an account", "signUpForm");
    }
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
      form.appendChild(errorDiv);
    }

    errorDiv.textContent = message;
    errorDiv.style.display = "block";

    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 3000);
  }

  static checkAuth() {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser && !window.location.href.includes("signin.html") && !window.location.href.includes("signup.html")) {
      window.location.href = "signin.html";
    }
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Check authentication status on page load
document.addEventListener("DOMContentLoaded", () => {
  AuthManager.checkAuth();
});
