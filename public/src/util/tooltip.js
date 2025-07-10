
class ModernTooltip {
    constructor() {
        // Uso de WeakMap para melhor gerenciamento de memória
        this.tooltipsMap = new WeakMap(); 
        this.activeTooltip = null;
        this.observers = new Map(); // Para rastrear observadores por elemento
        
        // Debounce para otimizar atualizações em massa
        this.updateDebounceTimers = new Map();
        
        // Container para todos os tooltips
        this.tooltipContainer = document.createElement('div');
        this.tooltipContainer.className = 'tooltip-container';
        this.tooltipContainer.style.position = 'absolute';
        this.tooltipContainer.style.top = '0';
        this.tooltipContainer.style.left = '0';
        this.tooltipContainer.style.width = '0';
        this.tooltipContainer.style.height = '0';
        this.tooltipContainer.style.overflow = 'visible';
        this.tooltipContainer.style.pointerEvents = 'none';
        this.tooltipContainer.style.zIndex = '1000';
        document.body.appendChild(this.tooltipContainer);
        
        // Inicializar todos os tooltips uma única vez
        this.initTooltips();
        
        // Configurar listeners de eventos uma única vez
        this.setupEventListeners();
        
        // Tornar a classe acessível globalmente com escopo limitado
        window.ModernTooltip = {
            updateTooltip: this.updateTooltip.bind(this),
            setObserve: this.setObserve.bind(this),
            initializeTooltip: this.initializeTooltip.bind(this),
            refreshAll: this.refreshAll.bind(this)
        };
    }

    initTooltips() {
        // Usar querySelector para selecionar elementos com data-tooltip
        const triggers = document.querySelectorAll('[data-tooltip]');
        
        // Usar for...of em vez de forEach para melhor performance
        for (const trigger of triggers) {
            this.initializeTooltip(trigger);
        }
    }
    
    refreshAll() {
        // Encontrar todos os elementos com data-tooltip e inicializar
        const triggers = document.querySelectorAll('[data-tooltip]');
        for (const trigger of triggers) {
            this.initializeTooltip(trigger);
        }
    }
    
    initializeTooltip(trigger) {
        // Adicionar classe tooltip-trigger se não existir
        if (!trigger.classList.contains('tooltip-trigger')) {
            trigger.classList.add('tooltip-trigger');
        }
        
        // Verificar se o tooltip já existe no mapa
        let entry = this.tooltipsMap.get(trigger);
        let tooltip;
        
        if (!entry) {
            tooltip = this.createTooltip(trigger);
            
            // Armazenar referência no WeakMap
            this.tooltipsMap.set(trigger, {
                tooltip: tooltip,
                observer: null
            });
            
            // Verificar se este elemento deve ser observado
            const shouldObserve = trigger.getAttribute('data-tooltip-observe') === 'true';
            if (shouldObserve) {
                this.setObserve(trigger, true);
            }
        } else {
            tooltip = entry.tooltip;
            // Atualizar conteúdo caso tenha mudado
            this.updateTooltipContent(tooltip, trigger);
        }
        
        return tooltip;
    }
    
    setObserve(triggerIdOrElement, observe = true) {
        const trigger = typeof triggerIdOrElement === 'string' 
            ? document.getElementById(triggerIdOrElement) 
            : triggerIdOrElement;
            
        if (!trigger || !trigger.hasAttribute('data-tooltip')) return false;
        
        // Atualizar o atributo
        trigger.setAttribute('data-tooltip-observe', observe ? 'true' : 'false');
        
        const entry = this.tooltipsMap.get(trigger);
        if (!entry) return false;
        
        // Se já tinha um observer, desconectar
        if (entry.observer) {
            entry.observer.disconnect();
            entry.observer = null;
        }
        
        // Se devemos observar, criar novo observer
        if (observe) {
            const observerConfig = { 
                attributes: true, 
                attributeFilter: ['data-tooltip', 'data-tooltip-title', 'data-tooltip-position'],
                subtree: false
            };
            
            const observer = new MutationObserver((mutations) => {
                // Usar debounce para não atualizar múltiplas vezes em sequência
                if (this.updateDebounceTimers.has(trigger)) {
                    clearTimeout(this.updateDebounceTimers.get(trigger));
                }
                
                this.updateDebounceTimers.set(trigger, setTimeout(() => {
                    this.updateTooltip(trigger);
                    this.updateDebounceTimers.delete(trigger);
                }, 50)); // 50ms debounce
            });
            
            observer.observe(trigger, observerConfig);
            entry.observer = observer;
        }
        
        return true;
    }
    
