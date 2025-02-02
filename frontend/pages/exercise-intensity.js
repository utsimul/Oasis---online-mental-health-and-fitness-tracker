class ExerciseTracker {
  constructor() {
    this.initializeChart();
    this.attachEventListeners();
    this.loadEntries();
  }

  initializeChart() {
    const ctx = document.getElementById('exerciseChart').getContext('2d');
    this.exerciseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Cardio', 'Strength', 'Flexibility', 'HIIT'],
        datasets: [{
          label: 'Minutes per Exercise Type',
          data: [0, 0, 0, 0],
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(255, 99, 132, 0.5)'
          ]
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Duration (minutes)'
            }
          }
        }
      }
    });
  }

  attachEventListeners() {
    document.getElementById('backToMainBtn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    const intensityInput = document.getElementById('intensity');
    const intensityValue = document.getElementById('intensityValue');
    
    intensityInput.addEventListener('input', (e) => {
      intensityValue.textContent = e.target.value;
    });

    document.getElementById('exerciseEntryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveEntry();
    });
  }

  saveEntry() {
    const entry = {
      type: document.getElementById('exerciseType').value,
      duration: parseInt(document.getElementById('duration').value),
      intensity: parseInt(document.getElementById('intensity').value),
      caloriesBurned: parseInt(document.getElementById('caloriesBurned').value) || 0,
      date: new Date().toISOString(),
      id: Date.now()
    };

    let entries = JSON.parse(localStorage.getItem('exerciseEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('exerciseEntries', JSON.stringify(entries));

    document.getElementById('exerciseEntryForm').reset();
    document.getElementById('intensityValue').textContent = '5';
    this.loadEntries();
  }

  loadEntries() {
    const entries = JSON.parse(localStorage.getItem('exerciseEntries') || '[]');
    this.renderEntries(entries);
    this.updateChart(entries);
    this.updateExerciseStatus(entries);
  }

  renderEntries(entries) {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );

    const container = document.getElementById('exerciseEntries');
    container.innerHTML = todayEntries.map(entry => `
      <div class="entry-item" data-id="${entry.id}">
        <div class="entry-content">
          <p>${entry.type} - ${entry.duration} minutes</p>
          <p>Intensity: ${entry.intensity}/10 | Calories Burned: ${entry.caloriesBurned}</p>
          <small>${new Date(entry.date).toLocaleTimeString()}</small>
        </div>
        <div class="entry-actions">
          <button onclick="exerciseTracker.deleteEntry(${entry.id})">
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

    const totalsByType = {
      cardio: 0,
      strength: 0,
      flexibility: 0,
      hiit: 0
    };

    todayEntries.forEach(entry => {
      totalsByType[entry.type] += entry.duration;
    });

    this.exerciseChart.data.datasets[0].data = [
      totalsByType.cardio,
      totalsByType.strength,
      totalsByType.flexibility,
      totalsByType.hiit
    ];
    this.exerciseChart.update();
  }

  updateExerciseStatus(entries) {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(entry => 
      new Date(entry.date).toDateString() === today
    );

    const totalDuration = todayEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalCalories = todayEntries.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
    const avgIntensity = todayEntries.length ? 
      todayEntries.reduce((sum, entry) => sum + entry.intensity, 0) / todayEntries.length : 0;

    const status = totalDuration >= 60 ? 'Good' : 
                  totalDuration >= 30 ? 'Fair' : 'Needs Improvement';

    const colors = {
      Good: '#2ecc71',
      Fair: '#f1c40f',
      'Needs Improvement': '#e74c3c'
    };

    document.getElementById('exerciseIndicator').innerHTML = `
      <div class="exercise-status">
        <h3>Today's Exercise Summary</h3>
        <p>Total Duration: ${totalDuration} minutes</p>
        <p>Calories Burned: ${totalCalories}</p>
        <p>Average Intensity: ${avgIntensity.toFixed(1)}/10</p>
        <p style="color: ${colors[status]}">Status: ${status}</p>
      </div>
    `;
  }

  deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    let entries = JSON.parse(localStorage.getItem('exerciseEntries') || '[]');
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('exerciseEntries', JSON.stringify(entries));

    this.loadEntries();
  }
}

window.exerciseTracker = new ExerciseTracker();