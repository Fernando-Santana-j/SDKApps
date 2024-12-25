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



let selectChannelReact = new DropdownSingle('select-channel-react-containner',channelItensSelectMenu);



async function sendPersonalize(type,data) {
    let session = await fetch('/personalize/change', {
        method: 'POST',
        credentials: 'include',
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

document.getElementById('color-dest-input').addEventListener('change',()=>{
    sendPersonalize('colorDest',document.getElementById('color-dest-input').value)
})

document.getElementById('color-dest-input').addEventListener('input',()=>{
    document.getElementById('color-dest-preview').style.backgroundColor = document.getElementById('color-dest-input').value
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


if (document.getElementById('desative-welcome')) {
    document.getElementById('desative-welcome').addEventListener('click',async()=>{
        let session = await fetch('/personalize/welcomeDesactive', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverID:serverID
            }),
        }).then(response => { return response.json() })
        if (session.success == true) {
            successNotify('Mensagem de boas vindas desativada!')
            document.getElementById(`active-welcome`).classList.remove(`hidden`)
            document.getElementById(`desative-welcome`).classList.add(`hidden`)
        }else{
            errorNotify(session.data)
        }
    })
}

if (document.getElementById('active-welcome')) {
    document.getElementById('active-welcome').addEventListener('click',async()=>{
        let session = await fetch('/personalize/welcomeActive', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverID:serverID
            }),
        }).then(response => { return response.json() })
        if (session.success == true) {
            successNotify('Mensagem de boas vindas ativada!')
            document.getElementById(`active-welcome`).classList.add(`hidden`)
            document.getElementById(`desative-welcome`).classList.remove(`hidden`)
        }else{
            errorNotify(session.data)
        }
    })
}


let inputSelectRepostTime = new DropdownSingle('select-hour-repost-containner', [{
    name: '1 hora',
    value: 1
}, {
    name: '2 horas',
    value: 2
}, {
    name: '3 horas',
    value: 3
}, {
    name: '4 horas',
    value: 4
}, {
    name: '5 horas',
    value: 5
},
{
    name: '6 horas',
    value: 6
},
{
    name: '7 horas',
    value: 7
},
{
    name: '8 horas',
    value: 8
},
{
    name: '9 horas',
    value: 9
},
{
    name: '10 horas',
    value: 10
},
{
    name: '11 horas',
    value: 11
},
{
    name: '12 horas',
    value: 12
},
{
    name: '13 horas',
    value: 13
},
{
    name: '14 horas',
    value: 14
},
{
    name: '15 horas',
    value: 15
},
{
    name: '16 horas',
    value: 16
},
{
    name: '17 horas',
    value: 17
},
{
    name: '18 horas',
    value: 18
},
{
    name: '19 horas',
    value: 19
},
{
    name: '20 horas',
    value: 20
},
{
    name: '21 horas',
    value: 21
},
{
    name: '22 horas',
    value: 22
},
{
    name: '23 horas',
    value: 23
},
{
    name: '24 horas',
    value: 24
}
])
document.getElementById('save-repost').addEventListener('click', async () => {
let hour = await inputSelectRepostTime.getValue().value
console.log(hour);

if (!hour) {
    return errorNotify('Selecione um horario!')
}
let session = await fetch('/personalize/repost', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        hour: hour,
        serverID: serverID
    }),
}).then(response => { return response.json() })
if (session.success == true) {
    successNotify(session.data)
} else {
    errorNotify(session.data)
}
})
let inputsSelectChannelWelcome = new DropdownSingle('welcome-channel-input', channelItensSelectMenu)
document.getElementById('number-buttons-input').addEventListener('input', e => {
let numberButtons = e.target.value
if (numberButtons > 5) {
    e.target.value = 5
    return errorNotify("O valor de botões nao pode ser maior que 5!")
}
document.getElementById('welcome-buttons-row').innerHTML = ''
for (let index = 0; index < numberButtons; index++) {
    document.getElementById('welcome-buttons-row').innerHTML += `
<div class="welcome-button-col">
    <div class="welcome-button-col-label">
        <label for="" class="lable-padrao">Digite o label do botão: </label>
        <input type="text" id="welcome-button-label-${index}" class="input-padrao" placeholder="Nome do botão...">
    </div>
    <div class="welcome-button-col-link">
        <label class="lable-padrao" for="">Canal de redirecinamento: </label>
        <div id="welcome-select-channel-${index}-containner">
            <input required type="text" class="input-padrao" list="welcome-select-channel-${index}-list" placeholder="selecione o canal..." id="welcome-select-channel-${index}-input">
            <datalist id="welcome-select-channel-${index}-list">
                ${channelItensSelectMenu.map(element => {
        return `
                        <option data-channel="${element.value}" value="${element.name}"></option>
                    `
    })}
            </datalist>
        </div>
    </div>
</div>
`
}
})

