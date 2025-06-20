 class DailyJournal {
    constructor() {
        this.entries = [];
        this.currentTheme = 'dark';
        this.domElements = {};
        this.editingEntryId = null;
        this.init();
    }

    init() {
        this.loadEntries();
        this.loadTheme();
        this.bindEvents();
        this.initNavbar();
        this.renderEntries();
        this.updateCharCount();
        this.renderStats();
        this.bindFilters();

        // Initialize quote section with delay to ensure DOM is ready
        setTimeout(() => {
            this.fetchQuote();
            this.initCursorEffects();
        }, 200);
    }

    bindEvents() {
        // Wait for DOM to be fully ready
        setTimeout(() => {
            this.domElements = {
                saveEntryBtn: document.getElementById('saveEntryBtn'),
                newQuoteBtn: document.getElementById('newQuoteBtn'),
                journalInput: document.getElementById('journalInput'),
                searchInput: document.getElementById('searchInput'),
                exportBtn: document.getElementById('exportBtn'),
                clearAllBtn: document.getElementById('clearAllBtn'),
                entriesContainer: document.getElementById('entriesContainer'),
                filterCategory: document.getElementById('filterCategory'),
                filterMood: document.getElementById('filterMood'),
                quoteCard: document.querySelector('.quote-card'),
                quickStatsBtn: document.getElementById('quickStatsBtn'),
                closeModalBtn: document.getElementById('closeModal'),
                themeButtons: document.querySelectorAll('.theme-btn')
            };

            this.bindEventListeners();
        }, 100);
    }

    bindEventListeners() {
        // Bind navbar events
        this.bindNavbarEvents();

        // Bind form submission
        if (this.domElements.saveEntryBtn) {
            this.domElements.saveEntryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveEntry();
            });
        }

        // Bind other events
        if (this.domElements.newQuoteBtn) {
            this.domElements.newQuoteBtn.addEventListener('click', () => this.fetchQuote());
        }

        if (this.domElements.journalInput) {
            this.domElements.journalInput.addEventListener('input', () => this.updateCharCount());
            this.domElements.journalInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.saveEntry();
                }
            });
        }

        if (this.domElements.searchInput) {
            this.domElements.searchInput.addEventListener('input', (e) => this.filterEntries(e.target.value));
        }

        if (this.domElements.exportBtn) {
            this.domElements.exportBtn.addEventListener('click', () => this.exportEntries());
        }

        if (this.domElements.clearAllBtn) {
            this.domElements.clearAllBtn.addEventListener('click', () => this.clearAllEntries());
        }

        if (this.domElements.entriesContainer) {
            this.domElements.entriesContainer.addEventListener('click', (e) => {
                // Add ripple effect on click only if not clicking action buttons
                if (!e.target.closest('.delete-btn') && !e.target.closest('.edit-btn')) {
                    this.createRippleEffect(e);
                }

                // Handle edit button clicks
                if (e.target.closest('.edit-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const entryElement = e.target.closest('.journal-entry');
                    if (entryElement) {
                        const id = parseInt(entryElement.getAttribute('data-id'));
                        if (id && !isNaN(id)) {
                            this.editEntry(id);
                        } else {
                            console.error('Invalid entry ID for editing:', entryElement.getAttribute('data-id'));
                        }
                    }
                }

                // Handle delete button clicks
                if (e.target.closest('.delete-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const entryElement = e.target.closest('.journal-entry');
                    if (entryElement) {
                        const id = parseInt(entryElement.getAttribute('data-id'));
                        if (id && !isNaN(id)) {
                            this.deleteEntry(id);
                        } else {
                            console.error('Invalid entry ID for deletion:', entryElement.getAttribute('data-id'));
                        }
                    }
                }
            });
        }

        if (this.domElements.quickStatsBtn) {
            this.domElements.quickStatsBtn.addEventListener('click', () => this.toggleQuickStats());
        }

        if (this.domElements.closeModalBtn) {
            this.domElements.closeModalBtn.addEventListener('click', () => this.toggleQuickStats());
        }

        // Theme buttons
        if (this.domElements.themeButtons) {
            this.domElements.themeButtons.forEach(btn => {
                btn.addEventListener('click', () => this.switchTheme(btn.dataset.theme));
            });
        }
    }

    initCursorEffects() {
        // Re-initialize cursor effects after DOM updates
        setTimeout(() => {
            const interactiveElements = document.querySelectorAll('.header, .quote-card, .input-container, .journal-entry, .chart-item, .stats-summary');

            interactiveElements.forEach(element => {
                // Remove existing listeners to prevent duplicates
                element.removeEventListener('mousemove', this.handleMouseMove);
                element.removeEventListener('mouseleave', this.handleMouseLeave);
                element.removeEventListener('click', this.handleClick);

                // Add enhanced cursor tracking
                element.addEventListener('mousemove', (e) => this.handleMouseMove(e, element));
                element.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, element));
                element.addEventListener('click', (e) => this.createRippleEffect(e));
            });
        }, 100);
    }

    handleMouseMove(e, element) {
        const rect = element.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        element.style.setProperty('--mouse-x', x + '%');
        element.style.setProperty('--mouse-y', y + '%');

        // Add dynamic color reflection
        const hue = (x + y) % 360;
        element.style.setProperty('--dynamic-hue', hue);
    }

    handleMouseLeave(e, element) {
        element.style.setProperty('--mouse-x', '50%');
        element.style.setProperty('--mouse-y', '50%');
        element.style.setProperty('--dynamic-hue', '240');
    }

    createRippleEffect(e) {
        const element = e.currentTarget;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        ripple.classList.add('ripple-effect');

        element.appendChild(ripple);

        setTimeout(() => {
            if (ripple && ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    bindFilters() {
        // Use setTimeout to ensure DOM elements are available
        setTimeout(() => {
            const filterCategory = this.domElements.filterCategory || document.getElementById('filterCategory');
            const filterMood = this.domElements.filterMood || document.getElementById('filterMood');
            const searchInput = this.domElements.searchInput || document.getElementById('searchInput');

            if (filterCategory) {
                filterCategory.addEventListener('change', () => {
                    console.log('Category filter changed:', filterCategory.value);
                    this.filterEntries();
                });
            }

            if (filterMood) {
                filterMood.addEventListener('change', () => {
                    console.log('Mood filter changed:', filterMood.value);
                    this.filterEntries();
                });
            }

            if (searchInput) {
                // Add debounced search for better performance
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        console.log('Search input changed:', e.target.value);
                        this.filterEntries(e.target.value);
                    }, 300);
                });
            }
        }, 200);
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
            this.currentTheme = stored || 'dark';
            this.applyTheme(this.currentTheme);
        } catch (error) {
            console.error('Error loading theme:', error);
            this.currentTheme = 'dark';
            this.applyTheme(this.currentTheme);
        }
    }

    switchTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveToStorage();
        this.showNotification(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme activated`, 'info');
    }

    applyTheme(theme) {
        try {
            document.documentElement.setAttribute('data-theme', theme);

            // Wait for DOM to be ready before updating theme buttons
            setTimeout(() => {
                const themeButtons = document.querySelectorAll('.theme-btn');
                if (themeButtons && themeButtons.length > 0) {
                    themeButtons.forEach(btn => {
                        if (btn && btn.dataset) {
                            btn.classList.remove('active');
                            if (btn.dataset.theme === theme) {
                                btn.classList.add('active');
                            }
                        }
                    });
                } else {
                    console.warn('Theme buttons not found in DOM yet, will retry...');
                    // Retry after a longer delay if buttons aren't found
                    setTimeout(() => {
                        const retryButtons = document.querySelectorAll('.theme-btn');
                        if (retryButtons && retryButtons.length > 0) {
                            retryButtons.forEach(btn => {
                                if (btn && btn.dataset) {
                                    btn.classList.remove('active');
                                    if (btn.dataset.theme === theme) {
                                        btn.classList.add('active');
                                    }
                                }
                            });
                        }
                    }, 500);
                }
            }, 100);
        } catch (error) {
            console.error('Error applying theme:', error);
        }
    }

    saveEntry() {
        const input = this.domElements.journalInput;
        if (!input) return;

        const content = input.value.trim();
        const titleEl = document.getElementById('entryTitle');
        const categoryEl = document.getElementById('category');
        const tagsEl = document.getElementById('tags');
        const moodEl = document.getElementById('mood');
        const imageUploadEl = document.getElementById('imageUpload');

        const title = titleEl ? titleEl.value.trim() : '';
        const category = categoryEl ? categoryEl.value : 'Personal';
        const tags = tagsEl ? tagsEl.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const mood = moodEl ? moodEl.value : 'Neutral';
        const image = imageUploadEl && imageUploadEl.files.length > 0 ? this.handleImageUpload(imageUploadEl.files[0]) : null;

        if (!content) {
            this.showNotification('Please write something before saving!', 'warning');
            input.focus();
            return;
        }

        if (content.length > 1000) {
            this.showNotification('Entry exceeds maximum length of 1000 characters', 'error');
            return;
        }

        // Check if we're editing an existing entry
        if (this.editingEntryId) {
            const existingEntryIndex = this.entries.findIndex(entry => entry.id === this.editingEntryId);
            if (existingEntryIndex !== -1) {
                // Update existing entry
                const existingEntry = this.entries[existingEntryIndex];
                this.entries[existingEntryIndex] = {
                    ...existingEntry,
                    title: title || 'Untitled Entry',
                    content: content,
                    category: category,
                    tags: tags,
                    mood: mood,
                    image: image || existingEntry.image, // Keep existing image if no new one uploaded
                    // Keep original date and time, but update timestamp
                    timestamp: new Date().toISOString()
                };

                this.showNotification('Entry updated successfully! ✨', 'success');
            }

            // Reset editing state
            this.editingEntryId = null;
            const saveBtn = this.domElements.saveEntryBtn;
            if (saveBtn) {
                saveBtn.textContent = 'Save Entry';
                saveBtn.classList.remove('btn-editing');
            }
        } else {
            // Create new entry
            const entry = {
                id: Date.now(),
                title: title || 'Untitled Entry',
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

            // Show milestone celebration
            if (this.entries.length % 5 === 0 && this.entries.length > 0) {
                if (typeof confetti !== 'undefined') {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
                this.showNotification(`Great job on your ${this.entries.length}th entry! 🎉`, 'success');
            } else {
                this.showNotification('Entry saved successfully! ✨', 'success');
            }
        }

        this.saveToStorage();
        this.renderEntries();
        this.renderStats();
        this.filterEntries();

        // Clear form
        input.value = '';
        if (titleEl) titleEl.value = '';
        if (tagsEl) tagsEl.value = '';
        if (moodEl) moodEl.value = 'Happy';
        if (imageUploadEl) imageUploadEl.value = '';
        this.updateCharCount();

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
        if (saveBtn) {
            saveBtn.classList.add('save-success');
            setTimeout(() => saveBtn.classList.remove('save-success'), 800);
        }
    }

    editEntry(id) {
        const entry = this.entries.find(entry => entry.id === id);
        if (!entry) {
            this.showNotification('Entry not found', 'error');
            return;
        }

        // Fill the form with current entry data
        const titleEl = document.getElementById('entryTitle');
        const contentEl = document.getElementById('journalInput');
        const categoryEl = document.getElementById('category');
        const tagsEl = document.getElementById('tags');
        const moodEl = document.getElementById('mood');

        if (titleEl) titleEl.value = entry.title;
        if (contentEl) contentEl.value = entry.content;
        if (categoryEl) categoryEl.value = entry.category;
        if (tagsEl) tagsEl.value = entry.tags.join(', ');
        if (moodEl) moodEl.value = entry.mood;

        // Update character count
        this.updateCharCount();

        // Store the editing entry ID
        this.editingEntryId = id;

        // Update save button text
        const saveBtn = this.domElements.saveEntryBtn;
        if (saveBtn) {
            saveBtn.textContent = 'Update Entry';
            saveBtn.classList.add('btn-editing');
        }

        // Scroll to the form
        const writeSection = document.getElementById('write');
        if (writeSection) {
            writeSection.scrollIntoView({ behavior: 'smooth' });
        }

        this.showNotification('Entry loaded for editing', 'info');
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

    filterEntries(searchQuery = '') {
        const container = this.domElements.entriesContainer || document.getElementById('entriesContainer');
        const searchInput = this.domElements.searchInput || document.getElementById('searchInput');
        const filterCategory = this.domElements.filterCategory || document.getElementById('filterCategory');
        const filterMood = this.domElements.filterMood || document.getElementById('filterMood');

        if (!container) return;

        searchQuery = searchQuery || (searchInput ? searchInput.value.toLowerCase() : '');
        const selectedCategory = filterCategory ? filterCategory.value.toLowerCase() : '';
        const selectedMood = filterMood ? filterMood.value.toLowerCase() : '';

        const entries = container.querySelectorAll('.journal-entry');
        let visibleCount = 0;

        entries.forEach(entry => {
            const content = entry.querySelector('.entry-content')?.textContent.toLowerCase() || '';
            const title = entry.querySelector('.entry-title')?.textContent.toLowerCase() || '';
            const date = entry.querySelector('.entry-date')?.textContent.toLowerCase() || '';
            const category = entry.getAttribute('data-category')?.toLowerCase() || '';
            const mood = entry.getAttribute('data-mood')?.toLowerCase() || '';

            // Check search match (title, content, or date)
            const matchesSearch = !searchQuery.trim() || 
                content.includes(searchQuery) || 
                title.includes(searchQuery) || 
                date.includes(searchQuery);

            // Check category filter
            const matchesCategory = !selectedCategory || category === selectedCategory;

            // Check mood filter  
            const matchesMood = !selectedMood || mood === selectedMood;

            const shouldShow = matchesSearch && matchesCategory && matchesMood;

            if (shouldShow) {
                entry.style.display = 'block';
                visibleCount++;
            } else {
                entry.style.display = 'none';
            }
        });

        // Show message if no entries match
        const existingMessage = container.querySelector('.filter-no-results');
        if (existingMessage) {
            existingMessage.remove();
        }

        if (visibleCount === 0 && entries.length > 0) {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'filter-no-results';
            noResultsMsg.innerHTML = '<p class="no-entries">No entries match your current filters. Try adjusting your search criteria.</p>';
            container.appendChild(noResultsMsg);
        }
    }

    exportEntries() {
        if (this.entries.length === 0) {
            this.showNotification('No entries to export', 'warning');
            return;
        }

        let exportText = '📖 MY DAILY JOURNAL\n';
        exportText += '='.repeat(52) + '\n\n';

        this.entries.forEach((entry, index) => {
            exportText += `Entry ${this.entries.length - index}: ${entry.title}\n`;
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
        if (!container) return;

        if (this.entries.length === 0) {
            container.innerHTML = '<p class="no-entries">No journal entries yet. Start writing your first entry above! ✨</p>';
            return;
        }

        container.innerHTML = this.entries.map(entry => this.createEntryHTML(entry)).join('');

        // Re-initialize cursor effects for new entries
        setTimeout(() => this.initCursorEffects(), 100);
    }

    createEntryHTML(entry) {
        return `
            <div class="journal-entry" data-id="${entry.id}" data-category="${entry.category.toLowerCase()}" data-mood="${entry.mood.toLowerCase()}">
                <div class="entry-header">
                    <div class="entry-title-section">
                        <h3 class="entry-title">${entry.title}</h3>
                        <span class="entry-date">📅 ${entry.date} • 🕒 ${entry.time}</span>
                    </div>
                    <div class="entry-actions">
                        <button class="edit-btn" title="Edit entry" aria-label="Edit entry">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="delete-btn" title="Delete entry" aria-label="Delete entry">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
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
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\b(https?:\/\/\S+)/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    updateCharCount() {
        const input = this.domElements.journalInput;
        const counter = document.getElementById('charCount');
        const saveBtn = this.domElements.saveEntryBtn;

        if (!input || !counter || !saveBtn) return;

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

    fetchQuote() {
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        const newQuoteBtn = this.domElements.newQuoteBtn;
        const quoteCard = document.querySelector('.quote-card');

        if (!quoteText || !quoteAuthor) {
            console.error('Quote elements not found in DOM');
            return;
        }

        // Enhanced inspirational quotes collection with even more quotes
        const inspirationalQuotes = [
            { quote: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
            { quote: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
            { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
            { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
            { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { quote: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
            { quote: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
            { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { quote: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
            { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
            { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
            { quote: "Great things never come from comfort zones.", author: "Unknown" },
            { quote: "Dream it. Wish it. Do it.", author: "Unknown" },
            { quote: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
            { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
            { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
            { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
            { quote: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
            { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
            { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
            { quote: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
            { quote: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
            { quote: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
            { quote: "If you tell the truth, you don't have to remember anything.", author: "Mark Twain" },
            { quote: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
            { quote: "The mind is everything. What you think you become.", author: "Buddha" },
            { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
            { quote: "A winner is a dreamer who never gives up.", author: "Nelson Mandela" },
            { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
            { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
            { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
            { quote: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
            { quote: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
            { quote: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
            { quote: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
            { quote: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
            { quote: "You learn more from failure than from success. Don't let it stop you. Failure builds character.", author: "Unknown" },
            { quote: "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.", author: "Steve Jobs" },
            { quote: "Experience is a hard teacher because she gives the test first, the lesson afterwards.", author: "Vernon Law" },
            { quote: "The most difficult thing is the decision to act, the rest is merely tenacity.", author: "Amelia Earhart" },
            { quote: "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.", author: "Christian D. Larson" },
            { quote: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
            { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
            { quote: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
            { quote: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" }
        ];

        // Ensure quote section is visible
        const quoteSection = document.querySelector('.quote-section');
        if (quoteSection) {
            quoteSection.style.display = 'block';
            quoteSection.style.visibility = 'visible';
            quoteSection.style.opacity = '1';
        }

        // Show loading state
        if (quoteCard) {
            quoteCard.classList.remove('loaded');
            quoteCard.classList.add('loading');
            quoteCard.style.display = 'block';
            quoteCard.style.visibility = 'visible';
        }
        if (newQuoteBtn) newQuoteBtn.disabled = true;

        quoteText.textContent = 'Loading new inspiration...';
        quoteAuthor.textContent = '';

        // Display quote immediately with smooth animation
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
            const selectedQuote = inspirationalQuotes[randomIndex];
            this.displayQuote(quoteText, quoteAuthor, selectedQuote);

            if (newQuoteBtn) newQuoteBtn.disabled = false;
            if (quoteCard) {
                quoteCard.classList.remove('loading');
                quoteCard.classList.add('loaded');
            }
        }, 300);
    }

    displayQuote(quoteText, quoteAuthor, quoteData) {
        const randomColor1 = this.getRandomColor();
        const randomColor2 = this.getRandomColor();
        const randomColor3 = this.getRandomColor();
        const quoteCard = document.querySelector('.quote-card');

        if (quoteCard) {
            // Create dynamic gradient with multiple colors
            const gradientAngle = Math.floor(Math.random() * 360);
            quoteCard.style.background = `linear-gradient(${gradientAngle}deg, ${randomColor1}, ${randomColor2}, ${randomColor3})`;
            quoteCard.style.backgroundSize = '400% 400%';
            quoteCard.style.animation = 'gradientShift 4s ease infinite';

            // Ensure visibility
            quoteCard.style.display = 'block';
            quoteCard.style.visibility = 'visible';
            quoteCard.style.opacity = '1';
        }

        // Smooth transition effect with scale animation
        quoteText.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        quoteAuthor.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        quoteText.style.opacity = '0';
        quoteAuthor.style.opacity = '0';
        quoteText.style.transform = 'translateY(20px) scale(0.95)';
        quoteAuthor.style.transform = 'translateY(20px) scale(0.95)';

        setTimeout(() => {
            quoteText.textContent = `"${quoteData.quote || quoteData.content}"`;
            quoteAuthor.textContent = `— ${quoteData.author || 'Unknown'}`;
            quoteText.style.opacity = '1';
            quoteAuthor.style.opacity = '1';
            quoteText.style.transform = 'translateY(0) scale(1)';
            quoteAuthor.style.transform = 'translateY(0) scale(1)';
        }, 300);
    }

    getRandomColor() {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
            '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
            '#d299c2', '#fef9d7', '#89f7fe', '#66a6ff', '#f5f7fa', '#c3cfe2',
            '#ff9a9e', '#fecfef', '#ffecd2', '#fcb69f', '#667eea', '#764ba2',
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd',
            '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9', '#f8c471', '#82e0aa',
            '#f1948a', '#85c1e9', '#f4d03f', '#a3e4d7', '#d7bde2', '#aed6f1',
            '#fad7a0', '#a9dfbf', '#f5b7b1', '#abebc6', '#f9e79f', '#d5a6bd'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    showNotification(message, type = 'info') {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type} show`;
        notification.textContent = message;        notification.setAttribute('role', 'alert');
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

        if (totalEntries) totalEntries.textContent = stats.totalEntries;
        if (totalWords) totalWords.textContent = stats.totalWords;
        if (avgWords) avgWords.textContent = stats.averageWordsPerEntry;
        if (oldestEntry) oldestEntry.textContent = stats.oldestEntry;
        if (newestEntry) newestEntry.textContent = stats.newestEntry;

        if (stats.totalEntries > 0) {
            this.renderCharts(stats);
        } else {
            const chartsContainer = document.querySelector('.stats-charts');
            if (chartsContainer) {
                chartsContainer.innerHTML = '<p>No data to display</p>';
            }
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

        const entriesChartEl = document.getElementById('entriesChart');
        if (entriesChartEl && typeof Chart !== 'undefined') {
            new Chart(entriesChartEl.getContext('2d'), {
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
                        title: { display: true, text: `Journal Entries by Month (${currentYear})`, font: { size: 14 } },
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Number of Entries' } },
                        x: { title: { display: true, text: 'Month' } }
                    }
                }
            });
        }

        const categoryLabels = Object.keys(stats.categories);
        const categoryData = Object.values(stats.categories);
        const categoriesChartEl = document.getElementById('categoriesChart');
        if (categoriesChartEl && typeof Chart !== 'undefined') {
            new Chart(categoriesChartEl.getContext('2d'), {
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
        }

        if (Object.keys(stats.moods).length > 0) {
            const moodLabels = Object.keys(stats.moods);
            const moodData = Object.values(stats.moods);
            const moodsChartEl = document.getElementById('moodsChart');
            if (moodsChartEl && typeof Chart !== 'undefined') {
                new Chart(moodsChartEl.getContext('2d'), {
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

    toggleQuickStats() {
        const modal = document.getElementById('quickStatsModal');
        if (!modal) return;

        modal.classList.toggle('active');
        if (modal.classList.contains('active')) {
            const stats = this.getStats();
            const modalStats = document.getElementById('modalStats');
            if (modalStats) {
                modalStats.textContent = `
                    Total Entries: ${stats.totalEntries}
                    Total Words: ${stats.totalWords}
                    Average Words: ${stats.averageWordsPerEntry}
                `;
            }
        }
    }

    // Navbar functionality
    initNavbar() {
        this.observeSections();
        this.handleNavbarScroll();
    }

    bindNavbarEvents() {
        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navbarNav = document.querySelector('.navbar-nav');
        if (mobileMenuBtn && navbarNav) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenuBtn.classList.toggle('active');
                navbarNav.classList.toggle('active');
            });
        }

        // Close mobile menu on link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const mobileBtn = document.getElementById('mobileMenuBtn');
                const nav = document.querySelector('.navbar-nav');
                if (mobileBtn && nav) {
                    mobileBtn.classList.remove('active');
                    nav.classList.remove('active');
                }
            });
        });
    }

    navigateToSection(section) {
        const element = document.getElementById(section);
        if (element) {
            const navbar = document.querySelector('.navbar');
            const navbarHeight = navbar ? navbar.offsetHeight : 80;
            const elementPosition = element.offsetTop - navbarHeight - 20;

            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    observeSections() {
        const sections = document.querySelectorAll('section[id], header[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('data-section') === id) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '-80px 0px -80px 0px'
        });

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    handleNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            if (navbar) {
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    navbar.style.transform = 'translateX(-50%) translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateX(-50%) translateY(0)';
                }

                if (currentScrollY > 50) {
                    navbar.style.background = 'var(--surface-color)';
                    navbar.style.boxShadow = 'var(--shadow-lg)';
                } else {
                    navbar.style.background = 'var(--surface-color)';
                }
            }

            lastScrollY = currentScrollY;
        });
    }


}

// Initialize the app only once when DOM is loaded
if (typeof window.journal === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.journal = new DailyJournal();
        console.log('📖 Welcome to Your Daily Journal!');
        console.log('💡 Pro tip: Use Ctrl/Cmd + Enter to quickly save entries');
        console.log('🎨 Try switching between light, dark, and custom themes');
    });
}
