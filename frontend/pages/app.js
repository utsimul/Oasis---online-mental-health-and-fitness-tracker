document.addEventListener("DOMContentLoaded", () => {
  class WellnessTracker {
    constructor() {
      this.authElements = {
        signInBtn: document.getElementById('signInBtn'),
        profileContainer: document.getElementById('profileContainer'),
        profileIcon: document.getElementById('profileIcon'),
        usernameDisplay: document.getElementById('usernameDisplay')
      };

      this.initAuthUI(); // Initialize auth UI first
      this.initEventListeners();
      this.loadData();
      this.initCharts();
      this.initFoodTracking();
      this.updateNutrientComparison();
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

    showProfileIcon(user) {
      this.authElements.signInBtn.classList.add('hidden');
      this.authElements.profileContainer.classList.remove('hidden');
      this.authElements.usernameDisplay.textContent = user.nickname || user.email.split('@')[0];
      
      // Add profile dropdown functionality if needed
      this.authElements.profileIcon.addEventListener('click', () => {
        // Implement profile dropdown or logout here
        console.log('Profile clicked', user);
      });
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
      document.getElementById('journalForm')?.addEventListener('submit', this.handleJournalSubmit.bind(this));
      document.getElementById('foodForm')?.addEventListener('submit', this.handleFoodSubmit.bind(this));
      document.getElementById('saveMetricsBtn')?.addEventListener('click', this.saveHealthMetrics.bind(this));

      const viewJournalHistoryBtn = document.getElementById('viewJournalHistoryBtn');
      viewJournalHistoryBtn?.addEventListener('click', () => {
        window.location.href = 'journal-history.html';
      });
    }

    showSection(sectionId) {
      document.querySelectorAll('main section').forEach(section => {
        section.classList.remove('active-section');
      });
      document.getElementById(sectionId)?.classList.add('active-section');
    }

    handleJournalSubmit(event) {
      event.preventDefault();
      const journalInput = document.getElementById('journalInput');
      const entry = { 
        text: journalInput.value, 
        date: new Date().toISOString(),
        userId: JSON.parse(localStorage.getItem('currentUser'))?.id 
      };
      
      let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      entries.push(entry);
      localStorage.setItem('journalEntries', JSON.stringify(entries));
      journalInput.value = '';
      this.renderJournalEntries();
    }

    renderJournalEntries() {
      const currentUserId = JSON.parse(localStorage.getItem('currentUser'))?.id;
      const entries = JSON.parse(localStorage.getItem('journalEntries') || []);
      const userEntries = entries.filter(entry => entry.userId === currentUserId);
      
      const entriesContainer = document.getElementById('journalEntries');
      if (entriesContainer) {
        entriesContainer.innerHTML = userEntries.map(entry => `
          <div class="journal-entry">
            <p>${entry.text}</p>
            <small>${new Date(entry.date).toLocaleString()}</small>
          </div>
        `).join('');
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