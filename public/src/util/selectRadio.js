class RadioList {
    constructor(containerId, group ,options, onChange = null) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.group = group
        this.onChange = onChange;
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <ul class="radio-list">
                ${this.options.map((option, index) => `
                    <li title="${option.title || ''}">
                        <input type="radio" id="${this.getInputId(index)}" name="${this.group}" ${option.checked ? 'checked' : ''}>
                        <label class="label-radius" for="${this.getInputId(index)}">
                            ${option.label}
                            ${option.rightImage ? option.rightImage.includes('svg') ? `<div class="right-image ${option.imageClass}" id="${option.imageId}">${option.rightImage}</div>` : `<img src="${option.rightImage}" alt="" class="right-image ${option.imageClass}">` : ''}
                        </label>
                        <label for="${this.getInputId(index)}" class="check">
                            <div class="inside"></div>
                        </label>
                    </li>
                `).join('')}
            </ul>
        `;
        this.radioInputs = this.container.querySelectorAll('input[type="radio"]');
    }

    setupEventListeners() {
        this.radioInputs.forEach((input, index) => {
            input.addEventListener('change', () => this.handleOptionChange(index));
        });
    }

    handleOptionChange(index) {
        if (this.onChange) {
            this.onChange(this.options[index], index);
        }
    }

    getInputId(index) {
        return `radio-option-${this.group}-${index}`;
    }

    getValue() {
        const selectedInput = Array.from(this.radioInputs).find(input => input.checked);
        return selectedInput ? this.options[Array.from(this.radioInputs).indexOf(selectedInput)] : null;
    }


    clearSelection() {
        this.radioInputs.forEach(input => {
            input.checked = false;
        });
        if (this.onChange) {
            this.onChange(null);
        }
    }
}