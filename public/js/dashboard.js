const storesGrid = document.getElementById('storesGrid');
const emptyState = document.getElementById('emptyState');
const tooltip = document.getElementById('tooltip');
const header = document.querySelector('header');

// Verificar se existem lojas
function checkStoresExist() {
    if (storeData.length === 0) {
        storesGrid.style.display = 'none';
        emptyState.style.display = 'flex';
        setTimeout(() => {
            emptyState.style.opacity = '1';
        }, 100);
    } else {
        storesGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        animateStoreCards();
    }
}

// Inicializar a interface
function initInterface() {
    // Mostrar o header com animação
    setTimeout(() => {
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
    }, 300);

    checkStoresExist();
}

// Animar cartões das lojas
function animateStoreCards() {
    const cards = document.querySelectorAll('.store-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 500 + (index * 150));
    });
}



// Tooltip para botões
document.addEventListener('mouseover', function (e) {
    const btnConsole = e.target.closest('.btn-console');
    const btnWebsite = e.target.closest('.btn-website');

    if (btnConsole) {
        showTooltip(btnConsole, 'Acessar o console administrativo');
    } else if (btnWebsite) {
        showTooltip(btnWebsite, 'Visualizar o site da loja');
    } else {
        hideTooltip();
    }
});

document.addEventListener('mouseout', function (e) {
    if (e.target.closest('.btn-action')) {
        hideTooltip();
    }
});

function showTooltip(element, text) {
    const rect = element.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
    tooltip.style.opacity = '1';
}

function hideTooltip() {
    tooltip.style.opacity = '0';
}
renderStores()
function renderStores() {
    storesGrid.innerHTML = '';
    storeData.forEach(store => {
        const card = document.createElement('div');
        card.className = 'store-card';
        card.dataset.status = store.status;

        let statusText = 'Ativo';
        let statusClass = 'status-active';
        if (store.status === 'inactive' || store.status === 'banned') {
            statusText = 'Inativo';
            statusClass = 'status-inactive';
        } else if (store.status === 'pending') {
            statusText = 'Pendente';
            statusClass = 'status-pending';
        }


        card.innerHTML = `
                    <div class="card-header">
                        <div>
                            <h3 class="store-name">${store.name}</h3>
                            <div class="store-category">...</div>
                        </div>
                        <div class="status-badge ${statusClass}">
                            <span class="status-indicator"></span>
                            ${statusText}
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="store-stats">
                            <div class="stats-title">Resumo</div>
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <div class="stat-value">${store.productsCount}</div>
                                    <div class="stat-label">PRODUTOS</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${store.salesRending ? store.salesRending : '--'}</div>
                                    <div class="stat-label">VENDAS</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${store.rating ? store.rating.toFixed(1) : '--'}</div>
                                    <div class="stat-label">AVALIAÇÃO</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="store-features">
                            <div class="feature-item">
                                <div class="feature-icon ${store.functions.onSale ? 'feature-active' : 'feature-inactive'}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round">
                                        <circle cx="9" cy="21" r="1"></circle>
                                        <circle cx="20" cy="21" r="1"></circle>
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                    </svg>
                                </div>
                                <div class="feature-label">VENDAS ${store.functions.onSale ? 'ATIVAS' : 'INATIVAS'}</div>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon ${store.functions.onView ? 'feature-active' : 'feature-inactive'}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round">
                                        <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z">
                                        </path>
                                    </svg>
                                </div>
                                <div class="feature-label">SITE ${store.functions.onView ? 'ONLINE' : 'OFFLINE'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <a href="/console/${store.id}" class="btn-action btn-console">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            Console
                        </a>
                        <a href="/store/${store.id}" taget="__blank" class="btn-action btn-website">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z">
                                </path>
                            </svg>
                            Ver Site
                        </a>
                    </div>
                `;

        storesGrid.appendChild(card);
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });

    checkStoresExist();
}

// Inicializar a aplicação
window.addEventListener('load', initInterface);



const botedit = new URLSearchParams(new URL(location.href).search).get('botedit', 0)
if (botedit == 'false') {
    errorNotify('Você não tem permissão para editar o bot!')
    const novaURL = window.location.protocol + '//' + window.location.host + window.location.pathname
    window.history.pushState({ path: novaURL }, '', novaURL);
}



document.getElementById('new-store-button').addEventListener('click', () => {
    if (userStores.length <= 0) {
        location.href = location.origin + '/onboarding'
    } else {
        document.getElementById('popup-create-new-store-containner').open()

    }
})

if ('createStore' in urlParams && urlParams.createStore == 'true') {
    if (userStores.length <= 0) {
        location.href = location.origin + '/onboarding'
    } else {
        document.getElementById('popup-create-new-store-containner').open()
    }
}

document.getElementById('popup-create-new-store-images-logo-input').addEventListener('change', async () => {
    await previewImage(document.getElementById('popup-create-new-store-images-logo-input'), document.getElementById('popup-create-new-store-images-logo-content-pic-img'))
})


document.getElementById('popup-create-new-store-input-url').addEventListener('input', (e) => {
    let value = e.target.value
    let include = false
    let specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '{', '}', '[', ']', '|', '\\', ':', ';', '"', "'", '<', '>', '?', ',', '.', '/', '~', '`', ' ']
    let resultInclude = new Promise((resolve, reject) => {
        for (let index = 0; index < specialChars.length; index++) {
            const element = specialChars[index];
            if (value.includes(element)) {
                resolve(true)
            }
        }
    })
    if (resultInclude == true) {
        include = true
    } else {
        include = false
    }
    let inputNewUrl = document.getElementById('popup-create-new-store-input-url')
    if (include == true) {
        document.getElementById('popup-create-new-store-error').innerText = "Não use caracteres especiais ou espaços no nome de identificação, apenas e permitido - ou _"
        inputNewUrl.classList.add("borderError")
    } else {

        inputNewUrl.classList.remove("borderError")
        document.getElementById('popup-create-new-store-error').innerText = ""
    }
})



















