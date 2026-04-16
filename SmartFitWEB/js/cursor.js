// cursor.js - Custom cursor with dot and follower (site-wide, self-initializing)

document.addEventListener('DOMContentLoaded', () => {
    // Inject minimal CSS once for all pages (prevents stuck cursor when page lacks CSS)
    const STYLE_ID = 'custom-cursor-styles';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            body { cursor: none; }
            /* Hide any legacy cursor element to avoid duplicates */
            .cursor { display: none !important; }
            .cursor-dot, .cursor-follower {
                position: fixed;
                top: 0; left: 0;
                transform: translate(-50%, -50%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                will-change: left, top, transform;
            }
            .cursor-dot {
                width: 8px; height: 8px; background: #FDBDBD;
                box-shadow: 0 0 6px rgba(253,219,219,0.8);
            }
            .cursor-follower {
                width: 36px; height: 36px;
                background: rgba(253,219,219,0.06);
                border: 1.5px solid rgba(253,219,219,0.35);
                box-shadow: 0 0 12px rgba(253,219,219,0.25);
                backdrop-filter: blur(2px);
                transition: transform 0.15s ease-out, background-color 0.15s ease-out, border-color 0.15s ease-out, box-shadow 0.15s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    // Ensure the cursor elements exist (create if missing)
    let cursorDot = document.querySelector('.cursor-dot');
    let cursorFollower = document.querySelector('.cursor-follower');

    if (!cursorDot) {
        cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        document.body.appendChild(cursorDot);
    }
    if (!cursorFollower) {
        cursorFollower = document.createElement('div');
        cursorFollower.className = 'cursor-follower';
        document.body.appendChild(cursorFollower);
    }

    let dotX = 0, dotY = 0;
    let followerX = 0, followerY = 0;

    // Track mouse
    window.addEventListener('mousemove', (e) => {
        dotX = e.clientX;
        dotY = e.clientY;
    }, { passive: true });

    // RAF loop
    const tick = () => {
        cursorDot.style.left = `${dotX}px`;
        cursorDot.style.top = `${dotY}px`;

        followerX += (dotX - followerX) * 0.18;
        followerY += (dotY - followerY) * 0.18;
        cursorFollower.style.left = `${followerX}px`;
        cursorFollower.style.top = `${followerY}px`;

        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Hover effects for common interactive elements
    const interactiveSelectors = 'a, button, input, select, textarea, .cta-button, .action-btn, .primary-btn, .secondary-btn, .social-btn, .catalog-item, .feature-card';
    const bindHover = (root) => {
        root.querySelectorAll(interactiveSelectors).forEach((el) => {
        el.addEventListener('mouseenter', () => {
                cursorFollower.style.transform = 'translate(-50%, -50%) scale(1.6)';
                cursorFollower.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                cursorFollower.style.borderColor = 'rgba(255,255,255,0.6)';
                cursorFollower.style.boxShadow = '0 0 18px rgba(255,255,255,0.35)';
        });
        el.addEventListener('mouseleave', () => {
                cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorFollower.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                cursorFollower.style.borderColor = 'rgba(255,255,255,0.35)';
                cursorFollower.style.boxShadow = '0 0 12px rgba(255,255,255,0.25)';
            });
        });
    };
    bindHover(document);

    // In case of dynamically added elements, observe DOM changes and bind hover handlers lazily
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach((node) => {
                if (node.nodeType === 1) bindHover(node);
            });
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Make images clickable to open their link (data-link or src), excluding hero and signin page
    const isSigninPage = /(^|\/)signin\.html$/i.test(window.location.pathname);
    const isInHero = (el) => {
        try { return !!el.closest('.welcome-hero'); } catch { return false; }
    };
    const alreadyLinked = (el) => {
        try { return !!el.closest('a'); } catch { return false; }
    };
    const bindImages = (root) => {
        if (isSigninPage) return;
        const images = root.querySelectorAll ? root.querySelectorAll('img') : [];
        images.forEach((img) => {
            if (isInHero(img) || alreadyLinked(img)) return;
            if (img.dataset.__clickBound) return;
            img.dataset.__clickBound = '1';
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => {
                const target = img.getAttribute('data-link') || img.src;
                if (target) window.open(target, '_blank');
        });
    });
    };
    bindImages(document);
    // Reuse existing observer to bind on dynamic content
    const imageObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach((node) => {
                if (node.nodeType === 1) bindImages(node);
            });
        }
    });
    imageObserver.observe(document.documentElement, { childList: true, subtree: true });
});


