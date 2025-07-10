const toggleSwitchStyles = new CSSStyleSheet();
toggleSwitchStyles.replaceSync(`
    :host {
        display: inline-block;
    }

    .toggle-switch {
        position: relative;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        font-family: 'poppins';
        color: var(--color-text-primary, #fff);
    }

    .toggle-switch__input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
    }

    .toggle-switch__slider {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
        background-color: #333;
        border-radius: 34px;
        transition: background-color 0.4s ease;
        margin-right: 10px;
    }

    .toggle-switch__slider::before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        border-radius: 50%;
        transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    .toggle-switch__input:checked + .toggle-switch__slider {
        background: linear-gradient(90deg, #8a2be2, #b906e6);
    }

    .toggle-switch__input:checked + .toggle-switch__slider::before {
        transform: translateX(26px);
    }

    .toggle-switch__input:focus + .toggle-switch__slider {
        box-shadow: 0 0 1px #8a2be2;
    }

    .toggle-switch__input:disabled + .toggle-switch__slider {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .toggle-switch__input:disabled + .toggle-switch__slider::before {
        background-color: #ccc;
    }

    .toggle-switch:hover .toggle-switch__slider::before {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .toggle-switch__label {
        font-size: 1em;
        user-select: none;
    }
`);

class CustomToggleSwitch extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [toggleSwitchStyles];
    }

    static get observedAttributes() {
        return ['checked', 'disabled', 'label', 'name', 'value'];
    }

    connectedCallback() {
        this.render();
        this.setupElements();
        this.setupEventListeners();
    }

    render() {
        const label = this.getAttribute('label') || '';
        const checked = this.hasAttribute('checked');
        const disabled = this.hasAttribute('disabled');
        const name = this.getAttribute('name') || '';
        const value = this.getAttribute('value') || 'on';

        this.shadowRoot.innerHTML = `
            <label class="toggle-switch">
                <input 
                    type="checkbox" 
                    class="toggle-switch__input"
                    name="${name}"
                    value="${value}"
                    ${checked ? 'checked' : ''}
                    ${disabled ? 'disabled' : ''}
                >
                <span class="toggle-switch__slider"></span>
                <span class="toggle-switch__label">${label}</span>
            </label>
        `;
    }

    setupElements() {
        this.checkbox = this.shadowRoot.querySelector('.toggle-switch__input');
        this.slider = this.shadowRoot.querySelector('.toggle-switch__slider');
        this.labelElement = this.shadowRoot.querySelector('.toggle-switch__label');
    }

    setupEventListeners() {
        this.checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.setAttribute('checked', '');
            } else {
                this.removeAttribute('checked');
            }

            this.dispatchEvent(new CustomEvent('change', {
                detail: { 
                    checked: e.target.checked,
                    name: this.getAttribute('name'),
                    value: this.getAttribute('value')
                },
                bubbles: true,
                composed: true
            }));
        });
    }

    // Getters e Setters
    get checked() {
        return this.checkbox?.checked || false;
    }

    set checked(value) {
        if (this.checkbox) {
            const oldValue = this.checkbox.checked;
            this.checkbox.checked = Boolean(value);
            
            if (oldValue !== this.checkbox.checked) {
                if (this.checkbox.checked) {
                    this.setAttribute('checked', '');
                } else {
                    this.removeAttribute('checked');
                }
                
                this.dispatchEvent(new CustomEvent('change', {
                    detail: { 
                        checked: this.checkbox.checked,
                        name: this.getAttribute('name'),
                        value: this.getAttribute('value')
                    },
                    bubbles: true,
                    composed: true
                }));
            }
        }
    }

    get disabled() {
        return this.checkbox?.disabled || false;
    }

    set disabled(value) {
        if (this.checkbox) {
            this.checkbox.disabled = Boolean(value);
            if (value) {
                this.setAttribute('disabled', '');
            } else {
                this.removeAttribute('disabled');
            }
        }
    }

    get label() {
        return this.getAttribute('label') || '';
    }

    set label(value) {
        this.setAttribute('label', value);
    }

    get name() {
        return this.getAttribute('name') || '';
    }

    set name(value) {
        this.setAttribute('name', value);
    }

    get value() {
        return this.getAttribute('value') || 'on';
    }

    set value(newValue) {
        this.setAttribute('value', newValue);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.shadowRoot || !this.checkbox) return;

        switch (name) {
            case 'checked':
                this.checkbox.checked = newValue !== null;
                break;
            case 'disabled':
                this.checkbox.disabled = newValue !== null;
                break;
            case 'label':
                if (this.labelElement) {
                    this.labelElement.textContent = newValue || '';
                }
                break;
            case 'name':
                this.checkbox.name = newValue || '';
                break;
            case 'value':
                this.checkbox.value = newValue || 'on';
                break;
        }
    }
}

customElements.define('toggle-switch', CustomToggleSwitch);