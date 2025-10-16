class ErrorTooltip {
    constructor() {
        this.errors = new Map();
        this.animations = new Map();
        this.pendingShows = new Map();
    }

    async show(elementId, message) {
        if (this.errors.has(elementId)) {
            this.pendingShows.set(elementId, message);
            await this.hide(elementId, true);
            return this.showImmediate(elementId, message);
        }

        return this.showImmediate(elementId, message);
    }

    async showImmediate(elementId, message) {
        const target = document.getElementById(elementId);
        if (!target) return;

        const tooltip = document.createElement('div');
        tooltip.className = 'e-tip';
        tooltip.setAttribute('data-error-for', elementId);
        tooltip.innerHTML = `
            <div class="e-arrow"></div>
            <div class="e-text">${message}</div>
        `;

        document.body.appendChild(tooltip);
        const rect = target.getBoundingClientRect();
        const scrollY = window.scrollY;

        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + scrollY + 10}px`;

        const showAnim = gsap.fromTo(tooltip,
            {
                opacity: 0,
                scale: 0.8,
                y: -10
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.4,
                ease: "back.out(1.7)",
                onComplete: () => {
                    tooltip.style.pointerEvents = 'auto';
                }
            }
        );

        const hoverAnim = gsap.to(tooltip, {
            scale: 1.05,
            duration: 0.2,
            paused: true,
            ease: "power1.out"
        });

        const handleTooltipClick = () => {
            this.hide(elementId, false, true);
            target.style.border = '1px solid #ff4444';
        };

        tooltip.addEventListener('mouseenter', () => hoverAnim.play());
        tooltip.addEventListener('mouseleave', () => hoverAnim.reverse());
        tooltip.addEventListener('click', handleTooltipClick);

        this.errors.set(elementId, tooltip);
        this.animations.set(elementId, { showAnim, hoverAnim });

        const updatePosition = () => {
            const newRect = target.getBoundingClientRect();
            tooltip.style.left = `${newRect.left}px`;
            tooltip.style.top = `${newRect.bottom + window.scrollY + 10}px`;
        };

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
    }

    async hide(elementId, shouldRemoveFromList = true, keepError = false) {
        const tooltip = this.errors.get(elementId);
        if (!tooltip) return;

        tooltip.style.pointerEvents = 'none';

        const target = document.getElementById(elementId);
        if (target && !keepError) {
            target.style.border = 'none';
        }

        return new Promise((resolve) => {
            gsap.to(tooltip, {
                opacity: 0,
                scale: 0.8,
                y: -10,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    tooltip.remove();
                    if (shouldRemoveFromList) {
                        this.errors.delete(elementId);
                        this.animations.delete(elementId);
                    }
                    resolve();
                }
            });
        });
    }

    async hideAll() {
        const errorIds = Array.from(this.errors.keys());
        await Promise.all(errorIds.map(id => this.hide(id)));
    }
    
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorTooltip;
}

if (typeof window !== 'undefined') {
    window.ErrorTooltip = ErrorTooltip;
}