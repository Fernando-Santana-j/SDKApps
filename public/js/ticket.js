let serverID = location.pathname.replace('/server/ticket/', "")

document.getElementById('bot-ticket-channel').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('bot-ticket-channel-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});

document.getElementById('save-channel-ticket').addEventListener('click',async()=>{
    if (document.getElementById('bot-ticket-channel').value <= 0) {
        errorNotify('Selecione um canal primeiro!')
        return
    }
    const opcoes = document.getElementById('bot-ticket-channel-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('bot-ticket-channel').value) {
            channelID = option.getAttribute('data-channel');
        }
    });
    let session = await fetch('/ticket/saveSend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            channelID: channelID,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
    }else{
        errorNotify(session.data)
    }
})

document.getElementById('add-ticket-motivo').addEventListener('click',async()=>{
    if (document.getElementById('motivo-name-ticket').value <= 0 || document.getElementById('motivo-desc-ticket').value <= 0) {
        errorNotify('Adicione o nome e a descrição primeiro!')
        return
    }
    let session = await fetch('/ticket/motivoADD', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            motivo: {
                desc: document.getElementById('motivo-desc-ticket').value,
                name: document.getElementById('motivo-name-ticket').value
            },
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
    }else{
        errorNotify(session.data)
    }
})