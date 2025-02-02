class WellnessTracker {
    constructor() {
        this.initEventListeners();
        this.loadData();
        this.initCharts();
    }

    initEventListeners() {
        // Navigation
        document.getElementById('journalBtn').addEventListener('click', () => this.showSection('journalSection'));
        document.getElementById('dietBtn').addEventListener('click', () => this.showSection('dietSection'));
        document.getElementById('healthBtn').addEventListener('click', () => this.showSection('healthSection'));
        document.getElementById('statsBtn').addEventListener('click', () => this.showSection('statsSection'));

        // Journal Form
        document.getElementById('journalForm').addEventListener('submit', this.handleJournalSubmit.bind(this));

        // Diet Form
        document.getElementById('foodForm').addEventListener('submit', this.handleFoodSubmit.bind(this));

        // Health Metrics
        document.getElementById('saveMetricsBtn').addEventListener('click', this.saveHealthMetrics.bind(this));

        // Journal History Button
        const viewJournalHistoryBtn = document.getElementById('viewJournalHistoryBtn');
        if (viewJournalHistoryBtn) {
            viewJournalHistoryBtn.addEventListener('click', () => {
                window.location.href = 'journal-history.html';
            });
        }
    }

    showSection(sectionId) {
        const sections = document.querySelectorAll('main section');
        sections.forEach(section => section.classList.remove('active-section'));
        document.getElementById(sectionId).classList.add('active-section');
    }

    handleJournalSubmit(event) {
        event.preventDefault();
        const journalInput = document.getElementById('journalInput');
        const entry = {
            text: journalInput.value,
            date: new Date().toISOString()
        };

        let entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        entries.push(entry);
        localStorage.setItem('journalEntries', JSON.stringify(entries));

        // Clear the input after saving
        journalInput.value = '';
        
        // Optional: Show a success message
        const successMessage = document.createElement('div');
        successMessage.textContent = 'Entry saved successfully!';
        successMessage.style.color = 'green';
        successMessage.style.marginTop = '10px';
        journalInput.parentNode.appendChild(successMessage);
        
        // Remove the success message after 2 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 2000);

        this.renderJournalEntries();
    }

    renderJournalEntries() {
        const entriesContainer = document.getElementById('journalEntries');
        const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
        
        entriesContainer.innerHTML = entries.map(entry => `
            <div class="journal-entry">
                <p>${entry.text}</p>
                <small>${entry.date}</small>
            </div>
        `).join('');
    }

    handleFoodSubmit(event) {
        event.preventDefault();
        const mealType = document.getElementById('mealType').value;
        const foodInput = document.getElementById('foodInput');
        const caloriesInput = document.getElementById('caloriesInput');

        const foodItem = {
            name: foodInput.value,
            calories: caloriesInput.value,
            date: new Date().toLocaleString()
        };

        let meals = JSON.parse(localStorage.getItem(`${mealType}Meals`) || '[]');
        meals.push(foodItem);
        localStorage.setItem(`${mealType}Meals`, JSON.stringify(meals));

        this.renderMeals();
        foodInput.value = '';
        caloriesInput.value = '';
    }

    renderMeals() {
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        mealTypes.forEach(type => {
            const list = document.getElementById(`${type}List`);
            const meals = JSON.parse(localStorage.getItem(`${type}Meals`) || '[]');
            
            list.innerHTML = meals.map(meal => `
                <li>
                    ${meal.name} - ${meal.calories} calories
                    <small>${meal.date}</small>
                </li>
            `).join('');
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

    initCharts() {
        // Nutrient Intake Chart
        this.createNutrientChart();
        
        // Mental Health and Progress Charts
        this.createMentalHealthCharts();
        this.createProgressCharts();
    }

    createNutrientChart() {
        const ctx = document.getElementById('nutrientChart').getContext('2d');
        const nutrients = [
            { name: 'Vitamin A', recommended: 900, current: 600 },
            { name: 'Vitamin C', recommended: 90, current: 75 },
            { name: 'Vitamin D', recommended: 15, current: 10 },
            { name: 'Calcium', recommended: 1000, current: 800 },
            { name: 'Iron', recommended: 18, current: 12 }
        ];

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: nutrients.map(n => n.name),
                datasets: [{
                    label: 'Recommended vs Current Intake',
                    data: nutrients.map(n => [n.recommended, n.current]),
                    backgroundColor: ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)']
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantity (mcg/mg)'
                        }
                    }
                }
            }
        });

        // Update nutrient intake table
        const tableBody = document.getElementById('nutrientIntakeBody');
        tableBody.innerHTML = '';
        nutrients.forEach(nutrient => {
            const percentage = ((nutrient.current / nutrient.recommended) * 100).toFixed(1);
            const row = `
                <tr>
                    <td>${nutrient.name}</td>
                    <td>${nutrient.recommended}</td>
                    <td>${nutrient.current}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    createMentalHealthCharts() {
        // Stress Level Chart
        const stressCtx = document.getElementById('stressLevelChart').getContext('2d');
        new Chart(stressCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Stress Level',
                    data: [7, 5, 6, 4, 3, 5, 4],
                    borderColor: 'rgba(255, 99, 132, 0.7)',
                    tension: 0.4
                }]
            },
            options: { responsive: true }
        });

        // Mood Tracker Chart
        const moodCtx = document.getElementById('moodChart').getContext('2d');
        new Chart(moodCtx, {
            type: 'radar',
            data: {
                labels: ['Happiness', 'Anxiety', 'Energy', 'Focus', 'Relaxation'],
                datasets: [{
                    label: 'Mood Metrics',
                    data: [7, 3, 6, 5, 7],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)'
                }]
            },
            options: { responsive: true }
        });
    }

    createProgressCharts() {
        // Nutrition Progress Chart
        const nutritionCtx = document.getElementById('nutritionProgressChart').getContext('2d');
        new Chart(nutritionCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Nutrition Score',
                    data: [65, 72, 78, 85],
                    borderColor: 'rgba(54, 162, 235, 0.7)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)'
                }]
            },
            options: { responsive: true }
        });

        // Exercise Progress Chart
        const exerciseCtx = document.getElementById('exerciseProgressChart').getContext('2d');
        new Chart(exerciseCtx, {
            type: 'bar',
            data: {
                labels: ['Cardio', 'Strength', 'Flexibility', 'HIIT'],
                datasets: [{
                    label: 'Weekly Exercise Intensity',
                    data: [7, 6, 5, 4],
                    backgroundColor: 'rgba(255, 206, 86, 0.7)'
                }]
            },
            options: { responsive: true }
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new WellnessTracker();
});