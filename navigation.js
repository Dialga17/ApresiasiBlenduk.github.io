// navigation.js — Header & Section Navigation
class NavigationController {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections  = document.querySelectorAll('.section');
        this.burger    = document.getElementById('burger');
        this.nav       = document.getElementById('nav');
        this.header    = document.getElementById('header');
        this.init();
    }

    init() {
        // Nav link clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.navigate(e, link));
        });

        // Burger toggle
        this.burger?.addEventListener('click', () => {
            this.burger.classList.toggle('open');
            this.nav.classList.toggle('open');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.nav?.contains(e.target) && !this.burger?.contains(e.target)) {
                this.burger?.classList.remove('open');
                this.nav?.classList.remove('open');
            }
        });

        // Header scroll shadow
        window.addEventListener('scroll', () => {
            this.header?.classList.toggle('scrolled', window.scrollY > 10);
        }, { passive: true });
    }

    navigate(e, link) {
        e.preventDefault();
        const target = link.getAttribute('data-section');

        // Update active link
        this.navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Show target section
        this.sections.forEach(s => s.classList.remove('active'));
        document.getElementById(target)?.classList.add('active');

        // Close mobile menu
        this.burger?.classList.remove('open');
        this.nav?.classList.remove('open');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

document.addEventListener('DOMContentLoaded', () => new NavigationController());
