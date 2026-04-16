// index.js - Homepage JavaScript

class HomePage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        this.initCarousel();
        this.setupAnimations();
        this.showWelcomeModal();
    }

    setupEventListeners() {
        // Custom Cursor
        this.setupCustomCursor();

        // Mobile Menu Toggle
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Add hover effects to buttons
        document.querySelectorAll('button, .cta-button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                const cursor = document.querySelector('.cursor');
                if (cursor) cursor.style.transform = 'scale(1.5)';
            });
            
            button.addEventListener('mouseleave', () => {
                const cursor = document.querySelector('.cursor');
                if (cursor) cursor.style.transform = 'scale(1)';
            });
        });


        // Add click animation to feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = 'translateY(-10px)';
                }, 150);
            });
        });

        // Update CTA button to use page transition
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPage('upload.html');
            });
        }
    }

    setupCustomCursor() {
        const cursor = document.querySelector('.cursor');
        const cursorFollower = document.querySelector('.cursor-follower');

        if (cursor && cursorFollower) {
            document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
                
                setTimeout(() => {
                    cursorFollower.style.left = e.clientX + 'px';
                    cursorFollower.style.top = e.clientY + 'px';
                }, 100);
            });
        }
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

    initCarousel() {
        const carouselTrack = document.getElementById('carouselTrack');
        const carouselPrev = document.getElementById('carouselPrev');
        const carouselNext = document.getElementById('carouselNext');
        
        if (!carouselTrack || !carouselPrev || !carouselNext) return;

        let currentSlide = 0;
        const slideWidth = 320;
        const totalSlides = carouselTrack.children.length;

        const updateCarousel = () => {
            const translateX = -currentSlide * slideWidth;
            carouselTrack.style.transform = `translateX(${translateX}px)`;
        };

        carouselNext.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % (totalSlides - 2);
            updateCarousel();
        });

        carouselPrev.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + (totalSlides - 2)) % (totalSlides - 2);
            updateCarousel();
        });

        // Auto-play carousel
        setInterval(() => {
            currentSlide = (currentSlide + 1) % (totalSlides - 2);
            updateCarousel();
        }, 4000);
    }

    setupAnimations() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    }

    showWelcomeModal() {
        if (!localStorage.getItem('visited')) {
            setTimeout(() => {
                this.showModal();
                localStorage.setItem('visited', 'true');
            }, 2000);
        }
    }

    showLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    navigateToPage(url) {
        this.showLoader();
        setTimeout(() => {
            window.location.href = url;
        }, 1000);
    }
}

// Global functions for onclick handlers
function closeModal() {
    if (window.homePage) {
        window.homePage.closeModal();
    }
}

// Initialize homepage when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.homePage = new HomePage();
});
