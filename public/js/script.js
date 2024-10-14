let theme = localStorage.getItem('theme')
if (theme == 'dark') {
    document.getElementById('footer-logo-img').src = '<%= host %>/public/img/logo-text-ligth.png'
}

document.getElementById('discord-iframe').src = `https://discord.com/widget?id=1286428696701435984&theme=${theme}`

let discordUrl
if (localStorage.getItem('access_token')) {
    discordUrl = `/auth/verify/${localStorage.getItem('access_token')}`
} else {
    discordUrl = "/redirect/discord"
}

document.querySelectorAll('.button-assinar').forEach(element => {
    if (isloged == 'true') {
        element.href = '/dashboard'
    } else {
        element.href = discordUrl
    }
})
document.getElementById('buttons-login').href = isloged == 'true' ? '/dashboard' : discordUrl 



// const carousel = document.querySelector('.carousel-inner');
// const itemWidth = 272;
// const totalWidth = itemWidth * collaborators.length;
// let position = 0;

// function animate() {
//     position += 1;
//     if (position >= totalWidth) {
//         position = 0;
//         carousel.style.transition = 'none';
//         carousel.style.transform = `translateX(0px)`;
//         setTimeout(() => {
//             carousel.style.transition = 'transform 0.1s linear';
//         }, 10);
//     } else {
//         carousel.style.transform = `translateX(${-position}px)`;
//     }
// }

// setInterval(animate, 30);