    createTooltip(trigger) {
        // Criar o elemento tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        
        // Definir posição
        const position = trigger.getAttribute('data-tooltip-position') || 'top';
        tooltip.classList.add(`tooltip-${position}`);
        
        // Adicionar um atributo de referência ao trigger
        const triggerId = trigger.id || `tooltip-trigger-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        if (!trigger.id) {
            trigger.id = triggerId;
        }
        tooltip.setAttribute('data-for', triggerId);
        
        // Obter conteúdo
        const content = trigger.getAttribute('data-tooltip');
        const title = trigger.getAttribute('data-tooltip-title');
        
        // Criar elementos internos com DocumentFragment para melhor performance
        const fragment = document.createDocumentFragment();
        
        // Adicionar título se fornecido
        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'tooltip-title';
            titleEl.textContent = title;
            fragment.appendChild(titleEl);
        }
        
        // Adicionar conteúdo
        const contentEl = document.createElement('div');
        contentEl.className = 'tooltip-content';
        contentEl.textContent = content;
        fragment.appendChild(contentEl);
        
        tooltip.appendChild(fragment);
        
        // Adicionar ao container em vez de ao body diretamente
        this.tooltipContainer.appendChild(tooltip);
        
        // Usar funções anônimas para evitar referências circulares
        const self = this;
        
        // Adicionar event listeners usando opções para melhor performance
        trigger.addEventListener('mouseenter', function() {
            self.showTooltip(tooltip, position, trigger);
        }, { passive: true });
        
        trigger.addEventListener('mouseleave', function() {
            self.hideTooltip(tooltip);
        }, { passive: true });
        
        return tooltip;
    }
    
    updateTooltip(triggerIdOrElement) {
        // Suporte para ID ou elemento
        const trigger = typeof triggerIdOrElement === 'string' 
            ? document.getElementById(triggerIdOrElement) 
            : triggerIdOrElement;
            
        if (!trigger) return false;
        
        // Recrear completamente o tooltip
        return this.forceRepositionTooltip(trigger);
    }
    
    updateTooltipContent(tooltip, trigger) {
        // Atualizar apenas o necessário
        const content = trigger.getAttribute('data-tooltip');
        const contentEl = tooltip.querySelector('.tooltip-content');
        if (contentEl && content !== null && contentEl.textContent !== content) {
            contentEl.textContent = content;
        }
        
        // Atualizar título
        const title = trigger.getAttribute('data-tooltip-title');
        let titleEl = tooltip.querySelector('.tooltip-title');
        
        if (title && !titleEl) {
            // Criar elemento de título se não existir
            titleEl = document.createElement('div');
            titleEl.className = 'tooltip-title';
            tooltip.insertBefore(titleEl, tooltip.firstChild);
            titleEl.textContent = title;
        } else if (titleEl && title !== null && titleEl.textContent !== title) {
            // Atualizar título existente
            titleEl.textContent = title;
        } else if (titleEl && !title) {
            // Remover título se não mais necessário
            titleEl.remove();
        }
    }

    showTooltip(tooltip, position, trigger) {
        // Esconder tooltip ativo anterior
        if (this.activeTooltip && this.activeTooltip !== tooltip) {
            this.hideTooltip(this.activeTooltip);
        }
        
        this.activeTooltip = tooltip;
        
        // Posicionar tooltip antes de mostrar
        this.positionTooltip(tooltip, position, trigger);
        
        // Tornar tooltip visível
        tooltip.style.visibility = 'visible';
        
        // Verificar se gsap está disponível
        if (typeof gsap !== 'undefined') {
            // Animação simplificada para melhor performance
            const animProps = {
                opacity: 0,
                scale: 0.9,
                duration: 0.3,
                ease: "power2.out",
                y: position === 'top' ? -10 : position === 'bottom' ? 10 : 0,
                x: position === 'left' ? -10 : position === 'right' ? 10 : 0
            };
            
            // Usar uma única animação GSAP para todo o tooltip
            gsap.fromTo(tooltip, 
                animProps,
                { 
                    opacity: 1, 
                    scale: 1, 
                    x: 0, 
                    y: 0,
                    duration: 0.3,
                    ease: "power2.out"
                }
            );
            
            // Animação simples para o elemento trigger
            gsap.to(trigger, {
                boxShadow: "0 5px 15px rgba(155, 93, 229, 0.2)",
                scale: 1.02,
                duration: 0.2,
                ease: "power2.out"
            });
        } else {
            // Fallback sem GSAP
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'scale(1)';
            
            // Adicionar classe para destacar o trigger
            trigger.classList.add('tooltip-active');
        }
    }

    hideTooltip(tooltip) {
        if (!tooltip) return;
        
        // Encontrar o trigger associado
        const triggerId = tooltip.getAttribute('data-for');
        const trigger = document.getElementById(triggerId);
        
        // Verificar se gsap está disponível
        if (typeof gsap !== 'undefined') {
            // Restaurar trigger se existir
            if (trigger) {
                gsap.to(trigger, {
                    boxShadow: "none",
                    scale: 1,
                    duration: 0.2,
                    ease: "power2.in"
                });
            }
            
            // Animação simples de saída
            gsap.to(tooltip, {
                opacity: 0,
                scale: 0.95,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                    tooltip.style.visibility = 'hidden';
                    if (this.activeTooltip === tooltip) {
                        this.activeTooltip = null;
                    }
                }
            });
        } else {
            // Fallback sem GSAP
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'scale(0.95)';
            
            // Remover classe do trigger
            if (trigger) {
                trigger.classList.remove('tooltip-active');
            }
            
            // Ocultar após transição
            setTimeout(() => {
                tooltip.style.visibility = 'hidden';
                if (this.activeTooltip === tooltip) {
                    this.activeTooltip = null;
                }
            }, 200);
        }
    }

    positionTooltip(tooltip, position, trigger) {
        if (!trigger) return;
        
        // Obter coordenadas do trigger
        const triggerRect = trigger.getBoundingClientRect();
        
        // Tornar o tooltip visível temporariamente para obter suas dimensões
        // mas de forma que não interfira visualmente
        const currentVisibility = tooltip.style.visibility;
        const currentDisplay = tooltip.style.display;
        const currentOpacity = tooltip.style.opacity;
        
        tooltip.style.visibility = 'hidden';
        tooltip.style.display = 'block';
        tooltip.style.opacity = '0';
        
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Posição do scroll
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Posição absoluta do trigger
        const triggerTop = triggerRect.top + scrollTop;
        const triggerLeft = triggerRect.left + scrollLeft;
        
        // Resetar posição
        tooltip.style.top = '';
        tooltip.style.bottom = '';
        tooltip.style.left = '';
        tooltip.style.right = '';
        
        // Posicionar baseado na direção
        switch(position) {
            case 'top':
                tooltip.style.top = `${triggerTop - tooltipRect.height - 20}px`;
                tooltip.style.left = `${triggerLeft + (triggerRect.width - tooltipRect.width) / 2}px`;
                break;
            case 'bottom':
                tooltip.style.top = `${triggerTop + triggerRect.height + 20}px`;
                tooltip.style.left = `${triggerLeft + (triggerRect.width - tooltipRect.width) / 2}px`;
                break;
            case 'left':
                tooltip.style.top = `${triggerTop + (triggerRect.height - tooltipRect.height) / 2}px`;
                tooltip.style.left = `${triggerLeft - tooltipRect.width - 20}px`;
                break;
            case 'right':
                tooltip.style.top = `${triggerTop + (triggerRect.height - tooltipRect.height) / 2}px`;
                tooltip.style.left = `${triggerLeft + triggerRect.width + 20}px`;
                break;
        }
        
        // Verificar limites da janela e ajustar se necessário
        this.adjustTooltipPosition(tooltip);
        
        // Restaurar configurações originais
        tooltip.style.visibility = currentVisibility;
        tooltip.style.display = currentDisplay;
        tooltip.style.opacity = currentOpacity;
    }
    forceRepositionTooltip(trigger) {
        if (!trigger) return false;
        
        const entry = this.tooltipsMap.get(trigger);
        if (!entry) return false;
        
        const tooltip = entry.tooltip;
        
        // Remover o tooltip atual do DOM
        if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
        
        // Limpar a entrada no WeakMap
        this.tooltipsMap.delete(trigger);
        
        // Recriar o tooltip do zero
        const newTooltip = this.createTooltip(trigger);
        
        // Adicionar de volta ao container
        this.tooltipContainer.appendChild(newTooltip);
        
        // Armazenar a nova referência no WeakMap
        this.tooltipsMap.set(trigger, {
            tooltip: newTooltip,
            observer: null
        });
        
        // Verificar se este elemento deve ser observado
        const shouldObserve = trigger.getAttribute('data-tooltip-observe') === 'true';
        if (shouldObserve) {
            this.setObserve(trigger, true);
        }
        
        return true;
    }
    
    adjustTooltipPosition(tooltip) {
        const tooltipBounds = tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Conversão para coordenadas absolutas
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Ajustar horizontalmente se necessário
        if (tooltipBounds.right > windowWidth) {
            const adjustment = tooltipBounds.right - windowWidth + 10;
            tooltip.style.left = `${parseInt(tooltip.style.left || 0) - adjustment}px`;
        }
        if (tooltipBounds.left < 0) {
            const adjustment = -tooltipBounds.left + 10;
            tooltip.style.left = `${parseInt(tooltip.style.left || 0) + adjustment}px`;
        }
        
        // Ajustar verticalmente se necessário
        if (tooltipBounds.bottom > windowHeight) {
            const adjustment = tooltipBounds.bottom - windowHeight + 10;
            tooltip.style.top = `${parseInt(tooltip.style.top || 0) - adjustment}px`;
        }
        if (tooltipBounds.top < 0) {
            const adjustment = -tooltipBounds.top + 10;
            tooltip.style.top = `${parseInt(tooltip.style.top || 0) + adjustment}px`;
        }
    }
    
    setupEventListeners() {
        const updateBtn = document.getElementById('update-tooltip');
        if (!updateBtn) return;
        
        updateBtn.addEventListener('click', () => {
            const targetSelect = document.getElementById('target-element');
            const contentInput = document.getElementById('tooltip-content');
            const titleInput = document.getElementById('tooltip-title');
            const observeCheckbox = document.getElementById('tooltip-observe');
            
            if (!targetSelect) return;
            
            const targetId = targetSelect.value;
            const targetElement = document.getElementById(targetId);
            
            if (!targetElement) return;
            
            // Atualizar atributos
            if (contentInput && contentInput.value) {
                targetElement.setAttribute('data-tooltip', contentInput.value);
            }
            
            if (titleInput && titleInput.value !== undefined) {
                targetElement.setAttribute('data-tooltip-title', titleInput.value);
            }
            
            // Atualizar observação se necessário
            if (observeCheckbox) {
                const shouldObserve = observeCheckbox.checked;
                this.setObserve(targetElement, shouldObserve);
            }
            
            // Atualizar tooltip
            this.updateTooltip(targetElement);
            
            // Limpar inputs
            if (contentInput) contentInput.value = '';
            if (titleInput) titleInput.value = '';
            
            // Mostrar confirmação
            if (typeof gsap !== 'undefined') {
                gsap.to(updateBtn, {
                    backgroundColor: '#4CAF50',
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        updateBtn.textContent = 'Tooltip Atualizado!';
                        setTimeout(() => {
                            updateBtn.textContent = 'Atualizar Tooltip';
                        }, 1500);
                    }
                });
            } else {
                // Fallback sem GSAP
                const originalBg = updateBtn.style.backgroundColor;
                updateBtn.style.backgroundColor = '#4CAF50';
                updateBtn.textContent = 'Tooltip Atualizado!';
                
                setTimeout(() => {
                    updateBtn.style.backgroundColor = originalBg;
                    updateBtn.textContent = 'Atualizar Tooltip';
                }, 1500);
            }
        });
        
        // Carregar valores atuais ao selecionar um elemento
        const targetSelect = document.getElementById('target-element');
        if (targetSelect) {
            targetSelect.addEventListener('change', () => {
                const targetId = targetSelect.value;
                const targetElement = document.getElementById(targetId);
                
                if (!targetElement) return;
                
                const contentInput = document.getElementById('tooltip-content');
                const titleInput = document.getElementById('tooltip-title');
                const observeCheckbox = document.getElementById('tooltip-observe');
                
                if (contentInput) {
                    contentInput.value = targetElement.getAttribute('data-tooltip') || '';
                }
                
                if (titleInput) {
                    titleInput.value = targetElement.getAttribute('data-tooltip-title') || '';
                }
                
                if (observeCheckbox) {
                    observeCheckbox.checked = targetElement.getAttribute('data-tooltip-observe') === 'true';
                }
            });
            
            // Carregar valores iniciais
            const event = new Event('change');
            targetSelect.dispatchEvent(event);
        }
        
        // Observar mudanças no DOM para adicionar tooltips a novos elementos
        const bodyObserver = new MutationObserver((mutations) => {
            let newTooltipElements = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // Element node
                            // Verificar o próprio elemento
                            if (node.hasAttribute('data-tooltip')) {
                                this.initializeTooltip(node);
                                newTooltipElements = true;
                            }
                            
                            // Verificar filhos do elemento
                            const childTriggers = node.querySelectorAll('[data-tooltip]');
                            if (childTriggers.length > 0) {
                                for (const trigger of childTriggers) {
                                    this.initializeTooltip(trigger);
                                }
                                newTooltipElements = true;
                            }
                        }
                    }
                }
            }
            
            if (newTooltipElements) {
                // Atualizar select de elementos se existir
                this.updateElementSelect();
            }
        });
        
        bodyObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Redimensionamento da janela
        window.addEventListener('resize', () => {
            if (this.activeTooltip) {
                const forId = this.activeTooltip.getAttribute('data-for');
                const trigger = document.getElementById(forId);
                if (trigger) {
                    const position = trigger.getAttribute('data-tooltip-position') || 'top';
                    this.positionTooltip(this.activeTooltip, position, trigger);
                }
            }
        }, { passive: true });
    }
    
    updateElementSelect() {
        const targetSelect = document.getElementById('target-element');
        if (!targetSelect) return;
        
        // Backup valor selecionado atual
        const currentValue = targetSelect.value;
        
        // Limpar opções
        targetSelect.innerHTML = '';
        
        // Adicionar todos os elementos com data-tooltip
        const triggers = document.querySelectorAll('[data-tooltip]');
        for (const trigger of triggers) {
            const id = trigger.id;
            if (id) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = id;
                targetSelect.appendChild(option);
            }
        }
        
        // Restaurar valor selecionado se ainda existir
        if (currentValue) {
            for (const option of targetSelect.options) {
                if (option.value === currentValue) {
                    targetSelect.value = currentValue;
                    break;
                }
            }
        }
    }
}

// Inicializar tooltips
const tooltipManager = new ModernTooltip();

// Adicionar método para inicializar novos tooltips dinamicamente
window.addTooltip = function(element, content, title, position) {
    if (!element) return;
    
    // Verificar se o elemento é um seletor string
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    // Verificar se o elemento existe
    if (element) {
        // Definir atributos
        if (content) {
            element.setAttribute('data-tooltip', content);
        }
        
        if (title) {
            element.setAttribute('data-tooltip-title', title);
        }
        
        if (position) {
            element.setAttribute('data-tooltip-position', position);
        }
        
        return window.ModernTooltip.initializeTooltip(element);
    }
    
    return false;
};

// Adicionar método para remover tooltips
window.removeTooltip = function(element) {
    if (!element) return;
    
    // Verificar se o elemento é um seletor string
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    if (!element) return false;
    
    // Remover atributos e classe
    element.removeAttribute('data-tooltip');
    element.removeAttribute('data-tooltip-title');
    element.removeAttribute('data-tooltip-position');
    element.removeAttribute('data-tooltip-observe');
    element.classList.remove('tooltip-trigger');
    
    // Encontrar o tooltip associado
    const triggerId = element.id;
    if (triggerId) {
        const tooltip = document.querySelector(`.tooltip[data-for="${triggerId}"]`);
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    return true;
};

// Expor método para atualizar todos os tooltips
window.refreshTooltips = function() {
    return window.ModernTooltip.refreshAll();
};