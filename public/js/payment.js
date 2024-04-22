
let serverID = location.pathname.replace('/payment/', "")

async function initCheckout(plan,price) {
    await $.ajax({
        traditional: true,
        url: '/subscription/create',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify( {
            price:price,
            serverID:serverID,
            uid:uid,
            plan:plan,
            host:location.origin
        } ),
        dataType: 'json',
        success: function(response) {
            console.log(response);
            if (response.success == true) {
                window.location.href = response.url;
            }   
        },
        error: function(xhr, status, error) {
            console.error(error);
        }
    })
}

document.getElementById('plan-1').addEventListener('click', async () => {
    initCheckout(1,999)
});


document.getElementById('plan-2').addEventListener('click', async () => {
    initCheckout(2,1499)
});


document.getElementById('plan-3').addEventListener('click', async () => {
    initCheckout(3,1999)
});