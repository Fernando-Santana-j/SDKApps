const popupStyles = new CSSStyleSheet();
popupStyles.replaceSync(`
.linha {
    width: 100%;
    border-radius: 100%;
    border-bottom: 1px solid var(--secundary-color-purple);
}
              .popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
              }
              
              .popup-overlay.open {
                opacity: 1;
                visibility: visible;
              }
              
              .popup-container {
                position: relative;
                background: var(--tertiary-color);
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 5px 15px var(--opacity-color-purple);
                transform: translateY(20px);
                opacity: 0;
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
              }
              
              .popup-container.open {
                opacity: 1;
                transform: translateY(0);
              }
              
              .popup-header {
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              
              .popup-title {
                margin: 0;
                font-size: 1.2rem;
                color: var(--color-text-primary);
                font-weight: 600;
              }
              
              .popup-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--color-text-primary);
                transition: 0.5s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 5px 10px 6px 10px;
                border-radius: 4px;
              }
              
              .popup-close:hover {
                opacity: 0.8;
                transition: 0.5s ease;
                background: var(--primary-color-opacity);
              }
              
              .popup-content {
                flex: 1;
                overflow-y: auto;
                max-height: calc(90vh - 120px);
              }
              
              .popup-content-body {
                padding: 20px;
              }
              
              /* Barra de rolagem personalizada */
              .popup-content::-webkit-scrollbar {
                width: 6px;
              }
              
              .popup-content::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              
              .popup-content::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 10px;
              }
              
              .popup-content::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
              }
    `);

class CustomPopup extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [popupStyles];
        // Definindo as propriedades iniciais
        this.popupTitle = 'Popup';
        this.isClosable = true;
        this.isOpen = false;

        // Criando a estrutura base do popup
        this.render();
    }

    // Observando os atributos para refletir mudanças
    static get observedAttributes() {
        return ['title', 'closable', 'open'];
    }

    // Quando os atributos mudam, atualizamos os valores
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title') {
            this.popupTitle = newValue;
            const titleElement = this.shadowRoot.querySelector('.popup-header h2');
            if (titleElement) titleElement.textContent = this.popupTitle;
        }

        if (name === 'closable') {
            this.isClosable = newValue !== 'false';
            this.updateClosableState();
        }

        if (name === 'open') {
            this.isOpen = newValue === 'true';
            this.updateOpenState();
        }
    }

    // Atualiza o estado de abertura do popup
    updateOpenState() {
        const popupOverlay = this.shadowRoot.querySelector('.popup-overlay');
        const popupContainer = this.shadowRoot.querySelector('.popup-container');

        if (this.isOpen) {
            popupOverlay.classList.add('open');
            popupContainer.classList.add('open');
            document.body.style.overflow = 'hidden';
        } else {
            popupOverlay.classList.remove('open');
            popupContainer.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Atualiza o estado dos elementos de fechamento
    updateClosableState() {
        const closeButton = this.shadowRoot.querySelector('.popup-close');
        const overlay = this.shadowRoot.querySelector('.popup-overlay');

        if (this.isClosable) {
            closeButton.style.display = 'block';
            // Remover evento antigo para evitar duplicação
            overlay.removeEventListener('click', this._overlayClickHandler);
            // Adicionar novo handler
            this._overlayClickHandler = this.handleOverlayClick.bind(this);
            overlay.addEventListener('click', this._overlayClickHandler);
        } else {
            closeButton.style.display = 'none';
            // Remover evento se não for fechável
            overlay.removeEventListener('click', this._overlayClickHandler);
        }
    }

    // Método para lidar com cliques no overlay
    handleOverlayClick(event) {
        // Fechar apenas se o clique for diretamente no overlay e não em seus filhos
        if (event.target === event.currentTarget && this.isClosable) {
            this.close();
        }
    }

    // Método para abrir o popup
    open() {
        this.setAttribute('open', 'true');
    }

    // Método para fechar o popup
    close() {
        if (this.isClosable) {
            this.setAttribute('open', 'false');
        }
    }

    // Renderiza a estrutura do popup
    render() {
        this.shadowRoot.innerHTML = `
            <div class="popup-overlay">
              <div class="popup-container">
                <div class="popup-header">
                  <h2 class="popup-title">${this.popupTitle}</h2>
                  <button class="popup-close" aria-label="Fechar popup">✕</button>
                </div>
                <div class="linha"></div>
                <div class="popup-content">
                  <div class="popup-content-body">
                    <slot></slot>
                  </div>
                </div>
              </div>
            </div>
          `;

        const closeButton = this.shadowRoot.querySelector('.popup-close');
        closeButton.addEventListener('click', () => this.close());

        this.updateClosableState();

        this._keydownHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen && this.isClosable) {
                this.close();
            }
        };

        window.addEventListener('keydown', this._keydownHandler);
    }

    connectedCallback() {
        if (this.hasAttribute('title')) {
            this.popupTitle = this.getAttribute('title');
            const titleElement = this.shadowRoot.querySelector('.popup-header h2');
            if (titleElement) titleElement.textContent = this.popupTitle;
        }

        if (this.hasAttribute('closable')) {
            this.isClosable = this.getAttribute('closable') !== 'false';
            this.updateClosableState();
        }

        if (this.hasAttribute('open')) {
            this.isOpen = this.getAttribute('open') === 'true';
            this.updateOpenState();
        }
    }

    disconnectedCallback() {
        window.removeEventListener('keydown', this._keydownHandler);
        const overlay = this.shadowRoot.querySelector('.popup-overlay');
        if (overlay && this._overlayClickHandler) {
            overlay.removeEventListener('click', this._overlayClickHandler);
        }
    }
}

customElements.define('custom-popup', CustomPopup);