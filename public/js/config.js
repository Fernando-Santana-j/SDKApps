let serverID = location.pathname.replace('/server/config/', "")


document.getElementById('save-configs').addEventListener('click', async () => {
    const opcoes = document.getElementById('bot-config-channel-list').querySelectorAll('option');
    let channelID = null;
    
    await opcoes.forEach(option => {
        if (option.value === document.getElementById('bot-config-channel').value) {
            channelID = option.getAttribute('data-channel');
        }
    });

    let channelIDBuy = null
    const opcoesBuy = document.getElementById('bot-config-channel-buy-list').querySelectorAll('option');
    await opcoesBuy.forEach(option => {
        if (option.value === document.getElementById('bot-config-channel-buy').value) {
            channelIDBuy = option.getAttribute('data-channel');
        }
    });

    let session = await fetch('/config/change', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID,
            noticeChannel:channelID,
            publicBuyChannel:channelIDBuy
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Configurações salvas!')
    } else {
        errorNotify(session.data)
    }
})

document.getElementById('cancel-configs').addEventListener('click',()=>{
    document.getElementById('bot-config-channel').value = ''
    document.getElementById('bot-config-channel-buy').value = ''
})

document.getElementById('changePaymentMethod').addEventListener('click', async () => {
    try {
        let session = await fetch('/subscription/update', {
            method: 'POST',
            credentials: 'include',
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
            setTimeout(async () => {
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
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID,
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Sua assinatura foi cancelada iremos te redirecionar!')
        setTimeout(async () => {
            location.href = '/'
        }, 1000)
    }
})




document.getElementById('block-bank-button').addEventListener('click',async()=>{
    let bankInput = document.getElementById('other-config-block-bank').value
    if (bankInput.length < 1) {
        errorNotify('Primeiro selecione o banco que deseja bloquear!')
        return
    }
    let possiveisBanks = ['Banco Inter S.A.',"Picpay Serviços S.A."]

    if (!possiveisBanks.includes(bankInput)) {
        errorNotify('Selecione um banco valido!')
        return
    }
    let blockBank = await fetch('/config/blockbank', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID: serverID,
            bank:bankInput
        }),
    }).then(response => { return response.json() })
    if (blockBank.success == true) {
        bankInput = ''
        successNotify('Banco bloqueado com sucesso!')
    }else{
        errorNotify(blockBank.data)
    }
})