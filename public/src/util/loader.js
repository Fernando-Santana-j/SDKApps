(function(global) {
    'use strict';

    class Loader {
      constructor(options = {}) {
        this.options = {
          text: options.text || 'Carregando...',
          minDisplayTime: options.minDisplayTime || 1000,
          appendToBody: options.appendToBody !== undefined ? options.appendToBody : true,
          target: typeof options.target === 'string' ? document.querySelector(options.target) : options.target,
          onShow: options.onShow || null,
          onHide: options.onHide || null,
          showProgress: options.showProgress || false,
          showStatus: options.showStatus || false
        };

        this.element = null;
        this.boxElement = null;
        this.cubes = [];
        this.lineElement = null;
        this.lineInner = null;
        this.progressBar = null;
        this.progressText = null;
        this.textElement = null;
        this.statusElement = null;
        this.isActive = false;
        this.showTime = 0;
        this.progress = 0;
        this.timeline = null;

        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
          this.init();
        }
      }

      init() {
        if (this.options.target instanceof HTMLElement) {
            this.element = document.createElement('div');
            this.element.className = 'loader-container-fit';

        }else{
            this.element = document.createElement('div');
            this.element.className = 'loader-container';
        }
        
        
        // Create loader content
        const loader = document.createElement('div');
        loader.className = 'loader';

        // Create cube animation box
        this.boxElement = document.createElement('div');
        this.boxElement.className = 'loader-box';

        // Create cubes
        for (let i = 0; i < 4; i++) {
          const cube = document.createElement('div');
          cube.className = 'loader-cube';
          this.cubes.push(cube);
          this.boxElement.appendChild(cube);
        }

        // Create line
        this.lineElement = document.createElement('div');
        this.lineElement.className = 'loader-line';

        this.lineInner = document.createElement('div');
        this.lineInner.className = 'loader-line-inner';
        this.lineElement.appendChild(this.lineInner);

        // Create text element
        this.textElement = document.createElement('div');
        this.textElement.className = 'loader-text';
        this.textElement.textContent = this.options.text;

        // Append elements
        loader.appendChild(this.boxElement);
        loader.appendChild(this.lineElement);
        loader.appendChild(this.textElement);

        // Create progress bar if needed
        if (this.options.showProgress) {
          const progressContainer = document.createElement('div');
          progressContainer.className = 'loader-progress';

          this.progressBar = document.createElement('div');
          this.progressBar.className = 'loader-progress-bar';

          const progressStripes = document.createElement('div');
          progressStripes.className = 'loader-progress-stripes';
          this.progressBar.appendChild(progressStripes);

          this.progressText = document.createElement('div');
          this.progressText.className = 'loader-progress-text';
          this.progressText.textContent = '0%';

          progressContainer.appendChild(this.progressBar);
          progressContainer.appendChild(this.progressText);
          loader.appendChild(progressContainer);
        }

        // Create status element if needed
        if (this.options.showStatus) {
          this.statusElement = document.createElement('div');
          this.statusElement.className = 'loader-status';
          this.statusElement.textContent = 'Iniciando...';
          loader.appendChild(this.statusElement);
        }

        // Append loader to container
        this.element.appendChild(loader);

        // Append to DOM
        if (this.options.target) {
          if (this.options.target instanceof HTMLElement) {
            this.options.target.appendChild(this.element);
          } else {
            console.error('Loader: Target must be a valid HTML Element');
          }
        } else if (this.options.appendToBody) {
          document.body.appendChild(this.element);
        }

        // Create animation timeline
        this.setupAnimation();
      }

      /**
       * Setup GSAP animations
       * @private
       */
      setupAnimation() {
        // Make sure GSAP is available
        if (typeof gsap === 'undefined') {
          console.error('Loader: GSAP not found. Include it before using this component.');
          return;
        }

        // Create a timeline
        this.timeline = gsap.timeline({
          paused: true,
          repeat: -1
        });

        // If progress bar is shown, setup its animation
        if (this.options.showProgress && this.progressBar) {
          gsap.set(this.progressBar, { left: '-100%' });
        }
      }

      setText(text) {
        if (this.textElement) {
          this.textElement.textContent = text;
        }
        return this;
      }
      updateProgress(percent, status) {
        this.progress = Math.min(100, Math.max(0, percent));

        if (this.progressBar && this.progressText) {
          gsap.to(this.progressBar, {
            left: `${this.progress - 100}%`,
            duration: 0.3,
            ease: "power1.out"
          });

          this.progressText.textContent = `${Math.round(this.progress)}%`;
        }

        if (status && this.statusElement) {
          this.statusElement.textContent = status;
        }

        return this;
      }

      setStatus(status) {
        if (this.statusElement) {
          this.statusElement.textContent = status;
        }
        return this;
      }

      show(text = null) {
        if (text) {
          this.setText(text);
        }

        if (!this.isActive) {
          this.isActive = true;

          // Reset progress if needed
          if (this.options.showProgress) {
            this.updateProgress(0, 'Iniciando...');
          }

          // Initial opacity
          gsap.set(this.element, { opacity: 0 });
          this.element.classList.add('active');
          this.showTime = Date.now();

          // Fade in animation
          gsap.to(this.element, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
          });

          // Start timeline
          this.timeline.restart();

          // Call onShow callback
          if (typeof this.options.onShow === 'function') {
            this.options.onShow();
          }
        }

        return this;
      }

      hide(force = false) {
        return new Promise(resolve => {
          if (!this.isActive) {
            resolve();
            return;
          }

          const currentTime = Date.now();
          const elapsed = currentTime - this.showTime;

          const hideLoader = () => {
            this.isActive = false;

            // Complete progress if needed
            if (this.options.showProgress && this.progress < 100) {
              this.updateProgress(100, 'Concluído');
            }

            gsap.to(this.boxElement, {
              scale: 0.8,
              opacity: 0.5,
              duration: 0.2,
              ease: "power3.in"
            });

            // Fade out animation
            gsap.to(this.element, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.inOut",
              delay: 0.1,
              onComplete: () => {
                this.element.classList.remove('active');
                this.timeline.pause();

                // Reset scale
                gsap.set(this.boxElement, { scale: 1, opacity: 1 });

                // Call onHide callback
                if (typeof this.options.onHide === 'function') {
                  this.options.onHide();
                }

                resolve();
              }
            });
          };

          if (force || elapsed >= this.options.minDisplayTime) {
            hideLoader();
          } else {
            // Wait for minimum display time
            setTimeout(hideLoader, this.options.minDisplayTime - elapsed);
          }
        });
      }

      destroy() {
        if (this.element && this.element.parentNode) {
          this.timeline.kill();
          this.element.parentNode.removeChild(this.element);
        }
      }
    }

    // Handle module exports
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Loader;
    }

    // Create global loader instance only after DOM is ready
    if (typeof window !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                global.Loader = Loader;
                global.globalLoader = new Loader();
            });
        } else {
            global.Loader = Loader;
            global.globalLoader = new Loader();
        }
    }

})(typeof window !== 'undefined' ? window : global);


// const loader = new Loader({
//     text: "Carregando...",
//     minDisplayTime: 1000,
//     showProgress: true,
//     showStatus: true,
//     target: "#minhaDiv", // opcional: para mostrar dentro de um elemento específico
//     onShow: () => console.log("Loader iniciado"),
//     onHide: () => console.log("Loader finalizado")
// });

// // Mostra o loader
// loader.show();

// // Atualiza o progresso (0-100) e status
// loader.updateProgress(50, "Processando...");

// // Atualiza apenas o status
// loader.setStatus("Quase lá...");

// // Atualiza apenas o texto
// loader.setText("Por favor aguarde...");

// // Esconde o loader
// loader.hide();

// // Para destruir o loader quando não for mais necessário
// loader.destroy();
