
document.addEventListener('DOMContentLoaded', function () {

    if (userID || googleLoginSession) {
        // showEnterButtonLogin()
    }

    setTimeout(() => {
        document.querySelector('.logo').style.opacity = '1';
        document.querySelector('.logo').style.transform = 'translateX(0)';
    }, 300);

    document.querySelectorAll('.nav-links a').forEach((link, index) => {
        setTimeout(() => {
            link.style.opacity = '1';
            link.style.transform = 'translateY(0)';
        }, 400 + (index * 120));
    });
    setTimeout(() => {
        document.querySelectorAll('.cta-button').forEach(button => {
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        })
        document.querySelectorAll('#buttons-register').forEach(button => {
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        })
    }, 800);
    setTimeout(() => {
        document.querySelector('.hero-title').style.opacity = '1';
        document.querySelector('.hero-title').style.transform = 'translateY(0)';
    }, 900);
    setTimeout(() => {
        document.querySelector('.hero-subtitle').style.opacity = '1';
        document.querySelector('.hero-subtitle').style.transform = 'translateY(0)';
    }, 1100);
    setTimeout(() => {
        document.querySelector('.hero-buttons').style.opacity = '1';
        document.querySelector('.hero-buttons').style.transform = 'translateY(0)';
    }, 1300);
    setTimeout(() => {
        document.querySelector('.hero-img').style.opacity = '1';
        document.querySelector('.hero-img').style.transform = 'translateY(0)';
    }, 1500);

    setTimeout(() => {
        document.querySelectorAll('.floating-shape').forEach((shape, index) => {
            shape.style.opacity = '0.6';
            shape.style.transform = 'scale(1)';
        });
    }, 1700);

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };
    function animateElement(element, animationType) {
        element.classList.add('animated', animationType);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    if (entry.target.classList.contains('section-title')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                    if (entry.target.classList.contains('section-subtitle')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                    if (entry.target.classList.contains('feature-card')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                    if (entry.target.classList.contains('news-card')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'scale(1)';
                    }
                    if (entry.target.classList.contains('testimonial-card')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                    if (entry.target.classList.contains('cta-section')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                    if (entry.target.classList.contains('partner-item')) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                }, delay);

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.setAttribute('data-delay', 100 * index);
        observer.observe(card);
    });

    document.querySelectorAll('.news-card').forEach((card, index) => {
        card.setAttribute('data-delay', 150 * index);
        observer.observe(card);
    });

    document.querySelectorAll('.partner-item').forEach((item, index) => {
        item.setAttribute('data-delay', 80 * index);
        observer.observe(item);
    });

    document.querySelectorAll('.section-title, .section-subtitle, .testimonial-card, .cta-section').forEach(el => {
        observer.observe(el);
    });

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            document.querySelector('header').classList.add('scrolled');
        } else {
            document.querySelector('header').classList.remove('scrolled');
        }
    });

    const testimonialDots = document.querySelectorAll('.testimonial-dot');
    const testimonialSlides = document.querySelector('.testimonial-slides');

    testimonialDots.forEach(dot => {
        dot.addEventListener('click', function () {
            testimonialDots.forEach(d => d.classList.remove('active'));
            this.classList.add('active');
            const slideIndex = this.getAttribute('data-slide');
            testimonialSlides.style.transform = `translateX(-${slideIndex * 33.333}%)`;
        });
    });
});





let theme = localStorage.getItem('theme')
if (theme == 'dark') {
    document.getElementById('footer-logo-image').src = '/public/img/Logos/logo-text-ligth.png'
}

async function sendCodeEmail() {
    let session = await fetch('/security/email/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({

        })
    })
    if (session.success == true) {
        successNotify('Foi enviado um email para o seu email!')
        // openPopup(document.getElementById('code-confirm-popup-containner'), document.getElementById('code-confirm-popup-content'))
    } else {
        errorNotify(session.data)
    }

}

document.querySelectorAll('.init-button').forEach(button => {
    button.addEventListener('click', () => {
        if ((userID && sessionUser.emaiVerify == true) || googleLoginSession == true) {
            location.href = '/dashboard?createStore=true'
            return
        }
        if (userID && sessionUser.emaiVerify == false) {
            sendCodeEmail()
            return
        }

        // openPopup(document.getElementById('login-popup-containner'), document.getElementById('login-popup-content'))
    })
})


document.getElementById('buttons-register').addEventListener('click', () => {
    if ((userID && sessionUser.emaiVerify == true) || googleLoginSession == true) {
        location.href = '/dashboard'
        return
    }
    if (userID && sessionUser.emaiVerify == false) {
        sendCodeEmail()
        return
    }

    document.getElementById('register-popup-containner').open()
})

document.getElementById('buttons-login').addEventListener('click', () => {

    if ((userID && sessionUser.emaiVerify == true) || googleLoginSession == true) {
        location.href = '/dashboard'
        return
    }
    if (userID && sessionUser.emaiVerify == false) {
        sendCodeEmail()
        return
    }

    document.getElementById('login-popup-containner').open()
})