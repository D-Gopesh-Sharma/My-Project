/**
 * nav.js — FashioLens Global Navigation Script
 * Handles: active link, hamburger menu, page fade transitions
 */
(function () {
  "use strict";

  /* ── Active Link ─────────────────────────────────────────── */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const allNavLinks = document.querySelectorAll('.luxury-nav-links a, .nav-links a');
  allNavLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPage = href.split('/').pop().split('?')[0].split('#')[0];
    // Mark active only on real page match (skip anchor-only links like #identity)
    if (linkPage && linkPage === currentPath && !href.startsWith('#')) {
      link.classList.add('nav-active');
    }
  });

  /* ── Hamburger Menu ──────────────────────────────────────── */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("luxNavLinks");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      const open = navLinks.classList.toggle("nav-open");
      hamburger.classList.toggle("ham-open", open);
      hamburger.setAttribute("aria-expanded", open);
    });

    // Close when a link is clicked
    navLinks.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        navLinks.classList.remove("nav-open");
        hamburger.classList.remove("ham-open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove("nav-open");
        hamburger.classList.remove("ham-open");
        hamburger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ── Scroll: sticky nav shadow ───────────────────────────── */
  const luxNav = document.getElementById("luxuryNav");
  if (luxNav) {
    window.addEventListener(
      "scroll",
      () => {
        luxNav.classList.toggle("lux-nav-scrolled", window.scrollY > 50);
      },
      { passive: true },
    );
  }

  /* ── Page Transition (fade out → navigate) ───────────────── */
  document.addEventListener("click", (e) => {
    const anchor = e.target.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      anchor.target === "_blank"
    )
      return;

    // Only intercept same-origin .html navigations
    try {
      const dest = new URL(href, window.location.href);
      if (dest.origin !== window.location.origin) return;
    } catch (_) {
      return;
    }

    e.preventDefault();
    document.body.classList.add("page-exit");
    setTimeout(() => {
      window.location.href = href;
    }, 320);
  });

  /* ── Page fade in ────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("page-enter");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add("page-enter-active");
      });
    });
  });
})();
