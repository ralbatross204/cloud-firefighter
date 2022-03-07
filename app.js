const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let t_ = 0;

let player = null;

let reticle = null;

let enemies = [];
let droplets = [];
let steams = [];

let score = 0;

let debugMode = false;
let gameOver = false;


(() => {
    resizeCanvas();
    window.onresize = resizeCanvas;

    const params = new URLSearchParams(location.search);
    if ( params.has("debug") ) {
        debugMode = true;

        window.addEventListener('keydown', (e) => {
            if ( e.key = ' ' ) {
                update(t_ + 17);
            }
        });
    }

    document.getElementById('play-again').onclick = () => {
        gameOver = false;
        restartGame();
    }
    document.getElementById('give-up').onclick = () => {
        alert('You loose!!!!!!');
        window.close();
    }

    player = makePlayer();

    restartGame();

    if ( !debugMode) { update(); }
})()

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    if ( player ) {
        player.x = canvas.width / 20;
        player.y = canvas.height / 2;
    }
}

function handlePointerdown(e) {
    reticle = { x: e.offsetX, y: e.offsetY };
}
function handlePointermove(e) {
    if ( reticle ) {
        reticle.x = e.offsetX; 
        reticle.y = e.offsetY;
    }
}
function handlePointerup(e) {
    reticle = null;
}

function restartGame() {
    document.documentElement.classList.remove('game-over');

    enemies = [makeEnemy()];
    droplets = [];
    steams = [];

    canvas.onpointerdown = handlePointerdown;
    canvas.onpointermove = handlePointermove;
    canvas.onpointerup = handlePointerup;

    update();
}

function endGame() {
    enemies = [];
    document.documentElement.classList.add('game-over');
    canvas.onpointerup = null;
    canvas.onpointerdown = null;
    reticle = null;
}

function update(t) {
    if ( t_ == 0 ) {
        t_ = t;
    }
    const dt = t - t_;
    const fps = 1000/dt;
    t_ = t;

    ctx.fillStyle = 'rgb(93, 215, 237)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if ( enemies.length == 0 ) {
        enemies.push(makeEnemy());
    }
    if ( reticle ) {
        droplets.push(makeDroplet());
    }

    if ( dt ) {
        updatePlayer(dt);
        updateEnemies(dt);
        updateDroplets(dt);
        updateSteams(dt);
    }
    doDropletCollisions();

    checkGameOver();

    drawEnemies();
    drawDroplets();
    drawSteams();
    drawPlayer();


    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    // ctx.fillText("FPS: " + Math.round(fps), 10, 20);

    ctx.fillText("Score: " + score, 10, 20);

    if ( gameOver ) {
        endGame();
    }

    if ( ! debugMode && ! gameOver ) { requestAnimationFrame(update); }
}

function makePlayer() {
    const x = canvas.width / 20;
    const y = canvas.height / 2;
    const size = 50;
    const stress = 0;

    const tufts = [];
    for ( let i = 0 ; i < size*15 ; i++ ) {
        tufts.push({
            x: x + (Math.random()*size - size/2),
            y: y + (Math.random()*size - size/2),
            size: Math.random()*5 + 5,
            opacity: 0.1,
            vx: (Math.random()*3 + 0.5) * ( Math.random() > 0.5 ? -1 : 1),
            vy: (Math.random()*3 + 0.5) * ( Math.random() > 0.5 ? -1 : 1),
            evaporating: false
        })
    }
    return {x, y, size, tufts, stress};
}

function updatePlayer(dt) {
    dt = dt/1000;
    for ( const t of player.tufts ) {
        t.x += t.vx * dt;
        t.y += t.vy * dt;

        const dx = t.x - player.x;
        const dy = t.y - player.y;

        if ( t.evaporating ) {
            t.opacity -= 0.001;
            if ( t.opacity < 0 ) {
                t.x = player.x + (Math.random()*100 - 50);
                t.y = player.y + (Math.random()*50 - 25);
                t.opacity = 0.1;
                t.evaporating = false;
            }
        } else {
            const d = dx*dx + dy*dy
            if ( d > player.size*player.size ) {
                t.evaporating = true;
            }
        }
    }
}

