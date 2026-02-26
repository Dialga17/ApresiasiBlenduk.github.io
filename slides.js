// slides.js — PPT Slide Controller (Touch + Keyboard + Dots)
class SlideController {
    constructor() {
        this.current   = 0;
        this.total     = 4;
        this.track     = document.getElementById('pptTrack');
        this.dots      = document.querySelectorAll('.pdot');
        this.counter   = document.getElementById('pptCounter');
        this.touchStartX = 0;
        this.touchEndX   = 0;
        this.init();
    }

    init() {
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prev());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.next());

        // Dot navigation
        this.dots.forEach(dot => {
            dot.addEventListener('click', () => {
                this.goTo(parseInt(dot.getAttribute('data-idx')));
            });
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            const homeActive = document.getElementById('home')?.classList.contains('active');
            if (!homeActive) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
            if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   this.prev();
        });

        // Touch swipe on track
        this.track?.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        this.track?.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            const diff = this.touchStartX - this.touchEndX;
            if (Math.abs(diff) > 40) diff > 0 ? this.next() : this.prev();
        }, { passive: true });

        this.render();
    }

    goTo(idx) {
        if (idx < 0 || idx >= this.total) return;
        this.current = idx;
        this.render();
    }

    next() { this.goTo((this.current + 1) % this.total); }
    prev() { this.goTo((this.current - 1 + this.total) % this.total); }

    render() {
        // Slide transform — each slide = 25% of track width
        if (this.track) {
            this.track.style.transform = `translateX(-${this.current * 25}%)`;
        }

        // Dots
        this.dots.forEach((d, i) => d.classList.toggle('active', i === this.current));

        // Counter
        if (this.counter) this.counter.textContent = `${this.current + 1} / ${this.total}`;
    }
}

document.addEventListener('DOMContentLoaded', () => new SlideController());
