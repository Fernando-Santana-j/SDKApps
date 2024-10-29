let serverID = location.pathname.replace('/server/ticket/', "")



async function updateMotivo() {
    let session = await fetch('/get/server', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true && session.data && "ticketOptions" in session.data) {
        let motivoContent = document.getElementById('motivos-config-row')
        motivoContent.innerHTML = ''
        session.data.ticketOptions.motivos.forEach(element=>{
            motivoContent.innerHTML += `
            <div data-motivoID='${element.id}' class="motivos-index-col">
                <p title="${element.name}" class="motivo-index-col-title">${element.name}</p>
                <button class="button-padrao motivo-index-config-button">Configurar</button>
            </div>
            `
        })
    }
}

document.getElementById('bot-ticket-channel').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('bot-ticket-channel-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});

document.getElementById('motivo-responsavel-ticket').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('motivo-responsavel-ticket-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um cargo válido da lista.');
        this.value = '';
    }
});

document.getElementById('motivo-responsavel-ticket-edit').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('motivo-responsavel-ticket-edit-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um cargo válido da lista.');
        this.value = '';
    }
});

document.getElementById('save-channel-ticket').addEventListener('click',async()=>{
    let server = await fetch('/get/server', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (server.success == true && `ticketOptions` in server.data && server.data.ticketOptions.motivos.length <= 0) {
        errorNotify(`Cadastre um motivo primeiro!`)   
        return 
    }
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
        credentials: 'include',
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

document.getElementById('bot-ticket-privatelog').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('bot-ticket-privatelog-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});
document.getElementById('save-privateLog-ticket').addEventListener('click',async()=>{
    if (document.getElementById('bot-ticket-privatelog').value <= 0) {
        errorNotify('Selecione um canal primeiro!')
        return
    }
    const opcoes = document.getElementById('bot-ticket-privatelog-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('bot-ticket-privatelog').value) {
            channelID = option.getAttribute('data-channel');
        }
    });
    let session = await fetch('/ticket/privatelog', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            log: channelID,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
    }else{
        errorNotify(session.data)
    }
})

document.getElementById('bot-ticket-publiclog').addEventListener('blur', function () {
    const inputValue = this.value.toLowerCase();
    const datalistOptions = Array.from(document.getElementById('bot-ticket-publiclog-list').getElementsByTagName('option'));
    const validOptions = datalistOptions.map(option => option.value.toLowerCase());

    if (!validOptions.includes(inputValue)) {
        errorNotify('Por favor, selecione um canal válido da lista.');
        this.value = '';
    }
});
document.getElementById('save-publicLog-ticket').addEventListener('click',async()=>{
    if (document.getElementById('bot-ticket-publiclog').value <= 0) {
        errorNotify('Selecione um canal primeiro!')
        return
    }
    const opcoes = document.getElementById('bot-ticket-publiclog-list').querySelectorAll('option');
    let channelID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('bot-ticket-publiclog').value) {
            channelID = option.getAttribute('data-channel');
        }
    });
    let session = await fetch('/ticket/publiclog', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            log: channelID,
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
    if (document.getElementById('motivo-responsavel-ticket').value <= 0 ||document.getElementById('motivo-name-ticket').value <= 0 || document.getElementById('motivo-desc-ticket').value <= 0) {
        errorNotify('Adicione o nome e a descrição primeiro!')
        return
    }
    const opcoes = document.getElementById('motivo-responsavel-ticket-list').querySelectorAll('option');
    let roleID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('motivo-responsavel-ticket').value) {
            roleID = option.getAttribute('data-roleID');
        }
    });
    let session = await fetch('/ticket/motivoADD', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            motivo: {
                desc: document.getElementById('motivo-desc-ticket').value,
                name: document.getElementById('motivo-name-ticket').value,
                responsavel:roleID
            },
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
        updateMotivo()
        document.getElementById('motivo-name-ticket').value = ''
        document.getElementById('motivo-desc-ticket').value = ''
    }else{
        errorNotify(session.data)
    }
})


