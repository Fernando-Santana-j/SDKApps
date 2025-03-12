class NotificationSystem {
    constructor() {
        this.container = null;
        this.initializeContainer();
    }

    initializeContainer() {
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    createNotification({ 
        message, 
        type = 'success', 
        duration = 4000, 
        showProgress = true,
        showIcon = true
    }) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'notification-inner';
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        if (showIcon) {
            const icon = this.getIconForType(type);
            content.appendChild(icon);
        }
        
        const messageElement = document.createElement('span');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;
        content.appendChild(messageElement);
        
        // Novo botão de fechar com SVG melhorado
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.setAttribute('aria-label', 'Fechar notificação');
        closeButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        
        closeButton.addEventListener('click', () => {
            notification.remove();
        });
        
        innerWrapper.appendChild(content);
        innerWrapper.appendChild(closeButton);
        notification.appendChild(innerWrapper);
        
        if (showProgress) {
            const progressWrapper = document.createElement('div');
            progressWrapper.className = 'notification-progress-wrapper';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'notification-progress';
            progressBar.style.animationDuration = `${duration}ms`;
            
            progressWrapper.appendChild(progressBar);
            notification.appendChild(progressWrapper);
        }
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
    }
    
    getIconForType(type) {
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        
        switch (type) {
            case 'success':
                icon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="none" stroke="currentColor" stroke-width="2" 
                          d="M7.75 12.75L10 15.25L16.25 8.75" 
                          stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
                break;
            case 'warning':
                icon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="none" stroke="currentColor" stroke-width="2" 
                          d="M12 8V13M12 16V16.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                          stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
                break;
            case 'error':
                icon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="none" stroke="currentColor" stroke-width="2" 
                          d="M16 8L8 16M8 8L16 16M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                          stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
                break;
        }
        
        return icon;
    }
}

// Funções helper permanecem as mesmas
const notifications = new NotificationSystem();

function successNotify(message, options = {}) {
    notifications.createNotification({
        message,
        type: 'success',
        duration: 5000,
        ...options
    });
}

function mensageNotify(message, options = {}) {
    notifications.createNotification({
        message,
        type: 'warning',
        duration: 7000,
        ...options
    });
}

function errorNotify(message, options = {}) {
    notifications.createNotification({
        message,
        type: 'error',
        duration: 10000,
        ...options
    });
}