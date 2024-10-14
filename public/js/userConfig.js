

async function cadastrar2fa() {
    let session = await fetch('/security/2fa/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({}),
    }).then(response => { return response.json() })
    if (session.success == true) {
        document.getElementById('code-2fa-image').src = session.qrcode
        document.getElementById('code-2fa-text').innerText = session.secret
        document.getElementById('full-containner-2fa').style.display = 'block'
        document.getElementById('send-code-2fa').addEventListener('click', async () => {
            if (document.getElementById('token-input-2fa').value.trim().length < 6) {
                errorNotify('Token invalido!')
            } else {
                let code2fa = await fetch('/security/code/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        code: document.getElementById('token-input-2fa').value.trim(),
                        type: '2fa',
                        first: true
                    }),
                }).then(response => { return response.json() })
                if (code2fa.success == true) {
                    successNotify('Autenticação de 2 fatores cadastrada!')
                    document.getElementById('full-containner-2fa').style.display = 'none'
                } else {
                    errorNotify(session.data)
                }
            }
        })
    } else {
        errorNotify(session.data)
    }
}

async function toogle2fa(active) {
    let toogle2fa = await fetch('/security/2fa/toogle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            active: active
        }),
    }).then(response => { return response.json() })
    if (toogle2fa.success == true) {
        successNotify(toogle2fa.data)
        document.getElementById('desative-2fa').classList.toggle('hidden')
        document.getElementById('active-2fa').classList.toggle('hidden')
    } else {
        errorNotify(toogle2fa.data)
    }
}



document.addEventListener('click', async (event) => {
    const target = event.target;

    if (target.closest('#desative-2fa')) {
        passVerify('toogle2fa', 'admin', null, false)
    }
    if (target.closest('#active-2fa')) {
        passVerify('toogle2fa', 'admin', null, true)
    }
    if (target.closest('#cadastro-2fa-button')) {
        passVerify('cadastro2fa', 'admin', null)
    }
})
