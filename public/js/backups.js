let serverID = location.pathname.replace('/server/backups/', "")


let channelItensSelectMenu = channels.map(element => {
    return {
        name: element.name,
        value: element.id
    }
})
let typeRecoveryInput = new DropdownSingle('type-recovery-input', [{
    name: 'Substituir dados',
    desc: 'Substitua todos os dados desse servidor pelos dados de outro!',
    value: 'replace'
}, {
    name: 'Priorizar este servidor',
    desc: 'Essa opção apenas adicionará os dados nesse servidor sem substituir nada.',
    value: 'priorize'
}, {
    name: 'Recuperar usuarios',
    desc: 'Essa opção recupera apenas os usuários verificados com o auth.',
    value: 'users'
}
]);
let selectChannelMensage = new DropdownSingle('auth-channel-select-mensage', channelItensSelectMenu);


document.getElementById('auth-system-copy-link').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('auth-system-copy-link').getAttribute('data-link')).then(() => {
        successNotify('Link copiado com sucesso!')
    }).catch(() => {
        errorNotify('Erro ao copiar o link!')
    })
})

document.getElementById('copy-code-button').addEventListener('click', () => {
    navigator.clipboard.writeText(backupCode).then(() => {
        successNotify('Codigo copiado com sucesso!')
    }).catch(() => {
        errorNotify('Erro ao copiar o codigo!')
    })
})

document.getElementById('auth-system-send-mensage').addEventListener('click', async () => {
    let title = document.getElementById('auth-system-mensage-title').value.trim()
    let mensage = document.getElementById('auth-system-mensage').value.trim()
    let link = document.getElementById('auth-system-send-mensage').getAttribute('data-link')
    let channel = selectChannelMensage.getValue().value
    if (!title || !mensage || !channel) {
        errorNotify('Preencha todos os campos!')
        return
    }

    let response = await fetch('/backups/sendMensage', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: title,
            mensage: mensage,
            link: link,
            channel: channel,
            serverID: serverID
        })
    }).then(response => { return response.json() })
    if (response.success == true) {
        successNotify(response.data)
    } else {
        errorNotify(response.data)
    }
})



document.getElementById('recovery-button-init').addEventListener('click', async () => {
    let recoveryCode = document.getElementById('recovery-code-backup').value.trim()
    let recoveryType = typeRecoveryInput.getValue().value
    let serverID = location.pathname.replace('/server/backups/', "")
    await passVerify(async() => {
        console.log(recoveryCode,recoveryType);
        
        if (!recoveryType) {
            errorNotify('Selecione o tipo de recovery!')
            return
        }
        
        if (!recoveryCode || recoveryCode.length != 6) {
            errorNotify('Insira o codigo de backup!')
            return
        }
        let response = await fetch('/backups/recovery', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                backupCode: recoveryCode,
                recoveryType: recoveryType,
                serverID: serverID
            })
        }).then(response => { return response.json() })
        if (response.success == true) {
            let responseData = response.data
            successNotify(responseData.data)
            if ('usersPassed' in responseData) {
                successNotify(`Recuperados ${responseData.usersPassed.length} usuários!`)
            }
            if ('usersErrors' in responseData) {
                mensageNotify(`Erro ao recuperar ${responseData.usersErrors.length} usuários!`)
            }
        } else {
            errorNotify(response.data)
        }
    },'admin',null,null)
})