document.getElementById('create-store-button').addEventListener('click', createStore)



async function createStore() {

    let DisplayName = document.getElementById('popup-create-new-store-input-name').value
    let IDName = document.getElementById('popup-create-new-store-input-url').value

    if (!DisplayName || !IDName || DisplayName.length < 3 || IDName.length < 3) {
        errorNotify('Por favor, insira um nome de exibição e um nome de identificação com pelo menos 3 caracteres.')
        return
    }

    let session = await fetch('/store/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID,
            DisplayName: DisplayName,
            IDName: IDName,
            userID: userID
        }),
    }).then(response => { return response.json() })
    document.getElementById("popup-create-new-store-form").style.display = 'none'
    document.getElementById("animation-check-containner").style.display = 'flex'
    if (session.success == true) {
        startAnimation("success", 'Loja criada com sucesso!')

    } else {
        startAnimation("error", session.data)
    }





}



function createParticles(type) {
    const particles = document.querySelector('.particles');
    particles.innerHTML = '';

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particles.appendChild(particle);

        const angle = (i / 12) * Math.PI * 2;
        const x = Math.cos(angle) * 50;
        const y = Math.sin(angle) * 50;

        gsap.set(particle, {
            x: '50%',
            y: '50%',
            rotation: type === 'error' ? angle * (180 / Math.PI) : 0
        });

        gsap.to(particle, {
            duration: type === 'error' ? 0.6 : 0.8,
            x: `calc(50% + ${x}px)`,
            y: `calc(50% + ${y}px)`,
            opacity: 1,
            scale: 0,
            ease: "power2.out",
            delay: 0.6
        });
    }
}



function startAnimation(type, text = null) {
    const container = document.querySelector('.feedback-container');
    const body = document.body;
    const successIcon = document.querySelector('.success-icon');
    const errorIcon = document.querySelector('.error-icon');

    // Configura o estado visual
    body.className = type;
    successIcon.style.display = type === 'success' ? 'block' : 'none';
    errorIcon.style.display = type === 'error' ? 'block' : 'none';

    // Define as mensagens
    const message = document.querySelector('.check-message');
    const submessage = document.querySelector('.check-submessage');
    message.textContent = type === 'success' ? 'Loja criada com sucesso!' : 'Erro ao criar loja';
    submessage.textContent = type === 'success' ? '' : text ? text : 'Verifique os dados e tente novamente';

    // Configura as cores dos ícones
    const iconPath = document.querySelector(`.${type}-icon path`);
    iconPath.style.stroke = type === 'success' ? '#820ad1' : '#e63946';

    const tl = gsap.timeline({
        onComplete: () => {
            setTimeout(() => {
                closePopup(document.getElementById('popup-create-new-store-containner'), document.getElementById('popup-create-new-store-content'))
                gsap.set(['.feedback-background', '.glow', '.ripple', '.particle'], {
                    clearProps: "all"
                });
                gsap.set('.feedback-icon path', { strokeDashoffset: 100 });
                gsap.set(['.message', '.submessage'], { opacity: 0, y: 20 });
                container.classList.remove('shake');
                document.getElementById("popup-create-new-store-form").style.display = 'block'
                document.getElementById("animation-check-containner").style.display = 'none'
                location.href = location.origin + '/store/painel/' + IDName
            }, 2000);
        }
    });

    // Animação comum
    tl.to('.ripple', {
        scale: 1.5,
        opacity: 1,
        duration: 0.4,
        ease: "power1.out"
    })
        .to('.ripple', {
            scale: 2,
            opacity: 0,
            duration: 0.4,
            ease: "power1.in"
        }, "-=0.2");

    if (type === 'success') {
        // Animação de sucesso
        tl.to('.feedback-background', {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(1.7)"
        }, "-=0.3")
            .to('.glow', {
                opacity: 0.5,
                duration: 0.5,
                ease: "power2.out"
            }, "-=0.5")
            .to('.glow', {
                opacity: 0,
                duration: 0.5,
                ease: "power2.in"
            }, "-=0.2")
            .to('.success-icon path', {
                strokeDashoffset: 0,
                duration: 0.6,
                ease: "power2.out",
                onComplete: () => createParticles('success')
            }, "-=0.3")
            .to('.check-message', {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "back.out(1.2)"
            }, "-=0.2")
            .to('.feedback-background', {
                scale: 1.05,
                duration: 0.3,
                ease: "power1.inOut",
                yoyo: true,
                repeat: 1
            }, "-=0.2");
    } else {
        // Animação de erro
        tl.to('.feedback-background', {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            ease: "back.out(1.7)",
            onComplete: () => {
                container.classList.add('shake');
            }
        }, "-=0.2")
            .to('.error-icon path', {
                strokeDashoffset: 0,
                duration: 0.5,
                ease: "power2.out",
                stagger: 0.1,
                onComplete: () => createParticles('error')
            }, "-=0.2")
            .to('.check-message', {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "back.out(1.2)"
            }, "-=0.2")
            .to('.check-submessage', {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "back.out(1.2)"
            }, "-=0.3");
    }
}