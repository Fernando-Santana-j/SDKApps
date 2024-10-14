async function passVerify(functions, type, redirect = null, others = null) {

    let response = await fetch('/security/pass/get')
        .then(response => {
            return response.text()
        })

    if (response) {
        if (response == 'null') {
            errorNotify('Erro ao processar sua solicitação logue novamente, você será redirecionado!')
            setTimeout(() => {
                location.href = '/logout'
            }, 1000)
            return
        }

        document.getElementById('containner').innerHTML += response

        document.getElementById('full-pass-containner').style.display = 'block'

        if (others == 'first') {
            document.getElementById('resend-pass').innerHTML = `<a id="resend-pass-button"  class="desc-col" style="cursor: pointer;">Clique aqui para reenviar a senha.</a>`
            document.getElementById('resend-pass-button').addEventListener('click', async () => {
                let toogle2fa = await fetch('/security/pass/resend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({}),
                }).then(response => { return response.json() })
                if (toogle2fa.success == true) {
                    document.getElementById('resend-pass').style.display = 'none'
                    successNotify(toogle2fa.data)
                    
                } else {
                    if (toogle2fa.data == 'redirect') {
                        location.href = '/security/pass'
                    }
                    errorNotify(toogle2fa.data)
                }
            })
            
        }

        await document.getElementById('pass-verify-button').addEventListener('click', async () => {
            if (type) {
                let session = await fetch('/security/pass/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pass: document.getElementById('pass-verify-input').value,
                        passType: (document.getElementById('pass-verify-input').value).includes('-ADM'),
                        type: type
                    }),
                }).then(response => { return response.json() })
                if (session.success == true) {
                    document.getElementById('full-pass-containner').remove()
                    if (redirect) {
                        location.href = redirect
                    }
                    type = null
                    successNotify('Senha verificada com sucesso!')
                    if (functions) {
                        functionPass(functions, type, others)
                    }
                } else {
                    errorNotify(session.data)
                }
            } else {
                errorNotify('Erro ao verificar a senha!')
            }
        })

    }



}

function functionPass(functions, type, others = null) {
    switch (functions) {
        case 'cadastro2fa':
            cadastrar2fa()
            break;
        case 'toogle2fa':

            if (others != null) {
                toogle2fa(others)
            } else {

                errorNotify('Erro ao ativar a verificação multifatorial!')
            }
            break;
        case 'desctivePix':
            desctivePix()
            break;
        case 'savePix':
            savePix()
            break;
        default:
            break;
    }
}