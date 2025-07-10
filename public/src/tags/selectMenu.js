// Novo elemento HTML customizado para dropdown
const selectMenuStyles = new CSSStyleSheet();
selectMenuStyles.replaceSync(`
    :host {
                    display: block;
                    font-family: var(--main-text-font, 'poppins', sans-serif);
                    --dropdown-bg: var(--color-text-primary, #f5f5f5);
                    --dropdown-text: var( --secundary-color, #1e1e1e);
                    --dropdown-border: var(--border-radius-min, 10px);
                    --dropdown-hover: var(--hover-color, rgba(107, 107, 107, 60%));
                    --dropdown-selected: var(--secundary-color-purple, #bb86fc);
                    --dropdown-selected-text: white;
                    --dropdown-shadow: var(--purple-box-shadow-small, 0 5px 15px rgba(138, 43, 226, 0.4));
                    --dropdown-transition: var(--transition-standard, all 0.3s ease);
                }
                
                .dropdown {
                    position: relative;
                    width: 100%;
                }
                
                .dropdown__input {
                    width: 100%;
                    padding: 12px 40px 12px 16px;
                    background-color: var(--dropdown-bg);
                    color: var(--dropdown-text);
                    border: 2px solid transparent;
                    border-radius: var(--dropdown-border);
                    font-size: 1rem;
                    cursor: pointer;
                    transition: var(--dropdown-transition);
                    outline: none;
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
                }
                
                .dropdown__input:focus,
                .dropdown.active .dropdown__input {
                    border-color: var(--dropdown-selected);
                    box-shadow: var(--dropdown-shadow);
                }
                
                .dropdown__select {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    width: 100%;
                    background-color: var(--dropdown-bg);
                    border-radius: var(--dropdown-border);
                    max-height: 0;
                    overflow-y: auto;
                    opacity: 0;
                    visibility: hidden;
                    transition: max-height 0.3s ease, opacity 0.3s ease, visibility 0.3s, transform 0.3s ease;
                    z-index: 1000;
                    transform: translateY(-10px);
                    box-shadow: var(--dropdown-shadow);
                    scrollbar-width: thin;
                    scrollbar-color: var(--dropdown-selected) var(--dropdown-bg);
                }
                
                .dropdown__select::-webkit-scrollbar {
                    width: 6px;
                }
                
                .dropdown__select::-webkit-scrollbar-track {
                    background: var(--dropdown-bg);
                    border-radius: 3px;
                }
                
                .dropdown__select::-webkit-scrollbar-thumb {
                    background: var(--dropdown-selected);
                    border-radius: 3px;
                }
                
                .dropdown__select.active {
                    max-height: 250px;
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }
                
                .dropdown__select-option {
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: var(--dropdown-transition);
                    display: flex;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }
                .dropdown__select-option-texts{
                    display: flex;
                    flex-direction: column;
                    color: var(--dropdown-text);
                }
                
                .dropdown__select-option:hover {
                    background-color: var(--dropdown-hover);
                }
                
                .dropdown__select-option.selected {
                    background-color: var(--dropdown-selected);
                    color: var(--dropdown-selected-text);
                }
                
                .dropdown__select-option.selected::before {
                    content: '✓';
                    margin-right: 8px;
                    font-weight: bold;
                }
                
                .dropdown-select-desc {
                    font-size: 0.8em;
                    opacity: 0.7;
                    margin-top: 4px;
                    display: block;
                }
                
                .dropdown__no-results {
                    padding: 16px;
                    text-align: center;
                    color: var(--dropdown-text);
                    font-style: italic;
                    opacity: 0.7;
                }
                
                .dropdown__input-icon {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    transition: transform 0.3s ease;
                    pointer-events: none;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .dropdown.active .dropdown__input-icon {
                    transform: translateY(-50%) rotate(180deg);
                }
                
                .dropdown.disabled {
                    opacity: 0.6;
                    pointer-events: none;
                }
                
                /* Animação de entrada para as opções */
                @keyframes fadeInOption {
                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .dropdown__select.active .dropdown__select-option {
                    animation: fadeInOption 0.2s ease forwards;
                }
                
                .dropdown__select.active .dropdown__select-option:nth-child(1) { animation-delay: 0.05s; }
                .dropdown__select.active .dropdown__select-option:nth-child(2) { animation-delay: 0.1s; }
                .dropdown__select.active .dropdown__select-option:nth-child(3) { animation-delay: 0.15s; }
                .dropdown__select.active .dropdown__select-option:nth-child(4) { animation-delay: 0.2s; }
                .dropdown__select.active .dropdown__select-option:nth-child(5) { animation-delay: 0.25s; }
                
                /* Efeito de ripple quando selecionado */
                @keyframes ripple {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2.5);
                        opacity: 0;
                    }
                }
                
                .ripple {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    width: 100px;
                    height: 100px;
                    margin-top: -50px;
                    margin-left: -50px;
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                }
    `)
