document.addEventListener('DOMContentLoaded', function() {
            
    const colorOptions = document.querySelectorAll('.color-option');
    const rangeSliders = document.querySelectorAll('.range-slider');
    const displayNameInput = document.getElementById('displayName-store-input');
    const logoButton = document.getElementById('logoButton');
    const backgroundButton = document.getElementById('backgroundButton');
    const logoFileName = document.getElementById('logoFileName');
    const backgroundFileName = document.getElementById('backgroundFileName');
    const saveButton = document.getElementById('saveButton');
    const resetButton = document.getElementById('resetButton');
    
    // Elementos do colorpicker
    const colorPickerModal = document.getElementById('colorPickerModal');
    const colorPreview = document.getElementById('colorPreview');
    const colorName = document.getElementById('colorName');
    const colorValue = document.getElementById('colorValue');
    const copyColorBtn = document.getElementById('copyColorBtn');
    const colorPickerGrid = document.getElementById('colorPickerGrid');
    const colorGridCursor = document.getElementById('colorGridCursor');
    const colorPickerHue = document.getElementById('colorPickerHue');
    const hueSliderThumb = document.getElementById('hueSliderThumb');
    const colorPickerAlpha = document.getElementById('colorPickerAlpha');
    const alphaGradient = document.getElementById('alphaGradient');
    const alphaSliderThumb = document.getElementById('alphaSliderThumb');
    const redSlider = document.getElementById('redSlider');
    const greenSlider = document.getElementById('greenSlider');
    const blueSlider = document.getElementById('blueSlider');
    const alphaSlider = document.getElementById('alphaSlider');
    const colorPresets = document.querySelectorAll('.color-preset');
    const cancelColorBtn = document.getElementById('cancelColorBtn');
    const confirmColorBtn = document.getElementById('confirmColorBtn');
    
    // Elementos de preview
    const storePreview = document.getElementById('storePreview');
    const previewBanner = document.getElementById('previewBanner');
    const previewStoreName = document.getElementById('previewStoreName');
    
    // Variáveis para o colorpicker
    let activeColorVar = '';
    let activeColorOption = null;
    let currentColor = { r: 138, g: 43, b: 226, a: 1 };
    let currentHue = 0;
    let isDraggingGrid = false;
    let isDraggingHue = false;
    let isDraggingAlpha = false;
    let originalColor = '';
    
    // Valores padrão para restaurar
    const defaultValues = {
        '--cor-principal': '#8a2be2',
        '--cor-principal-clara': '#bb86fc',
        '--cor-principal-escura': '#4a148c',
        '--cor-destaque': '#03dac6',
        '--cor-fundo': '#121212',
        '--cor-superficie': '#1e1e1e',
        '--cor-superficie-2': '#2d2d2d',
        '--cor-erro': '#cf6679',
        '--cor-texto-principal': '#ffffff',
        '--cor-texto-secundaria': '#e1e1e1',
        '--cor-texto-terciaria': 'rgba(255, 255, 255, 0.7)',
        '--espacamento-padrao': '1rem',
        '--borda-arredondada': '12px',
        'displayName': 'Minha Loja'
    };
    
    // Configuração da animação GSAP
    function setupAnimations() {
        // Animação de entrada dos elementos do editor
        gsap.fromTo('.editor-section', 
            { y: 50, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        );
        
        // Animação para os títulos
        gsap.fromTo('.section-title, .subsection-title', 
            { x: -30, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: "back.out(1.7)" }
        );
        
        
        // Animação para os range sliders
        gsap.fromTo('.range-slider-container', 
            { x: 30, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: "back.out(1.2)" }
        );
        
        // Efeito de "desenhar" a barra de progresso nos sliders
        gsap.fromTo('.range-progress', 
            { width: 0, opacity: 0 }, 
            { 
                width: function(index, target) {
                    // Obter o slider associado
                    const sliderId = target.id.replace('Progress', '');
                    const slider = document.getElementById(sliderId);
                    if (slider) {
                        const min = parseFloat(slider.min);
                        const max = parseFloat(slider.max);
                        const value = parseFloat(slider.value);
                        return `${((value - min) / (max - min)) * 100}%`;
                    }
                    return 0;
                }, 
                opacity: 1, 
                duration: 1.2, 
                delay: 0.5, 
                ease: "power3.out",
                onComplete: function() {
                    // Ajustar a altura do editor após as animações
                    adjustEditorHeight();
                }
            }
        );
        
        // Animação para os componentes da preview
        gsap.fromTo('.demo-component', 
            { scale: 0.8, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.6, stagger: 0.1, ease: "back.out(1.7)", delay: 0.5 }
        );
        
        // Efeito de pulsação para tags
        gsap.to('.demo-tag', {
            scale: 1.05,
            duration: 1,
            repeat: -1,
            yoyo: true,
            stagger: 0.2,
            ease: "sine.inOut"
        });
    }
    


    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            const colorVar = this.dataset.colorVar;
            
            // Verificar se o colorpicker já está aberto
            if (colorPickerModal.style.display === 'block') {
                // Se estiver aberto, apenas atualizar o elemento ativo e a cor
                activeColorVar = colorVar;
                activeColorOption = this;
                
                // Obter a cor atual da variável CSS
                const computedStyle = getComputedStyle(document.documentElement);
                originalColor = computedStyle.getPropertyValue(colorVar).trim();
                
                // Converter para RGB
                if (originalColor.startsWith('rgba')) {
                    const rgba = originalColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                    if (rgba) {
                        currentColor = {
                            r: parseInt(rgba[1]),
                            g: parseInt(rgba[2]),
                            b: parseInt(rgba[3]),
                            a: parseFloat(rgba[4])
                        };
                    }
                } else if (originalColor.startsWith('rgb')) {
                    const rgb = originalColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                    if (rgb) {
                        currentColor = {
                            r: parseInt(rgb[1]),
                            g: parseInt(rgb[2]),
                            b: parseInt(rgb[3]),
                            a: 1
                        };
                    }
                } else {
                    // Remover espaços e o "#" inicial se houver
                    const cleanHex = originalColor.replace(/\s+/g, '').replace('#', '');
                    const rgb = hexToRgb(cleanHex.length > 0 ? '#' + cleanHex : '#8a2be2');
                    currentColor = rgb;
                }
                
                // Calcular o matiz atual usando HSV
                const hsv = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
                currentHue = hsv.h;
                
                // Atualizar nome da cor no colorpicker
                colorName.textContent = this.querySelector('.color-option-name').textContent;
                
                // Atualizar interface do colorpicker
                updateColorPickerUI();
                
                // Reposicionar o colorpicker
                const elementRect = this.getBoundingClientRect();
                const editorSection = document.querySelector('.editor-section');
                const editorRect = editorSection.getBoundingClientRect();
                
                // Calcular posição relativa ao elemento clicado
                let top = elementRect.bottom - editorRect.top;
                let left = elementRect.left - editorRect.left;
                
                // Ajustar posição horizontal
                const colorPickerWidth = colorPickerModal.offsetWidth;
                if (left + colorPickerWidth > editorRect.width) {
                    left = editorRect.width - colorPickerWidth - 20;
                }
                
                // Ajustar posição vertical
                const colorPickerHeight = colorPickerModal.offsetHeight;
                const spaceBelow = editorRect.height - top;
                const spaceAbove = top;
                
                if (spaceBelow < colorPickerHeight && spaceAbove > colorPickerHeight) {
                    // Se não houver espaço abaixo mas houver acima, posicionar acima
                    top = top - colorPickerHeight - elementRect.height - 10;
                } else if (spaceBelow < colorPickerHeight && spaceAbove < colorPickerHeight) {
                    // Se não houver espaço nem acima nem abaixo, posicionar no centro da seção
                    top = Math.max(10, (editorRect.height - colorPickerHeight) / 2);
                } else {
                    // Caso contrário, posicionar abaixo com um pequeno espaçamento
                    top = top + 10;
                }
                
                // Garantir que o colorpicker não saia dos limites da seção
                left = Math.max(10, Math.min(left, editorRect.width - colorPickerWidth - 10));
                top = Math.max(10, Math.min(top, editorRect.height - colorPickerHeight - 10));
                
                // Aplicar posição com animação
                gsap.to(colorPickerModal, {
                    top: `${top}px`,
                    left: `${left}px`,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                // Atualizar os valores dos sliders
                redSlider.value = currentColor.r;
                greenSlider.value = currentColor.g;
                blueSlider.value = currentColor.b;
                alphaSlider.value = currentColor.a;
                
                // Atualizar a cor do preview
                colorPreview.style.backgroundColor = rgbaToString(currentColor);
                colorValue.textContent = rgbaToString(currentColor);
            } else {
                // Se não estiver aberto, abrir normalmente
                openColorPicker(colorVar, this);
            }
        });
    });

    function hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: 1
        } : { r: 0, g: 0, b: 0, a: 1 };
    }
    
    function rgbaToHex(rgba) {
        return `#${rgba.r.toString(16).padStart(2, '0')}${rgba.g.toString(16).padStart(2, '0')}${rgba.b.toString(16).padStart(2, '0')}`;
    }
    
    function rgbaToString(rgba) {
        if (rgba.a < 1) {
            return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(2)})`;
        } else {
            return rgbaToHex(rgba);
        }
    }
    
    // Conversão RGB para HSV
    function rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, v = max;
        
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        
        if (max === min) {
            h = 0; // acromático
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return { h: h * 360, s: s, v: v };
    }
    
    // Conversão HSV para RGB
    function hsvToRgb(h, s, v) {
        h /= 360;
        let r, g, b;
        
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    // Conversões entre HSL e HSV (necessárias para compatibilidade)
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // acromático
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return { h: h * 360, s: s, l: l };
    }
    
    function hslToRgb(h, s, l) {
        h /= 360;
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // acromático
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    function updateColorPickerUI() {
        // Atualizar a cor de visualização
        colorPreview.style.backgroundColor = rgbaToString(currentColor);
        colorValue.textContent = rgbaToString(currentColor);
        
        // Atualizar sliders RGB
        redSlider.value = currentColor.r;
        greenSlider.value = currentColor.g;
        blueSlider.value = currentColor.b;
        alphaSlider.value = currentColor.a;
        
        // Atualizar a cor de fundo do grid com base no matiz atual
        const pureColor = hsvToRgb(currentHue, 1, 1);
        
        // Definir a cor atual no grid para o gradiente
        const colorGridWhite = document.querySelector('.color-grid-white');
        colorGridWhite.style.setProperty('--current-color', `rgb(${pureColor.r}, ${pureColor.g}, ${pureColor.b})`);
        
        // Calcular valores HSV da cor atual para posicionar o cursor corretamente
        const hsvColor = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
        
        // Posicionar cursor na grade (saturação no eixo X, valor no eixo Y invertido)
        const x = hsvColor.s * 100;
        const y = (1 - hsvColor.v) * 100;
        
        // Posicionar cursor na grade
        colorGridCursor.style.left = `${Math.max(0, Math.min(100, x))}%`;
        colorGridCursor.style.top = `${Math.max(0, Math.min(100, y))}%`;
        
        // Posicionar thumb no slider de matiz
        hueSliderThumb.style.left = `${(currentHue / 360) * 100}%`;
        
        // Atualizar o gradiente alpha com a cor atual
        alphaGradient.style.background = `linear-gradient(to right, rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0), rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 1))`;
        
        // Posicionar thumb no slider de alpha
        alphaSliderThumb.style.left = `${currentColor.a * 100}%`;
    }
    
    
    function openColorPicker(colorVar, element) {
        activeColorVar = colorVar;
        activeColorOption = element;
        
        // Obter a cor atual da variável CSS
        const computedStyle = getComputedStyle(document.documentElement);
        originalColor = computedStyle.getPropertyValue(colorVar).trim();
        
        // Converter para RGB
        if (originalColor.startsWith('rgba')) {
            const rgba = originalColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (rgba) {
                currentColor = {
                    r: parseInt(rgba[1]),
                    g: parseInt(rgba[2]),
                    b: parseInt(rgba[3]),
                    a: parseFloat(rgba[4])
                };
            }
        } else if (originalColor.startsWith('rgb')) {
            const rgb = originalColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgb) {
                currentColor = {
                    r: parseInt(rgb[1]),
                    g: parseInt(rgb[2]),
                    b: parseInt(rgb[3]),
                    a: 1
                };
            }
        } else {
            // Remover espaços e o "#" inicial se houver
            const cleanHex = originalColor.replace(/\s+/g, '').replace('#', '');
            const rgb = hexToRgb(cleanHex.length > 0 ? '#' + cleanHex : '#8a2be2');
            currentColor = rgb;
        }
        
        // Calcular o matiz atual usando HSV
        const hsv = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
        currentHue = hsv.h;
        
        // Atualizar nome da cor no colorpicker
        colorName.textContent = element.querySelector('.color-option-name').textContent;
        
        // Atualizar interface do colorpicker
        updateColorPickerUI();
        
        // Obter as dimensões e posições dos elementos
        const elementRect = element.getBoundingClientRect();
        const editorSection = document.querySelector('.editor-section');
        const editorRect = editorSection.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calcular posição relativa ao elemento clicado
        let top = elementRect.bottom - editorRect.top;
        let left = elementRect.left - editorRect.left;
        
        // Ajustar posição horizontal
        const colorPickerWidth = colorPickerModal.offsetWidth;
        if (left + colorPickerWidth > editorRect.width) {
            left = editorRect.width - colorPickerWidth - 20;
        }
        
        // Ajustar posição vertical
        const colorPickerHeight = colorPickerModal.offsetHeight;
        const spaceBelow = editorRect.height - top;
        const spaceAbove = top;
        
        if (spaceBelow < colorPickerHeight && spaceAbove > colorPickerHeight) {
            // Se não houver espaço abaixo mas houver acima, posicionar acima
            top = top - colorPickerHeight - elementRect.height - 10;
        } else if (spaceBelow < colorPickerHeight && spaceAbove < colorPickerHeight) {
            // Se não houver espaço nem acima nem abaixo, posicionar no centro da seção
            top = Math.max(10, (editorRect.height - colorPickerHeight) / 2);
        } else {
            // Caso contrário, posicionar abaixo com um pequeno espaçamento
            top = top + 10;
        }
        
        // Garantir que o colorpicker não saia dos limites da seção
        left = Math.max(10, Math.min(left, editorRect.width - colorPickerWidth - 10));
        top = Math.max(10, Math.min(top, editorRect.height - colorPickerHeight - 10));
        
        // Aplicar posição
        colorPickerModal.style.top = `${top}px`;
        colorPickerModal.style.left = `${left}px`;
        
        // Mostrar o colorpicker com animação
        colorPickerModal.style.display = 'block';
        gsap.fromTo(colorPickerModal, 
            { opacity: 0, y: -10 }, 
            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
        
        // Definir os valores iniciais para os sliders
        redSlider.value = currentColor.r;
        greenSlider.value = currentColor.g;
        blueSlider.value = currentColor.b;
        alphaSlider.value = currentColor.a;
        
        // Atualizar a cor do preview
        colorPreview.style.backgroundColor = rgbaToString(currentColor);
        colorValue.textContent = rgbaToString(currentColor);
        
        // Adicionar evento de clique fora para fechar o colorpicker
        setTimeout(() => {
            document.addEventListener('mousedown', closeColorPickerOnClickOutside);
        }, 10);
    }
    
    // Função para fechar o colorpicker ao clicar fora dele
    function closeColorPickerOnClickOutside(e) {
        if (colorPickerModal.style.display === 'block') {
            // Verificar se o clique foi em um elemento de cor
            const isColorOption = e.target.closest('.color-option');
            
            // Se for um elemento de cor, não fazer nada (o evento de clique do elemento já tratará isso)
            if (isColorOption) {
                return;
            }
            
            const isClickInside = colorPickerModal.contains(e.target) || 
                                 activeColorOption.contains(e.target);
                                 
            if (!isClickInside) {
                closeColorPicker(true);
                document.removeEventListener('mousedown', closeColorPickerOnClickOutside);
            }
        }
    }
    
    function closeColorPicker(confirm = false) {
        document.removeEventListener('mousedown', closeColorPickerOnClickOutside);
        
        gsap.to(colorPickerModal, {
            opacity: 0,
            y: -10,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                colorPickerModal.style.display = 'none';
                
                if (!confirm) {
                    // Restaurar a cor original
                    document.documentElement.style.setProperty(activeColorVar, originalColor);
                }
            }
        });
    }
    
    function updateColorFromGrid(e) {
        const rect = colorPickerGrid.getBoundingClientRect();
        let x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        let y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        
        // Converter posição para saturação e valor no modelo HSV
        const s = x;
        const v = 1 - y;
        
        // Converter HSV para RGB usando o matiz atual e a saturação/valor da posição do mouse
        const rgb = hsvToRgb(currentHue, s, v);
        currentColor.r = rgb.r;
        currentColor.g = rgb.g;
        currentColor.b = rgb.b;
        
        // Atualizar UI e aplicar a cor
        updateColorPickerUI();
        applyCurrentColor();
    }
    
    function updateColorFromHue(e) {
        const rect = colorPickerHue.getBoundingClientRect();
        let x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        // Converter posição para ângulo de matiz (0-360)
        currentHue = x * 360;
        
        // Obter valores S e V atuais da cor corrente
        const hsv = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
        
        // Converter novo HSV para RGB mantendo S e V
        const rgb = hsvToRgb(currentHue, hsv.s, hsv.v);
        currentColor.r = rgb.r;
        currentColor.g = rgb.g;
        currentColor.b = rgb.b;
        
        // Atualizar UI e aplicar a cor
        updateColorPickerUI();
        applyCurrentColor();
    }
    
    function updateColorFromAlpha(e) {
        const rect = colorPickerAlpha.getBoundingClientRect();
        let x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        // Definir valor alpha
        currentColor.a = x;
        
        // Atualizar UI e aplicar a cor
        updateColorPickerUI();
        applyCurrentColor();
    }
    
    function updateColorFromRGBASliders() {
        currentColor.r = parseInt(redSlider.value);
        currentColor.g = parseInt(greenSlider.value);
        currentColor.b = parseInt(blueSlider.value);
        currentColor.a = parseFloat(alphaSlider.value);
        
        // Calcular o novo matiz
        const hsl = rgbToHsl(currentColor.r, currentColor.g, currentColor.b);
        currentHue = hsl.h;
        
        // Atualizar UI e aplicar a cor
        updateColorPickerUI();
        applyCurrentColor();
    }
    
    function applyCurrentColor() {
        const colorStr = rgbaToString(currentColor);
        if (activeColorVar && colorStr) {
            // Aplicar a cor à variável CSS
            document.documentElement.style.setProperty(activeColorVar, colorStr);
            
            // Atualizar o valor exibido
            if (colorValue) {
                colorValue.textContent = colorStr;
            }
            
            // Atualizar o preview de cor
            if (colorPreview) {
                colorPreview.style.backgroundColor = colorStr;
            }
            
            // Atualizar o estilo do elemento de preview
            const previewElement = document.querySelector(`.preview-element[data-color-var="${activeColorVar}"]`);
            if (previewElement) {
                previewElement.style.backgroundColor = colorStr;
            }
        }
    }
    function updatePreviewStyles(cssVar, value) {
        // Adicionar animações específicas quando certas propriedades mudam
        if (cssVar === '--borda-arredondada') {
            gsap.to('.demo-component, .demo-card, .demo-button', {
                borderRadius: value,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.fromTo('.demo-tag',
                { scale: 0.95, borderRadius: value },
                { scale: 1, borderRadius: value, duration: 0.4, stagger: 0.05, ease: "back.out(1.7)" }
            );
        }
        
        if (cssVar === '--espacamento-padrao') {
            gsap.to('.store-demo-components', {
                gap: value,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.to('.demo-component', {
                padding: value,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    }
    
    // Atualizar valores de range
    function updateRangeValue(input) {
        const value = input.value;
        const unit = input.dataset.unit || '';
        const cssVar = input.dataset.var;
        const valueElementId = input.id + 'Value';
        const valueElement = document.getElementById(valueElementId);
        
        // Verificar se o elemento existe antes de atualizar seu conteúdo
        if (valueElement) {
            valueElement.textContent = value + unit;
        }
        
        
        document.documentElement.style.setProperty(cssVar, value + unit);
        
        // Atualizar elementos adicionais para o novo range slider
        const bubbleId = input.id + 'Bubble';
        const bubbleElement = document.getElementById(bubbleId);
        
        if (bubbleElement) {
            bubbleElement.textContent = value + unit;
            
            // Calcular a posição da bolha
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);
            const percent = ((value - min) / (max - min)) * 100;
            
            // Posicionar a bolha
            bubbleElement.style.left = `${percent}%`;
        }
        
        // Atualizar previews específicos conforme necessário
        if (cssVar === '--borda-arredondada') {
            gsap.to('.demo-component, .demo-card, .demo-button', {
                borderRadius: value + unit,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.fromTo('.demo-tag',
                { scale: 0.95, borderRadius: value + unit },
                { scale: 1, borderRadius: value + unit, duration: 0.4, stagger: 0.05, ease: "back.out(1.7)" }
            );
        }
        
        if (cssVar === '--espacamento-padrao') {
            gsap.to('.store-demo-components', {
                gap: value + unit,
                duration: 0.3,
                ease: "power2.out"
            });
            
            gsap.to('.demo-component', {
                padding: value + unit,
                duration: 0.3,
                ease: "power2.out"
            });
        }

        if (input.id === 'espacamentoPadrao') {
            adjustEditorHeight()
            setTimeout(() => {
                adjustEditorHeight()
            }, 300);
        }
    }
    
    
    
    // Inicializar os range sliders modernos
    function initModernRangeSliders() {
        const modernRangeSliders = document.querySelectorAll('.modern-range-slider');
        
        modernRangeSliders.forEach(slider => {
            // Configurar valores iniciais
            updateRangeValue(slider);
            
            // Animar marcadores de ticks na inicialização
            const sliderContainer = slider.closest('.range-slider-container');
            const ticks = sliderContainer.querySelectorAll('.range-tick');
            
            gsap.fromTo(ticks, 
                { height: 0, opacity: 0 },
                { 
                    height: 6, 
                    opacity: 1, 
                    duration: 0.5, 
                    stagger: 0.1, 
                    ease: "power2.out",
                    delay: 0.2
                }
            );
            
            // Adicionar eventos para atualização em tempo real
            slider.addEventListener('input', function() {
                updateRangeValue(this);
                
                // Animação extra ao mover o slider
                const valueElement = document.getElementById(this.id + 'Value');
                if (valueElement) {
                    gsap.fromTo(valueElement,
                        { scale: 1.1, backgroundColor: "rgba(138, 43, 226, 0.2)" },
                        { scale: 1, backgroundColor: "rgba(138, 43, 226, 0.1)", duration: 0.4, ease: "power2.out" }
                    );
                }
                
                // Colorir ticks com base no valor atual
                const min = parseFloat(this.min);
                const max = parseFloat(this.max);
                const value = parseFloat(this.value);
                const percent = (value - min) / (max - min);
                const tickCount = ticks.length;
                
                ticks.forEach((tick, index) => {
                    const tickPercent = index / (tickCount - 1);
                    if (tickPercent <= percent) {
                        gsap.to(tick, { 
                            backgroundColor: "var(--main-color-purple)", 
                            height: 8, 
                            duration: 0.3 
                        });
                    } else {
                        gsap.to(tick, { 
                            backgroundColor: "var(--tertiary-color)", 
                            height: 6, 
                            duration: 0.3 
                        });
                    }
                });
            });
            
            // Animação quando o mouse entra no slider
            slider.addEventListener('mouseenter', function() {
                const id = this.id;
                const elements = {
                    bubble: document.getElementById(id + 'Bubble'),
                    progress: document.getElementById(id + 'Progress')
                };
                
                if (elements.bubble) {
                    gsap.to(elements.bubble, {
                        opacity: 1,
                        top: '-25px',
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
                
                if (elements.progress) {
                    gsap.to(elements.progress, {
                        height: 10,
                        opacity: 1,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
                
                gsap.to(this, {
                    boxShadow: "0 0 0 5px rgba(138, 43, 226, 0.1)",
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
            
            // Animação quando o mouse sai do slider
            slider.addEventListener('mouseleave', function() {
                const id = this.id;
                const elements = {
                    bubble: document.getElementById(id + 'Bubble'),
                    progress: document.getElementById(id + 'Progress')
                };
                
                if (elements.bubble) {
                    gsap.to(elements.bubble, {
                        opacity: 0,
                        top: '-10px',
                        duration: 0.3,
                        ease: "power2.in"
                    });
                }
                
                if (elements.progress) {
                    gsap.to(elements.progress, {
                        height: 8,
                        opacity: 0.9,
                        duration: 0.3,
                        ease: "power2.in"
                    });
                }
                
                gsap.to(this, {
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
        });
    }
    
    
    
    colorPickerGrid.addEventListener('mousedown', function(e) {
        isDraggingGrid = true;
        updateColorFromGrid(e);
    });
    
    colorPickerHue.addEventListener('mousedown', function(e) {
        isDraggingHue = true;
        updateColorFromHue(e);
    });
    
    colorPickerAlpha.addEventListener('mousedown', function(e) {
        isDraggingAlpha = true;
        updateColorFromAlpha(e);
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDraggingGrid) {
            updateColorFromGrid(e);
        } else if (isDraggingHue) {
            updateColorFromHue(e);
        } else if (isDraggingAlpha) {
            updateColorFromAlpha(e);
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDraggingGrid = false;
        isDraggingHue = false;
        isDraggingAlpha = false;
    });
    
    redSlider.addEventListener('input', updateColorFromRGBASliders);
    greenSlider.addEventListener('input', updateColorFromRGBASliders);
    blueSlider.addEventListener('input', updateColorFromRGBASliders);
    alphaSlider.addEventListener('input', updateColorFromRGBASliders);
    
    colorPresets.forEach(preset => {
        preset.addEventListener('click', function() {
            const color = this.dataset.color;
            updateColorFromPresets(color);
            closeColorPicker(true);
            
            // Animação de seleção
            gsap.fromTo(this, 
                { scale: 0.8 }, 
                { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1, ease: "back.out(2)" }
            );
        });
    });
    
    cancelColorBtn.addEventListener('click', function() {
        closeColorPicker(false);
    });
    
    confirmColorBtn.addEventListener('click', function() {
        closeColorPicker(true);
    });
    
    copyColorBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(colorValue.textContent)
            .then(() => {
                // Feedback visual
                gsap.fromTo(this, 
                    { scale: 0.8 }, 
                    { scale: 1, duration: 0.3, ease: "back.out(2)" }
                );
            });
    });
    

    // Inicializar os range sliders modernos
    initModernRangeSliders();
    
    // Evento para o nome da loja
    displayNameInput.addEventListener('input', function() {
        previewStoreName.textContent = this.value;
    });
    
    function collectSettings() {
        const settings = {};
        
        // Coletar valores das variáveis de cor
        colorOptions.forEach(option => {
            const colorVar = option.dataset.colorVar;
            const computedStyle = getComputedStyle(document.documentElement);
            settings[colorVar] = computedStyle.getPropertyValue(colorVar).trim();
        });
        
        // Coletar valores dos sliders de range
        rangeSliders.forEach(input => {
            const cssVar = input.dataset.var;
            const value = input.value + (input.dataset.unit || '');
            settings[cssVar] = value;
        });
        
        settings['displayName'] = displayNameInput.value;
        
        return settings;
    }
    
    
    
    // Evento para resetar para valores padrão
    resetButton.addEventListener('click', function() {
        // Resetar cores
        colorOptions.forEach(option => {
            const colorVar = option.dataset.colorVar;
            const defaultValue = defaultValues[colorVar];
            document.documentElement.style.setProperty(colorVar, defaultValue);
            updateColorPreview(option, defaultValue);
        });
        
        // Resetar sliders
        rangeSliders.forEach(input => {
            const cssVar = input.dataset.var;
            const defaultValue = defaultValues[cssVar];
            const numericValue = parseFloat(defaultValue);
            input.value = numericValue;
            updateRangeValue(input);
        });
        
        // Resetar informações da loja
        displayNameInput.value = defaultValues.displayName;
        previewStoreName.textContent = defaultValues.displayName;
        previewBanner.src = 'https://placehold.co/800x400?text=BANNER';
        logoFileName.textContent = 'Nenhum arquivo selecionado';
        backgroundFileName.textContent = 'Nenhum arquivo selecionado';
        
        
        gsap.fromTo(storePreview, 
            { opacity: 0.5, scale: 0.95 }, 
            { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
        );
    });
    
    // Inicialização do seletor de cores
    function initColorPicker() {
        // Definir o matiz inicial
        if (!currentHue) {
            // Se não estiver definido, calcular com base na cor atual
            const hsv = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
            currentHue = hsv.h;
        }
        
        // Definir a cor inicial para o grid baseado no matiz atual
        const initialColor = hsvToRgb(currentHue, 1, 1);
        
        // Definir a cor atual no grid
        const colorGridWhite = document.querySelector('.color-grid-white');
        colorGridWhite.style.setProperty('--current-color', `rgb(${initialColor.r}, ${initialColor.g}, ${initialColor.b})`);
        
        // Inicializar posição dos controles
        hueSliderThumb.style.left = `${(currentHue / 360) * 100}%`;
        alphaSliderThumb.style.left = `${currentColor.a * 100}%`;
        
        // Inicializar valores dos sliders
        redSlider.value = currentColor.r;
        greenSlider.value = currentColor.g;
        blueSlider.value = currentColor.b;
        alphaSlider.value = currentColor.a;
        
        // Posicionar cursor na grade
        const hsv = rgbToHsv(currentColor.r, currentColor.g, currentColor.b);
        colorGridCursor.style.left = `${hsv.s * 100}%`;
        colorGridCursor.style.top = `${(1 - hsv.v) * 100}%`;
        
        // Inicializar gradiente alpha
        alphaGradient.style.background = `linear-gradient(to right, rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0), rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 1))`;
    }
    
    // Adicionar chamada da inicialização ao final do script
    initColorPicker();
    
    // Inicializar animações quando a página carregar
    setupAnimations();
    
    // Referências aos elementos de fonte
    const fontSelector = document.getElementById('fontSelector');
    const fontPreviewText = document.getElementById('fontPreviewText');
    const tamanhoFonte = document.getElementById('tamanhoFonte');
    
    // Função para atualizar a fonte na visualização
    function updateFont() {
        const selectedFont = fontSelector.value;
        const fontSize = tamanhoFonte.value + 'px';
        
        // Atualizar as variáveis CSS
        document.documentElement.style.setProperty('--fonte-principal', selectedFont);
        document.documentElement.style.setProperty('--tamanho-fonte-base', fontSize);
        
        // Atualizar o texto de preview com a fonte selecionada
        fontPreviewText.style.fontFamily = selectedFont;
        fontPreviewText.style.fontSize = fontSize;
        
        // Atualizar todos os elementos de texto no preview
        const previewElements = document.querySelectorAll('.store-preview *');
        previewElements.forEach(element => {
            // Aplicar a fonte para todos os elementos de texto
            if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3' || 
                element.tagName === 'H4' || element.tagName === 'P' || element.tagName === 'SPAN' ||
                element.tagName === 'BUTTON' || element.tagName === 'LABEL') {
                element.style.fontFamily = selectedFont;
                element.style.fontSize = fontSize;
            }
        });
        
        // Atualizar elementos específicos do preview
        const storeName = document.getElementById('previewStoreName');
        const demoTitle = document.querySelector('.store-demo-title');
        const demoComponents = document.querySelectorAll('.demo-component h3');
        const demoTexts = document.querySelectorAll('.demo-text-title, .demo-text-primary, .demo-text-secondary, .demo-text-tertiary');
        const demoButtons = document.querySelectorAll('.demo-button');
        const demoTags = document.querySelectorAll('.demo-tag');
        
        if (storeName) storeName.style.fontFamily = selectedFont;
        if (demoTitle) demoTitle.style.fontFamily = selectedFont;
        demoComponents.forEach(comp => comp.style.fontFamily = selectedFont);
        demoTexts.forEach(text => text.style.fontFamily = selectedFont);
        demoButtons.forEach(button => button.style.fontFamily = selectedFont);
        demoTags.forEach(tag => tag.style.fontFamily = selectedFont);
        
        // Animar a mudança de fonte
        gsap.fromTo(fontPreviewText, 
            { opacity: 0, y: -5 }, 
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        );
        
        // Animar a mudança de fonte nos elementos de demonstração
        gsap.fromTo('.demo-component', 
            { opacity: 0.8 }, 
            { opacity: 1, duration: 0.5, stagger: 0.05, ease: "power2.out" }
        );
    }
    
    
    
    document.addEventListener('DOMContentLoaded', function() {
       
        rangeSliders.forEach(slider => {
            slider.addEventListener('input', function() {
                updateRangeValue(this);
            });
            // Inicializar os valores
            updateRangeValue(slider);
        });
        
        // Inicializar os range sliders modernos
        initModernRangeSliders();
        
        
        // Evento para o nome da loja
        storeNameInput.addEventListener('input', function() {
            storeName.textContent = this.value || 'Nome da Loja';
        });
        
        // Eventos para o colorpicker
        colorPresets.forEach(preset => {
            preset.addEventListener('click', function() {
                const color = this.dataset.color;
                if (color) {
                    // Converter hex para RGB
                    const rgb = hexToRgb(color);
                    currentColor = rgb;
                    
                    // Atualizar o matiz
                    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
                    currentHue = hsv.h;
                    
                    // Atualizar UI
                    updateColorPickerUI();
                    applyCurrentColor();
                }
            });
        });
        
        colorPickerGrid.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Previne comportamentos padrão
            isColorGridActive = true;
            
            // Remover qualquer transição no cursor para movimento instantâneo
            colorGridCursor.style.transition = 'none';
            
            // Atualizar a cor e posição do cursor
            updateColorFromGrid(e);
            
            function handleGridMove(e) {
                if (isColorGridActive) {
                    e.preventDefault(); // Previne comportamentos padrão
                    e.stopPropagation(); // Impede propagação para outros elementos
                    updateColorFromGrid(e);
                }
            }
            
            function handleMouseUp(e) {
                e.preventDefault(); // Previne comportamentos padrão
                isColorGridActive = false;
                
                // Restaurar transição do cursor
                setTimeout(() => {
                    colorGridCursor.style.transition = '';
                }, 100);
                
                document.removeEventListener('mousemove', handleGridMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
            
            document.addEventListener('mousemove', handleGridMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        colorPickerHue.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Previne comportamentos padrão
            isHueSliderActive = true;
            
            // Remover qualquer transição no thumb para movimento instantâneo
            hueSliderThumb.style.transition = 'none';
            
            updateColorFromHue(e);
            
            function handleHueMove(e) {
                if (isHueSliderActive) {
                    e.preventDefault(); // Previne comportamentos padrão
                    e.stopPropagation(); // Impede propagação para outros elementos
                    updateColorFromHue(e);
                }
            }
            
            function handleMouseUp(e) {
                e.preventDefault(); // Previne comportamentos padrão
                isHueSliderActive = false;
                
                // Restaurar transição do thumb
                setTimeout(() => {
                    hueSliderThumb.style.transition = '';
                }, 100);
                
                document.removeEventListener('mousemove', handleHueMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
            
            document.addEventListener('mousemove', handleHueMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        colorPickerAlpha.addEventListener('mousedown', function(e) {
            e.preventDefault(); // Previne comportamentos padrão
            isAlphaSliderActive = true;
            
            // Remover qualquer transição no thumb para movimento instantâneo
            alphaSliderThumb.style.transition = 'none';
            
            updateColorFromAlpha(e);
            
            function handleAlphaMove(e) {
                if (isAlphaSliderActive) {
                    e.preventDefault(); // Previne comportamentos padrão
                    e.stopPropagation(); // Impede propagação para outros elementos
                    updateColorFromAlpha(e);
                }
            }
            
            function handleMouseUp(e) {
                e.preventDefault(); // Previne comportamentos padrão
                isAlphaSliderActive = false;
                
                // Restaurar transição do thumb
                setTimeout(() => {
                    alphaSliderThumb.style.transition = '';
                }, 100);
                
                document.removeEventListener('mousemove', handleAlphaMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
            
            document.addEventListener('mousemove', handleAlphaMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        // Remover os antigos listeners de eventos globais
        document.removeEventListener('mousemove', function(e) {
            if (isColorGridActive) updateColorFromGrid(e);
            if (isHueSliderActive) updateColorFromHue(e);
            if (isAlphaSliderActive) updateColorFromAlpha(e);
        });
        
        document.removeEventListener('mouseup', function() {
            isColorGridActive = false;
            isHueSliderActive = false;
            isAlphaSliderActive = false;
        });
        
        // Eventos para os sliders RGB e Alpha
        redSlider.addEventListener('input', updateColorFromSliders);
        greenSlider.addEventListener('input', updateColorFromSliders);
        blueSlider.addEventListener('input', updateColorFromSliders);
        alphaSlider.addEventListener('input', updateColorFromSliders);
        
        // Eventos para os botões do color picker
        cancelColorBtn.addEventListener('click', cancelColorPicker);
        confirmColorBtn.addEventListener('click', confirmColorPicker);
        copyColorBtn.addEventListener('click', copyColorValue);
        
        // Inicializar animações quando a página carregar
        setupAnimations();
    });

    // Inicializar o colorpicker quando for aberto
    function updateColorFromPresets(color) {
        if (color) {
            // Converter hex para RGB
            const rgb = hexToRgb(color);
            currentColor = rgb;
            
            // Atualizar o matiz
            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            currentHue = hsv.h;
            
            // Atualizar UI e aplicar a cor
            updateColorPickerUI();
            applyCurrentColor();
        }
    }

    // Remover os eventos duplicados
    // document.addEventListener('DOMContentLoaded', function() {
    //     // Inicializar controles
    //     setupRangeSliders();
    //     setupAnimations();
        
    //     // Remover eventos duplicados para o colorpicker
    //     document.querySelectorAll('.color-option').forEach(option => {
    //         const clone = option.cloneNode(true);
    //         option.parentNode.replaceChild(clone, option);
            
    //         // Adicionar o atributo data-color-var se não existir
    //         if (!clone.hasAttribute('data-color-var')) {
    //             const onclick = clone.getAttribute('onclick');
    //             if (onclick) {
    //                 const matches = onclick.match(/'([^']+)'/);
    //                 if (matches && matches[1]) {
    //                     clone.setAttribute('data-color-var', matches[1]);
    //                 }
    //             }
    //         }
            
    //     });
    // });
});

// Inicializar os range sliders modernos
function setupRangeSliders() {
    const modernRangeSliders = document.querySelectorAll('.modern-range-slider');
    
    modernRangeSliders.forEach(slider => {
        // Configurar valores iniciais
        const value = slider.value;
        const unit = slider.dataset.unit || '';
        const cssVar = slider.dataset.var;
        
        // Atualizar variável CSS
        if (cssVar) {
            document.documentElement.style.setProperty(cssVar, value + unit);
            
            // Atualizar o preview inicialmente se necessário
            if (cssVar === '--borda-arredondada') {
                gsap.set('.demo-component, .demo-card, .demo-button, .demo-tag', {
                    borderRadius: value + unit
                });
            }
            
            if (cssVar === '--espacamento-padrao') {
                gsap.set('.store-demo-components', {
                    gap: value + unit
                });
                
                gsap.set('.demo-component', {
                    padding: value + unit
                });
            }
        }
        
        // Atualizar a bolha de valor
        const bubbleId = slider.id + 'Bubble';
        const bubbleElement = document.getElementById(bubbleId);
        if (bubbleElement) {
            bubbleElement.textContent = value + unit;
            
            // Posicionar a bolha de acordo com o valor
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const percent = ((value - min) / (max - min)) * 100;
            bubbleElement.style.left = `${percent +1}%`;
        }
        
        // Atualizar o elemento de valor fixo
        const valueElementId = slider.id + 'Value';
        const valueElement = document.getElementById(valueElementId);
        if (valueElement) {
            valueElement.textContent = value + unit;
        }
        
        // Adicionar eventos para atualização em tempo real
        slider.addEventListener('input', function() {
            const value = this.value;
            const unit = this.dataset.unit || '';
            const cssVar = this.dataset.var;
            
            // Atualizar variável CSS
            if (cssVar) {
                document.documentElement.style.setProperty(cssVar, value + unit);
            }
            
            // Atualizar a bolha de valor
            if (bubbleElement) {
                bubbleElement.textContent = value + unit;
                
                // Calcular a posição da bolha
                const min = parseFloat(this.min);
                const max = parseFloat(this.max);
                const percent = ((value - min) / (max - min)) * 100;
                
                // Posicionar a bolha
                bubbleElement.style.left = `${percent +1}%`;
            }
            
            // Atualizar o elemento de valor
            if (valueElement) {
                valueElement.textContent = value + unit;
                
                // Animar mudança de valor
                gsap.fromTo(valueElement,
                    { scale: 1.1, backgroundColor: "rgba(138, 43, 226, 0.2)" },
                    { scale: 1, backgroundColor: "rgba(138, 43, 226, 0.1)", duration: 0.4, ease: "power2.out" }
                );
            }
            
            // Animar os ticks
            const ticks = this.parentElement.querySelectorAll('.range-tick');
            if (ticks.length > 0) {
                const min = parseFloat(this.min);
                const max = parseFloat(this.max);
                const percent = (value - min) / (max - min);
                const tickCount = ticks.length;
                
                ticks.forEach((tick, index) => {
                    const tickPercent = index / (tickCount - 1);
                    if (tickPercent <= percent) {
                        gsap.to(tick, { 
                            backgroundColor: "var(--main-color-purple)", 
                            height: 8, 
                            duration: 0.3 
                        });
                    } else {
                        gsap.to(tick, { 
                            backgroundColor: "var(--tertiary-color)", 
                            height: 6, 
                            duration: 0.3 
                        });
                    }
                });
            }

            // Atualizar previews específicos conforme necessário
            if (cssVar === '--borda-arredondada') {
                gsap.to('.demo-component, .demo-card, .demo-button', {
                    borderRadius: value + unit,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                gsap.fromTo('.demo-tag',
                    { scale: 0.95, borderRadius: value + unit },
                    { scale: 1, borderRadius: value + unit, duration: 0.4, stagger: 0.05, ease: "back.out(1.7)" }
                );
            }
            
            if (cssVar === '--espacamento-padrao') {
                gsap.to('.store-demo-components', {
                    gap: value + unit,
                    duration: 0.3,
                    ease: "power2.out"
                });
                
                gsap.to('.demo-component', {
                    padding: value + unit,
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
        
        // Animação quando o mouse entra no slider
        slider.addEventListener('mouseenter', function() {
            if (bubbleElement) {
                gsap.to(bubbleElement, {
                    opacity: 1,
                    top: '-10px',
                    duration: 0.3,
                    ease: "power2.out"
                });
            }
        });
        
        // Animação quando o mouse sai do slider
        slider.addEventListener('mouseleave', function() {
            if (bubbleElement) {
                gsap.to(bubbleElement, {
                    opacity: 0,
                    top: '0px',
                    duration: 0.3,
                    ease: "power2.in"
                });
            }
        });
    });
}
setupRangeSliders();
function adjustEditorHeight() {
    const editorSection1 = document.querySelector('#editor-section-1');
    const editorSection2 = document.querySelector('#editor-section-2');
    
    if (!editorSection1 || !editorSection2) return;
    // Reset heights before recalculating
    editorSection1.style.height = '';
    editorSection2.style.height = '';
    
    const previewSection = document.querySelector('.preview-section');
    if (!previewSection) return;
    
    const section2Rect = editorSection2.getBoundingClientRect();
    const previewRect = previewSection.getBoundingClientRect();
    
    const totalHeight = section2Rect.height + previewRect.height + 32;
    
    if (editorSection1.offsetHeight < totalHeight) {
        editorSection1.style.height = `${totalHeight}px`; 
    }
    
    editorSection2.style.height = `${editorSection1.offsetHeight - 32 - previewRect.height}px`;
}
document.addEventListener('DOMContentLoaded', adjustEditorHeight)
window.addEventListener('load', adjustEditorHeight);
window.addEventListener('resize', adjustEditorHeight);
const initialAdjustInterval = setInterval(() => {
    adjustEditorHeight();
    setTimeout(() => clearInterval(initialAdjustInterval), 1000);
}, 100);

// Adicionar evento de redimensionamento da janela para ajustar a posição do colorpicker
window.addEventListener('resize', function() {
    if (colorPickerModal.style.display === 'block' && activeColorOption) {
        // Recalcular a posição do colorpicker
        const elementRect = activeColorOption.getBoundingClientRect();
        const editorSection = document.querySelector('.editor-section');
        const editorRect = editorSection.getBoundingClientRect();
        
        // Calcular posição relativa ao elemento clicado
        let top = elementRect.bottom - editorRect.top;
        let left = elementRect.left - editorRect.left;
        
        // Ajustar posição horizontal
        const colorPickerWidth = colorPickerModal.offsetWidth;
        if (left + colorPickerWidth > editorRect.width) {
            left = editorRect.width - colorPickerWidth - 20;
        }
        
        // Ajustar posição vertical
        const colorPickerHeight = colorPickerModal.offsetHeight;
        const spaceBelow = editorRect.height - top;
        const spaceAbove = top;
        
        if (spaceBelow < colorPickerHeight && spaceAbove > colorPickerHeight) {
            // Se não houver espaço abaixo mas houver acima, posicionar acima
            top = top - colorPickerHeight - elementRect.height - 10;
        } else if (spaceBelow < colorPickerHeight && spaceAbove < colorPickerHeight) {
            // Se não houver espaço nem acima nem abaixo, posicionar no centro da seção
            top = Math.max(10, (editorRect.height - colorPickerHeight) / 2);
        } else {
            // Caso contrário, posicionar abaixo com um pequeno espaçamento
            top = top + 10;
        }
        
        // Garantir que o colorpicker não saia dos limites da seção
        left = Math.max(10, Math.min(left, editorRect.width - colorPickerWidth - 10));
        top = Math.max(10, Math.min(top, editorRect.height - colorPickerHeight - 10));
        
        // Aplicar posição
        colorPickerModal.style.top = `${top}px`;
        colorPickerModal.style.left = `${left}px`;
    }
});