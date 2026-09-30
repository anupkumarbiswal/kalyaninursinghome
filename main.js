/* ============================================================
   Kalyani Nursing Home — main.js
   Handles: mobile nav toggle, scroll fade-in animations,
   contact form submission, date input min (today)
   ============================================================ */

'use strict';

// ── Mobile Navigation ─────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Close nav when a link is clicked (mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Scroll Fade-In Animation ──────────────────────────────────
const fadeEls = document.querySelectorAll('.fade-in');

if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  fadeEls.forEach((el, i) => {
    // Stagger delay for cards in the same row
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
    observer.observe(el);
  });
} else {
  // Fallback: show all immediately
  fadeEls.forEach(el => el.classList.add('visible'));
}

// ── Sticky Header Shadow on Scroll ───────────────────────────
const header = document.querySelector('.header');
if (header) {
  const updateHeaderShadow = () => {
    if (window.scrollY > 10) {
      header.style.boxShadow = '0 2px 16px rgba(0,0,0,.12)';
    } else {
      header.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)';
    }
  };
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });
  updateHeaderShadow();
}

// ── Contact Form ──────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
const successMsg  = document.getElementById('successMsg');

/** Save appointment to localStorage so admin panel picks it up */
function saveToAdminPanel(data) {
  const STORAGE_KEY = 'knh_appointments';
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const appt = {
      id:        uid(),
      firstName: data.firstName || '',
      lastName:  data.lastName  || '',
      phone:     data.phone     || '',
      email:     data.email     || '',
      dept:      data.department || 'other',
      date:      data.preferredDate || '',
      message:   data.message  || '',
      status:    'pending',
      booked:    new Date().toISOString(),
    };
    existing.unshift(appt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Could not save appointment:', err);
  }
}

if (contactForm) {
  // Set minimum date to today for the date picker
  const dateInput = contactForm.querySelector('#preferredDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic client-side validation
    const required = contactForm.querySelectorAll('[required]');
    let valid = true;

    required.forEach((field) => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#e8734a';
        field.focus();
      }
    });

    if (!valid) return;

    // Collect form data before reset
    const formData = Object.fromEntries(new FormData(contactForm).entries());

    const submitBtn = contactForm.querySelector('[type="submit"]');
    submitBtn.disabled    = true;
    submitBtn.textContent = '⏳ Sending…';

    setTimeout(() => {
      // Save to localStorage → visible in admin panel
      saveToAdminPanel(formData);

      contactForm.reset();
      submitBtn.disabled    = false;
      submitBtn.textContent = '📅 Request Appointment';

      if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Hide success message after 8 seconds
        setTimeout(() => {
          successMsg.style.display = 'none';
        }, 8000);
      }
    }, 1200);
  });

  // Live validation: restore border on input
  contactForm.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => {
      field.style.borderColor = '';
    });
  });
}

// ── Smooth scroll for anchor links ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── Current year in footer ────────────────────────────────────
// (If you add a <span id="year"> in footer, this auto-updates it)
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
