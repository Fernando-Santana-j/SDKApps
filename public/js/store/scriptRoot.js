const menuItems = document.querySelectorAll('#store-menu-nav-list li a');
const menuLine = document.querySelector('#store-menu-line');
const menuContent = document.querySelector('#store-menu-content');
let activeItem;

const pathName = location.pathname;
if (pathName.includes('about')) {
    activeItem = menuItems[0];
} else if (pathName.includes('feedback')) {
    activeItem = menuItems[2];
} else {
    activeItem = menuItems[1];
}

activeItem.classList.add('active');

function setInitialPosition() {
    const menuRect = menuContent.getBoundingClientRect();
    const activeRect = activeItem.getBoundingClientRect();

    menuLine.style.width = `${activeRect.width + 15}px`;
    menuLine.style.left = `${activeRect.left - menuRect.left - 5}px`;

    if (menuLine.style.opacity === '0' || !menuLine.style.opacity) {
        setTimeout(() => {
            menuLine.style.opacity = '1';
        }, 100);
    }
}

function moveLineToItem(item) {
    const menuRect = menuContent.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    menuLine.style.width = `${itemRect.width + 10}px`;
    menuLine.style.left = `${itemRect.left - menuRect.left - 5}px`;
    
}

menuItems.forEach(item => {
    item.addEventListener('mouseenter', () => moveLineToItem(item));
    item.addEventListener('mouseleave', () => moveLineToItem(activeItem));

    item.addEventListener('click', (e) => {
        activeItem.classList.remove('active');
        item.classList.add('active');
        activeItem = item;
        moveLineToItem(activeItem);
    });
});

window.addEventListener('load', setInitialPosition);
window.addEventListener('resize', setInitialPosition);