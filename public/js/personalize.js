let serverID = location.pathname.replace('/server/personalize/', "")



if ('personalize' in server) {
    if ('colorDest' in server.personalize) {
        document.getElementById('color-dest-preview').style.backgroundColor = server.personalize.colorDest
    }   
    if ('cargoPay' in server.personalize) {
        const opcoes = document.getElementById('cargos-input-list').querySelectorAll('option');
        opcoes.forEach(option => {
            if (option.getAttribute('data-cargos') == server.personalize.cargoPay) {
                document.getElementById('cargos-name-input').value = option.value
            }
        });
    }
}




async function sendPersonalize(type,data) {
    let session = await fetch('/personalize/change', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            [type]: data,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Personalização alterada!')
    }else{
        errorNotify(session.data)
    }
}


document.getElementById('avatarBotPerso').addEventListener('change',()=>{
    errorNotify("Essa função esta temporariamente desativada!")
    return
    const fileInput = document.getElementById('avatarBotPerso');
    const previewImage = document.getElementById('avatarPreview');
    const file = fileInput.files[0];

    if (file) {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = function(event) {
                previewImage.src = event.target.result;
            };
            reader.readAsDataURL(file);

            var formData = new FormData();
            formData.append('avatarBot',file)
            formData.append('serverID',serverID)

            $.ajax({
                traditional: true,
                url: '/personalize/avatarbot',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    if (response.success) {
                        successNotify('Imagem Alterada')
                    } else {
                        errorNotify(response.data)
                    }
    
                },
                error: function (xhr, status, error) {
                    console.error(error);
                }
            })
        } else {
            errorNotify('Por favor, selecione um arquivo JPEG, PNG ou JPEG válido.');
        }
    } else {
        errorNotify('Por favor, selecione um arquivo para enviar.');
    }
})

document.getElementById('saveCargoPay').addEventListener('click',async()=>{
    const opcoes = document.getElementById('cargos-input-list').querySelectorAll('option');
    let cargosID = null;

    await opcoes.forEach(option => {
        if (option.value === document.getElementById('cargos-name-input').value) {
            cargosID = option.getAttribute('data-cargos');
        }
    });
    if (!cargosID) {
        errorNotify("Selecione um cargo primeiro")
        return
    }
    sendPersonalize('cargoPay',cargosID)
})

document.getElementById('saveBotName').addEventListener('click',async()=>{
    let name = document.getElementById('bot-name-input').value.trim()
    if (!name) {
        errorNotify("Selecione um cargo primeiro")
        return
    }
    sendPersonalize('botName',name)
})

document.getElementById('color-dest-input').addEventListener('change',()=>{
    sendPersonalize('colorDest',document.getElementById('color-dest-input').value)
})

document.getElementById('color-dest-input').addEventListener('input',()=>{
    document.getElementById('color-dest-preview').style.backgroundColor = document.getElementById('color-dest-input').value
})

document.getElementById('checkbox').addEventListener('change',async()=>{
    let session = await fetch('/personalize/productIcon', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            icon:document.getElementById('checkbox').checked ,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Personalização alterada!')
    }else{
        errorNotify(session.data)
    }
})
document.getElementById('welcome-channel-input').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('welcome-channel-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});
document.getElementById('save-mensage-welcome').addEventListener('click',async()=>{
    const opcoes = document.getElementById('welcome-channel-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('welcome-channel-input').value) {
            channelID = option.getAttribute('data-channel');
        }
    });

    let session = await fetch('/personalize/welcome', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mensage:document.getElementById('mensage-welcome').value ,
            title:document.getElementById('title-welcome').value ,
            channel:channelID,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Mensagem de boas vindas salva!')
    }else{
        errorNotify(session.data)
    }
})

document.getElementById('desative-welcome').addEventListener('click',async()=>{
    let session = await fetch('/personalize/welcomeDesactive', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Mensagem de boas vindas desativada!')
        document.getElementById(`active-welcome`).classList.add(`hidden`)
        document.getElementById(`desative-welcome`).classList.remove(`hidden`)
    }else{
        errorNotify(session.data)
    }
})

document.getElementById('active-welcome').addEventListener('click',async()=>{
    let session = await fetch('/personalize/welcomeActive', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Mensagem de boas vindas ativada!')
        document.getElementById(`active-welcome`).classList.remove(`hidden`)
        document.getElementById(`desative-welcome`).classList.add(`hidden`)
    }else{
        errorNotify(session.data)
    }
})