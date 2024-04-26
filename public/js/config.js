let serverID = location.pathname.replace('/server/config/', "")


document.getElementById('save-configs').addEventListener('click', async () => {
    const opcoes = document.getElementById('bot-config-channel-list').querySelectorAll('option');
    let channelID = null;
    console.log(1);
    await opcoes.forEach(option => {
        if (option.value === document.getElementById('bot-config-channel').value) {
            channelID = option.getAttribute('data-channel');
        }
    });
    console.log(channelID);
    let session = await fetch('/config/change', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID,
            noticeChannel:channelID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Configurações salvas!')
    } else {
        errorNotify(session.data)
    }
})

document.getElementById('changePaymentMethod').addEventListener('click', async () => {
    try {
        let session = await fetch('/subscription/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverID: serverID,
            }),
        }).then(response => { return response.json() })
        if (session.success == true) {
            console.log(session);

            successNotify('Você sera redirecionado para a pagina de cadastro de novo pagamento!')
            setInterval(async () => {
                window.open(session.data, "_blank");
            }, 3000)
        } else {
            errorNotify(session.data)
        }
    } catch (error) {
        console.log(error);
        errorNotify('Erro ao redirecionar para a pagina de pagamento!')
    }
})

document.getElementById('cancelSubscription').addEventListener('click', () => {
    document.getElementById('confimCancelSubscription').style.display = 'flex'
})

document.getElementById('back-confirm-subscription').addEventListener('click', () => {
    document.getElementById('confimCancelSubscription').style.display = 'none'
})

document.getElementById('confirmCancelSubscription').addEventListener('click', async () => {
    document.getElementById('confimCancelSubscription').style.display = 'none'
    mensageNotify('Aguarde estamos deletando a sua conta!')
    let session = await fetch('/accout/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID,
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Sua assinatura foi cancelada iremos te redirecionar!')
        setInterval(async () => {
            location.href = '/'
        }, 1000)
    }
})