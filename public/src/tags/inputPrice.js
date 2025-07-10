const inputPriceStyles = new CSSStyleSheet();
inputPriceStyles.replaceSync(`
    .input-container {
                    position: relative;
                    width: 100%;
                }
                
    .input-padrao {
        font-size: 1.2em;
        padding: 0.5em;
        width: 100%;
        height: 3em;
        background-color: var(--color-text-primary, #ffffff);
        color: var(--primary-color, #333333);
        border: none;
        outline: none;
        border-radius: var(--border-radius-min, 8px);
        font-family: 'Poppins', sans-serif;
        padding-left: 2.5em;
        padding-right: 0.5em;
        box-sizing: border-box;
        transition: transform 0.3s, box-shadow 0.3s;
    }
    
    
    .currency-symbol {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--primary-color, #333333);
        opacity: 0.7;
        pointer-events: none;
        transition: all 0.3s;
    }
    
    .input-padrao.filled {
        background-color: #f8f8f8;
    }
`)
class InputPreco extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [inputPriceStyles];
        this.shadowRoot.innerHTML = `
            <div class="input-container">
                <input type="text" class="input-padrao preco-input" placeholder="0,00">
                <span class="currency-symbol">R$</span>
            </div>
        `;

        this.inputElement = this.shadowRoot.querySelector('.preco-input');
        this.containerElement = this.shadowRoot.querySelector('.input-container');

        this.inputElement.addEventListener('input', this.formatarPreco.bind(this));
        this.inputElement.addEventListener('focus', this.onFocus.bind(this));
        this.inputElement.addEventListener('blur', this.onBlur.bind(this));
        this.containerElement.addEventListener('click', this.addRippleEffect.bind(this));
    }

    // Getter e Setter para o valor
    get value() {
        return this.inputElement.value;
    }

    set value(val) {
        this.inputElement.value = val;
        this.formatarPreco();
    }

    // Formatar o preço em tempo real
    formatarPreco() {
        let valor = this.inputElement.value.replace(/\D/g, '');

        if (valor === '') {
            this.inputElement.value = '';
            this.inputElement.classList.remove('filled');
            return;
        }

        // Converte para número e divide por 100 para considerar os centavos
        valor = parseInt(valor, 10) / 100;

        // Formata no padrão brasileiro
        const valorFormatado = valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        this.inputElement.value = valorFormatado;
        this.inputElement.classList.add('filled');

        // Dispara evento de mudança
        this.dispatchEvent(new CustomEvent('preco-alterado', {
            detail: { valor: valor },
            bubbles: true,
            composed: true
        }));
    }

    // Efeitos e animações
    onFocus() {
        this.containerElement.classList.add('focus');
    }

    onBlur() {
        this.containerElement.classList.remove('focus');
    }

    addRippleEffect() {
        this.containerElement.classList.remove('clicked');
        setTimeout(() => {
            this.containerElement.classList.add('clicked');
        }, 10);
    }

    // Conecta o elemento ao DOM
    connectedCallback() {
        if (this.hasAttribute('value')) {
            this.value = this.getAttribute('value');
        }
    }

    // Atributos observados
    static get observedAttributes() {
        return ['value', 'placeholder'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value') {
            this.value = newValue;
        } else if (name === 'placeholder') {
            this.inputElement.placeholder = newValue;
        }
    }
}

customElements.define('input-price', InputPreco);
