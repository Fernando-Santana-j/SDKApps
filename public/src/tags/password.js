const passwordInputStyles = new CSSStyleSheet();
passwordInputStyles.replaceSync(`
    :host {
        display: block;
        width: 100%;
    }

    .password-input__wrapper {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
    }

    .password-input__field {
        font-size: 1.2em;
        padding: 0.5em;
        width: 100%;
        height: 2em;
        background-color: var(--color-text-primary);
        color: var(--primary-color);
        border: none;
        border-radius: var(--border-radius-min);
        font-family: 'poppins';
        padding-right: 2.5em;
        outline: none;
    }

    .password-input__toggle {
        position: absolute;
        right: 8px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--tertiary-color);
        transition: 0.7s;
        opacity: 1;
        &:hover {
            opacity: 0.8;
            transition: 0.7s;
        }
    }

    .password-input__toggle svg {
        width: 2em;
        height: 2em;
    }

    .password-input__field:disabled,
    .password-input__toggle:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`);

class CustomPasswordInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [passwordInputStyles];
    }

    static get observedAttributes() {
        return ['placeholder', 'name', 'value', 'required', 'height'];
    }

    connectedCallback() {
        this.render();
        this.setupElements();
        this.setupEventListeners();
    }

    render() {
        this.showPasswordIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
        `;

        this.hidePasswordIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-closed"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>
        `;

        this.shadowRoot.innerHTML = `

            <div class="password-input__wrapper">
                <input 
                    type="password" 
                    class="password-input__field"
                    style="height: ${this.getAttribute('height') || '2em' } !important;"
                    placeholder="${this.getAttribute('placeholder') || 'Digite sua senha...'}"
                    name="${this.getAttribute('name') || ''}"
                    ${this.getAttribute('required') ? 'required' : ''}
                    value="${this.getAttribute('value') || ''}"
                >
                <button 
                    type="button" 
                    class="password-input__toggle"
                    aria-label="Alternar visibilidade da senha"
                >
                    ${this.showPasswordIcon}
                </button>
            </div>
        `;
    }

    setupElements() {
        this.input = this.shadowRoot.querySelector('.password-input__field');
        this.toggleButton = this.shadowRoot.querySelector('.password-input__toggle');
    }

    setupEventListeners() {
        this.toggleButton.addEventListener('click', () => this.toggleVisibility());

        this.input.addEventListener('input', (e) => {
            this.dispatchEvent(new CustomEvent('change', {
                detail: { value: e.target.value },
                bubbles: true,
                composed: true
            }));
        });
    }

    toggleVisibility() {
        const isPassword = this.input.type === 'password';
        this.input.type = isPassword ? 'text' : 'password';
        this.toggleButton.innerHTML = isPassword
            ? this.hidePasswordIcon
            : this.showPasswordIcon;
        this.toggleButton.setAttribute('aria-pressed', isPassword);
    }

    get value() {
        return this.input?.value || '';
    }

    set value(newValue) {
        if (this.input) {
            this.input.value = newValue;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.input) return;

        switch (name) {
            case 'placeholder':
                this.input.placeholder = newValue;
                break;
            case 'name':
                this.input.name = newValue;
                break;
            case 'value':
                this.input.value = newValue;
                break;
            case 'required':
                this.input.required = newValue !== null;
                break;
            case 'height':
                this.input.style.height = `${newValue} !important`;
                break;
        }
    }
}

customElements.define('input-password', CustomPasswordInput);