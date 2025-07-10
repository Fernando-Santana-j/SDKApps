// Define o componente personalizado de upload de imagem
const imageUploadStyles = new CSSStyleSheet();
imageUploadStyles.replaceSync(`
  .image-preview-container {
            position: relative;
            width: 100%;
            height: ${this._height};
            border-radius: 8px; /* Equivalente ao var(--border-radius-min) */
            overflow: hidden;
            background-color: var(--tertiary-color, #2f3136);
            border: 2px dashed rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .preview-card {
            width: 100%;
            height: 100%;
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .preview-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: all 0.3s ease;
            display: none;
          }
          
          .preview-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.7);
            opacity: 1;
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
          }
          
          .upload-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            color: var(--white-color, #ffffff);
            text-align: center;
            transform: translateY(0);
            transition: all 0.3s ease;
            padding: 1rem;
          }
          
          .upload-icon-container {
            position: relative;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
          }
          
          .upload-icon {
            font-size: 2rem;
            color: var(--accent, #ae00ff);
            z-index: 2;
            transition: all 0.3s ease;
          }
          
          .upload-icon-circle {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 2px dashed var(--accent, #ae00ff);
            border-radius: 50%;
            animation: rotate 10s linear infinite;
          }
          
          .upload-title {
            font-size: 1rem;
            font-weight: 500;
            color: var(--white-color, #ffffff);
            margin: 0;
          }
          
          .upload-subtitle {
            font-size: 0.8rem;
            opacity: 0.8;
            color: var(--text-gray-color-secundary, #a3a6aa);
            margin: 0;
          }
          
          .image-preview-container:hover .preview-overlay,
          .image-preview-container.drag-over .preview-overlay {
            opacity: 1;
          }
          
          .image-preview-container:hover,
          .image-preview-container.drag-over {
            border-color: var(--accent, #ae00ff);
            box-shadow: 0 0 0 3px rgba(174, 0, 255, 0.15);
            background-color: rgba(174, 0, 255, 0.05);
          }
          
          .image-preview-container.drag-over .upload-icon {
            transform: scale(1.1);
            color: var(--accent-hover, #c44aff);
          }
          
          .file-input {
            display: none;
          }
          
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          @keyframes previewAppear {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .preview-active {
            animation: previewAppear 0.3s ease forwards;
          }
          
          @media (max-width: 768px) {
            :host {
              width: 100%;
            }
          }
  `)

