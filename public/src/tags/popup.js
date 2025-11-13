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
    width: 100vw;
    height: 100vh;
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
    border-radius: var(--border-radius-mid);
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 15px var(--opacity-color-purple);
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
    /* Default size constraints */
    width: auto;
    max-width: 90vw;
    min-width: 300px;
    height: auto;
    max-height: 90vh;
    min-height: 200px;
    /* Ensure that overflow works properly */
    overflow: hidden;
}
              
.popup-container.open {
    opacity: 1;
    transform: translateY(0);
}
              
.popup-header {
    padding: 25px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0; /* Prevent header from shrinking */
}
              
.popup-title {
    margin: 0 0 0 1em;
    margin-right: 10px;
    font-size: 1.8rem;
    font-weight: 700;
    background: linear-gradient(90deg, var(--color-text-primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
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
    flex-shrink: 0; /* Prevent button from shrinking */
}
              
.popup-close:hover {
    opacity: 0.8;
    transition: 0.5s ease;
    background: var(--primary-color-opacity);
}

.linha {
    flex-shrink: 0; 
}
              
.popup-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
}
              
              
`);

class CustomPopup extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [popupStyles];
        this.popupTitle = 'Popup';
        this.isClosable = true;
        this.isOpen = false;
        this.popupWidth = 'auto';
        this.popupHeight = 'auto';
        this.maxPopupWidth = 'auto';
        this.maxPopupHeight = 'auto';
        this.minPopupWidth = 'auto';
        this.minPopupHeight = 'auto';
        this.render();
    }

    // Observando os atributos para refletir mudanças
    static get observedAttributes() {
        return ['title', 'closable', 'open', 'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height'];
    }

    // Quando os atributos mudam, atualizamos os valores
    attributeChangedCallback(name, oldValue, newValue) {       
        if (oldValue === newValue) return; // Prevent infinite loops
        
        switch (name) {
            case 'closable':
                this.isClosable = newValue !== 'false';
                this.updateClosableState();
                if (newValue === 'false') {
                    this.shadowRoot.querySelector('.popup-header-space').style.display = 'none'
                    this.shadowRoot.querySelector('.popup-header').style.justifyContent = "center"
                }
                break;
            case 'open':
                this.isOpen = newValue === 'true';
                this.updateOpenState();
                break;
            case 'title':
                this.popupTitle = newValue;
                const titleElement = this.shadowRoot.querySelector('.popup-title');
                if (titleElement) titleElement.textContent = this.popupTitle;
                break;
            case 'width':
                this.updateStyle('width', newValue);
                break;
            case "height":
                this.updateStyle('height', newValue);
                break;
            case "max-width":
                this.updateStyle('maxWidth', newValue);
                break;
            case "max-height":
                this.updateStyle('maxHeight', newValue);
                break;
            case "min-width":
                this.updateStyle('minWidth', newValue);
                break;
            case "min-height":
                this.updateStyle('minHeight', newValue);
                break;
        }
    }

    // Helper method to update styles with proper validation
    updateStyle(property, value) {
        if (!value) return;
        
        const container = this.shadowRoot.querySelector('.popup-container');
        if (container) {
            // Ensure value has proper CSS units
            if (!isNaN(value) && !value.toString().match(/[a-z%]/i)) {
                value = `${value}px`;
            }
            container.style[property] = value;
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
            
            // Apply any size attributes that were set before opening
            this.applyAllSizeAttributes();
        } else {
            popupOverlay.classList.remove('open');
            popupContainer.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Apply all size-related attributes
    applyAllSizeAttributes() {
        const sizeAttributes = ['width', 'height', 'max-width', 'max-height', 'min-width', 'min-height'];
        sizeAttributes.forEach(attr => {
            const value = this.getAttribute(attr);
            if (value) {
                const camelCase = attr.replace(/-([a-z])/g, g => g[1].toUpperCase());
                this.updateStyle(camelCase, value);
            }
        });
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
        this.shadowRoot.querySelector
    }

    // Método para fechar o popup
    close() {
        if (this.isClosable) {
            this.setAttribute('open', 'false');
        }
    }

    PopupIsOpen() {
        return this.isOpen;
    }

    // Renderiza a estrutura do popup
    render() {
        this.shadowRoot.innerHTML = `
            <div class="popup-overlay">
              <div class="popup-container">
                <div class="popup-header">
                  <div class="popup-header-space" style="width:32px;"></div>
                  <h2 class="popup-title">${this.popupTitle}</h2>
                  <button class="popup-close" aria-label="Fechar popup">✕</button>
                </div>
                <div class="linha"></div>
                <div class="popup-content">
                    <slot></slot>
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
            const titleElement = this.shadowRoot.querySelector('.popup-title');
            if (titleElement) titleElement.textContent = this.popupTitle;
        }

        if (this.hasAttribute('closable')) {
            this.isClosable = this.getAttribute('closable') !== 'false';
            this.updateClosableState();
        }

        // Apply all size attributes when component is connected
        this.applyAllSizeAttributes();

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