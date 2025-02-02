class MoodTracker {
  constructor() {
    this.initializeCharts();
    this.attachEventListeners();
    this.loadData();
    this.currentView = 'weekly';
  }

  initializeCharts() {
    // Happiness Chart
    this.happinessChart = new Chart(
      document.getElementById('happinessChart').getContext('2d'),
      this.getChartConfig('Happiness Level', 'rgba(162, 213, 171, 0.7)')
    );

    // Dissociation Chart
    this.dissociationChart = new Chart(
      document.getElementById('dissociationChart').getContext('2d'),
      this.getChartConfig('Dissociation Level', 'rgba(173, 216, 230, 0.7)')
    );

    // Anxiety Chart
    this.anxietyChart = new Chart(
      document.getElementById('anxietyChart').getContext('2d'),
      this.getChartConfig('Anxiety Level', 'rgba(255, 218, 185, 0.7)')
    );
  }

  attachEventListeners() {
    document.getElementById('backToMainBtn').addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    ['happiness', 'dissociation', 'anxiety'].forEach(type => {
      const input = document.getElementById(`${type}Level`);
      const display = document.getElementById(`${type}Value`);
      input.addEventListener('input', (e) => {
        display.textContent = parseFloat(e.target.value).toFixed(1);
        this.updateRangeColors();
      });
    });

    document.getElementById('moodEntryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveMoodEntry();
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.changeView(e.target.dataset.view);
      });
    });
  }

  getChartConfig(label, color) {
    return {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: label,
          data: [],
          borderColor: color,
          backgroundColor: color.replace('0.7', '0.2'),
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
              text: label
            }
          }
        }
      }
    };
  }

  saveMoodEntry() {
    const moodEntry = {
      happiness: parseFloat(document.getElementById('happinessLevel').value),
      dissociation: parseFloat(document.getElementById('dissociationLevel').value),
      anxiety: parseFloat(document.getElementById('anxietyLevel').value),
      date: new Date().toISOString(),
      id: Date.now()
    };

    const attackEntry = {
      types: Array.from(document.querySelectorAll('input[name="attackType"]:checked'))
                  .map(cb => cb.value),
      triggers: document.getElementById('triggers').value,
      date: new Date().toISOString(),
      id: Date.now()
    };

    // Save mood levels
    let moodEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    moodEntries.push(moodEntry);
    localStorage.setItem('moodEntries', JSON.stringify(moodEntries));

    // Save attack data if any attack types are checked
    if (attackEntry.types.length > 0) {
      let attackEntries = JSON.parse(localStorage.getItem('attackEntries') || '[]');
      attackEntries.push(attackEntry);
      localStorage.setItem('attackEntries', JSON.stringify(attackEntries));
    }

    // Reset form
    document.getElementById('moodEntryForm').reset();
    ['happiness', 'dissociation', 'anxiety'].forEach(type => {
      document.getElementById(`${type}Value`).textContent = '5.0';
    });

    this.loadData();
    this.updateCharts();
  }

  loadData() {
    const moodEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    this.renderMoodEntries(moodEntries);
    this.updateMoodStatus(moodEntries);
  }

  updateMoodStatus(moodEntries) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEntries = moodEntries.filter(entry => 
      new Date(entry.date) > weekAgo
    );

    const avgHappiness = recentEntries.reduce((acc, entry) => 
      acc + entry.happiness, 0) / (recentEntries.length || 1);
    
    const avgDissociation = recentEntries.reduce((acc, entry) => 
      acc + entry.dissociation, 0) / (recentEntries.length || 1);

    const avgAnxiety = recentEntries.reduce((acc, entry) => 
      acc + entry.anxiety, 0) / (recentEntries.length || 1);

    const status = avgHappiness >= 7 && avgDissociation <= 3 && avgAnxiety <= 3 ? 'Good' : 
                  avgHappiness >= 5 && avgDissociation <= 5 && avgAnxiety <= 5 ? 'Fair' : 'Poor';
    
    const colors = {
      Good: '#2ecc71',
      Fair: '#f1c40f',
      Poor: '#e74c3c'
    };

    const indicator = document.createElement('div');
    indicator.innerHTML = `
      <h3>Average Happiness: ${avgHappiness.toFixed(1)}</h3>
      <h3>Average Dissociation: ${avgDissociation.toFixed(1)}</h3>
      <h3>Average Anxiety: ${avgAnxiety.toFixed(1)}</h3>
      <p style="color: ${colors[status]}">Status: ${status}</p>
    `;

    const moodEntriesContainer = document.getElementById('moodEntries');
    moodEntriesContainer.parentNode.insertBefore(indicator, moodEntriesContainer);
  }

  renderMoodEntries(moodEntries) {
    const container = document.getElementById('moodEntries');
    container.innerHTML = moodEntries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(entry => `
        <div class="entry-item" data-id="${entry.id}">
          <div class="entry-content">
            <p>Happiness: ${entry.happiness} | Dissociation: ${entry.dissociation} | Anxiety: ${entry.anxiety}</p>
            <small>${new Date(entry.date).toLocaleString()}</small>
          </div>
          <div class="entry-actions">
            <button class="edit-btn" onclick="moodTracker.editEntry(${entry.id})">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="delete-btn" onclick="moodTracker.deleteEntry(${entry.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
  }

  editEntry(id) {
    const moodEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    const entry = moodEntries.find(e => e.id === id);
    if (!entry) return;

    const entryElement = document.querySelector(`[data-id="${id}"]`);
    entryElement.innerHTML = `
      <div class="edit-form">
        <div class="form-group">
          <label>Happiness: </label>
          <input type="range" class="edit-happiness" value="${entry.happiness}" min="0" max="10" step="0.1">
          <span class="edit-happiness-value">${entry.happiness}</span>
        </div>
        <div class="form-group">
          <label>Dissociation: </label>
          <input type="range" class="edit-dissociation" value="${entry.dissociation}" min="0" max="10" step="0.1">
          <span class="edit-dissociation-value">${entry.dissociation}</span>
        </div>
        <div class="form-group">
          <label>Anxiety: </label>
          <input type="range" class="edit-anxiety" value="${entry.anxiety}" min="0" max="10" step="0.1">
          <span class="edit-anxiety-value">${entry.anxiety}</span>
        </div>
        <div class="edit-actions">
          <button onclick="moodTracker.saveEdit(${id})">Save</button>
          <button onclick="moodTracker.loadData()">Cancel</button>
        </div>
      </div>
    `;

    const happinessInput = entryElement.querySelector('.edit-happiness');
    const happinessDisplay = entryElement.querySelector('.edit-happiness-value');
    happinessInput.addEventListener('input', (e) => {
      happinessDisplay.textContent = parseFloat(e.target.value).toFixed(1);
    });

    const dissociationInput = entryElement.querySelector('.edit-dissociation');
    const dissociationDisplay = entryElement.querySelector('.edit-dissociation-value');
    dissociationInput.addEventListener('input', (e) => {
      dissociationDisplay.textContent = parseFloat(e.target.value).toFixed(1);
    });

    const anxietyInput = entryElement.querySelector('.edit-anxiety');
    const anxietyDisplay = entryElement.querySelector('.edit-anxiety-value');
    anxietyInput.addEventListener('input', (e) => {
      anxietyDisplay.textContent = parseFloat(e.target.value).toFixed(1);
    });
  }

  saveEdit(id) {
    const moodEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    const entryElement = document.querySelector(`[data-id="${id}"]`);

    const newHappiness = parseFloat(entryElement.querySelector('.edit-happiness').value);
    const newDissociation = parseFloat(entryElement.querySelector('.edit-dissociation').value);
    const newAnxiety = parseFloat(entryElement.querySelector('.edit-anxiety').value);
    
    const updatedEntries = moodEntries.map(entry => 
      entry.id === id ? {
        ...entry,
        happiness: newHappiness,
        dissociation: newDissociation,
        anxiety: newAnxiety
      } : entry
    );

    localStorage.setItem('moodEntries', JSON.stringify(updatedEntries));
    this.loadData();
    this.updateCharts();
  }

  deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    const moodEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    const filteredEntries = moodEntries.filter(entry => entry.id !== id);
    localStorage.setItem('moodEntries', JSON.stringify(filteredEntries));
    
    this.loadData();
    this.updateCharts();
  }

  changeView(view) {
    this.currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    this.updateCharts();
  }

  updateCharts() {
    const moodEntries = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    const dates = this.getDateRangeForView();
    
    const happinessData = this.processEntriesForChart(moodEntries, 'happiness', dates);
    const dissociationData = this.processEntriesForChart(moodEntries, 'dissociation', dates);
    const anxietyData = this.processEntriesForChart(moodEntries, 'anxiety', dates);
    
    this.happinessChart.data.labels = happinessData.labels;
    this.happinessChart.data.datasets[0].data = happinessData.data;
    this.happinessChart.update();

    this.dissociationChart.data.labels = dissociationData.labels;
    this.dissociationChart.data.datasets[0].data = dissociationData.data;
    this.dissociationChart.update();

    this.anxietyChart.data.labels = anxietyData.labels;
    this.anxietyChart.data.datasets[0].data = anxietyData.data;
    this.anxietyChart.update();
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

  processEntriesForChart(entries, type, dateRange) {
    const filteredEntries = entries.filter(entry => 
      new Date(entry.date) >= dateRange.start && 
      new Date(entry.date) <= dateRange.end
    );

    // Group entries by date
    const groupedEntries = filteredEntries.reduce((acc, entry) => {
      const date = new Date(entry.date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry[type]);
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
    const types = ['happiness', 'dissociation', 'anxiety'];
    const colors = {
      happiness: '#a2d5ab',
      dissociation: '#add8e6',
      anxiety: '#ffdab9'
    };

    types.forEach(type => {
      const range = document.getElementById(`${type}Level`);
      const value = range.value;
      const percentage = (value / range.max) * 100;
      range.style.background = `linear-gradient(to right, 
        ${colors[type]} 0%, 
        ${colors[type]} ${percentage}%, 
        #e0e0e0 ${percentage}%, 
        #e0e0e0 100%
      )`;
    });
  }
}

// Initialize the tracker
const moodTracker = new MoodTracker();
window.moodTracker = moodTracker;