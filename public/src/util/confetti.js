class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.explosions = [];
        this.isRightSide = true;

        this.colors = [
            '#FF1461', '#18FF92', '#5A87FF', '#FBF38C',
            '#FF85EA', '#FF432E', '#CBFF49', '#18FF92'
        ];

        this.shapes = ['circle', 'square', 'triangle', 'line'];

        // Estados da animação
        this.isPlaying = false;
        this.animationFrameId = null;
        this.explosionIntervalId = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start(containner) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.animate();
        this.startAlternatingExplosions(containner);
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.explosionIntervalId) {
            clearInterval(this.explosionIntervalId);
            this.explosionIntervalId = null;
        }
    }

    clear() {
        this.particles = [];
        this.explosions = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    startAlternatingExplosions(containner) {
        const createAlternatingExplosion = () => {
            if (!this.isPlaying) return;
            this.createExplosion(containner);
            this.isRightSide = !this.isRightSide;
        };

        createAlternatingExplosion();
        this.explosionIntervalId = setInterval(createAlternatingExplosion, 800);
    }

    createExplosion(containner) {
        const containerRect = document.querySelector(containner).getBoundingClientRect();
        const center = {
            x: containerRect.x + containerRect.width / 2,
            y: containerRect.y
        };

        const explosionPoints = 3;
        const startAngle = this.isRightSide ? -Math.PI / 6 : -5 * Math.PI / 6;
        const angleSpread = Math.PI / 3;

        for (let i = 0; i < explosionPoints; i++) {
            const angle = startAngle + (i / explosionPoints) * angleSpread;
            const distance = containerRect.width / 3;
            const explosionCenter = {
                x: center.x + Math.cos(angle) * distance,
                y: center.y + Math.sin(angle) * distance
            };

            const baseAngle = this.isRightSide ? Math.PI / 4 : 3 * Math.PI / 4;

            for (let j = 0; j < 25; j++) {
                const spread = (Math.random() - 0.5) * Math.PI / 2;
                const particleAngle = baseAngle + spread;
                const velocity = 1.5 + Math.random() * 3;

                this.particles.push({
                    x: explosionCenter.x,
                    y: explosionCenter.y,
                    shape: this.shapes[Math.floor(Math.random() * this.shapes.length)],
                    size: Math.random() * 8 + 4,
                    color: this.colors[Math.floor(Math.random() * this.colors.length)],
                    speedX: Math.cos(particleAngle) * velocity,
                    speedY: Math.sin(particleAngle) * velocity,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2,
                    opacity: 1,
                    gravity: 0.05 + Math.random() * 0.03,
                    decay: 0.004 + Math.random() * 0.002,
                    wobble: Math.random() * 0.1,
                    wobbleSpeed: Math.random() * 0.05
                });
            }
        }
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.fillStyle = particle.color;

        switch (particle.shape) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 'square':
                this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                break;

            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(-particle.size / 2, particle.size / 2);
                this.ctx.lineTo(particle.size / 2, particle.size / 2);
                this.ctx.lineTo(0, -particle.size / 2);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case 'line':
                this.ctx.strokeStyle = particle.color;
                this.ctx.lineWidth = particle.size / 4;
                this.ctx.beginPath();
                this.ctx.moveTo(-particle.size / 2, 0);
                this.ctx.lineTo(particle.size / 2, 0);
                this.ctx.stroke();
                break;
        }

        this.ctx.restore();
    }

    animate() {
        if (!this.isPlaying) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles = this.particles.filter(particle => {
            const wobbleX = Math.sin(particle.rotation * particle.wobbleSpeed) * particle.wobble;
            const wobbleY = Math.cos(particle.rotation * particle.wobbleSpeed) * particle.wobble;

            particle.x += particle.speedX + wobbleX;
            particle.y += particle.speedY + wobbleY;
            particle.speedY += particle.gravity;
            particle.rotation += particle.rotationSpeed;
            particle.opacity -= particle.decay;

            particle.speedX *= 0.995;
            particle.speedY *= 0.995;

            if (particle.opacity <= 0) return false;

            this.drawParticle(particle);
            return true;
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
}