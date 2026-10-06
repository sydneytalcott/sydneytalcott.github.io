// Vanilla JS for Interactivity
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuLinks = mobileMenu?.querySelectorAll('a');

  // Mobile Menu Toggle
  const toggleMenu = (show) => {
    if (mobileMenu) {
      if (show) {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  };

  menuToggle?.addEventListener('click', () => toggleMenu(true));
  menuClose?.addEventListener('click', () => toggleMenu(false));
  mobileMenuLinks?.forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Scroll Reveal Observer
  const revealCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  };

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver(revealCallback, observerOptions);

  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  revealElements.forEach(el => revealObserver.observe(el));
});

// Interaction Logic Ready
