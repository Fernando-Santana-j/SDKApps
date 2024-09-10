const botedit = new URLSearchParams(new URL(location.href).search).get('botedit', 0)
if (botedit == 'false') {
    errorNotify('Você não tem permissão para editar o bot!')
    const novaURL = window.location.protocol + '//' + window.location.host + window.location.pathname
    window.history.pushState({ path: novaURL }, '', novaURL);
}



