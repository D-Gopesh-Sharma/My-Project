// result.js - Try-On Result Page
class ResultPage {
    constructor() {
        this.resultData = null;
        this.init();
    }

    init() {
        this.loadResultData();
        this.setupEventListeners();
        this.generateSuggestions();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Download result
        const downloadBtn = document.getElementById('downloadResult');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', this.downloadResult.bind(this));
        }

        // Share result
        const shareBtn = document.getElementById('shareResult');
        if (shareBtn) {
            shareBtn.addEventListener('click', this.shareResult.bind(this));
        }

        // Save to profile
        const saveBtn = document.getElementById('saveToProfile');
        if (saveBtn) {
            saveBtn.addEventListener('click', this.saveToProfile.bind(this));
        }

        // Social media sharing
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.shareOnSocial(e.target.textContent.toLowerCase());
            });
        });
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

    loadResultData() {
        // Get result data from URL parameters or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('id');

        if (resultId) {
            // Load from localStorage based on ID
            const tryOns = JSON.parse(localStorage.getItem('tryOns') || '[]');
            this.resultData = tryOns.find(tryOn => tryOn.id == resultId);
        } else {
            // Load the most recent try-on result
            const tryOns = JSON.parse(localStorage.getItem('tryOns') || '[]');
            this.resultData = tryOns[0]; // Most recent
        }

        if (this.resultData) {
            this.displayResult();
        } else {
            this.showNoResultMessage();
        }
    }

    displayResult() {
        const originalPhoto = document.getElementById('originalPhoto');
        const resultPhoto = document.getElementById('resultPhoto');
        const dressName = document.getElementById('dressName');
        const dressDescription = document.getElementById('dressDescription');

        if (originalPhoto) originalPhoto.src = this.resultData.photo;
        if (resultPhoto) resultPhoto.src = this.resultData.result;
        
        if (dressName) {
            dressName.textContent = this.resultData.dress?.name || 'Selected Dress';
        }
        
        if (dressDescription) {
            dressDescription.textContent = this.generateDressDescription();
        }

        // Add loading animation
        this.animateResult();
    }

    generateDressDescription() {
        if (!this.resultData.dress) {
            return 'Beautiful dress perfect for any occasion.';
        }

        const dress = this.resultData.dress;
        const categoryDescriptions = {
            casual: 'Perfect for everyday wear and casual outings',
            formal: 'Elegant choice for special occasions and formal events',
            party: 'Ideal for celebrations and night out',
            saree: 'Traditional Indian attire with timeless elegance',
            western: 'Contemporary style with modern appeal'
        };

        const patternDescriptions = {
            solid: 'with a classic solid color',
            striped: 'featuring stylish stripes',
            floral: 'adorned with beautiful floral patterns',
            lace: 'with intricate lace detailing',
            sequin: 'sparkling with sequin embellishments',
            embroidered: 'featuring elegant embroidery work'
        };

        const categoryDesc = categoryDescriptions[dress.category] || 'Stylish and versatile';
        const patternDesc = patternDescriptions[dress.pattern] || 'with unique design elements';

        return `${categoryDesc} ${patternDesc}. This ${dress.category} dress combines comfort with style, making it a perfect addition to your wardrobe.`;
    }

    animateResult() {
        const originalPhoto = document.getElementById('originalPhoto');
        const resultPhoto = document.getElementById('resultPhoto');

        if (originalPhoto && resultPhoto) {
            // Start with original photo visible and result hidden
            resultPhoto.style.opacity = '0';
            resultPhoto.style.transform = 'scale(0.8)';

            // Animate result photo appearing
            setTimeout(() => {
                resultPhoto.style.transition = 'all 0.8s ease';
                resultPhoto.style.opacity = '1';
                resultPhoto.style.transform = 'scale(1)';
            }, 500);

            // Add sparkle effect
            this.addSparkleEffect(resultPhoto);
        }
    }

    addSparkleEffect(element) {
        const sparkles = document.createElement('div');
        sparkles.className = 'sparkles';
        sparkles.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        element.parentElement.style.position = 'relative';
        element.parentElement.appendChild(sparkles);

        // Create sparkle particles
        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: gold;
                border-radius: 50%;
                animation: sparkle 2s infinite ease-in-out;
                animation-delay: ${Math.random() * 2}s;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            sparkles.appendChild(sparkle);
        }

        // Remove sparkles after animation
        setTimeout(() => {
            sparkles.remove();
        }, 4000);
    }

    showNoResultMessage() {
        const resultSection = document.querySelector('.result-section .container');
        resultSection.innerHTML = `
            <div class="no-result-message">
                <div class="no-result-icon">🔍</div>
                <h2>No Result Found</h2>
                <p>We couldn't find the try-on result you're looking for.</p>
                <div class="no-result-actions">
                    <a href="upload.html" class="cta-button">Try On New Dress</a>
                    <a href="profile.html" class="secondary-button">View Your History</a>
                </div>
            </div>
        `;
    }

    downloadResult() {
        if (this.resultData && this.resultData.result) {
            const link = document.createElement('a');
            link.download = `virtueStyle-result-${this.resultData.id}.jpg`;
            link.href = this.resultData.result;
            link.click();
            
            this.showToast('Image downloaded successfully!');
            this.trackAction('download');
        } else {
            this.showToast('No result image available to download', 'error');
        }
    }

    shareResult() {
        if (!this.resultData) {
            this.showToast('No result to share', 'error');
            return;
        }

        const shareData = {
            title: 'My Virtual Try-On Result',
            text: `Check out how I look in ${this.resultData.dress?.name || 'this dress'} using VirtueStyle's AI technology!`,
            url: window.location.href
        };

        if (navigator.share && navigator.canShare(shareData)) {
            navigator.share(shareData)
                .then(() => {
                    this.showToast('Shared successfully!');
                    this.trackAction('share');
                })
                .catch(() => {
                    this.fallbackShare();
                });
        } else {
            this.fallbackShare();
        }
    }

    fallbackShare() {
        // Copy link to clipboard
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                this.showToast('Link copied to clipboard!');
                this.trackAction('share');
            })
            .catch(() => {
                this.showToast('Unable to copy link', 'error');
            });
    }

    saveToProfile() {
        if (!this.resultData) {
            this.showToast('No result to save', 'error');
            return;
        }

        // Check if already saved
        const tryOns = JSON.parse(localStorage.getItem('tryOns') || '[]');
        const existingIndex = tryOns.findIndex(tryOn => tryOn.id === this.resultData.id);

        if (existingIndex === -1) {
            // Add to the beginning of the array (most recent first)
            tryOns.unshift(this.resultData);
            
            // Keep only last 50 try-ons
            if (tryOns.length > 50) {
                tryOns.splice(50);
            }
            
            localStorage.setItem('tryOns', JSON.stringify(tryOns));
            this.showToast('Saved to your profile!');
        } else {
            this.showToast('Already saved in your profile');
        }
        
        this.trackAction('save');
    }

    shareOnSocial(platform) {
        if (!this.resultData) {
            this.showToast('No result to share', 'error');
            return;
        }

        const text = encodeURIComponent(`Check out my virtual try-on result using VirtueStyle! ${this.resultData.dress?.name || 'Amazing dress'}`);
        const url = encodeURIComponent(window.location.href);
        const hashtags = encodeURIComponent('VirtueStyle,VirtualTryOn,Fashion,AI');

        let shareUrl;

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
                break;
            case 'instagram':
                // Instagram doesn't have direct web sharing, so copy text
                navigator.clipboard.writeText(`${decodeURIComponent(text)} ${decodeURIComponent(url)}`);
                this.showToast('Text copied! Open Instagram and paste in your story/post');
                return;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
            default:
                this.showToast('Platform not supported', 'error');
                return;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
            this.trackAction(`share_${platform}`);
        }
    }

    generateSuggestions() {
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        if (!suggestionsGrid) return;

        // Generate similar dresses based on the current dress category
        const currentCategory = this.resultData?.dress?.category || 'casual';
        const suggestions = this.getSimilarDresses(currentCategory);

        suggestionsGrid.innerHTML = '';
        suggestions.forEach((dress, index) => {
            const suggestionItem = this.createSuggestionItem(dress, index);
            suggestionsGrid.appendChild(suggestionItem);
        });
    }

    getSimilarDresses(category) {
        const dressDatabase = [
            { id: 1, name: 'Summer Floral Dress', category: 'casual', color: '#FFB6C1', pattern: 'floral' },
            { id: 2, name: 'Elegant Black Gown', category: 'formal', color: '#000000', pattern: 'solid' },
            { id: 3, name: 'Party Sequin Dress', category: 'party', color: '#FFD700', pattern: 'sequin' },
            { id: 4, name: 'Traditional Silk Saree', category: 'saree', color: '#8B4513', pattern: 'traditional' },
            { id: 5, name: 'Casual Denim Dress', category: 'casual', color: '#4682B4', pattern: 'solid' },
            { id: 6, name: 'Cocktail Lace Dress', category: 'formal', color: '#800080', pattern: 'lace' },
            { id: 7, name: 'Sparkling Party Dress', category: 'party', color: '#FF69B4', pattern: 'sequin' },
            { id: 8, name: 'Designer Lehenga', category: 'saree', color: '#FF6347', pattern: 'embroidered' }
        ];

        // Filter by category and return 4 suggestions
        return dressDatabase
            .filter(dress => dress.category === category)
            .slice(0, 4);
    }

    createSuggestionItem(dress, index) {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.style.animationDelay = `${index * 0.1}s`;

        const svgDress = this.generateDressSVG(dress);

        item.innerHTML = `
            ${svgDress}
            <div class="suggestion-item-info">
                <h4>${dress.name}</h4>
                <p>${this.formatCategory(dress.category)}</p>
                <button class="try-suggestion-btn" onclick="result.trySuggestion(${dress.id})">
                    Try This On
                </button>
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
                ${dress.pattern === 'floral' ? this.addFloralPattern() : ''}
                ${dress.pattern === 'sequin' ? this.addSequinPattern() : ''}
                <circle cx="135" cy="35" r="2" fill="#333"/>
                <circle cx="165" cy="35" r="2" fill="#333"/>
                <path d="M140,40 Q150,45 160,40" stroke="#333" stroke-width="1.5" fill="none"/>
            </svg>
        `;
    }

    addFloralPattern() {
        return `
            <circle cx="120" cy="80" r="3" fill="#fff" opacity="0.7"/>
            <circle cx="140" cy="100" r="2" fill="#fff" opacity="0.7"/>
            <circle cx="170" cy="90" r="3" fill="#fff" opacity="0.7"/>
            <circle cx="130" cy="120" r="2" fill="#fff" opacity="0.7"/>
        `;
    }

    addSequinPattern() {
        let sequins = '';
        for (let i = 0; i < 12; i++) {
            const x = 100 + Math.random() * 100;
            const y = 60 + Math.random() * 120;
            sequins += `<circle cx="${x}" cy="${y}" r="1.5" fill="#FFD700" opacity="0.8"/>`;
        }
        return sequins;
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

    trySuggestion(dressId) {
        // Store the selected dress ID and redirect to upload page
        localStorage.setItem('selectedDressId', dressId.toString());
        window.location.href = 'upload.html?suggestion=true';
    }

    trackAction(action) {
        // Track user actions for analytics
        const actions = JSON.parse(localStorage.getItem('userActions') || '[]');
        actions.push({
            action: action,
            timestamp: new Date().toISOString(),
            resultId: this.resultData?.id,
            dressCategory: this.resultData?.dress?.category
        });

        // Keep only last 100 actions
        if (actions.length > 100) {
            actions.splice(0, actions.length - 100);
        }

        localStorage.setItem('userActions', JSON.stringify(actions));

        // Update share count if sharing
        if (action.includes('share')) {
            const currentShares = parseInt(localStorage.getItem('shareCount') || '0');
            localStorage.setItem('shareCount', (currentShares + 1).toString());
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
            animation: slideInRight 0.3s ease;
            box-shadow: var(--shadow);
            max-width: 300px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initialize comparison slider (optional feature)
    initComparisonSlider() {
        const originalPhoto = document.getElementById('originalPhoto');
        const resultPhoto = document.getElementById('resultPhoto');
        
        if (!originalPhoto || !resultPhoto) return;

        const container = originalPhoto.parentElement.parentElement;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = '50';
        slider.className = 'comparison-slider';

        slider.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            z-index: 10;
            opacity: 0.8;
            cursor: pointer;
        `;

        container.style.position = 'relative';
        container.appendChild(slider);

        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            resultPhoto.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
        });
    }
}

// Global result instance
let result;

// Initialize result page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    result = new ResultPage();
});

// Add result-specific CSS animations
const resultCSS = `
@keyframes sparkle {
    0%, 100% {
        opacity: 0;
        transform: scale(0);
    }
    50% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.suggestion-item {
    animation: fadeInUp 0.6s ease;
    animation-fill-mode: both;
}

.try-suggestion-btn {
    background: var(--accent-color);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    margin-top: 1rem;
    width: 100%;
}

.try-suggestion-btn:hover {
    background: #b8941f;
    transform: translateY(-2px);
}

.no-result-message {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-light);
}

.no-result-icon {
    font-size: 6rem;
    margin-bottom: 2rem;
}

.no-result-message h2 {
    font-family: 'Playfair Display', serif;
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.no-result-message p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
}

.no-result-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.secondary-button {
    display: inline-block;
    padding: 1rem 2rem;
    background: transparent;
    color: var(--primary-color);
    text-decoration: none;
    border: 2px solid var(--primary-color);
    border-radius: 50px;
    font-weight: 600;
    transition: var(--transition);
}

.secondary-button:hover {
    background: var(--primary-color);
    color: white;
    transform: translateY(-2px);
}

.result-image {
    position: relative;
    overflow: hidden;
}

.comparison-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 2px;
    background: var(--accent-color);
    outline: none;
}

.comparison-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.comparison-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent-color);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

/* Mobile responsiveness for result page */
@media (max-width: 768px) {
    .no-result-actions {
        flex-direction: column;
        align-items: center;
    }
    
    .secondary-button,
    .cta-button {
        width: 100%;
        max-width: 300px;
        text-align: center;
    }
}
`;

const style = document.createElement('style');
style.textContent = resultCSS;
document.head.appendChild(style);