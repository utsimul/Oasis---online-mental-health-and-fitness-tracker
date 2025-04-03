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

  async fetchJournalEntries(dateStr = '') {
    try {
      let url = '/api/journal';
      if (dateStr) {
        url += `?date=${dateStr}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching entries:', error);
      return [];
    }
  }

  async createNewEntry(text, mood) {
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          text,
          mood,
          date: new Date().toISOString()
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create entry');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  }

  async renderJournalEntriesForToday() {
    const today = new Date().toISOString().split('T')[0];
    await this.renderJournalEntriesForDate(today);
  }

  async renderJournalEntriesForDate(dateStr) {
    const entriesContainer = document.getElementById('journalEntries');
    entriesContainer.innerHTML = '<p>Loading entries...</p>';
    
    try {
      const entries = await this.fetchJournalEntries(dateStr);
      this.updateCurrentDateDisplay(new Date(dateStr));

      if (entries.length === 0) {
        entriesContainer.innerHTML = '<p>No journal entries for this date.</p>';
        return;
      }

      entriesContainer.innerHTML = entries.map(entry => `
        <div class="journal-history-entry" data-id="${entry._id}">
          <div class="journal-entry-content">
            <p class="entry-text">${entry.text}</p>
            <div class="entry-meta">
              <span class="mood-tag ${entry.mood}">${entry.mood}</span>
              <small>${new Date(entry.date).toLocaleString()}</small>
            </div>
          </div>
          <div class="entry-actions">
            <button class="edit-entry-btn" data-id="${entry._id}">
              <i class="fas fa-pencil-alt"></i>
            </button>
            <button class="delete-entry-btn" data-id="${entry._id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');

      this.attachEntryListeners();
    } catch (error) {
      entriesContainer.innerHTML = '<p>Error loading entries. Please try again.</p>';
      console.error('Error rendering entries:', error);
    }
  }

  attachEntryListeners() {
    document.querySelectorAll('.delete-entry-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryId = e.currentTarget.getAttribute('data-id');
        this.deleteEntry(entryId);
      });
    });

    document.querySelectorAll('.edit-entry-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const entryDiv = e.currentTarget.closest('.journal-history-entry');
        const entryId = e.currentTarget.getAttribute('data-id');
        this.enableEditMode(entryDiv, entryId);
      });
    });
  }

  async enableEditMode(entryDiv, entryId) {
    try {
      const response = await fetch(`/api/journal/${entryId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch entry');
      
      const entry = await response.json();
      
      const entryContent = entryDiv.querySelector('.journal-entry-content');
      entryContent.innerHTML = `
        <div class="edit-mode">
          <textarea class="edit-textarea">${entry.text}</textarea>
          <select class="edit-mood-select">
            <option value="happy" ${entry.mood === 'happy' ? 'selected' : ''}>Happy</option>
            <option value="neutral" ${entry.mood === 'neutral' ? 'selected' : ''}>Neutral</option>
            <option value="sad" ${entry.mood === 'sad' ? 'selected' : ''}>Sad</option>
            <option value="angry" ${entry.mood === 'angry' ? 'selected' : ''}>Angry</option>
            <option value="anxious" ${entry.mood === 'anxious' ? 'selected' : ''}>Anxious</option>
          </select>
          <div class="edit-actions">
            <button class="save-edit-btn">Save</button>
            <button class="cancel-edit-btn">Cancel</button>
          </div>
          <small>${new Date(entry.date).toLocaleString()}</small>
        </div>
      `;

      entryContent.querySelector('.save-edit-btn').addEventListener('click', async () => {
        const newText = entryContent.querySelector('.edit-textarea').value;
        const newMood = entryContent.querySelector('.edit-mood-select').value;
        await this.saveEditedEntry(entryId, newText, newMood);
      });

      entryContent.querySelector('.cancel-edit-btn').addEventListener('click', () => {
        const currentDate = document.getElementById('journalDatePicker').value;
        this.renderJournalEntriesForDate(currentDate);
      });

    } catch (error) {
      console.error('Error enabling edit mode:', error);
      alert('Failed to load entry for editing');
    }
  }

  async saveEditedEntry(entryId, newText, newMood) {
    try {
      const response = await fetch(`/api/journal/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          text: newText,
          mood: newMood,
          date: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update entry');
      }
      
      const currentDate = document.getElementById('journalDatePicker').value;
      await this.renderJournalEntriesForDate(currentDate);
    } catch (error) {
      console.error('Error saving edited entry:', error);
      alert('Failed to save changes. Please try again.');
    }
  }

  async deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      const response = await fetch(`/api/journal/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete entry');
      }
      
      const currentDate = document.getElementById('journalDatePicker').value;
      await this.renderJournalEntriesForDate(currentDate);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  }

  async deleteAllEntries() {
    if (!confirm('Are you sure you want to delete ALL journal entries? This cannot be undone.')) return;
    
    try {
      const entries = await this.fetchJournalEntries();
      
      // Using Promise.all for better performance with multiple deletions
      await Promise.all(entries.map(entry => 
        fetch(`/api/journal/${entry._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        })
      ));
      
      await this.renderJournalEntriesForToday();
      alert('All entries have been deleted successfully.');
    } catch (error) {
      console.error('Error deleting all entries:', error);
      alert('Failed to delete all entries. Please try again.');
    }
  }
}

// Initialize the journal history page
document.addEventListener('DOMContentLoaded', () => {
  new JournalHistory();
});