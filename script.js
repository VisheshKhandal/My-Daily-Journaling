 class DailyJournal {
     constructor() {
         this.entries = [];
         this.currentTheme = 'light';
         this.init();
     }

     init() {
         this.loadEntries();
         this.loadTheme();
         this.bindEvents();
         this.fetchQuote();
         this.renderEntries();
         this.updateCharCount();
         this.renderStats();
         this.bindFilters();
     }

     bindEvents() {
         this.domElements = {
             saveEntryBtn: document.getElementById('saveEntryBtn'),
             newQuoteBtn: document.getElementById('newQuoteBtn'),
             darkModeToggle: document.getElementById('darkModeToggle'),
             journalInput: document.getElementById('journalInput'),
             searchInput: document.getElementById('searchInput'),
             exportBtn: document.getElementById('exportBtn'),
             clearAllBtn: document.getElementById('clearAllBtn'),
             entriesContainer: document.getElementById('entriesContainer'),
             filterCategory: document.getElementById('filterCategory'),
             filterMood: document.getElementById('filterMood'),
             quoteCard: document.querySelector('.quote-card')
         };
         this.domElements.saveEntryBtn.addEventListener('click', (e) => {
             e.preventDefault();
             this.saveEntry();
         });
         this.domElements.newQuoteBtn.addEventListener('click', () => this.fetchQuote());
         this.domElements.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
         this.domElements.journalInput.addEventListener('input', () => this.updateCharCount());
         this.domElements.searchInput.addEventListener('input', (e) => this.filterEntries(e.target.value));
         this.domElements.exportBtn.addEventListener('click', () => this.exportEntries());
         this.domElements.clearAllBtn.addEventListener('click', () => this.clearAllEntries());

         this.domElements.journalInput.addEventListener('keydown', (e) => {
             if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                 e.preventDefault();
                 this.saveEntry();
             }
         });

         this.domElements.entriesContainer.addEventListener('click', (e) => {
             if (e.target.closest('.delete-btn')) {
                 const id = parseInt(e.target.closest('.journal-entry').getAttribute('data-id'));
                 this.deleteEntry(id);
             }
         });
     }

     bindFilters() {
         this.domElements.filterCategory.addEventListener('change', () => this.filterEntries());
         this.domElements.filterMood.addEventListener('change', () => this.filterEntries());
     }

     saveToStorage() {
         try {
             localStorage.setItem('journalEntries', JSON.stringify(this.entries));
             localStorage.setItem('journalTheme', this.currentTheme);
         } catch (error) {
             console.error('Error saving to localStorage:', error);
             this.showNotification('Error saving data', 'error');
         }
     }

     loadEntries() {
         try {
             const stored = localStorage.getItem('journalEntries');
             this.entries = stored ? JSON.parse(stored) : [];
             this.entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
         } catch (error) {
             console.error('Error loading entries:', error);
             this.entries = [];
         }
     }

     loadTheme() {
         try {
             const stored = localStorage.getItem('journalTheme');
             this.currentTheme = stored || 'light';
             document.documentElement.setAttribute('data-theme', this.currentTheme);
             this.updateThemeIcon();
         } catch (error) {
             console.error('Error loading theme:', error);
         }
     }

     saveEntry() {
         const input = this.domElements.journalInput;
         const content = input.value.trim();
         const category = document.getElementById('category').value;
         const tags = document.getElementById('tags').value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
         const mood = document.getElementById('mood').value;
         const imageUpload = document.getElementById('imageUpload');
         const image = imageUpload.files.length > 0 ? this.handleImageUpload(imageUpload.files[0]) : null;

         if (!content) {
             this.showNotification('Please write something before saving!', 'warning');
             input.focus();
             return;
         }

         if (content.length > 1000) {
             this.showNotification('Entry exceeds maximum length of 1000 characters', 'error');
             return;
         }

         const entry = {
             id: Date.now(),
             content: content,
             category: category,
             tags: tags,
             mood: mood,
             image: image,
             date: new Date().toLocaleDateString('en-US', {
                 weekday: 'long',
                 year: 'numeric',
                 month: 'long',
                 day: 'numeric'
             }),
             time: new Date().toLocaleTimeString('en-US', {
                 hour: '2-digit',
                 minute: '2-digit'
             }),
             timestamp: new Date().toISOString()
         };

         this.entries.unshift(entry);
         this.saveToStorage();
         this.renderEntries();
         this.renderStats();
         this.filterEntries();

         input.value = '';
         document.getElementById('tags').value = '';
         document.getElementById('mood').value = 'Happy';
         imageUpload.value = '';
         this.updateCharCount();

         this.showNotification('Entry saved successfully! ✨', 'success');
         this.animateSaveButton();
     }

     handleImageUpload(file) {
         if (!file.type.match('image.*')) {
             this.showNotification('Please upload an image file', 'warning');
             return null;
         }

         if (file.size > 2 * 1024 * 1024) {
             this.showNotification('Image size should be less than 2MB', 'warning');
             return null;
         }

         return URL.createObjectURL(file);
     }

     animateSaveButton() {
         const saveBtn = this.domElements.saveEntryBtn;
         saveBtn.classList.add('save-success');
         setTimeout(() => saveBtn.classList.remove('save-success'), 800);
     }

     deleteEntry(id) {
         if (confirm('Are you sure you want to delete this entry?')) {
             this.entries = this.entries.filter(entry => entry.id !== id);
             this.saveToStorage();
             this.renderEntries();
             this.renderStats();
             this.filterEntries();
             this.showNotification('Entry deleted', 'info');
         }
     }

     clearAllEntries() {
         if (this.entries.length === 0) {
             this.showNotification('No entries to clear', 'info');
             return;
         }

         if (confirm('Are you sure you want to delete ALL entries? This cannot be undone.')) {
             this.entries = [];
             this.saveToStorage();
             this.renderEntries();
             this.renderStats();
             this.showNotification('All entries cleared', 'info');
         }
     }

     filterEntries(searchQuery = this.domElements.searchInput.value.toLowerCase()) {
         const filterCategory = this.domElements.filterCategory.value.toLowerCase();
         const filterMood = this.domElements.filterMood.value.toLowerCase();

         const entries = this.domElements.entriesContainer.querySelectorAll('.journal-entry');
         entries.forEach(entry => {
             const content = entry.querySelector('.entry-content').textContent.toLowerCase();
             const date = entry.querySelector('.entry-date').textContent.toLowerCase();
             const category = entry.getAttribute('data-category').toLowerCase();
             const mood = entry.getAttribute('data-mood').toLowerCase();

             const matchesSearch = !searchQuery.trim() || content.includes(searchQuery) || date.includes(searchQuery);
             const matchesCategory = !filterCategory || category === filterCategory;
             const matchesMood = !filterMood || mood === filterMood;

             entry.style.display = matchesSearch && matchesCategory && matchesMood ? 'block' : 'none';
         });
     }

     exportEntries() {
         if (this.entries.length === 0) {
             this.showNotification('No entries to export', 'warning');
             return;
         }

         let exportText = '📖 MY DAILY JOURNAL\n';
         exportText += '='.repeat(52) + '\n\n';

         this.entries.forEach((entry, index) => {
             exportText += `Entry ${this.entries.length - index}\n`;
             exportText += `Category: ${entry.category}\n`;
             exportText += `Tags: ${entry.tags.join(', ') || 'None'}\n`;
             exportText += `Mood: ${entry.mood || 'Not specified'}\n`;
             exportText += `Date: ${entry.date} at ${entry.time}\n`;
             exportText += '-'.repeat(30) + '\n';
             exportText += `${entry.content}\n\n`;
         });

         exportText += `\nExported on: ${new Date().toLocaleDateString()}\n`;
         exportText += `Total entries: ${this.entries.length}`;

         this.downloadFile(exportText, `my-daily-journal-${new Date().toISOString().split('T')[0]}.txt`);
         this.showNotification('Journal exported successfully! 📄', 'success');
     }

     downloadFile(content, filename) {
         const blob = new Blob([content], { type: 'text/plain' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = filename;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
     }

     renderEntries() {
         const container = this.domElements.entriesContainer;

         if (this.entries.length === 0) {
             container.innerHTML = '<p class="no-entries">No journal entries yet. Start writing your first entry above! ✨</p>';
             return;
         }

         container.innerHTML = this.entries.map(entry => this.createEntryHTML(entry)).join('');
     }

     createEntryHTML(entry) {
         return `
             <div class="journal-entry" data-id="${entry.id}" data-category="${entry.category.toLowerCase()}" data-mood="${entry.mood.toLowerCase()}">
                 <div class="entry-header">
                     <span class="entry-date">📅 ${entry.date} • 🕒 ${entry.time}</span>
                     <button class="delete-btn" title="Delete entry" aria-label="Delete entry">
                         <i class="bi bi-trash-fill"></i>
                     </button>
                 </div>
                 <div class="entry-content">${this.formatContent(entry.content)}</div>
                 <div class="entry-meta">
                     <span class="entry-category">📁 ${entry.category}</span>
                     <span class="entry-tags">🏷️ ${entry.tags.join(', ') || 'None'}</span>
                     <span class="entry-mood">😊 ${entry.mood || 'Not specified'}</span>
                     ${entry.image ? `<img src="${entry.image}" alt="Entry image" class="entry-image" loading="lazy">` : ''}
                 </div>
             </div>
         `;
     }

     formatContent(content) {
         return content
             .replace(/&/g, '&')
             .replace(/</g, '<')
             .replace(/>/g, '>')
             .replace(/\n/g, '<br>')
             .replace(/\b(https?:\/\/\S+)/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
     }

     updateCharCount() {
         const input = this.domElements.journalInput;
         const counter = document.getElementById('charCount');
         const saveBtn = this.domElements.saveEntryBtn;

         const length = input.value.length;
         const maxLength = 1000;

         counter.textContent = `${length}/${maxLength} characters`;

         if (length > maxLength) {
             counter.style.color = 'var(--error-color)';
             saveBtn.disabled = true;
         } else if (length > maxLength * 0.9) {
             counter.style.color = 'var(--warning-color)';
             saveBtn.disabled = false;
         } else if (length > maxLength * 0.7) {
             counter.style.color = 'var(--warning-color)';
             saveBtn.disabled = false;
         } else {
             counter.style.color = 'var(--text-secondary)';
             saveBtn.disabled = length === 0;
         }
     }

     toggleDarkMode() {
         this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
         document.documentElement.setAttribute('data-theme', this.currentTheme);
         this.updateThemeIcon();
         this.saveToStorage();
         this.showNotification(`${this.currentTheme === 'dark' ? 'Dark' : 'Light'} mode activated`, 'info');
     }

     updateThemeIcon() {
         const btn = this.domElements.darkModeToggle;
         btn.innerHTML = this.currentTheme === 'light' ? '🌙' : '☀️';
         btn.setAttribute('aria-label', `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`);
     }

     async fetchQuote() {
         const quoteText = document.getElementById('quoteText');
         const quoteAuthor = document.getElementById('quoteAuthor');
         const newQuoteBtn = this.domElements.newQuoteBtn;
         const quoteCard = this.domElements.quoteCard;

         quoteCard.classList.remove('loaded');
         quoteCard.classList.add('loading');
         quoteText.textContent = 'Loading new inspiration...';
         quoteAuthor.textContent = '';
         newQuoteBtn.disabled = true;

         const backupQuotes = [
             { content: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
             { content: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
             { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
             { content: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
             { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
         ];

         try {
             const quoteData = await this.fetchRandomQuote();
             this.displayQuote(quoteText, quoteAuthor, quoteData);
         } catch (error) {
             console.error('Error fetching quote:', error);
             const randomIndex = Math.floor(Math.random() * backupQuotes.length);
             this.displayQuote(quoteText, quoteAuthor, backupQuotes[randomIndex]);
             this.showNotification('Using offline quote - API unavailable', 'info');
         } finally {
             newQuoteBtn.disabled = false;
             quoteCard.classList.remove('loading');
             quoteCard.classList.add('loaded');
         }
     }

     async fetchRandomQuote() {
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 5000);

         try {
             const response = await fetch('https://api.quotable.io/random', {
                 signal: controller.signal,
                 headers: { 'Accept': 'application/json' }
             });

             clearTimeout(timeoutId);

             if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

             return await response.json();
         } catch (error) {
             clearTimeout(timeoutId);
             throw error;
         }
     }

     displayQuote(quoteText, quoteAuthor, quoteData) {
         const randomColor1 = this.getRandomColor();
         const randomColor2 = this.getRandomColor();
         const quoteCard = this.domElements.quoteCard;
         quoteCard.style.background = `linear-gradient(135deg, ${randomColor1}, ${randomColor2})`;

         quoteText.style.opacity = '0';
         quoteAuthor.style.opacity = '0';

         setTimeout(() => {
             quoteText.textContent = `"${quoteData.content}"`;
             quoteAuthor.textContent = `— ${quoteData.author}`;
             quoteText.style.opacity = '1';
             quoteAuthor.style.opacity = '1';
         }, 500);
     }

     getRandomColor() {
         const letters = '0123456789ABCDEF';
         let color = '#';
         for (let i = 0; i < 6; i++) {
             color += letters[Math.floor(Math.random() * 16)];
         }
         return color;
     }

     showNotification(message, type = 'info') {
         const existing = document.querySelector('.notification');
         if (existing) existing.remove();

         const notification = document.createElement('div');
         notification.className = `notification notification-${type} show`;
         notification.textContent = message;
         notification.setAttribute('role', 'alert');
         notification.setAttribute('aria-live', 'polite');

         document.body.appendChild(notification);

         setTimeout(() => {
             notification.classList.remove('show');
             setTimeout(() => notification.remove(), 300);
         }, 3000);
     }

     getStats() {
         if (this.entries.length === 0) {
             return {
                 totalEntries: 0,
                 totalWords: 0,
                 averageWordsPerEntry: 0,
                 oldestEntry: null,
                 newestEntry: null,
                 categories: {},
                 moods: {}
             };
         }

         const wordCounts = this.entries.map(entry => entry.content.split(/\s+/).length);
         const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);

         const categories = {};
         const moods = {};

         this.entries.forEach(entry => {
             categories[entry.category] = (categories[entry.category] || 0) + 1;
             if (entry.mood) {
                 moods[entry.mood] = (moods[entry.mood] || 0) + 1;
             }
         });

         return {
             totalEntries: this.entries.length,
             totalWords: totalWords,
             averageWordsPerEntry: Math.round(totalWords / this.entries.length),
             oldestEntry: this.entries[this.entries.length - 1]?.date || 'N/A',
             newestEntry: this.entries[0]?.date || 'N/A',
             categories: categories,
             moods: moods
         };
     }

     renderStats() {
         const stats = this.getStats();
         const totalEntries = document.getElementById('totalEntries');
         const totalWords = document.getElementById('totalWords');
         const avgWords = document.getElementById('avgWords');
         const oldestEntry = document.getElementById('oldestEntry');
         const newestEntry = document.getElementById('newestEntry');

         totalEntries.textContent = stats.totalEntries;
         totalWords.textContent = stats.totalWords;
         avgWords.textContent = stats.averageWordsPerEntry;
         oldestEntry.textContent = stats.oldestEntry;
         newestEntry.textContent = stats.newestEntry;

         if (stats.totalEntries > 0) {
             this.renderCharts(stats);
         } else {
             document.querySelector('.stats-charts').innerHTML = '';
         }
     }

     renderCharts(stats) {
         const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
         const currentYear = new Date().getFullYear();
         const entryCounts = months.map((_, i) => {
             const start = new Date(currentYear, i, 1);
             const end = new Date(currentYear, i + 1, 0);
             return this.entries.filter(entry => {
                 const entryDate = new Date(entry.timestamp);
                 return entryDate >= start && entryDate <= end;
             }).length;
         });

         new Chart(document.getElementById('entriesChart').getContext('2d'), {
             type: 'bar',
             data: {
                 labels: months,
                 datasets: [{
                     label: 'Entries per Month',
                     data: entryCounts,
                     backgroundColor: '#2563eb',
                     borderColor: '#1e293b',
                     borderWidth: 1
                 }]
             },
             options: {
                 responsive: true,
                 maintainAspectRatio: false,
                 plugins: {
                     title: {
                         display: true,
                         text: `Journal Entries by Month (${currentYear})`,
                         font: { size: 14 }
                     },
                     legend: { position: 'top' }
                 },
                 scales: {
                     y: { beginAtZero: true, title: { display: true, text: 'Number of Entries' } },
                     x: { title: { display: true, text: 'Month' } }
                 }
             }
         });

         const categoryLabels = Object.keys(stats.categories);
         const categoryData = Object.values(stats.categories);
         new Chart(document.getElementById('categoriesChart').getContext('2d'), {
             type: 'doughnut',
             data: {
                 labels: categoryLabels,
                 datasets: [{
                     label: 'Entries by Category',
                     data: categoryData,
                     backgroundColor: ['#2563eb', '#1e40af', '#1d4ed8', '#3b82f6', '#93c5fd'],
                     borderColor: '#1e293b',
                     borderWidth: 1
                 }]
             },
             options: {
                 responsive: true,
                 maintainAspectRatio: false,
                 plugins: {
                     title: { display: true, text: 'Entries by Category', font: { size: 14 } },
                     legend: { position: 'right' }
                 }
             }
         });

         if (Object.keys(stats.moods).length > 0) {
             const moodLabels = Object.keys(stats.moods);
             const moodData = Object.values(stats.moods);
             new Chart(document.getElementById('moodsChart').getContext('2d'), {
                 type: 'pie',
                 data: {
                     labels: moodLabels,
                     datasets: [{
                         label: 'Entries by Mood',
                         data: moodData,
                         backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                         borderColor: '#1e293b',
                         borderWidth: 1
                     }]
                 },
                 options: {
                     responsive: true,
                     maintainAspectRatio: false,
                     plugins: {
                         title: { display: true, text: 'Entries by Mood', font: { size: 14 } },
                         legend: { position: 'right' }
                     }
                 }
             });
         }
     }
 }

 document.addEventListener('DOMContentLoaded', () => {
     const journal = new DailyJournal();
     window.journal = journal;

     console.log('📖 Welcome to Your Daily Journal!');
     console.log('💡 Pro tip: Use Ctrl/Cmd + Enter to quickly save entries');
     console.log('🎨 Try switching between light and dark themes');
 });

