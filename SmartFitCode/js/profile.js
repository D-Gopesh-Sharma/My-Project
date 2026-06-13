// profile.js - User Profile Page

import { auth, signOut, onAuthStateChanged } from "./firebase.js";

class UserProfile {
    constructor() {
        this.currentTab = 'history';
        this.init();
    }

    init() {
        this.loadFirebaseUser();

        this.setupEventListeners();
        this.loadProfileStats();
        this.loadTryOnHistory();
        this.loadFavorites();
        this.setupMobileMenu();
    }

    loadFirebaseUser() {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = "signin.html";
                return;
            }
            const nameEl = document.getElementById("profileName");
            const emailEl = document.getElementById("profileEmail");
            const avatarEl = document.getElementById("profileAvatar");
            // Name
            nameEl.textContent = user.displayName || "FashioLens User";
            // Email
            emailEl.textContent = user.email;
            // Avatar (Google profile image)
            avatarEl.src = user.photoURL
                ? user.photoURL.replace("s96-c", "s400-c")
                : "../assets/default-avatar.png";
        });
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        
        // Settings form
        const saveSettingsBtn = document.querySelector('.save-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', this.saveSettings.bind(this));
        }

        // Avatar change
        const changeAvatarBtn = document.querySelector('.change-avatar-btn');
        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', this.changeAvatar.bind(this));
        }
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await signOut(auth);
                window.location.href = "index.html";
            });
        }

        // Clear history button
        this.addClearHistoryButton();
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }
    }

    loadUserData() {
        const savedData = JSON.parse(localStorage.getItem('userData') || '{}');
        this.userData = { ...this.userData, ...savedData };
        
        // Update UI with user data
        document.getElementById('profileName').textContent = this.userData.name;
        document.getElementById('profileEmail').textContent = this.userData.email;
        
        // Load settings form
        document.getElementById('settingsName').value = this.userData.name;
        document.getElementById('settingsEmail').value = this.userData.email;
        document.getElementById('preferredStyle').value = this.userData.preferredStyle;
    }

    loadProfileStats() {
        const tryOns = JSON.parse(localStorage.getItem('tryOns') || '[]');
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const shares = parseInt(localStorage.getItem('shareCount') || '0');

        document.getElementById('tryOnsCount').textContent = tryOns.length;
        document.getElementById('favoritesCount').textContent = favorites.length;
        document.getElementById('sharesCount').textContent = shares;

        // Animate counters
        this.animateCounters();
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat h3');
        counters.forEach(counter => {
            const target = parseInt(counter.textContent);
            let current = 0;
            const increment = target / 20;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 50);
        });
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load specific tab content
        if (tabName === 'history') {
            this.loadTryOnHistory();
        } else if (tabName === 'favorites') {
            this.loadFavorites();
        }
    }

    loadTryOnHistory() {
        const tryOns = JSON.parse(localStorage.getItem('tryOns') || '[]');
        const historyGrid = document.getElementById('historyGrid');

        if (tryOns.length === 0) {
            historyGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📸</div>
                    <h3>No Try-Ons Yet</h3>
                    <p>Start your virtual try-on journey!</p>
                    <a href="upload.html" class="cta-button">Try On Now</a>
                </div>
            `;
            return;
        }

        historyGrid.innerHTML = '';
        tryOns.forEach((tryOn, index) => {
            const historyItem = this.createHistoryItem(tryOn, index);
            historyGrid.appendChild(historyItem);
        });
    }

    createHistoryItem(tryOn, index) {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.animationDelay = `${index * 0.1}s`;

        item.innerHTML = `
            <div class="history-image">
                ${tryOn.result ? 
                    `<img src="${tryOn.result}" alt="Try-On Result">` : 
                    `<div class="placeholder-image">No Result</div>`
                }
                <div class="history-overlay">
                    <button class="view-btn" onclick="profile.viewTryOnDetails(${tryOn.id})">View</button>
                    <button class="delete-btn" onclick="profile.deleteTryOn(${tryOn.id})">Delete</button>
                </div>
            </div>
            <div class="history-item-info">
                <h4>${tryOn.dress?.name || 'Unknown Dress'}</h4>
                <p class="history-date">${tryOn.date}</p>
                <span class="history-category">${tryOn.dress?.category || 'Unknown'}</span>
            </div>
        `;

        return item;
    }

    loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const favoritesGrid = document.getElementById('favoritesGrid');

        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❤️</div>
                    <h3>No Favorites Yet</h3>
                    <p>Explore our catalog and add your favorite dresses!</p>
                    <a href="catalog.html" class="cta-button">Browse Catalog</a>
                </div>
            `;
            return;
        }

        favoritesGrid.innerHTML = '';
        favorites.forEach((favorite, index) => {
            const favoriteItem = this.createFavoriteItem(favorite, index);
            favoritesGrid.appendChild(favoriteItem);
        });
    }

    createFavoriteItem(favorite, index) {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.style.animationDelay = `${index * 0.1}s`;

        const svgDress = this.generateDressSVG(favorite);

        item.innerHTML = `
            <div class="favorite-image">
                ${svgDress}
                <div class="favorite-overlay">
                    <button class="try-on-btn" onclick="window.location.href='upload.html'">Try On</button>
                    <button class="remove-favorite-btn" onclick="profile.removeFavorite(${favorite.id})">Remove</button>
                </div>
            </div>
            <div class="favorite-item-info">
                <h4>${favorite.name}</h4>
                <p class="favorite-price">${favorite.price}</p>
                <span class="favorite-category">${this.formatCategory(favorite.category)}</span>
            </div>
        `;

        return item;
    }

    generateDressSVG(dress) {
        const patterns = {
            casual: 'M110,60 Q150,50 190,60 L185,180 Q150,190 115,180 Z',
            formal: 'M100,50 Q150,40 200,50 L190,200 Q150,220 110,200 Z',
            party: 'M105,45 Q150,35 195,45 L200,220 Q150,240 100,220 Z',
            saree: 'M90,55 Q150,25 210,55 L205,250 Q150,270 95,250 Z',
            western: 'M115,65 Q150,55 185,65 L180,160 Q150,170 120,160 Z'
        };

        const pattern = patterns[dress.category] || patterns.casual;

        return `
            <svg viewBox="0 0 300 200" style="width: 100%; height: 150px;">
                <rect width="300" height="200" fill="#f8f8f8"/>
                <path d="${pattern}" fill="${dress.color}" stroke="#333" stroke-width="2"/>
                <circle cx="135" cy="35" r="2" fill="#333"/>
                <circle cx="165" cy="35" r="2" fill="#333"/>
                <path d="M140,40 Q150,45 160,40" stroke="#333" stroke-width="1.5" fill="none"/>
            </svg>
        `;
    }

    formatCategory(category) {
        const categoryNames = {
            casual: 'Casual Wear',
            formal: 'Formal Wear',
            party: 'Party Dress',
            saree: 'Traditional Saree',
            western: 'Western Wear'
        };
        return categoryNames[category] || category;
    }

    viewTryOnDetails(tryOnId) {
        const tryOns = JSON.parse(localStorage.getItem('tryOns') || '[]');
        const tryOn = tryOns.find(t => t.id === tryOnId);
        
        if (!tryOn) return;

        // Create modal for try-on details
        const modal = document.createElement('div');
        modal.className = 'tryOn-modal';
        modal.innerHTML = `
            <div class="tryOn-modal-content">
                <span class="close-modal">&times;</span>
                <div class="tryOn-modal-body">
                    <div class="tryOn-comparison">
                        <div class="tryOn-before">
                            <h4>Original</h4>
                            <img src="${tryOn.photo}" alt="Original Photo">
                        </div>
                        <div class="tryOn-after">
                            <h4>Result</h4>
                            <img src="${tryOn.result}" alt="Try-On Result">
                        </div>
                    </div>
                    <div class="tryOn-details">
                        <h3>${tryOn.dress?.name || 'Virtual Try-On'}</h3>
                        <p><strong>Date:</strong> ${tryOn.date}</p>
                        <p><strong>Category:</strong> ${this.formatCategory(tryOn.dress?.category || 'unknown')}</p>
                        <div class="tryOn-actions">
                            <button class="download-btn" onclick="profile.downloadTryOn('${tryOn.result}')">
                                📥 Download
                            </button>
                            <button class="share-btn" onclick="profile.shareTryOn(${tryOnId})">
                                🔗 Share
                            </button>
                            <button class="delete-btn" onclick="profile.deleteTryOn(${tryOnId}); this.closest('.tryOn-modal').remove()">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    deleteTryOn(tryOnId) {
        if (confirm('Are you sure you want to delete this try-on?')) {
            let tryOns = JSON.parse(localStorage.getItem('tryOns') || '[]');
            tryOns = tryOns.filter(t => t.id !== tryOnId);
            localStorage.setItem('tryOns', JSON.stringify(tryOns));
            
            this.loadTryOnHistory();
            this.loadProfileStats();
            this.showToast('Try-on deleted successfully');
        }
    }

    downloadTryOn(imageUrl) {
        const link = document.createElement('a');
        link.download = `virtueStyle-tryOn-${Date.now()}.jpg`;
        link.href = imageUrl;
        link.click();
    }

    shareTryOn(tryOnId) {
        const tryOns = JSON.parse(localStorage.getItem('tryOns') || '[]');
        const tryOn = tryOns.find(t => t.id === tryOnId);
        
        if (!tryOn) return;

        if (navigator.share) {
            navigator.share({
                title: 'My Virtual Try-On',
                text: `Check out my virtual try-on of ${tryOn.dress?.name}!`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            this.showToast('Link copied to clipboard!');
        }

        // Increment share count
        const currentShares = parseInt(localStorage.getItem('shareCount') || '0');
        localStorage.setItem('shareCount', (currentShares + 1).toString());
        this.loadProfileStats();
    }

    removeFavorite(favoriteId) {
        if (confirm('Remove from favorites?')) {
            let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            favorites = favorites.filter(f => f.id !== favoriteId);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            
            this.loadFavorites();
            this.loadProfileStats();
            this.showToast('Removed from favorites');
        }
    }

    changeAvatar() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const avatarImg = document.getElementById('profileAvatar');
                    avatarImg.src = event.target.result;
                    
                    // Save to localStorage
                    this.userData.avatar = event.target.result;
                    this.saveUserData();
                    this.showToast('Avatar updated successfully!');
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    saveSettings() {
        const name = document.getElementById('settingsName').value.trim();
        const email = document.getElementById('settingsEmail').value.trim();
        const preferredStyle = document.getElementById('preferredStyle').value;

        if (!name || !email) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Update user data
        this.userData.name = name;
        this.userData.email = email;
        this.userData.preferredStyle = preferredStyle;

        // Save to localStorage
        this.saveUserData();

        // Update UI
        document.getElementById('profileName').textContent = name;
        document.getElementById('profileEmail').textContent = email;

        this.showToast('Settings saved successfully!');
    }

    saveUserData() {
        localStorage.setItem('userData', JSON.stringify(this.userData));
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    addClearHistoryButton() {
        const historyTab = document.getElementById('history');
        if (historyTab && !historyTab.querySelector('.clear-history-btn')) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'clear-history-btn';
            clearBtn.textContent = 'Clear All History';
            clearBtn.style.cssText = `
                background: #ff4757;
                color: white;
                border: none;
                padding: 0.8rem 1.5rem;
                border-radius: 25px;
                cursor: pointer;
                margin-top: 1rem;
                transition: all 0.3s ease;
            `;
            
            clearBtn.addEventListener('click', this.clearAllHistory.bind(this));
            historyTab.appendChild(clearBtn);
        }
    }

    clearAllHistory() {
        if (confirm('Are you sure you want to clear all your try-on history? This action cannot be undone.')) {
            localStorage.removeItem('tryOns');
            this.loadTryOnHistory();
            this.loadProfileStats();
            this.showToast('History cleared successfully');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        const bgColor = type === 'error' ? '#ff4757' : 'var(--accent-color)';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: var(--shadow);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Export user data
    exportUserData() {
        const userData = {
            profile: this.userData,
            tryOns: JSON.parse(localStorage.getItem('tryOns') || '[]'),
            favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
            shareCount: localStorage.getItem('shareCount') || '0'
        };

        const dataStr = JSON.stringify(userData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.download = 'virtueStyle-profile-data.json';
        link.href = dataUri;
        link.click();

        this.showToast('Profile data exported successfully!');
    }
}

// Global profile instance
let profile;

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    profile = new UserProfile();
});

// Add profile-specific CSS
const profileCSS = `
.history-item,
.favorite-item {
    animation: fadeInUp 0.5s ease;
    animation-fill-mode: both;
}

.empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem 2rem;
    color: var(--text-light);
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.empty-state h3 {
    font-family: 'Playfair Display', serif;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.history-overlay,
.favorite-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0;
    transition: var(--transition);
}

.history-item:hover .history-overlay,
.favorite-item:hover .favorite-overlay {
    opacity: 1;
}

.history-image,
.favorite-image {
    position: relative;
    overflow: hidden;
    border-radius: var(--border-radius);
}

.view-btn,
.delete-btn,
.try-on-btn,
.remove-favorite-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.view-btn,
.try-on-btn {
    background: var(--accent-color);
    color: white;
}

.delete-btn,
.remove-favorite-btn {
    background: #ff4757;
    color: white;
}

.view-btn:hover,
.try-on-btn:hover {
    background: #b8941f;
}

.delete-btn:hover,
.remove-favorite-btn:hover {
    background: #ff3742;
}

.placeholder-image {
    width: 100%;
    height: 150px;
    background: var(--bg-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-light);
    font-style: italic;
}

.history-date,
.favorite-price {
    font-size: 0.9rem;
    color: var(--text-light);
}

.history-category,
.favorite-category {
    background: var(--accent-color);
    color: white;
    padding: 0.2rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 500;
}

.tryOn-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 10000;
    display: none;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
}

