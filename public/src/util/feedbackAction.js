class feedbackAction {
    constructor(containerId) {
        this.container = document.querySelector(containerId);
        this.init();
        this.isAnimating = false;
    }
    
    init() {
        const html = `
            <div class="cb-wrap">
                <div class="cb-circle cb-ripple"></div>
                <div class="cb-circle cb-glow"></div>
                <div class="cb-circle cb-bg"></div>
                <svg class="cb-icon" viewBox="0 0 50 50">
                    <path d="M10 25 L20 35 L40 15"/>
                </svg>
                <svg class="cb-icon" viewBox="0 0 50 50" style="display: none;">
                    <path d="M15 15 L35 35 M35 15 L15 35"/>
                </svg>
                <div class="cb-dots"></div>
            </div>
            <div class="cb-text"></div>
            <div class="cb-subtext"></div>
        `;
        
        this.container.style.display = 'none';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
        this.container.innerHTML = html;
        
        // Cache elements
        this.wrap = this.container.querySelector('.cb-wrap');
        this.icons = this.container.querySelectorAll('.cb-icon');
        this.text = this.container.querySelector('.cb-text');
        this.subtext = this.container.querySelector('.cb-subtext');
        this.dots = this.container.querySelector('.cb-dots');
    }
    
    createDots(type) {
        this.dots.innerHTML = '';
        const color = type === 'success' ? '#820ad1' : '#e63946';
        
        for (let i = 0; i < 12; i++) {
            const dot = document.createElement('div');
            dot.className = 'cb-dot';
            dot.style.background = color;
            this.dots.appendChild(dot);
            
            const angle = (i / 12) * Math.PI * 2;
            const x = Math.cos(angle) * 50;
            const y = Math.sin(angle) * 50;
            
            gsap.set(dot, { 
                x: '50%', 
                y: '50%',
                rotation: type === 'error' ? angle * (180/Math.PI) : 0
            });
            
            gsap.to(dot, {
                duration: type === 'error' ? 0.6 : 0.8,
                x: `calc(50% + ${x}px)`,
                y: `calc(50% + ${y}px)`,
                opacity: 1,
                scale: 0,
                ease: "power2.out",
                delay: 0.6
            });
        }
    }
    clear() {
        gsap.set(this.container.querySelectorAll('.cb-bg, .cb-glow, .cb-ripple, .cb-dot'), {
            clearProps: "all"
        });
        gsap.set(this.container.querySelectorAll('.cb-icon path'), {
            strokeDashoffset: 100
        });
        gsap.set([this.text, this.subtext], {
            opacity: 0,
            y: 20
        });
        
        this.wrap.classList.remove('cb-shake');
        this.container.style.display = 'none';
        this.isAnimating = false;
    }
    show(type = 'success', message = '', submessage = 'Verifique os dados e tente novamente', callback = null) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        // Show and configure
        this.container.style.display = 'flex';
        this.icons[0].style.display = type === 'success' ? 'block' : 'none';
        this.icons[1].style.display = type === 'error' ? 'block' : 'none';
        this.text.textContent = message;
        this.subtext.textContent = submessage;
        
        const icon = type === 'success' ? this.icons[0] : this.icons[1];
        icon.querySelector('path').style.stroke = type === 'success' ? '#820ad1' : '#e63946';

        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(() => {
                    if (callback) callback(type);
                }, 2000);
            }
        });

        // Animations
        tl.to(this.container.querySelector('.cb-ripple'), {
            scale: 1.5,
            opacity: 1,
            duration: 0.4,
            ease: "power1.out"
        })
        .to(this.container.querySelector('.cb-ripple'), {
            scale: 2,
            opacity: 0,
            duration: 0.4,
            ease: "power1.in"
        }, "-=0.2");

        if (type === 'success') {
            tl.to(this.container.querySelector('.cb-bg'), {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: "back.out(1.7)"
            }, "-=0.3")
            .to(this.container.querySelector('.cb-glow'), {
                opacity: 0.5,
                duration: 0.5,
                ease: "power2.out"
            }, "-=0.5")
            .to(this.container.querySelector('.cb-glow'), {
                opacity: 0,
                duration: 0.5,
                ease: "power2.in"
            }, "-=0.2")
            .to(icon.querySelector('path'), {
                strokeDashoffset: 0,
                duration: 0.6,
                ease: "power2.out",
                onComplete: () => this.createDots('success')
            }, "-=0.3")
            .to(this.text, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "back.out(1.2)"
            }, "-=0.2")
            .to(this.container.querySelector('.cb-bg'), {
                scale: 1.05,
                duration: 0.3,
                ease: "power1.inOut",
                yoyo: true,
                repeat: 1
            }, "-=0.2");
        } else {
            tl.to(this.container.querySelector('.cb-bg'), {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                ease: "back.out(1.7)",
                onComplete: () => {
                    this.wrap.classList.add('cb-shake');
                }
            }, "-=0.2")
            .to(icon.querySelector('path'), {
                strokeDashoffset: 0,
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => this.createDots('error')
            }, "-=0.2")
            .to(this.text, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "back.out(1.2)"
            }, "-=0.2")
            .to(this.subtext, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "back.out(1.2)"
            }, "-=0.3");
        }
    }
}

// uso:

// const feedbackAnimation = new feedbackAction('#containner-test');

// // Show success animation
// feedbackAnimation.show('success', 'Sucesso!', null, () => {
//     console.log('Animação de sucesso completada');
// });

// // Show error animation
// feedbackAnimation.show('error', 'Erro na operação', 'Verifique os dados e tente novamente');