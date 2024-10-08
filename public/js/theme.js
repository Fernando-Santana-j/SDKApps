try {
    if (localStorage.getItem('theme') == null || localStorage.getItem('theme') == undefined) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches == false) {
            localStorage.setItem('theme', 'light')
        } else {
            localStorage.setItem('theme', 'dark')
        }
        themeVerificarion()
    }

    themeVerificarion()
    function themeVerificarion() {
        var themeLocal = localStorage.getItem('theme')
        if (themeLocal == 'dark') {
            document.body.setAttribute('data-theme', themeLocal);
            document.getElementById('top-header-theme').innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0,0,256,256"><g fill="#ffffff" fill-rule="evenodd" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(10.66667,10.66667)"><path d="M17.75,12c0,-3.174 -2.576,-5.75 -5.75,-5.75c-3.174,0 -5.75,2.576 -5.75,5.75c0,3.174 2.576,5.75 5.75,5.75c3.174,0 5.75,-2.576 5.75,-5.75zM16.25,12c0,2.346 -1.904,4.25 -4.25,4.25c-2.346,0 -4.25,-1.904 -4.25,-4.25c0,-2.346 1.904,-4.25 4.25,-4.25c2.346,0 4.25,1.904 4.25,4.25zM11.25,2v2c0,0.414 0.336,0.75 0.75,0.75c0.414,0 0.75,-0.336 0.75,-0.75v-2c0,-0.414 -0.336,-0.75 -0.75,-0.75c-0.414,0 -0.75,0.336 -0.75,0.75zM6.35,3.715l1,1.732c0.207,0.358 0.667,0.481 1.025,0.274c0.358,-0.207 0.481,-0.666 0.275,-1.024l-1,-1.732c-0.207,-0.359 -0.667,-0.482 -1.025,-0.275c-0.358,0.207 -0.481,0.666 -0.275,1.025zM2.965,7.65l1.732,1c0.358,0.206 0.817,0.083 1.024,-0.275c0.207,-0.358 0.084,-0.818 -0.274,-1.025l-1.732,-1c-0.359,-0.206 -0.818,-0.083 -1.025,0.275c-0.207,0.358 -0.084,0.818 0.275,1.025zM2,12.75h2c0.414,0 0.75,-0.336 0.75,-0.75c0,-0.414 -0.336,-0.75 -0.75,-0.75h-2c-0.414,0 -0.75,0.336 -0.75,0.75c0,0.414 0.336,0.75 0.75,0.75zM3.715,17.65l1.732,-1c0.358,-0.207 0.481,-0.667 0.274,-1.025c-0.207,-0.358 -0.666,-0.481 -1.024,-0.275l-1.732,1c-0.359,0.207 -0.482,0.667 -0.275,1.025c0.207,0.358 0.666,0.481 1.025,0.275zM7.65,21.035l1,-1.732c0.206,-0.358 0.083,-0.817 -0.275,-1.024c-0.358,-0.207 -0.818,-0.084 -1.025,0.274l-1,1.732c-0.206,0.359 -0.083,0.818 0.275,1.025c0.358,0.207 0.818,0.084 1.025,-0.275zM12.75,22v-2c0,-0.414 -0.336,-0.75 -0.75,-0.75c-0.414,0 -0.75,0.336 -0.75,0.75v2c0,0.414 0.336,0.75 0.75,0.75c0.414,0 0.75,-0.336 0.75,-0.75zM17.65,20.285l-1,-1.732c-0.207,-0.358 -0.667,-0.481 -1.025,-0.274c-0.358,0.207 -0.481,0.666 -0.275,1.024l1,1.732c0.207,0.359 0.667,0.482 1.025,0.275c0.358,-0.207 0.481,-0.666 0.275,-1.025zM21.035,16.35l-1.732,-1c-0.358,-0.206 -0.817,-0.083 -1.024,0.275c-0.207,0.358 -0.084,0.818 0.274,1.025l1.732,1c0.359,0.206 0.818,0.083 1.025,-0.275c0.207,-0.358 0.084,-0.818 -0.275,-1.025zM22,11.25h-2c-0.414,0 -0.75,0.336 -0.75,0.75c0,0.414 0.336,0.75 0.75,0.75h2c0.414,0 0.75,-0.336 0.75,-0.75c0,-0.414 -0.336,-0.75 -0.75,-0.75zM20.285,6.35l-1.732,1c-0.358,0.207 -0.481,0.667 -0.274,1.025c0.207,0.358 0.666,0.481 1.024,0.275l1.732,-1c0.359,-0.207 0.482,-0.667 0.275,-1.025c-0.207,-0.358 -0.666,-0.481 -1.025,-0.275zM16.35,2.965l-1,1.732c-0.206,0.358 -0.083,0.817 0.275,1.024c0.358,0.207 0.818,0.084 1.025,-0.274l1,-1.732c0.206,-0.359 0.083,-0.818 -0.275,-1.025c-0.358,-0.207 -0.818,-0.084 -1.025,0.275z"></path></g></g></svg>`
        } else {
            document.body.setAttribute('data-theme', themeLocal);
            document.getElementById('top-header-theme').innerHTML = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0,0,256,256"><g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(8.53333,8.53333)"><path d="M22,21c-6.627,0 -12,-5.373 -12,-12c0,-1.95 0.475,-3.785 1.3,-5.412c-4.815,1.56 -8.3,6.077 -8.3,11.412c0,6.627 5.373,12 12,12c4.678,0 8.72,-2.682 10.7,-6.588c-1.166,0.378 -2.408,0.588 -3.7,0.588z"></path></g></g></svg>`
        }
    }



} catch (error) {

}