class PasswordVerifier {
    static sessionKey = 'password_verified';
    static verifying = false;
    static popupId = 'password-verifier-popup';

    static async verify({ onSuccess, onError, force = false, type = null, redirect = null, others = null } = {}) {
        if (!force && sessionStorage.getItem(PasswordVerifier.sessionKey) === 'true') {
            if (typeof onSuccess === 'function') onSuccess();
            return true;
        }
        if (PasswordVerifier.verifying) return;
        PasswordVerifier.verifying = true;
        PasswordVerifier.#showPopup({ onSuccess, onError, type, redirect, others });
    }

    static #showPopup({ onSuccess, onError, type, redirect, others }) {
        // Remove any existing popup
        const old = document.getElementById(PasswordVerifier.popupId);
        if (old) old.remove();

        // Create popup container
        const popup = document.createElement('div');
        popup.id = PasswordVerifier.popupId;
        popup.innerHTML = `
            <style>
                #${PasswordVerifier.popupId} {
                    position: fixed;
                    top: 0; 
                    left: 0; 
                    width: 100vw; 
                    height: 100vh;
                    background: rgba(0,0,0,0.8);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    backdrop-filter: blur(12px);
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .pv-wrapper {
                    width: 100%;
                    max-width: 60em;
                    min-width: 320px;
                }

                .pv-content {
                    background: var(--secundary-color);
                    border-radius: 24px;
                    box-shadow: 
                        0 30px 60px -12px rgba(0, 0, 0, 0.3),
                        0 18px 36px -18px rgba(138, 43, 226, 0.15);
                    padding: 3rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    position: relative;
                    border: 2px solid var(--main-color-purple);
                    transform: perspective(1000px);
                    animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    overflow: hidden;
                }

                @keyframes popIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.8) rotateX(-90deg);
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1) rotateX(0);
                    }
                }

                .pv-icon {
                    width: 100px;
                    height: 100px;
                    background: linear-gradient(135deg, var(--main-color-purple), var(--accent));
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                    box-shadow: 
                        0 15px 30px rgba(138, 43, 226, 0.3),
                        0 5px 15px rgba(138, 43, 226, 0.2);
                    transform: translateZ(50px);
                }

                .pv-icon svg {
                    width: 50px;
                    height: 50px;
                    color: white;
                    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
                }

                .pv-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    background: linear-gradient(90deg, var(--main-color-purple), var(--accent));
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    text-align: center;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.5px;
                }

                .pv-desc {
                    color: var(--text-gray-color-primary);
                    font-size: 1rem;
                    text-align: center;
                    margin-bottom: 1.5rem;
                    line-height: 1.6;
                }

                .pv-input-container {
                    width: 100%;
                    position: relative;
                    margin-bottom: 1.5rem;
                }

                .pv-error {
                    color: var(--red-color);
                    font-size: 0.9rem;
                    text-align: center;
                    height: 1.2rem;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    margin-bottom: 1rem;
                }

                .pv-error.show {
                    opacity: 1;
                }

                .pv-btn {
                    width: 100%;
                    padding: 1.2rem;
                    background: linear-gradient(135deg, var(--main-color-purple), var(--accent));
                    color: white;
                    border: none;
                    border-radius: 16px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 
                        0 15px 30px rgba(138, 43, 226, 0.2),
                        0 5px 15px rgba(138, 43, 226, 0.1);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .pv-btn:hover {
                    transform: translateY(-4px);
                    box-shadow: 
                        0 20px 40px rgba(138, 43, 226, 0.3),
                        0 7px 20px rgba(138, 43, 226, 0.15);
                }

                .pv-btn:active {
                    transform: scale(0.97);
                }

                .pv-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                @media screen and (max-width: 600px) {
                    #${PasswordVerifier.popupId} {
                        padding: 0.5rem;
                    }

                    .pv-wrapper {
                        width: 95%;
                        max-width: 95%;
                    }

                    .pv-content {
                        padding: 2rem;
                        border-radius: 16px;
                    }

                    .pv-icon {
                        width: 80px;
                        height: 80px;
                    }

                    .pv-title {
                        font-size: 1.5rem;
                    }

                    .pv-desc {
                        font-size: 0.9rem;
                        max-width: 100%;
                    }

                    .pv-input, .pv-btn {
                        padding: 1rem;
                        font-size: 1rem;
                    }
                }
            </style>
            <div class="pv-wrapper">
                <div class="pv-content">
                    <div class="pv-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div class="pv-title">Verificação de Segurança</div>
                    <div class="pv-desc">Por favor, insira sua senha para continuar. Esta verificação garante a segurança do seu acesso.</div>
                    <div class="pv-input-container">
                        <input-password 
                            id="pv-pass" 
                            placeholder="Digite sua senha" 
                            name="security-verification-password"
                            height="2.5em"
                        ></input-password>
                    </div>
                    <div class="pv-error" id="pv-error"></div>
                    <button class="pv-btn" id="pv-btn-confirm">Confirmar Acesso</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        // Get DOM elements
        const btn = popup.querySelector('#pv-btn-confirm');
        const passInput = popup.querySelector('#pv-pass');
        const errorDiv = popup.querySelector('#pv-error');

        // Confirm logic
        btn.onclick = async () => {
            // Reset previous error states
            errorDiv.textContent = '';
            errorDiv.classList.remove('show');
            passInput.classList.remove('error');

            const pass = passInput.value.trim();

            if (!pass) {
                errorDiv.textContent = 'Por favor, insira sua senha.';
                errorDiv.classList.add('show');
                passInput.classList.add('error');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Verificando...';

            // Verifica no backend
            try {
                const res = await fetch('/security/pass/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pass, passType: pass.includes('-ADM'), type })
                });
                const data = await res.json();
                if (data.success) {
                    sessionStorage.setItem(PasswordVerifier.sessionKey, 'true');
                    PasswordVerifier.#closePopup();
                    PasswordVerifier.verifying = false;
                    if (typeof onSuccess === 'function') onSuccess();
                    if (redirect) location.href = redirect;
                } else {
                    errorDiv.textContent = data.data || 'Senha incorreta.';
                    errorDiv.classList.add('show');
                    passInput.classList.add('error');
                    btn.disabled = false;
                    btn.textContent = 'Confirmar Acesso';
                    if (typeof onError === 'function') onError(data.data);
                }
            } catch (e) {
                errorDiv.textContent = 'Erro ao verificar senha.';
                errorDiv.classList.add('show');
                passInput.classList.add('error');
                btn.disabled = false;
                btn.textContent = 'Confirmar Acesso';
                if (typeof onError === 'function') onError('Erro ao verificar senha.');
            }
        };

        // Enter key submits
        passInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') btn.click();
        });
    }

    static #closePopup() {
        const popup = document.getElementById(PasswordVerifier.popupId);
        if (popup) {
            popup.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => popup.remove(), 300);
        }
        PasswordVerifier.verifying = false;
    }
}

// Add global styles for fade out animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeOut {
    from { opacity: 1; backdrop-filter: blur(12px); }
    to { opacity: 0; backdrop-filter: blur(0); }
}
`;
document.head.appendChild(style);

// Exemplo de uso:
// await PasswordVerifier.verify({
//   onSuccess: () => { /* ação após sucesso */ },
//   onError: (msg) => { /* ação em caso de erro */ },
//   force: false, // se true, sempre pede senha
//   type: 'algumTipo',
//   redirect: '/alguma-rota',
//   others: null
// });
