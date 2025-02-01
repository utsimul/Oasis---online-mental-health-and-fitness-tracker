class JournalHistory {
  constructor() {
    this.initEventListeners();
    this.renderJournalEntries();
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

  renderJournalEntries() {
    const entriesContainer = document.getElementById('journalEntries');
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    
    if (entries.length === 0) {
      entriesContainer.innerHTML = '<p>No journal entries yet.</p>';
      return;
    }

    entriesContainer.innerHTML = entries.map((entry, index) => `
      <div class="journal-history-entry" data-index="${index}">
        <div class="journal-entry-content">
          <p>${entry.text}</p>
          <small>${entry.date}</small>
        </div>
        <button class="delete-entry-btn" data-index="${index}">Delete</button>
      </div>
    `).join('');

    this.attachDeleteEntryListeners();
  }

  attachDeleteEntryListeners() {
    const deleteButtons = document.querySelectorAll('.delete-entry-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        this.deleteEntry(index);
      });
    });
  }

  deleteEntry(index) {
    let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    entries.splice(index, 1);
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    this.renderJournalEntries();
  }

  deleteAllEntries() {
    if (confirm('Are you sure you want to delete all journal entries?')) {
      localStorage.removeItem('journalEntries');
      this.renderJournalEntries();
    }
  }
}

// Initialize the journal history page
document.addEventListener('DOMContentLoaded', () => {
  new JournalHistory();
});