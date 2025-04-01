class JournalHistory {
  constructor() {
    this.currentUserId = JSON.parse(localStorage.getItem('currentUser'))?.id;
    if (!this.currentUserId) {
      window.location.href = 'signin.html';
      return;
    }
    
    this.initDatePicker();
    this.initEventListeners();
    this.renderJournalEntriesForToday();
  }

  initDatePicker() {
    const datePicker = flatpickr("#journalDatePicker", {
      dateFormat: "Y-m-d",
      defaultDate: new Date(),
      onChange: (selectedDates, dateStr) => {
        this.renderJournalEntriesForDate(dateStr);
      }
    });

    // Set initial date display
    this.updateCurrentDateDisplay(new Date());
  }

  initEventListeners() {
    const backToMainBtn = document.getElementById('backToMainBtn');
    if (backToMainBtn) {
      backToMainBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }

    const deleteAllEntriesBtn = document.getElementById('deleteAllEntriesBtn');
    if (deleteAllEntriesBtn) {
      deleteAllEntriesBtn.addEventListener('click', this.deleteAllEntries.bind(this));
    }
  }

  updateCurrentDateDisplay(date) {
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    currentDateDisplay.textContent = date.toLocaleDateString('en-US', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  }

  renderJournalEntriesForToday() {
    const today = new Date().toISOString().split('T')[0];
    this.renderJournalEntriesForDate(today);
  }

  renderJournalEntriesForDate(dateStr) {
    const entriesContainer = document.getElementById('journalEntries');
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    
    // Update date display
    this.updateCurrentDateDisplay(new Date(dateStr));

    // Filter entries for the selected date
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      return entryDate === dateStr;
    });

    if (filteredEntries.length === 0) {
      entriesContainer.innerHTML = '<p>No journal entries for this date.</p>';
      return;
    }

    entriesContainer.innerHTML = filteredEntries.map((entry, index) => `
      <div class="journal-history-entry" data-index="${index}">
        <div class="journal-entry-content">
          <p class="entry-text">${entry.text}</p>
          <small>${new Date(entry.date).toLocaleTimeString()}</small>
        </div>
        <div class="entry-actions">
          <button class="edit-entry-btn" data-index="${index}" data-date="${dateStr}">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="delete-entry-btn" data-index="${index}" data-date="${dateStr}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');

    this.attachEntryListeners();
  }

  attachEntryListeners() {
    const deleteButtons = document.querySelectorAll('.delete-entry-btn');
    const editButtons = document.querySelectorAll('.edit-entry-btn');

    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.closest('.delete-entry-btn').getAttribute('data-index');
        const dateStr = e.target.closest('.delete-entry-btn').getAttribute('data-date');
        this.deleteEntry(index, dateStr);
      });
    });

    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryDiv = e.target.closest('.journal-history-entry');
        const index = e.target.closest('.edit-entry-btn').getAttribute('data-index');
        const dateStr = e.target.closest('.edit-entry-btn').getAttribute('data-date');
        this.enableEditMode(entryDiv, index, dateStr);
      });
    });
  }

  enableEditMode(entryDiv, index, dateStr) {
    const entryContent = entryDiv.querySelector('.journal-entry-content');
    const currentText = entryContent.querySelector('.entry-text').textContent;
    const timestamp = entryContent.querySelector('small').textContent;

    entryContent.innerHTML = `
      <div class="edit-mode">
        <textarea class="edit-textarea">${currentText}</textarea>
        <div class="edit-actions">
          <button class="save-edit-btn">Save</button>
          <button class="cancel-edit-btn">Cancel</button>
        </div>
        <small>${timestamp}</small>
      </div>
    `;

    const saveBtn = entryContent.querySelector('.save-edit-btn');
    const cancelBtn = entryContent.querySelector('.cancel-edit-btn');

    saveBtn.addEventListener('click', () => {
      const newText = entryContent.querySelector('.edit-textarea').value;
      this.saveEditedEntry(index, dateStr, newText);
    });

    cancelBtn.addEventListener('click', () => {
      this.renderJournalEntriesForDate(dateStr);
    });
  }

  saveEditedEntry(index, dateStr, newText) {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const entryIndex = entries.findIndex((entry, i) => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      return entryDate === dateStr && i === parseInt(index);
    });

    if (entryIndex !== -1) {
      entries[entryIndex].text = newText;
      localStorage.setItem('journalEntries', JSON.stringify(entries));
      this.renderJournalEntriesForDate(dateStr);
    }
  }

  deleteEntry(index, dateStr) {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    entries = entries.filter((entry, i) => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      return !(entryDate === dateStr && i === parseInt(index));
    });
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    this.renderJournalEntriesForDate(dateStr);
  }

  deleteAllEntries() {
    if (confirm('Are you sure you want to delete all journal entries?')) {
      localStorage.removeItem('journalEntries');
      this.renderJournalEntriesForToday();
    }
  }
}

// Initialize the journal history page
document.addEventListener('DOMContentLoaded', () => {
  new JournalHistory();
});