function drawPlayer() {
    for ( const t of player.tufts ) {
        ctx.fillStyle = `rgba(255, 255, 255, ${t.opacity})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, 2*Math.PI);
        ctx.fill();
    }
    
    // The eyes
    const eyeRadius = 7;
    const xl = player.x - player.size/6;
    const xr = player.x + player.size/6;
    const y = player.y - player.size/8;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(xl, y, eyeRadius, 0, 2*Math.PI);
    ctx.arc(xr, y, eyeRadius, 0, 2*Math.PI);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(xl, y, eyeRadius, 0, 2*Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xr, y, eyeRadius, 0, 2*Math.PI);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.3)';

    // The pupils
    const pupilRadius = eyeRadius/4;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(xl + eyeRadius - pupilRadius*2, y, pupilRadius, 0, 2*Math.PI);
    ctx.arc(xr + eyeRadius - pupilRadius*2, y, pupilRadius, 0, 2*Math.PI);
    ctx.fill();

    // The brows
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(xl - 3*player.stress, y - 10*player.stress, eyeRadius + 3, Math.PI, Math.PI*1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xr + 3*player.stress, y - 10*player.stress, eyeRadius + 3, Math.PI*1.5, Math.PI*2);
    ctx.stroke();
    

    
    // The mouth
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if ( reticle ) {
        // A stern look while shooting
        ctx.moveTo(player.x - player.size/4, player.y + player.size/4);
        ctx.lineTo(player.x + player.size/4, player.y + player.size/4);
    } else {
        // Otherwise a smile
        ctx.arc(player.x, player.y + player.size/4, player.size/4, 0, Math.PI);
    }
    ctx.stroke();
}

function makeEnemy() {
    const x = canvas.width;
    const y = Math.random() * canvas.height;
    const vx  = -(Math.random()*100 + 200);   // in px/sec
    const vy = (y - player.y)/((x - player.x)/vx);
    const size = Math.random()*10 + 5;
    const falls = false;
    return {x, y, vx, vy, size, falls}
}

function updateEnemies(dt) {
    if ( Number.isNaN(dt) ) { return; }

    for ( const e of enemies ) {
        const t = dt/1000;
        e.x += e.vx * t;
        e.y += e.vy * t;
    }

    const countBefore = enemies.length;
    enemies = enemies.filter( e => e.x > 0 && e.size > 3);
    score += countBefore - enemies.length;
}
function drawEnemies() {

    for ( const e of enemies ) {
        ctx.fillStyle = 'brown';
        ctx.fillRect(e.x - 4, e.y+4, 8, 30);


        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, 2*Math.PI);
        ctx.fill();

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, 2, e.size*0.6, 0, 0, 2*Math.PI);
        ctx.fill();
    }

}

function checkGameOver() {
    for ( const e of enemies ) {
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const s = player.size/2 + e.size;

        const h = Math.sqrt(dx*dx + dy*dy);
        if ( h < s ) {
            gameOver = true;
        }

        if ( h > 500 ) {
            player.stress = 0;
        } else {
            player.stress = (500 - h) / 500;
        }
    }
}

function makeDroplet() {
    const x = player.x;
    const y = player.y;
    const dx = reticle.x - player.x;
    const dy = reticle.y - player.y;
    const h = Math.sqrt(dx*dx + dy*dy);
    const pressure = Math.min(200, h)/200;
    const vx = 200 * dx/h * (1 + 3*pressure);
    const vy = 200 * dy/h * (1 + 3*pressure);
    const size = 2;
    const falls = true;
    const spent = false;
    const hue = 220 + Math.random()*40;
    const droplet = { x, y, vx, vy, size, falls, spent, hue };
    return droplet;
}

function updateDroplets(dt) {
    if ( Number.isNaN(dt) ) { return; }
    const t = dt/1000;

    for ( const d of droplets ) {
        
        d.x += d.vx * t;
        d.y += d.vy * t;
        d.vy += 1000 * t;
    }

    droplets = droplets.filter( d => 0 <= d.x && d.x <= canvas.width && 0 <= d.y && d.y <= canvas.height );
}

function doDropletCollisions() {
    for ( const d of droplets ) {
        if ( d.spent ) { continue; }

        for ( const e of enemies ) {
            const dx = e.x - d.x;
            const dy = e.y - d.y;
            const s = e.size + d.size;
            if ( dx*dx + dy*dy < s*s ) {
                e.size -= 1;
                d.spent = true;
                const n = Math.random()*5+15;
                for ( let i = 0 ; i < n ; i++ ) {
                    steams.push(makeSteam(d.x, d.y));
                }
                break;
            }
        }
    }
}

function drawDroplets() {
    
    for ( const d of droplets ) {
        ctx.fillStyle = `hsl(${d.hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, 2*Math.PI);
        ctx.fill();
    }
}

function makeSteam(x, y) {
    return {
        x: x + (Math.random()*10 - 20),
        y: y,
        vy: -(Math.random()*50 + 50),
        opacity: 0.1,
        size: 10,
    }
}

function updateSteams(dt) {
    if ( Number.isNaN(dt) ) { return; }
    const t = dt/1000;

    for ( const s of steams ) {
        s.y += s.vy * t;
        s.opacity -= 0.002;
        s.size -= 0.02;
    }
    steams = steams.filter( s => s.opacity > 0 && s.size > 0 );
}

function drawSteams() {
    for ( const s of steams ) {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, 2*Math.PI);
        ctx.fill();
    }
}