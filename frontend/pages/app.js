document.addEventListener("DOMContentLoaded", () => {
  class WellnessTracker {
    constructor() {
      this.authElements = {
        signInBtn: document.getElementById('signInBtn'),
        profileContainer: document.getElementById('profileContainer'),
        profileIcon: document.getElementById('profileIcon'),
        usernameDisplay: document.getElementById('usernameDisplay')
      };

      this.initAuthUI();
      this.initEventListeners();
      this.loadData();
      this.initCharts();
      this.initFoodTracking();
      this.updateNutrientComparison();
      this.profileDropdown = document.getElementById('profileDropdown');
      this.settingsBtn = document.getElementById('settingsBtn');
    }

    initAuthUI() {
      const currentUser = localStorage.getItem('currentUser');
      const authToken = localStorage.getItem('authToken');

      if (currentUser && authToken) {
        try {
          const user = JSON.parse(currentUser);
          this.showProfileIcon(user);
        } catch (e) {
          this.showSignInButton();
        }
      } else {
        this.showSignInButton();
      }
    }

    initProfileDropdown() {
      this.authElements.profileIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.profileDropdown.classList.toggle('hidden');
      });

      this.settingsBtn.addEventListener('click', () => {
        window.location.href = 'profile.html';
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.profile-icon-container')) {
          this.profileDropdown.classList.add('hidden');
        }
      });
    }

    showProfileIcon(user) {
      this.authElements.signInBtn.classList.add('hidden');
      this.authElements.profileContainer.classList.remove('hidden');
      
      const profilePhoto = localStorage.getItem('profilePhoto') || 'assets/default-profile.png';
      this.authElements.profileIcon.src = profilePhoto;
      
      document.getElementById('dropdownFullName').textContent = user.fullname;
      document.getElementById('dropdownEmail').textContent = user.email;
      document.getElementById('dropdownProfilePhoto').src = profilePhoto;
      
      this.initProfileDropdown();
    }

    showSignInButton() {
      this.authElements.profileContainer.classList.add('hidden');
      this.authElements.signInBtn.classList.remove('hidden');
      
      this.authElements.signInBtn.addEventListener('click', () => {
        window.location.href = 'signin.html';
      });
    }

    initEventListeners() {
      document.getElementById('journalBtn')?.addEventListener('click', () => this.showSection('journalSection'));
      document.getElementById('dietBtn')?.addEventListener('click', () => this.showSection('dietSection'));
      document.getElementById('healthBtn')?.addEventListener('click', () => this.showSection('healthSection'));
      document.getElementById('statsBtn')?.addEventListener('click', () => this.showSection('statsSection'));
      
      // Updated journal form submission
      document.getElementById('journalForm')?.addEventListener('submit', (e) => this.handleJournalSubmit(e));
      
      document.getElementById('foodForm')?.addEventListener('submit', this.handleFoodSubmit.bind(this));
      document.getElementById('saveMetricsBtn')?.addEventListener('click', this.saveHealthMetrics.bind(this));
      document.getElementById('viewJournalHistoryBtn')?.addEventListener('click', () => {
        window.location.href = 'journal-history.html';
      });
    }

    showSection(sectionId) {
      document.querySelectorAll('main section').forEach(section => {
        section.classList.remove('active-section');
      });
      document.getElementById(sectionId)?.classList.add('active-section');
    }

    async handleJournalSubmit(event) {
      event.preventDefault();
      
      // Get form values
      const text = document.getElementById('journalInput').value;
      const mood = document.querySelector('input[name="mood"]:checked')?.value;
      const authToken = localStorage.getItem('authToken');

      // Validate inputs
      if (!text || !mood) {
        alert('Please enter both journal text and select a mood');
        return;
      }

      if (!authToken) {
        window.location.href = 'signin.html';
        return;
      }

      try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

        // Send to backend
        const response = await fetch('/api/journal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            text,
            mood,
            date: new Date().toISOString()
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save entry');
        }

        // Reset form
        event.target.reset();
        alert('Journal entry saved successfully!');
        
        // Refresh entries
        await this.renderJournalEntries();

      } catch (error) {
        console.error('Journal submission error:', error);
        alert(`Error: ${error.message}`);
      } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.textContent = 'Save Entry';
          submitBtn.disabled = false;
        }
      }
    }

    async renderJournalEntries() {
      const authToken = localStorage.getItem('authToken');
      const entriesContainer = document.getElementById('journalEntriesContainer'); // Make sure this exists in HTML
      
      if (!authToken || !entriesContainer) return;

      try {
        entriesContainer.innerHTML = '<p>Loading entries...</p>';
        
        const response = await fetch('/api/journal', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch entries');

        const entries = await response.json();
        
        if (entries.length === 0) {
          entriesContainer.innerHTML = '<p>No journal entries yet.</p>';
          return;
        }

        entriesContainer.innerHTML = entries
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5) // Show only 5 most recent
          .map(entry => `
            <div class="journal-entry">
              <p class="entry-text">${entry.text}</p>
              <div class="entry-meta">
                <span class="mood-tag ${entry.mood}">${entry.mood}</span>
                <small>${new Date(entry.date).toLocaleString()}</small>
              </div>
            </div>
          `).join('');

      } catch (error) {
        console.error('Error loading journal entries:', error);
        entriesContainer.innerHTML = '<p>Error loading entries. Please try again.</p>';
      }
    }


    handleFoodSubmit(event) {
      event.preventDefault();
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        window.location.href = 'signin.html';
        return;
      }

      const mealType = document.getElementById('mealType').value;
      const foodInput = document.getElementById('foodInput');
      const caloriesInput = document.getElementById('caloriesInput');
      
      const foodItem = { 
        name: foodInput.value, 
        calories: caloriesInput.value, 
        date: new Date().toLocaleString(),
        userId: currentUser.id 
      };

      let meals = JSON.parse(localStorage.getItem(`${mealType}Meals`) || '[]');
      meals.push(foodItem);
      localStorage.setItem(`${mealType}Meals`, JSON.stringify(meals));
      this.renderMeals();
      foodInput.value = '';
      caloriesInput.value = '';
    }

    renderMeals() {
      const currentUserId = JSON.parse(localStorage.getItem('currentUser'))?.id;
      
      ['breakfast', 'lunch', 'dinner'].forEach(type => {
        const list = document.getElementById(`${type}List`);
        if (list) {
          const meals = JSON.parse(localStorage.getItem(`${type}Meals`) || []);
          const userMeals = meals.filter(meal => meal.userId === currentUserId);
          
          list.innerHTML = userMeals.map(meal => `
            <li>
              ${meal.name} - ${meal.calories} calories
              <small>${meal.date}</small>
            </li>
          `).join('');
        }
      });
    }

    saveHealthMetrics() {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        window.location.href = 'signin.html';
        return;
      }

      const metrics = {
        weight: document.getElementById('weightInput').value,
        steps: document.getElementById('stepsInput').value,
        sleep: document.getElementById('sleepInput').value,
        date: new Date().toLocaleString(),
        userId: currentUser.id
      };

      let metricHistory = JSON.parse(localStorage.getItem('healthMetrics') || '[]');
      metricHistory.push(metrics);
      localStorage.setItem('healthMetrics', JSON.stringify(metricHistory));
      alert('Health metrics saved successfully!');
    }

    loadData() {
      this.renderJournalEntries();
      this.renderMeals();
    }

    initCharts() {
      // Initialize your charts here
    }

    initFoodTracking() {
      // Food tracking initialization
    }

    updateNutrientComparison() {
      // Nutrient comparison logic
    }
  }

  new WellnessTracker();
});