class CustomDropdown extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [selectMenuStyles];
        this.options = [];
        this.selectedOption = null;
        this.multiSelect = false;
        this.selectedOptions = [];
        

    }

    connectedCallback() {
        this.multiSelect = this.hasAttribute('multiple');
        this.render();
        this.setupEventListeners();
    }

    static get observedAttributes() {
        return ['placeholder', 'disabled', 'multiple'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.shadowRoot) {
            if (name === 'placeholder') {
                const input = this.shadowRoot.querySelector('.dropdown__input');
                if (input) input.placeholder = newValue || 'Selecione uma opção...';
            } else if (name === 'disabled') {
                this.toggleDisabled(newValue !== null);
            } else if (name === 'multiple') {
                this.multiSelect = newValue !== null;
                this.render();
                this.setupEventListeners();
            }
        }
    }

    toggleDisabled(disabled) {
        const dropdown = this.shadowRoot.querySelector('.dropdown');
        if (dropdown) {
            if (disabled) {
                dropdown.classList.add('disabled');
            } else {
                dropdown.classList.remove('disabled');
            }
        }
    }

    render() {
        // Parse options from child elements
        this.parseOptions();

        const placeholder = this.getAttribute('placeholder') || 'Selecione uma opção...';

        this.shadowRoot.innerHTML = `
            <div class="dropdown">
                <input type="text" class="dropdown__input" placeholder="${placeholder}" readonly>
                <div class="dropdown__input-icon">
                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="dropdown__select">
                    ${this.options.map(option => `
                        <div class="dropdown__select-option" data-name="${option.name}" data-value="${option.value}" ${option.selected ? 'data-selected="true"' : ''}>
                            <div class="dropdown__select-option-texts">
                                ${option.name}
                                ${option.desc ? `<div class="dropdown-select-desc">${option.desc}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                    <div class="dropdown__no-results" style="display: none;">Nenhuma opção encontrada…</div>
                </div>
            </div>
        `;

        // Inicializa as opções selecionadas
        this.initializeSelectedOptions();
    }

    parseOptions() {
        this.options = [];

        // Primeiro verificamos se há um atributo options-json
        const optionsJson = this.getAttribute('options-json');
        if (optionsJson) {
            try {
                const parsedOptions = JSON.parse(optionsJson);
                this.options = parsedOptions.map(opt => {
                    // Normaliza o formato das opções
                    return {
                        value: opt.value || opt.id || '',
                        name: opt.name || opt.label || opt.text || '',
                        desc: opt.desc || opt.description || '',
                        selected: opt.selected || false
                    };
                });
                return;
            } catch (e) {
                console.error('Erro ao analisar options-json:', e);
            }
        }

        // Segundo, verificamos se há um atributo options-data-src (URL para buscar opções)
        const dataSrc = this.getAttribute('options-data-src');
        if (dataSrc && !this._dataLoaded) {
            this._dataLoaded = true;
            this.loadOptionsFromUrl(dataSrc);
            return;
        }

        // Por último, usamos as custom-options como fallback
        const optionElements = this.querySelectorAll('custom-option');

        optionElements.forEach(option => {
            const value = option.getAttribute('value') || '';
            const name = option.textContent.trim();
            const desc = option.getAttribute('description') || '';
            const selected = option.hasAttribute('selected');

            this.options.push({ value, name, desc, selected });
        });
    }

    async loadOptionsFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro ao carregar opções: ${response.status}`);
            }

            const data = await response.json();

            // Tenta detectar o formato e normalizar
            let options = [];

            if (Array.isArray(data)) {
                options = data.map(item => {
                    // Tenta detectar as propriedades corretas
                    return {
                        value: item.value || item.id || '',
                        name: item.name || item.label || item.text || '',
                        desc: item.desc || item.description || '',
                        selected: item.selected || false
                    };
                });
            } else if (typeof data === 'object' && data.results) {
                // Formato comum em APIs: { results: [...] }
                options = data.results.map(item => ({
                    value: item.value || item.id || '',
                    name: item.name || item.label || item.text || '',
                    desc: item.desc || item.description || '',
                    selected: item.selected || false
                }));
            }

            this.options = options;
            this.render();
            this.dispatchEvent(new CustomEvent('optionsloaded', {
                detail: { options },
                bubbles: true
            }));
        } catch (error) {
            console.error('Erro ao carregar opções do dropdown:', error);
            this.dispatchEvent(new CustomEvent('optionserror', {
                detail: { error: error.message },
                bubbles: true
            }));
        }
    }

    setupEventListeners() {
        const dropdown = this.shadowRoot.querySelector('.dropdown');
        const input = this.shadowRoot.querySelector('.dropdown__input');
        const select = this.shadowRoot.querySelector('.dropdown__select');
        const selectOptions = this.shadowRoot.querySelectorAll('.dropdown__select-option');

        // Clique no input para mostrar/esconder o dropdown
        input.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Opções de clique
        selectOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleOptionClick(option);

                // Efeito ripple
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');

                const rect = option.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                ripple.style.top = y + 'px';
                ripple.style.left = x + 'px';

                option.appendChild(ripple);

                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', () => {
            this.closeDropdown();
        });

        // Impedir que o clique no dropdown feche o dropdown
        select.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    toggleDropdown() {
        const dropdown = this.shadowRoot.querySelector('.dropdown');
        const select = this.shadowRoot.querySelector('.dropdown__select');

        if (select.classList.contains('active')) {
            this.closeDropdown();
        } else {
            dropdown.classList.add('active');
            select.classList.add('active');
        }
    }

    closeDropdown() {
        const dropdown = this.shadowRoot.querySelector('.dropdown');
        const select = this.shadowRoot.querySelector('.dropdown__select');

        dropdown.classList.remove('active');
        select.classList.remove('active');
    }

    handleOptionClick(option) {
        const value = option.getAttribute('data-value');
        const name = option.getAttribute('data-name');
        const input = this.shadowRoot.querySelector('.dropdown__input');

        if (this.multiSelect) {
            // Modo multi-select
            const index = this.selectedOptions.findIndex(opt => opt.value === value);

            if (index === -1) {
                this.selectedOptions.push({ name, value });
                option.classList.add('selected');
            } else {
                this.selectedOptions.splice(index, 1);
                option.classList.remove('selected');
            }

            input.value = this.selectedOptions.map(opt => opt.name).join(', ');

            if (this.selectedOptions.length === 0) {
                input.value = '';
            }
        } else {
            // Modo single-select
            const selectOptions = this.shadowRoot.querySelectorAll('.dropdown__select-option');

            selectOptions.forEach(opt => {
                opt.classList.remove('selected');
            });

            option.classList.add('selected');
            this.selectedOption = { name, value };
            input.value = name;
            this.closeDropdown();
        }

        // Dispara evento de mudança
        this.dispatchEvent(new CustomEvent('change', {
            detail: this.multiSelect ? this.selectedOptions : this.selectedOption,
            bubbles: true
        }));
    }

    initializeSelectedOptions() {
        const selectOptions = this.shadowRoot.querySelectorAll('.dropdown__select-option');
        const input = this.shadowRoot.querySelector('.dropdown__input');

        const preSelectedOptions = Array.from(selectOptions).filter(option =>
            option.getAttribute('data-selected') === 'true'
        );

        if (preSelectedOptions.length > 0) {
            if (this.multiSelect) {
                preSelectedOptions.forEach(option => {
                    const value = option.getAttribute('data-value');
                    const name = option.getAttribute('data-name');

                    this.selectedOptions.push({ name, value });
                    option.classList.add('selected');
                });

                input.value = this.selectedOptions.map(opt => opt.name).join(', ');
            } else {
                // No modo single, seleciona apenas a primeira opção
                const option = preSelectedOptions[0];
                const value = option.getAttribute('data-value');
                const name = option.getAttribute('data-name');

                this.selectedOption = { name, value };
                option.classList.add('selected');
                input.value = name;
            }
        }
    }

    // Métodos públicos
    getValue() {
        if (this.multiSelect) {
            return this.selectedOptions.map(opt => opt.value);
        } else {
            return this.selectedOption ? this.selectedOption.value : null;
        }
    }

    getFullValue() {
        if (this.multiSelect) {
            return this.selectedOptions;
        } else {
            return this.selectedOption;
        }
    }

    setValue(value) {
        const selectOptions = this.shadowRoot.querySelectorAll('.dropdown__select-option');
        const input = this.shadowRoot.querySelector('.dropdown__input');

        if (this.multiSelect) {
            // Limpa seleções atuais
            selectOptions.forEach(opt => opt.classList.remove('selected'));
            this.selectedOptions = [];

            // Array de valores
            if (Array.isArray(value)) {
                value.forEach(val => {
                    const option = Array.from(selectOptions).find(opt =>
                        opt.getAttribute('data-value') === String(val)
                    );

                    if (option) {
                        const name = option.getAttribute('data-name');
                        this.selectedOptions.push({ name, value: val });
                        option.classList.add('selected');
                    }
                });

                input.value = this.selectedOptions.map(opt => opt.name).join(', ');
            }
        } else {
            // Limpa seleções atuais
            selectOptions.forEach(opt => opt.classList.remove('selected'));
            this.selectedOption = null;

            // Encontra a opção correspondente
            const option = Array.from(selectOptions).find(opt =>
                opt.getAttribute('data-value') === String(value)
            );

            if (option) {
                const name = option.getAttribute('data-name');
                this.selectedOption = { name, value };
                option.classList.add('selected');
                input.value = name;
            } else {
                input.value = '';
            }
        }

        // Dispara evento de mudança
        this.dispatchEvent(new CustomEvent('change', {
            detail: this.multiSelect ? this.selectedOptions : this.selectedOption,
            bubbles: true
        }));
    }

    // Método para definir as opções programaticamente
    setOptions(options) {
        if (!Array.isArray(options)) {
            console.error('setOptions requer um array de opções');
            return;
        }

        // Normaliza as opções
        this.options = options.map(opt => {
            return {
                value: opt.value || opt.id || '',
                name: opt.name || opt.label || opt.text || '',
                desc: opt.desc || opt.description || '',
                selected: opt.selected || false
            };
        });

        // Re-renderiza o dropdown com as novas opções
        this.render();
        this.setupEventListeners();

        // Dispara evento
        this.dispatchEvent(new CustomEvent('optionschanged', {
            detail: { options: this.options },
            bubbles: true
        }));
    }

    // Método para adicionar uma única opção
    addOption(option) {
        if (!option || typeof option !== 'object') {
            console.error('addOption requer um objeto de opção');
            return;
        }

        const newOption = {
            value: option.value || option.id || '',
            name: option.name || option.label || option.text || '',
            desc: option.desc || option.description || '',
            selected: option.selected || false
        };

        this.options.push(newOption);
        this.render();
        this.setupEventListeners();

        // Se a nova opção for selecionada, atualiza a seleção
        if (newOption.selected) {
            const optionEl = Array.from(this.shadowRoot.querySelectorAll('.dropdown__select-option'))
                .find(opt => opt.getAttribute('data-value') === String(newOption.value));

            if (optionEl) {
                this.handleOptionClick(optionEl);
            }
        }
    }

    // Método para remover uma opção pelo valor
    removeOption(value) {
        const index = this.options.findIndex(opt => opt.value === value);
        if (index !== -1) {
            this.options.splice(index, 1);
            this.render();
            this.setupEventListeners();

            // Se a opção removida estava selecionada, atualiza a seleção
            if (this.multiSelect) {
                const selectedIndex = this.selectedOptions.findIndex(opt => opt.value === value);
                if (selectedIndex !== -1) {
                    this.selectedOptions.splice(selectedIndex, 1);
                    const input = this.shadowRoot.querySelector('.dropdown__input');
                    input.value = this.selectedOptions.map(opt => opt.name).join(', ');
                }
            } else if (this.selectedOption && this.selectedOption.value === value) {
                this.selectedOption = null;
                const input = this.shadowRoot.querySelector('.dropdown__input');
                input.value = '';
            }
        }
    }

    clear() {
        const selectOptions = this.shadowRoot.querySelectorAll('.dropdown__select-option');
        const input = this.shadowRoot.querySelector('.dropdown__input');

        selectOptions.forEach(opt => opt.classList.remove('selected'));

        if (this.multiSelect) {
            this.selectedOptions = [];
        } else {
            this.selectedOption = null;
        }

        input.value = '';

        // Dispara evento de mudança
        this.dispatchEvent(new CustomEvent('change', {
            detail: this.multiSelect ? this.selectedOptions : this.selectedOption,
            bubbles: true
        }));
    }

    // Getter e setter para value
    get value() {
        return this.getValue();
    }

    set value(newValue) {
        this.setValue(newValue);
    }
}

class CustomOption extends HTMLElement {
    constructor() {
        super();
    }
}

// Registra os elementos customizados
customElements.define('custom-dropdown', CustomDropdown);
customElements.define('custom-option', CustomOption);