// catalog.js - Fashion Catalog Page

class FashionCatalog {
    constructor() {
        this.dresses = [];
        this.filteredDresses = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.generateDresses();
        this.setupEventListeners();
        this.renderCatalog();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilter(e.target.dataset.filter);
            });
        });

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', this.loadMoreItems.bind(this));
        }

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
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

    generateDresses() {
        const dressData = [
            // Casual Dresses
            { 
                name: 'Denim Shirt Dress', 
                category: 'casual', 
                price: 79, 
                color: '#4682B4', 
                pattern: 'solid',
                image: 'https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/2025/APRIL/24/ccYJV6Eo_6899a6a7ad3c4e81b40b5910e0f010f4.jpg',
                rating: 4.2,
                reviews: 89
            },
            { 
                name: 'Sweatshirt', 
                category: 'casual', 
                price: 89, 
                color: '#87CEEB', 
                pattern: 'floral',
                image: 'https://www.xtees.com/uploads/products/images/primary/custom-printed-men-heavyweight-oversized-sweatshirt_1700953121.jpg',
                rating: 4.5,
                reviews: 127
            },
            
            { 
                name: 'Bohemian Wrap Dress', 
                category: 'casual', 
                price: 95, 
                color: '#DDA0DD', 
                pattern: 'paisley',
                image: 'https://i.pinimg.com/736x/aa/0d/4d/aa0d4df90ae7b1c78b6e4d36f2f73dee.jpg',
                rating: 4.7,
                reviews: 156
            },
            { 
                name: 'Cotton A-Line Dress', 
                category: 'casual', 
                price: 65, 
                color: '#F0E68C', 
                pattern: 'striped',
                image:'https://www.gulabidorijaipur.com/cdn/shop/products/image_0181_SCL_9329.jpg?v=1679724360&width=1200',
                rating: 4.0,
                reviews: 73
            },
            
            // Formal Dresses
            { 
                name: 'Black Tie Evening Gown', 
                category: 'formal', 
                price: 299, 
                color: '#000000', 
                pattern: 'solid',
                image: 'https://www.ladyblacktie.com/cdn/shop/files/LBTdone-83__84268.1676298200.1280.1280.jpg?v=1767800753&width=1024',
                rating: 4.8,
                reviews: 234
            },
            { 
                name: 'Silk Cocktail Dress', 
                category: 'formal', 
                price: 189, 
                color: '#8B0000', 
                pattern: 'solid',
                image:'https://www.ferrovia.in/cdn/shop/files/red_velvet_dress.jpg?v=1696665676',
                rating: 4.6,
                reviews: 167
            },
            { 
                name: 'Lace Midi Dress', 
                category: 'formal', 
                price: 159, 
                color: '#F5F5DC', 
                pattern: 'lace',
                image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxoBwM6FK8rKE3q8ty60n4HZcONSoBFah0gw&s',
                rating: 4.4,
                reviews: 98
            },
            { 
                name: 'Velvet Bodycon Dress', 
                category: 'formal', 
                price: 149, 
                color: '#800080', 
                pattern: 'solid',
                image: 'https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/19780178/2022/9/10/798a0703-ea51-4a1b-8e4b-aa788acb91401662784988521-SASSAFRAS-Women-Dresses-3221662784987887-1.jpg',
                rating: 4.3,
                reviews: 112
            },
            
            // Party Dresses
            { 
                name: 'Sequin Mini Dress', 
                category: 'party', 
                price: 129, 
                color: '#FFD700', 
                pattern: 'sequin',
                image: 'https://www.realmbyvaishali.com/cdn/shop/files/DSC05227_1.jpg?v=1738882324&width=1366',
                rating: 4.7,
                reviews: 189
            },
            { 
                name: 'Off-Shoulder Party Dress', 
                category: 'party', 
                price: 109, 
                color: '#FF69B4', 
                pattern: 'solid',
                image: 'https://image.made-in-china.com/2f0j00zGtcWLSYRopR/Dominating-Floor-Length-off-Shoulder-Sequin-High-Slit-Long-Prom-Dress-Party-Gown.webp',
                rating: 4.5,
                reviews: 145
            },
            { 
                name: 'Party Tuxedo Dress', 
                category: 'party', 
                price: 139, 
                color: '#C0C0C0', 
                pattern: 'metallic',
                image: 'https://i.etsystatic.com/47767947/r/il/fb6249/5623845064/il_570xN.5623845064_amlo.jpg',
                rating: 4.6,
                reviews: 178
            },
            { 
                name: 'Party Dress', 
                category: 'party', 
                price: 119, 
                color: '#FF6347', 
                pattern: 'ruffled',
                image: 'https://medias.utsavfashion.com/media/catalog/product/cache/1/small_image/295x/040ec09b1e35df139433887a97daa66f/w/o/woven-art-silk-jacquard-sherwani-in-teal-blue-v1-muy1730.jpg',
                rating: 4.4,
                reviews: 134
            },
            
            // Saree Collection
            { 
                name: 'Silk Banarasi Saree', 
                category: 'saree', 
                price: 249, 
                color: '#8B4513', 
                pattern: 'traditional',
                image: 'https://anvicouture.com/cdn/shop/files/Blue-Silk-Saree-with-white-Floral-woven-motifs-Saree-s4d-828874.jpg?v=1715099952',
                rating: 4.9,
                reviews: 267
            },
            { 
                name: 'Chiffon Designer Saree', 
                category: 'saree', 
                price: 179, 
                color: '#FF1493', 
                pattern: 'embroidered',
                image: 'https://www.anantexports.in/cdn/shop/files/IMG-20240805_231623.jpg?v=1722880010&width=1946',
                rating: 4.7,
                reviews: 198
            },
            { 
                name: 'Cotton Handloom Saree', 
                category: 'saree', 
                price: 89, 
                color: '#32CD32', 
                pattern: 'handwoven',
                image: 'https://www.mohifashion.com/cdn/shop/files/0Q8A3498.webp?v=1725222544',
                rating: 4.3,
                reviews: 156
            },
            { 
                name: 'Georgette Party Saree', 
                category: 'saree', 
                price: 199, 
                color: '#4169E1', 
                pattern: 'beaded',
                image: 'https://assets2.andaazfashion.com/media/catalog/product/b/l/black-georgette-sequins-embroidered-cocktail-party-wear-saree-sarv176245-1.jpg',
                rating: 4.6,
                reviews: 223
            },
            
            // Western Collection
            { 
                name: 't-shirts', 
                category: 'western', 
                price: 169, 
                color: '#708090', 
                pattern: 'solid',
                image: 'https://i.etsystatic.com/55336092/r/il/805034/6816673407/il_fullxfull.6816673407_tjj8.jpg',
                rating: 4.4,
                reviews: 134
            },
            { 
                name: 'jackets', 
                category: 'western', 
                price: 189, 
                color: '#000000', 
                pattern: 'leather',
                image: 'https://assets.ajio.com/medias/sys_master/root/20250107/GKzt/677c3381663dbe1c5fc0f2b1/-473Wx593H-701023917-black-MODEL.jpg',
                rating: 4.5,
                reviews: 167
            },
            { 
                name: 'Baggy Shirts', 
                category: 'western', 
                price: 99, 
                color: '#4682B4', 
                pattern: 'denim',
                image: 'https://m.media-amazon.com/images/I/61njc+UXrQL._UY1100_.jpg',
                rating: 4.2,
                reviews: 98
            },
            { 
                name: 'Hoodies', 
                category: 'western', 
                price: 79, 
                color: '#B22222', 
                pattern: 'plaid',
                image: 'https://m.media-amazon.com/images/I/81e8zWBHOyL._UY1100_.jpg',
                rating: 4.1,
                reviews: 87
            }
        ];

        this.dresses = dressData.map((dress, index) => ({
            id: index + 1,
            ...dress,
            isNew: Math.random() > 0.7, // 30% chance of being new
            isFavorite: false
        }));

        this.filteredDresses = [...this.dresses];
    }

    renderCatalog() {
        const catalogGrid = document.getElementById('catalogGrid');
        if (!catalogGrid) return;

        catalogGrid.innerHTML = '';

        const startIndex = 0;
        const endIndex = this.currentPage * this.itemsPerPage;
        const itemsToShow = this.filteredDresses.slice(startIndex, endIndex);

        itemsToShow.forEach(dress => {
            const dressElement = this.createDressElement(dress);
            catalogGrid.appendChild(dressElement);
        });

        this.updateLoadMoreButton();
        this.animateCards();
    }

    createDressElement(dress) {
        const dressDiv = document.createElement('div');
        dressDiv.className = 'catalog-item';
        dressDiv.dataset.id = dress.id;
        dressDiv.dataset.category = dress.category;

        const newBadge = dress.isNew ? '<span class="new-badge">NEW</span>' : '';
        const heartIcon = dress.isFavorite ? '❤️' : '🤍';

        dressDiv.innerHTML = `
            <div class="catalog-item-image">
                <img src="${dress.image}" alt="${dress.name}" loading="lazy">
                ${newBadge}
                <div class="catalog-item-overlay">
                    <button class="try-on-btn" onclick="window.location.href='upload.html'">
                        Try On Now
                    </button>
                </div>
            </div>
            <div class="catalog-item-info">
                <div class="dress-header">
                    <h3>${dress.name}</h3>
                    <button class="favorite-btn" data-id="${dress.id}">${heartIcon}</button>
                </div>
                <div class="dress-details">
                    <span class="price">$${dress.price}</span>
                    <span class="rating">⭐ ${dress.rating} (${dress.reviews})</span>
                </div>
                <p class="dress-category">${this.formatCategory(dress.category)}</p>
                <p class="dress-pattern">${this.formatPattern(dress.pattern)}</p>
            </div>
        `;

        // Add event listeners
        const favoriteBtn = dressDiv.querySelector('.favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(dress.id);
            });
        }

        dressDiv.addEventListener('click', () => this.showDressDetails(dress));

        return dressDiv;
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

    formatPattern(pattern) {
        const patternNames = {
            solid: 'Solid Color',
            floral: 'Floral Pattern',
            striped: 'Striped Design',
            lace: 'Lace Detail',
            sequin: 'Sequin Embellished',
            embroidered: 'Embroidered',
            traditional: 'Traditional Design',
            handwoven: 'Handwoven',
            beaded: 'Beaded Work',
            metallic: 'Metallic Finish',
            ruffled: 'Ruffle Detail',
            leather: 'Leather Material',
            denim: 'Denim Fabric',
            plaid: 'Plaid Pattern',
            paisley: 'Paisley Print'
        };
        return patternNames[pattern] || pattern;
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filteredDresses = this.dresses.filter(dress => 
                this.currentFilter === 'all' || dress.category === this.currentFilter
            );
        } else {
            this.filteredDresses = this.dresses.filter(dress => {
                const matchesSearch = dress.name.toLowerCase().includes(searchTerm) ||
                                    dress.category.toLowerCase().includes(searchTerm) ||
                                    dress.pattern.toLowerCase().includes(searchTerm);
                const matchesFilter = this.currentFilter === 'all' || dress.category === this.currentFilter;
                return matchesSearch && matchesFilter;
            });
        }

        this.currentPage = 1;
        this.renderCatalog();
    }

    handleFilter(filter) {
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.currentFilter = filter;
        
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        if (filter === 'all') {
            this.filteredDresses = searchTerm ? 
                this.dresses.filter(dress => dress.name.toLowerCase().includes(searchTerm)) :
                [...this.dresses];
        } else {
            this.filteredDresses = this.dresses.filter(dress => {
                const matchesFilter = dress.category === filter;
                const matchesSearch = searchTerm ? dress.name.toLowerCase().includes(searchTerm) : true;
                return matchesFilter && matchesSearch;
            });
        }

        this.currentPage = 1;
        this.renderCatalog();
    }

    loadMoreItems() {
        this.currentPage++;
        this.renderCatalog();
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;

        const totalItems = this.filteredDresses.length;
        const shownItems = this.currentPage * this.itemsPerPage;

        if (shownItems >= totalItems) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.textContent = `Load More (${totalItems - shownItems} remaining)`;
        }
    }

    animateCards() {
        const cards = document.querySelectorAll('.catalog-item');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    toggleFavorite(dressId) {
        const dress = this.dresses.find(d => d.id === dressId);
        if (dress) {
            dress.isFavorite = !dress.isFavorite;
            
            // Update UI
            const favoriteBtn = document.querySelector(`[data-id="${dressId}"]`);
            if (favoriteBtn) {
                favoriteBtn.textContent = dress.isFavorite ? '❤️' : '🤍';
            }

            // Save to localStorage
            this.saveFavorites();
            
            // Show toast
            const message = dress.isFavorite ? 'Added to favorites!' : 'Removed from favorites';
            this.showToast(message);
        }
    }

    saveFavorites() {
        const favorites = this.dresses.filter(dress => dress.isFavorite);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        favorites.forEach(fav => {
            const dress = this.dresses.find(d => d.id === fav.id);
            if (dress) {
                dress.isFavorite = true;
            }
        });
    }

    showDressDetails(dress) {
        // Create modal for dress details
        const modal = document.createElement('div');
        modal.className = 'dress-modal';
        modal.innerHTML = `
            <div class="dress-modal-content">
                <span class="close-modal">&times;</span>
                <div class="dress-modal-body">
                    <div class="dress-modal-image">
                        <img src="${dress.image}" alt="${dress.name}">
                    </div>
                    <div class="dress-modal-info">
                        <h2>${dress.name}</h2>
                        <div class="dress-rating">⭐ ${dress.rating} (${dress.reviews} reviews)</div>
                        <div class="dress-price">$${dress.price}</div>
                        <p class="dress-description">
                            Beautiful ${dress.category} dress with ${dress.pattern} pattern. 
                            Perfect for any ${dress.category === 'formal' ? 'special occasion' : 'casual outing'}.
                        </p>
                        <div class="dress-specs">
                            <div class="spec-item">
                                <strong>Category:</strong> ${this.formatCategory(dress.category)}
                            </div>
                            <div class="spec-item">
                                <strong>Pattern:</strong> ${this.formatPattern(dress.pattern)}
                            </div>
                            <div class="spec-item">
                                <strong>Color:</strong> ${dress.color}
                            </div>
                        </div>
                        <div class="dress-modal-actions">
                            <button class="try-on-modal-btn" onclick="window.location.href='upload.html'">
                                Try On Virtual
                            </button>
                            <button class="favorite-modal-btn ${dress.isFavorite ? 'favorited' : ''}" 
                                    onclick="catalog.toggleFavorite(${dress.id}); this.classList.toggle('favorited')">
                                ${dress.isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
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
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    handleKeyNavigation(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            const modal = document.querySelector('.dress-modal');
            if (modal) {
                modal.remove();
            }
        }
        
        // Enter key on focused dress card opens details
        if (e.key === 'Enter' && e.target.classList.contains('catalog-item')) {
            const dressId = parseInt(e.target.dataset.id);
            const dress = this.dresses.find(d => d.id === dressId);
            if (dress) {
                this.showDressDetails(dress);
            }
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: var(--shadow);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Global catalog instance
let catalog;

// Initialize catalog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    catalog = new FashionCatalog();
    catalog.loadFavorites();
});

// Add modal styles
const modalCSS = `
.dress-modal {
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

.dress-modal-content {
    background: white;
    border-radius: var(--border-radius);
    max-width: 800px;
    width: 90%;
    max-height: 90%;
    overflow-y: auto;
    position: relative;
}

.close-modal {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 2rem;
    cursor: pointer;
    z-index: 1;
    color: #666;
    background: white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
}

.dress-modal-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem;
}

.dress-modal-image {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-light);
    border-radius: var(--border-radius);
    padding: 2rem;
}

.dress-modal-image img {
    max-width: 100%;
    max-height: 400px;
    object-fit: cover;
    border-radius: var(--border-radius);
}

.dress-modal-info h2 {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.dress-rating {
    font-size: 1.1rem;
    margin-bottom: 1rem;
}

.dress-price {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--accent-color);
    margin-bottom: 1rem;
}

.dress-description {
    color: var(--text-light);
    line-height: 1.8;
    margin-bottom: 2rem;
}

.dress-specs {
    margin-bottom: 2rem;
}

.spec-item {
    margin-bottom: 0.5rem;
    color: var(--text-light);
}

.dress-modal-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.try-on-modal-btn,
.favorite-modal-btn {
    padding: 1rem 2rem;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    border: none;
}

.try-on-modal-btn {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    color: white;
}

.favorite-modal-btn {
    background: transparent;
    border: 2px solid var(--accent-color);
    color: var(--accent-color);
}

.favorite-modal-btn.favorited {
    background: var(--accent-color);
    color: white;
}

.new-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: #FF4757;
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 1;
}

.dress-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.favorite-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    transition: var(--transition);
}

.favorite-btn:hover {
    transform: scale(1.2);
}

.dress-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.price {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--accent-color);
}

.rating {
    font-size: 0.9rem;
    color: var(--text-light);
}

.dress-pattern {
    font-size: 0.9rem;
    color: var(--text-light);
    font-style: italic;
}

.catalog-item-image {
    position: relative;
    overflow: hidden;
    height: 300px;
}

.catalog-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.catalog-item:hover .catalog-item-image img {
    transform: scale(1.05);
}

@media (max-width: 768px) {
    .dress-modal-body {
        grid-template-columns: 1fr;
        padding: 1rem;
    }
    
    .dress-modal-content {
        width: 95%;
        max-height: 95%;
    }
}
`;

const style = document.createElement('style');
style.textContent = modalCSS;
document.head.appendChild(style);