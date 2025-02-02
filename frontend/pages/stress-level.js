class StressTracker {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.loadData();
    this.currentView = 'weekly';
    this.updateChart();
    this.updateRangeColors(); 
  }

  initializeElements() {
    this.stressChart = new Chart(
      document.getElementById('stressChart').getContext('2d'),
      this.getChartConfig()
    );
    
    this.stressLevel = document.getElementById('stressLevel');
    this.stressValue = document.getElementById('stressValue');
  }

  attachEventListeners() {
    const backBtn = document.getElementById('backToMainBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    this.stressLevel.addEventListener('input', (e) => {
      this.stressValue.textContent = parseFloat(e.target.value).toFixed(1);
      this.updateRangeColors(); 
    });

    document.getElementById('stressEntryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveStressEntry();
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.changeView(e.target.dataset.view);
      });
    });
  }

  changeView(view) {
    this.currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    this.updateChart();
  }

  getChartConfig() {
    return {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Stress Level',
          data: [],
          borderColor: 'rgba(255, 99, 132, 1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 10,
            title: {
              display: true,
              text: 'Stress Level'
            }
          }
        }
      }
    };
  }

  saveStressEntry() {
    const entry = {
      level: parseFloat(this.stressLevel.value),
      date: new Date().toISOString(),
      id: Date.now()
    };

    let entries = JSON.parse(localStorage.getItem('stressEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('stressEntries', JSON.stringify(entries));

    this.loadData();
    this.updateChart();
  }

  loadData() {
    const entries = JSON.parse(localStorage.getItem('stressEntries') || '[]');
    this.renderEntries(entries);
    this.updateStressStatus(entries);
  }

  updateStressStatus(entries) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEntries = entries.filter(entry => 
      new Date(entry.date) > weekAgo
    );

    const avgStress = recentEntries.reduce((acc, entry) => 
      acc + entry.level, 0) / (recentEntries.length || 1);

    const status = avgStress <= 3 ? 'Good' : avgStress <= 7 ? 'Medium' : 'Bad';
    const colors = {
      Good: '#2ecc71',
      Medium: '#f1c40f',
      Bad: '#e74c3c'
    };

    const indicator = document.getElementById('stressIndicator');
    indicator.innerHTML = `
      <h3>Average Stress Level: ${avgStress.toFixed(1)}</h3>
      <p style="color: ${colors[status]}">Status: ${status}</p>
    `;
  }

  renderEntries(entries) {
    const container = document.getElementById('stressEntries');
    container.innerHTML = entries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(entry => `
        <div class="entry-item" data-id="${entry.id}">
          <div class="entry-content">
            <p>Level: ${entry.level}</p>
            <small>${new Date(entry.date).toLocaleString()}</small>
          </div>
          <div class="entry-actions">
            <button class="edit-btn" onclick="stressTracker.editEntry(${entry.id})">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="delete-btn" onclick="stressTracker.deleteEntry(${entry.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
  }

  editEntry(id) {
    const entries = JSON.parse(localStorage.getItem('stressEntries') || '[]');
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const entryElement = document.querySelector(`[data-id="${id}"]`);
    entryElement.innerHTML = `
      <div class="edit-form">
        <input type="range" min="0" max="10" step="0.1" value="${entry.level}" class="edit-level">
        <span class="edit-value">${entry.level}</span>
        <div class="edit-actions">
          <button onclick="stressTracker.saveEdit(${id})">Save</button>
          <button onclick="stressTracker.loadData()">Cancel</button>
        </div>
      </div>
    `;

    const rangeInput = entryElement.querySelector('.edit-level');
    const valueDisplay = entryElement.querySelector('.edit-value');
    rangeInput.addEventListener('input', (e) => {
      valueDisplay.textContent = parseFloat(e.target.value).toFixed(1);
    });
  }

  saveEdit(id) {
    const entries = JSON.parse(localStorage.getItem('stressEntries') || '[]');
    const newLevel = parseFloat(document.querySelector(`[data-id="${id}"] .edit-level`).value);
    
    const updatedEntries = entries.map(entry => 
      entry.id === id ? {...entry, level: newLevel} : entry
    );

    localStorage.setItem('stressEntries', JSON.stringify(updatedEntries));
    this.loadData();
    this.updateChart();
  }

  deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    const entries = JSON.parse(localStorage.getItem('stressEntries') || '[]');
    const filteredEntries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('stressEntries', JSON.stringify(filteredEntries));
    
    this.loadData();
    this.updateChart();
  }

  updateChart() {
    const entries = JSON.parse(localStorage.getItem('stressEntries') || '[]');
    const dates = this.getDateRangeForView();
    
    const chartData = this.processEntriesForChart(entries, dates);
    
    this.stressChart.data.labels = chartData.labels;
    this.stressChart.data.datasets[0].data = chartData.data;
    this.stressChart.update();
  }

  getDateRangeForView() {
    const end = new Date();
    const start = new Date();

    switch(this.currentView) {
      case 'weekly':
        start.setDate(end.getDate() - 7);
        return { start, end, format: 'MM-DD' };
      case 'monthly':
        start.setMonth(end.getMonth() - 1);
        return { start, end, format: 'MM-DD' };
      case 'yearly':
        start.setFullYear(end.getFullYear() - 1);
        return { start, end, format: 'YYYY-MM' };
    }
  }

  processEntriesForChart(entries, dateRange) {
    const filteredEntries = entries.filter(entry => 
      new Date(entry.date) >= dateRange.start && 
      new Date(entry.date) <= dateRange.end
    );

    // Group entries by date
    const groupedEntries = filteredEntries.reduce((acc, entry) => {
      const date = new Date(entry.date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry.level);
      return acc;
    }, {});

    // Calculate daily averages
    const dailyAverages = Object.entries(groupedEntries).map(([date, levels]) => ({
      date: new Date(date),
      level: levels.reduce((a, b) => a + b) / levels.length
    }));

    // Sort by date
    dailyAverages.sort((a, b) => a.date - b.date);

    return {
      labels: dailyAverages.map(entry => 
        entry.date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      ),
      data: dailyAverages.map(entry => entry.level)
    };
  }

  updateRangeColors() {
    const range = this.stressLevel;
    const value = range.value;
    const percentage = (value / range.max) * 100;
    range.style.background = `linear-gradient(to right, 
      #ffc67c 0%, 
      #ffc67c ${percentage}%, 
      #e0e0e0 ${percentage}%, 
      #e0e0e0 100%
    )`;
  }
}

// Initialize the tracker and make it global
window.stressTracker = new StressTracker();