document.getElementById('save-mensage-welcome').addEventListener('click', async () => {
let mensage = document.getElementById('mensage-welcome').value.trim()
if (!mensage) {
    return errorNotify('Digite uma mensagem!')
}
let channel = inputsSelectChannelWelcome.getValue()
if (!channel) {
    return errorNotify('Selecione um canal!')
}
let buttonsArray = []
let numberButtons = document.getElementById('number-buttons-input').value
if (numberButtons && numberButtons > 0) {
    for (let index = 0; index < numberButtons; index++) {
        const opcoes = document.getElementById(`welcome-select-channel-${index}-list`).querySelectorAll('option');
        let channelID = null;

        opcoes.forEach(option => {
            if (option.value === document.getElementById(`welcome-select-channel-${index}-input`).value) {
                channelID = option.getAttribute('data-channel');
            }
        });
        buttonsArray.push({
            label: document.getElementById(`welcome-button-label-${index}`).value,
            channelID: channelID
        })
    }
}
let session = await fetch('/personalize/welcome', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        mensage: document.getElementById('mensage-welcome').value,
        buttons: buttonsArray,
        channel: channel.value,
        serverID: serverID
    }),
}).then(response => { return response.json() })
if (session.success == true) {
    successNotify('Mensagem de boas vindas salva!')
} else {
    errorNotify(session.data)
}
})



document.getElementById('feedback-channel-input').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('feedback-channel-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});
document.getElementById('saveChannelFeedback').addEventListener('click',async()=>{

    if (document.getElementById(`feedback-channel-input`).value.trim().length <= 0) {
        errorNotify(`Insira um canal primeiro!`)
        return
    }
    const opcoes = document.getElementById('feedback-channel-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('feedback-channel-input').value) {
            channelID = option.getAttribute('data-channel');
        }
    });
    let session = await fetch('/personalize/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID:serverID,
            channelID:channelID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Canal salvo!')
    }else{
        errorNotify(session.data)
    }
})







document.getElementById('save-auto-react').addEventListener('click',async()=>{
    if (document.getElementById(`emoji-name-react`).value.trim().length <= 0) {
        errorNotify(`Insira um emoji primeiro!`)
        return
    }
    if (!selectChannelReact.getValue().value) {
        errorNotify(`Insira um canal primeiro!`)
        return
    }
    let session = await fetch('/personalize/autoReact', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            emoji:document.getElementById(`emoji-name-react`).value.trim(),
            channelID:selectChannelReact.getValue().value,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Reacao criada!')
        
    }else{
        errorNotify(session.data)
    }
})

document.getElementById('save-antifake').addEventListener('click',async()=>{
    let session = await fetch('/personalize/antifake', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            antifakeDays:document.getElementById(`min-days-fake`).value.trim(),
            antifakeNames:document.getElementById(`names-block-fake`).value.trim(),
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
        
    }else{
        errorNotify(session.data)
    }
})



document.getElementById('save-mensage-lembrete').addEventListener('click',async()=>{
    if (document.getElementById(`title-lembrete`).value.trim().length <= 0) {
        errorNotify(`Insira um titulo primeiro!`)
        return
    }
    if (document.getElementById(`mensage-lembrete`).value.trim().length <= 0) {
        errorNotify(`Insira uma mensagem primeiro!`)
        return
    }
    let session = await fetch('/personalize/lembrete', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mensage:document.getElementById('mensage-lembrete').value ,
            title:document.getElementById('title-lembrete').value ,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify('Mensagem de lembrete salva!')
        
    }else{
        errorNotify(session.data)
    }
})
async function toogleLembrete(active) {
    let session = await fetch('/personalize/lembreteToogle', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID:serverID,
            active: active
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        if (active == true) {
            successNotify('Mensagem de lembrete ativada!')
            document.getElementById(`active-lembrete`).classList.add(`hidden`)
            document.getElementById(`desative-lembrete`).classList.remove(`hidden`)
        }else{
            successNotify('Mensagem de lembrete desativada!')
            document.getElementById(`active-lembrete`).classList.remove(`hidden`)
            document.getElementById(`desative-lembrete`).classList.add(`hidden`)
        }
    }else{
        errorNotify(session.data)
    }
}
if (document.getElementById('desative-lembrete')) {
    document.getElementById('desative-lembrete').addEventListener('click',async()=>{
        toogleLembrete(false)
    })
}

if (document.getElementById('active-lembrete')) {
    document.getElementById('active-lembrete').addEventListener('click',async()=>{
        toogleLembrete(true)
    })
}