document.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.closest('.close-config-motivo-popup')) {
        document.getElementById('config-motivo-popup-cotainner').style.display = 'none'
        document.getElementById('config-motivo-popup-cotainner').setAttribute('data-motivoID',"")
    }
    if (target.closest('.motivo-index-config-button')) {
        let session = await fetch('/get/server', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serverID:serverID
            }),
        }).then(response => { return response.json() })
        if (session.success == true && session.data && "ticketOptions" in session.data) {
            let motivoID = await target.closest('.motivos-index-col').getAttribute('data-motivoID')
            let motivo = await session.data.ticketOptions.motivos.find(element=> element.id == motivoID)
            let motivoResp = await motivo.responsavel
            const opcoes = document.getElementById('motivo-responsavel-ticket-edit-list').querySelectorAll('option');
            let roleName = null;

            for (let index = 0; index < opcoes.length; index++) {
                const option = opcoes[index];
                if (await option.getAttribute('data-roleID') == motivoResp) {
                    roleName = option.value;
                }
            }
            document.getElementById('motivo-responsavel-ticket-edit').value = roleName
            document.getElementById('config-motivo-popup-edit-name').value = motivo.name
            document.getElementById('config-motivo-popup-edit-desc').value = motivo.desc
            document.getElementById('config-motivo-popup-cotainner').style.display = 'flex'
            document.getElementById('config-motivo-popup-cotainner').setAttribute('data-motivoID',motivoID)
        }
    }

    if (target.closest('.semana-buttons-col')) {
        let eleme = target.closest('.semana-buttons-col')
        let day = await eleme.getAttribute('data-name')
        
        
        if (horarioTicketPreData.days.includes(day)) {
            eleme.classList.remove('semana-select')
            while(horarioTicketPreData.days.indexOf(day) !== -1) {
                horarioTicketPreData.days.splice(horarioTicketPreData.days.indexOf(day), 1);
            }
        }else{
            eleme.classList.add('semana-select')
            horarioTicketPreData.days.push(day)
        }
    }
})

document.getElementById('init-sup-horas').addEventListener('change',()=>{
    let input2 = document.getElementById('end-sup-horas')
    let value = document.getElementById('init-sup-horas').value
    if (input2.value && value > input2.value) {
        value = input2.value
        document.getElementById('init-sup-horas').value = input2.value
    }
    horarioTicketPreData.init = value
})
document.getElementById('end-sup-horas').addEventListener('change',()=>{
    let input1 = document.getElementById('init-sup-horas')
    let value = document.getElementById('end-sup-horas').value
    if (input1.value && value < input1.value) {
        value = input1.value
        document.getElementById('end-sup-horas').value = input1.value
    }
    horarioTicketPreData.end = value
})
document.getElementById('save-horario-date-ticket').addEventListener('click',async()=>{
    if (!horarioTicketPreData.end || horarioTicketPreData.end == null || !horarioTicketPreData.init || horarioTicketPreData.init == null) {
        errorNotify('Adicione o horario de inicio e de fim do atendimento!')
        return
    }
    if (horarioTicketPreData.end == horarioTicketPreData.init) {
        errorNotify('O horario de inicio não pode ser igual ao de encerramento!')
        return
    }
    if (horarioTicketPreData.days.length <= 0) {
        errorNotify('Selecione pelo menos 1 dia de atendimento!')
        return
    }
    let session = await fetch('/ticket/horario', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            options: horarioTicketPreData,
            serverID:serverID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
    }else{
        errorNotify(session.data)
    } 

})
document.getElementById('exclud-motivo-edit').addEventListener('click',async()=>{
    if (document.getElementById('config-motivo-popup-cotainner').getAttribute('data-motivoID')) {
        let session = await fetch('/ticket/motivoDEL', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                motivoID: document.getElementById('config-motivo-popup-cotainner').getAttribute('data-motivoID'),
                serverID:serverID
            }),
        }).then(response => { return response.json() })
        if (session.success == true) {
            successNotify(session.data)
            updateMotivo()
            document.getElementById('config-motivo-popup-cotainner').style.display = 'none'
            document.getElementById('config-motivo-popup-cotainner').setAttribute('data-motivoID',"")
        }else{
            errorNotify(session.data)
        } 
    }
})

document.getElementById('save-motivo-edit').addEventListener('click',async()=>{
    const opcoes = document.getElementById('motivo-responsavel-ticket-edit-list').querySelectorAll('option');
    let roleID = null;

    opcoes.forEach(option => {
        if (option.value === document.getElementById('motivo-responsavel-ticket-edit').value) {
            roleID = option.getAttribute('data-roleID');
        }
    });
    let session = await fetch('/ticket/motivoUPD', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            motivoID: document.getElementById('config-motivo-popup-cotainner').getAttribute('data-motivoID'),
            serverID:serverID,
            desc: document.getElementById('config-motivo-popup-edit-desc').value,
            name: document.getElementById('config-motivo-popup-edit-name').value,
            responsavel:roleID
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
    }else{
        errorNotify(session.data)
    } 
})
document.getElementById('save-desc-ticket').addEventListener('click',async()=>{
    let session = await fetch('/ticket/desc', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            serverID:serverID,
            desc: document.getElementById('desc-ticket').value,
        }),
    }).then(response => { return response.json() })
    if (session.success == true) {
        successNotify(session.data)
    }else{
        errorNotify(session.data)
    } 
})



document.getElementById('BannerTicketPerso').addEventListener('change',()=>{
    const fileInput = document.getElementById('BannerTicketPerso');
    const previewImage = document.getElementById('BannerTicketPreview');
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
            formData.append('BannerTicket',file)
            formData.append('serverID',serverID)

            $.ajax({
                traditional: true,
                url: '/ticket/banner',
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