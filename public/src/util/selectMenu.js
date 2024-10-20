class DropdownBase {
    constructor(containerId, options, onChange = null) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.onChange = onChange;
        this.render();
        this.setupEventListeners();
        this.initializeSelectedOptions();
    }

    render() {
        this.container.innerHTML = `
            <div class="dropdown">
                <input type="text" class="dropdown__input" placeholder="Selecione uma opção...">
                <div class="dropdown__select">
                    ${this.options.map(option => `<div class="dropdown__select-option" data-name="${option.name}" data-value="${option.value}" ${option.selected ? 'data-selected="true"' : ''}>${option.name} ${option.desc ? `<div class="dropdown-select-desc">${option.desc}</div>` : ''} </div>`).join('')}
                    <div class="dropdown__no-results" style="display: none; padding: 10px; text-align: center;">Nenhuma opção encontrada…</div>
                </div>
            </div>
        `;
        this.dropdown = this.container.querySelector('.dropdown');
        this.input = this.container.querySelector('.dropdown__input');
        this.select = this.container.querySelector('.dropdown__select');
        this.selectOptions = this.container.querySelectorAll('.dropdown__select-option');
        this.noResults = this.container.querySelector('.dropdown__no-results');
    }

    setupEventListeners() {
        this.input.addEventListener('focus', () => this.toggleDropdown(true));
        this.input.addEventListener('input', () => {
            this.filterOptions();
            this.triggerOnChange();
        });
        this.selectOptions.forEach(option => {
            option.addEventListener('click', () => this.handleOptionClick(option));
        });
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }

    toggleDropdown(show) {
        this.select.classList.toggle('active', show);
        this.dropdown.classList.toggle('active', show);
    }

    filterOptions() {
        const searchText = this.input.value.toLowerCase();
        let hasVisibleOption = false;

        this.selectOptions.forEach(option => {
            const shouldShow = option.textContent.toLowerCase().includes(searchText);
            option.style.display = shouldShow ? 'block' : 'none';
            if (shouldShow) hasVisibleOption = true;
        });

        this.noResults.style.display = hasVisibleOption ? 'none' : 'block';
        this.toggleDropdown(true);
    }

    handleOutsideClick(e) {
        if (!this.dropdown.contains(e.target)) {
            this.toggleDropdown(false);
        }
    }

    triggerOnChange() {
        if (this.onChange) {
            this.onChange(this.getValue());
        }
    }

    handleOptionClick(option) {
       
    }

    getValue() {

    }

    clearSelection() {
        this.input.value = '';
        this.selectOptions.forEach(option => {
            option.classList.remove('selected');
        });
        this.triggerOnChange();
    }
}

class DropdownSingle extends DropdownBase {
    constructor(containerId, options, onChange = null) {
        super(containerId, options, onChange);
        this.selectedOption = null;
    }

    initializeSelectedOptions() {
        const preSelectedOptions = Array.from(this.selectOptions).filter(option => 
            option.getAttribute('data-selected') === 'true'
        );

        if (preSelectedOptions.length > 0) {
            // Se houver mais de uma opção marcada como selecionada, 
            // seleciona apenas a primeira no modo single
            this.handleOptionClick(preSelectedOptions[0]);
        }
    }

    handleOptionClick(option) {
        const value = option.getAttribute('data-value');
        const name = option.getAttribute('data-name');
        
        if (this.selectedOption) {
            this.selectedOption.classList.remove('selected');
        }
        
        this.selectedOption = option;
        this.selectedOption.classList.add('selected');
        
        this.input.value = name;
        this.toggleDropdown(false);
        this.triggerOnChange();
    }

    getValue() {
        return this.selectedOption ? {
            name: this.selectedOption.getAttribute('data-name'),
            value: this.selectedOption.getAttribute('data-value')
        } : null;
    }

    clearSelection() {
        super.clearSelection();
        this.selectedOption = null;
    }
}

class DropdownMulti extends DropdownBase {
    constructor(containerId, options, onChange = null) {
        super(containerId, options, onChange);
        this.selectedOptions = [];
    }

    initializeSelectedOptions() {
        const preSelectedOptions = Array.from(this.selectOptions).filter(option => 
            option.getAttribute('data-selected') === 'true'
        );

        preSelectedOptions.forEach(option => {
            this.handleOptionClick(option);
        });
    }

    handleOptionClick(option) {
        const value = option.getAttribute('data-value');
        const name = option.getAttribute('data-name');
        const index = this.selectedOptions.findIndex(opt => opt.value === value);
        
        if (index === -1) {
            this.selectedOptions.push({name, value});
            option.classList.add('selected');
        } else {
            this.selectedOptions.splice(index, 1);
            option.classList.remove('selected');
        }
        
        this.updateInput();
        this.triggerOnChange();
    }

    updateInput() {
        this.input.value = this.selectedOptions.map(opt => opt.name).join(', ');
    }

    getValue() {
        return this.selectedOptions;
    }

    clearSelection() {
        super.clearSelection();
        this.selectedOptions = [];
    }
}