class SleepQualityTracker {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.loadData();
    this.currentView = 'weekly';
    this.updateChart();
    this.updateRangeColors();
  }

  initializeElements() {
    this.sleepChart = new Chart(
      document.getElementById('sleepChart').getContext('2d'),
      this.getChartConfig()
    );
    
    this.sleepQuality = document.getElementById('sleepQuality');
    this.qualityValue = document.getElementById('qualityValue');
  }

  attachEventListeners() {
    const backBtn = document.getElementById('backToMainBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    const qualityInput = document.getElementById('sleepQuality');
    const qualityDisplay = document.getElementById('qualityValue');
    
    if (qualityInput && qualityDisplay) {
      qualityInput.addEventListener('input', (e) => {
        qualityDisplay.textContent = parseFloat(e.target.value).toFixed(1);
        this.updateRangeColors();
      });
    }

    document.getElementById('sleepEntryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSleepEntry();
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.changeView(e.target.dataset.view);
      });
    });
  }

  getChartConfig() {
    return {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Sleep Hours',
          data: [],
          borderColor: 'rgba(75, 192, 192, 1)',
          yAxisID: 'hours'
        }, {
          label: 'Sleep Quality',
          data: [],
          borderColor: 'rgba(153, 102, 255, 1)',
          yAxisID: 'quality'
        }]
      },
      options: {
        responsive: true,
        scales: {
          hours: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Sleep Hours'
            },
            min: 0,
            max: 24
          },
          quality: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Sleep Quality'
            },
            min: 0,
            max: 10
          }
        }
      }
    };
  }

  saveSleepEntry() {
    const entry = {
      hours: parseFloat(document.getElementById('sleepHours').value),
      quality: parseFloat(this.sleepQuality.value),
      notes: document.getElementById('sleepNotes').value,
      date: new Date().toISOString(),
      id: Date.now()
    };

    let entries = JSON.parse(localStorage.getItem('sleepEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('sleepEntries', JSON.stringify(entries));

    this.loadData();
    this.updateChart();
    
    // Reset form
    document.getElementById('sleepEntryForm').reset();
    this.qualityValue.textContent = '5.0';
  }

  loadData() {
    const entries = JSON.parse(localStorage.getItem('sleepEntries') || '[]');
    this.renderEntries(entries);
    this.updateSleepStatus(entries);
  }

  updateSleepStatus(entries) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEntries = entries.filter(entry => 
      new Date(entry.date) > weekAgo
    );

    const avgHours = recentEntries.reduce((acc, entry) => 
      acc + entry.hours, 0) / (recentEntries.length || 1);
    
    const avgQuality = recentEntries.reduce((acc, entry) => 
      acc + entry.quality, 0) / (recentEntries.length || 1);

    const status = avgHours >= 7 && avgQuality >= 7 ? 'Good' : 
                  avgHours >= 6 && avgQuality >= 5 ? 'Fair' : 'Poor';
    
    const colors = {
      Good: '#2ecc71',
      Fair: '#f1c40f',
      Poor: '#e74c3c'
    };

    const indicator = document.getElementById('sleepIndicator');
    indicator.innerHTML = `
      <h3>Average Sleep: ${avgHours.toFixed(1)} hours</h3>
      <h3>Average Quality: ${avgQuality.toFixed(1)}/10</h3>
      <p style="color: ${colors[status]}">Status: ${status}</p>
    `;
  }

  renderEntries(entries) {
    const container = document.getElementById('sleepEntries');
    container.innerHTML = entries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(entry => `
        <div class="entry-item" data-id="${entry.id}">
          <div class="entry-content">
            <p>Hours: ${entry.hours} | Quality: ${entry.quality}/10</p>
            <p class="entry-notes">${entry.notes}</p>
            <small>${new Date(entry.date).toLocaleString()}</small>
          </div>
          <div class="entry-actions">
            <button class="edit-btn" onclick="sleepTracker.editEntry(${entry.id})">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="delete-btn" onclick="sleepTracker.deleteEntry(${entry.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
  }

  editEntry(id) {
    const entries = JSON.parse(localStorage.getItem('sleepEntries') || '[]');
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const entryElement = document.querySelector(`[data-id="${id}"]`);
    entryElement.innerHTML = `
      <div class="edit-form">
        <div class="form-group">
          <label>Hours: </label>
          <input type="number" class="edit-hours" value="${entry.hours}" min="0" max="24" step="0.5">
        </div>
        <div class="form-group">
          <label>Quality: </label>
          <input type="range" class="edit-quality" value="${entry.quality}" min="0" max="10" step="0.1">
          <span class="edit-quality-value">${entry.quality}</span>
        </div>
        <div class="form-group">
          <label>Notes: </label>
          <textarea class="edit-notes">${entry.notes}</textarea>
        </div>
        <div class="edit-actions">
          <button onclick="sleepTracker.saveEdit(${id})">Save</button>
          <button onclick="sleepTracker.loadData()">Cancel</button>
        </div>
      </div>
    `;

    const qualityInput = entryElement.querySelector('.edit-quality');
    const qualityDisplay = entryElement.querySelector('.edit-quality-value');
    qualityInput.addEventListener('input', (e) => {
      qualityDisplay.textContent = parseFloat(e.target.value).toFixed(1);
    });
  }

  saveEdit(id) {
    const entries = JSON.parse(localStorage.getItem('sleepEntries') || '[]');
    const entryElement = document.querySelector(`[data-id="${id}"]");
    
    const newHours = parseFloat(entryElement.querySelector('.edit-hours').value);
    const newQuality = parseFloat(entryElement.querySelector('.edit-quality').value);
    const newNotes = entryElement.querySelector('.edit-notes').value;
    
    const updatedEntries = entries.map(entry => 
      entry.id === id ? {
        ...entry,
        hours: newHours,
        quality: newQuality,
        notes: newNotes
      } : entry
    );

    localStorage.setItem('sleepEntries', JSON.stringify(updatedEntries));
    this.loadData();
    this.updateChart();
  }

  deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    const entries = JSON.parse(localStorage.getItem('sleepEntries') || '[]');
    const filteredEntries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('sleepEntries', JSON.stringify(filteredEntries));
    
    this.loadData();
    this.updateChart();
  }

  changeView(view) {
    this.currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    this.updateChart();
  }

  updateChart() {
    const entries = JSON.parse(localStorage.getItem('sleepEntries') || '[]');
    const dates = this.getDateRangeForView();
    
    const chartData = this.processEntriesForChart(entries, dates);
    
    this.sleepChart.data.labels = chartData.labels;
    this.sleepChart.data.datasets[0].data = chartData.hours;
    this.sleepChart.data.datasets[1].data = chartData.quality;
    this.sleepChart.update();
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
      if (!acc[date]) acc[date] = { hours: [], quality: [] };
      acc[date].hours.push(entry.hours);
      acc[date].quality.push(entry.quality);
      return acc;
    }, {});

    // Calculate daily averages
    const dailyAverages = Object.entries(groupedEntries).map(([date, values]) => ({
      date: new Date(date),
      hours: values.hours.reduce((a, b) => a + b) / values.hours.length,
      quality: values.quality.reduce((a, b) => a + b) / values.quality.length
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
      hours: dailyAverages.map(entry => entry.hours),
      quality: dailyAverages.map(entry => entry.quality)
    };
  }

  updateRangeColors() {
    const range = this.sleepQuality;
    const value = range.value;
    const percentage = (value / range.max) * 100;
    range.style.background = `linear-gradient(to right, 
      #a5ceff 0%, 
      #a5ceff ${percentage}%, 
      #e0e0e0 ${percentage}%, 
      #e0e0e0 100%
    )`;
  }
}

// Initialize the tracker and make it global
window.sleepTracker = new SleepQualityTracker();