.tryOn-modal-content {
    background: white;
    border-radius: var(--border-radius);
    max-width: 900px;
    width: 90%;
    max-height: 90%;
    overflow-y: auto;
    position: relative;
}

.tryOn-modal-body {
    padding: 2rem;
}

.tryOn-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

.tryOn-before,
.tryOn-after {
    text-align: center;
}

.tryOn-before h4,
.tryOn-after h4 {
    margin-bottom: 1rem;
    color: var(--accent-color);
    font-family: 'Playfair Display', serif;
}

.tryOn-before img,
.tryOn-after img {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: var(--border-radius);
}

.tryOn-details h3 {
    font-family: 'Playfair Display', serif;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.tryOn-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    flex-wrap: wrap;
}

.tryOn-actions button {
    flex: 1;
    min-width: 120px;
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 25px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
}

.download-btn {
    background: #4CAF50;
    color: white;
}

.share-btn {
    background: #2196F3;
    color: white;
}

.tryOn-actions .delete-btn {
    background: #ff4757;
    color: white;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

@media (max-width: 768px) {
    .tryOn-comparison {
        grid-template-columns: 1fr;
    }
    
    .tryOn-actions {
        flex-direction: column;
    }
    
    .tryOn-actions button {
        flex: none;
    }
}
`;

const style = document.createElement('style');
style.textContent = profileCSS;
document.head.appendChild(style);