class ImageUpload extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [imageUploadStyles];
      // Estado interno
      this._allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      this._title = 'Clique ou arraste uma imagem';
      this._subtitle = 'Suporta PNG, JPG e GIF';
      this._width = '100%';
      this._height = '15em';
      this._previewUrl = '';
      
      this.render();
      this.setupEventListeners();
      
      // Se já tiver uma URL de preview, aplica após renderização
      if (this._previewUrl) {
        this.setPreview(this._previewUrl);
      }
    }
    
    // Atributos observados
    static get observedAttributes() {
      return ['allowed-extensions', 'title', 'subtitle', 'width', 'height', 'preview-url'];
    }
    
    // Quando os atributos mudam
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      
      switch (name) {
        case 'allowed-extensions':
          this._allowedExtensions = newValue.split(',').map(ext => ext.trim().toLowerCase());
          this.updateSubtitle();
          break;
        case 'title':
          this._title = newValue;
          if (this.shadowRoot.querySelector('.upload-title')) {
            this.shadowRoot.querySelector('.upload-title').textContent = newValue;
          }
          break;
        case 'subtitle':
          this._subtitle = newValue;
          if (this.shadowRoot.querySelector('.upload-subtitle')) {
            this.shadowRoot.querySelector('.upload-subtitle').textContent = newValue;
          }
          break;
        case 'width':
          this._width = newValue;
          this.updateStyles();
          break;
        case 'height':
          this._height = newValue;
          this.updateStyles();
          break;
        case 'preview-url':
          this._previewUrl = newValue;
          if (newValue) {
            this.setPreview(newValue);
          }
          break;
      }
    }
    
    // Getter para acessar os arquivos como um input padrão
    get files() {
      return this.shadowRoot.querySelector('.file-input').files;
    }
    
    // Atualiza a legenda de extensões permitidas
    updateSubtitle() {
      const subtitleEl = this.shadowRoot.querySelector('.upload-subtitle');
      if (subtitleEl && !this.hasAttribute('subtitle')) {
        const extList = this._allowedExtensions.map(ext => ext.toUpperCase()).join(', ');
        subtitleEl.textContent = `Suporta ${extList}`;
      }
    }
    
    // Atualiza os estilos com base nos atributos
    updateStyles() {
      const container = this.shadowRoot.querySelector('.image-preview-container');
      if (container) {
        container.style.width = this._width;
        container.style.height = this._height;
      }
    }
    
    // Configura os event listeners
    setupEventListeners() {
      const container = this.shadowRoot.querySelector('.image-preview-container');
      const fileInput = this.shadowRoot.querySelector('.file-input');
      
      container.addEventListener('click', () => fileInput.click());
      
      container.addEventListener('dragover', this.handleDragOver.bind(this));
      container.addEventListener('dragleave', this.handleDragLeave.bind(this));
      container.addEventListener('drop', this.handleDrop.bind(this));
      
      fileInput.addEventListener('change', this.handleFileChange.bind(this));
    }
    
    // Manipuladores de eventos
    handleDragOver(event) {
      event.preventDefault();
      event.stopPropagation();
      this.shadowRoot.querySelector('.image-preview-container').classList.add('drag-over');
    }
    
    handleDragLeave(event) {
      event.preventDefault();
      event.stopPropagation();
      this.shadowRoot.querySelector('.image-preview-container').classList.remove('drag-over');
    }
    
    handleDrop(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const container = this.shadowRoot.querySelector('.image-preview-container');
      container.classList.remove('drag-over');
      
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        this.processFile(files[0]);
      }
    }
    
    handleFileChange(event) {
      if (event.target.files && event.target.files[0]) {
        this.processFile(event.target.files[0]);
      }
    }
    
    // Processa o arquivo selecionado
    processFile(file) {
      const fileExt = file.name.split('.').pop().toLowerCase();
      
      // Verifica se a extensão é permitida
      if (!this._allowedExtensions.includes(fileExt)) {
        if (typeof window.errorNotify === 'function') {
          window.errorNotify(`Tipo de arquivo não permitido. Use apenas: ${this._allowedExtensions.join(', ')}`);
        } else {
          console.error(`Tipo de arquivo não permitido. Use apenas: ${this._allowedExtensions.join(', ')}`);
        }
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const previewImg = this.shadowRoot.querySelector('.preview-img');
        const overlay = this.shadowRoot.querySelector('.preview-overlay');
        
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        previewImg.classList.add('preview-active');
        
        // Anima a aparição da imagem
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(previewImg,
            { scale: 0.95, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
          );
          
          gsap.to(overlay, { opacity: 0, duration: 0.2, ease: "power2.out" });
        } else {
          overlay.style.opacity = '0';
        }
        
        // Dispara evento de mudança
        this.dispatchEvent(new CustomEvent('image-change', {
          detail: { file, dataUrl: e.target.result }
        }));
      };
      
      reader.readAsDataURL(file);
    }
    
    // Métodos públicos
    
    // Define uma imagem de preview a partir de uma URL
    setPreview(url) {
      if (!url) return;
      
      const previewImg = this.shadowRoot.querySelector('.preview-img');
      const overlay = this.shadowRoot.querySelector('.preview-overlay');
      
      previewImg.src = url;
      previewImg.style.display = 'block';
      previewImg.classList.add('preview-active');
      
      // Anima a aparição da imagem
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(previewImg,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
        
        gsap.to(overlay, { opacity: 0, duration: 0.2, ease: "power2.out" });
      } else {
        overlay.style.opacity = '0';
      }
      
      // Dispara evento de mudança
      this.dispatchEvent(new CustomEvent('image-set', {
        detail: { dataUrl: url }
      }));
    }
    
    // Retorna o valor do arquivo como objeto { file, dataUrl }
    getValue() {
      const img = this.shadowRoot.querySelector('.preview-img');
      const input = this.shadowRoot.querySelector('.file-input');
      
      if (img.style.display === 'block') {
        return {
          file: input.files[0] || null,
          dataUrl: img.src
        };
      }
      
      return null;
    }
    
    // Limpa a imagem
    clear() {
      const img = this.shadowRoot.querySelector('.preview-img');
      const overlay = this.shadowRoot.querySelector('.preview-overlay');
      const input = this.shadowRoot.querySelector('.file-input');
      
      img.src = '';
      img.style.display = 'none';
      img.classList.remove('preview-active');
      
      overlay.style.opacity = '1';
      input.value = '';
      
      // Dispara evento de limpeza
      this.dispatchEvent(new CustomEvent('image-clear'));
    }
    
    // Renderiza o componente
    render() {
      this.shadowRoot.innerHTML = `
        <div class="image-preview-container">
          <div class="preview-card">
            <div class="preview-overlay">
              <div class="upload-content">
                <div class="upload-icon-container">
                  <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <div class="upload-icon-circle"></div>
                </div>
                <p class="upload-title">${this._title}</p>
                <p class="upload-subtitle">${this._subtitle}</p>
              </div>
            </div>
            <img src="" alt="Image Preview" class="preview-img">
          </div>
        </div>
        <input type="file" accept="image/*" class="file-input">
      `;
      
      this.updateStyles();
      this.updateSubtitle();
    }
  }
  
  customElements.define('image-upload', ImageUpload);