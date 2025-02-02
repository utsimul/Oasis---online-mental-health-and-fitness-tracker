class NutritionTracker {
  constructor() {
    this.initializeChart();
    this.attachEventListeners();
    this.loadEntries();
  }

  initializeChart() {
    const ctx = document.getElementById('nutritionChart').getContext('2d');
    this.nutritionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Calories', 'Protein', 'Carbs', 'Fats'],
        datasets: [
          {
            label: 'Current Intake',
            data: [0, 0, 0, 0],
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
          {
            label: 'Recommended Daily Intake',
            data: [2000, 50, 275, 55], // Example recommended values
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  attachEventListeners() {
    document.getElementById('backToMainBtn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    document.getElementById('nutritionEntryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEntry();
    });
  }

  saveEntry() {
    const entry = {
      foodName: document.getElementById('foodName').value,
      calories: parseFloat(document.getElementById('calories').value),
      protein: parseFloat(document.getElementById('protein').value) || 0,
      carbs: parseFloat(document.getElementById('carbs').value) || 0,
      fats: parseFloat(document.getElementById('fats').value) || 0,
      date: new Date().toISOString(),
      id: Date.now()
    };

    let entries = JSON.parse(localStorage.getItem('nutritionEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('nutritionEntries', JSON.stringify(entries));

    document.getElementById('nutritionEntryForm').reset();
    this.loadEntries();
  }

  loadEntries() {
    const entries = JSON.parse(localStorage.getItem('nutritionEntries') || '[]');
    this.renderEntries(entries);
    this.updateChart(entries);
    this.updateNutritionStatus(entries);
  }

  renderEntries(entries) {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );

    const container = document.getElementById('nutritionEntries');
    container.innerHTML = todayEntries.map(entry => `
      <div class="entry-item" data-id="${entry.id}">
        <div class="entry-content">
          <p>${entry.foodName}</p>
          <p>Calories: ${entry.calories} | Protein: ${entry.protein}g | Carbs: ${entry.carbs}g | Fats: ${entry.fats}g</p>
          <small>${new Date(entry.date).toLocaleTimeString()}</small>
        </div>
        <div class="entry-actions">
          <button onclick="nutritionTracker.deleteEntry(${entry.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  updateChart(entries) {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );

    const totals = todayEntries.reduce((acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fats: acc.fats + entry.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    this.nutritionChart.data.datasets[0].data = [
      totals.calories,
      totals.protein,
      totals.carbs,
      totals.fats
    ];
    this.nutritionChart.update();
  }

  updateNutritionStatus(entries) {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );

    const totals = todayEntries.reduce((acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fats: acc.fats + entry.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const recommended = {
      calories: 2000,
      protein: 50,
      carbs: 275,
      fats: 55
    };

    const percentages = {
      calories: (totals.calories / recommended.calories * 100).toFixed(1),
      protein: (totals.protein / recommended.protein * 100).toFixed(1),
      carbs: (totals.carbs / recommended.carbs * 100).toFixed(1),
      fats: (totals.fats / recommended.fats * 100).toFixed(1)
    };

    document.getElementById('nutritionIndicator').innerHTML = `
      <div class="nutrition-status">
        <h3>Today's Progress</h3>
        <p>Calories: ${totals.calories} / ${recommended.calories} (${percentages.calories}%)</p>
        <p>Protein: ${totals.protein}g / ${recommended.protein}g (${percentages.protein}%)</p>
        <p>Carbs: ${totals.carbs}g / ${recommended.carbs}g (${percentages.carbs}%)</p>
        <p>Fats: ${totals.fats}g / ${recommended.fats}g (${percentages.fats}%)</p>
      </div>
    `;
  }

  deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    let entries = JSON.parse(localStorage.getItem('nutritionEntries') || '[]');
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('nutritionEntries', JSON.stringify(entries));

    this.loadEntries();
  }
}

window.nutritionTracker = new NutritionTracker();