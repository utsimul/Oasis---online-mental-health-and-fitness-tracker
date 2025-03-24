document.addEventListener("DOMContentLoaded", () => {
  class WellnessTracker {
    constructor() {
      this.initEventListeners();
      this.loadData();
      this.initCharts();
      this.initFoodTracking();
      this.updateNutrientComparison();
      this.checkAuth(); // Add authentication check
    }

    checkAuth() {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        window.location.href = 'signin.html';
      }
    }

    initEventListeners() {
      document.querySelectorAll('button').forEach(btn => {
        if (btn.id === 'signInBtn') {
          btn.addEventListener('click', () => {
            window.location.href = 'signin.html';
          });
        }
      });

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
      document.querySelectorAll('main section').forEach(section => section.classList.remove('active-section'));
      document.getElementById(sectionId)?.classList.add('active-section');
    }

    handleJournalSubmit(event) {
      event.preventDefault();
      const journalInput = document.getElementById('journalInput');
      const entry = { text: journalInput.value, date: new Date().toISOString() };
      let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      entries.push(entry);
      localStorage.setItem('journalEntries', JSON.stringify(entries));
      journalInput.value = '';
      this.renderJournalEntries();
    }

    renderJournalEntries() {
      const entriesContainer = document.getElementById('journalEntries');
      const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      entriesContainer.innerHTML = entries.map(entry => `<div class="journal-entry"><p>${entry.text}</p><small>${entry.date}</small></div>`).join('');
    }

    handleFoodSubmit(event) {
      event.preventDefault();
      const mealType = document.getElementById('mealType').value;
      const foodInput = document.getElementById('foodInput');
      const caloriesInput = document.getElementById('caloriesInput');
      const foodItem = { name: foodInput.value, calories: caloriesInput.value, date: new Date().toLocaleString() };
      let meals = JSON.parse(localStorage.getItem(`${mealType}Meals`) || '[]');
      meals.push(foodItem);
      localStorage.setItem(`${mealType}Meals`, JSON.stringify(meals));
      this.renderMeals();
      foodInput.value = '';
      caloriesInput.value = '';
    }

    renderMeals() {
      ['breakfast', 'lunch', 'dinner'].forEach(type => {
        const list = document.getElementById(`${type}List`);
        const meals = JSON.parse(localStorage.getItem(`${type}Meals`) || '[]');
        list.innerHTML = meals.map(meal => `<li>${meal.name} - ${meal.calories} calories<small>${meal.date}</small></li>`).join('');
      });
    }

    saveHealthMetrics() {
      const metrics = {
        weight: document.getElementById('weightInput').value,
        steps: document.getElementById('stepsInput').value,
        sleep: document.getElementById('sleepInput').value,
        date: new Date().toLocaleString()
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

    initCharts() {}
    initFoodTracking() {}
    updateNutrientComparison() {}
  }

  new WellnessTracker();
});
