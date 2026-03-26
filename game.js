// ==================== BASQUETE 3D - CÓDIGO PRINCIPAL ====================

let scene, camera, renderer;
let player, ball, basket, basketRim;
let score = 0;
let combo = 0;
let timeLeft = 60;
let gameRunning = true;
let keys = {};
let mouseDown = false;
let mouseStartX = 0, mouseStartY = 0;
let power = 0;
let velocity = new THREE.Vector3();

const scoreElement = document.getElementById('score');
const comboElement = document.getElementById('combo');
const timeElement = document.getElementById('time');

// Inicializa o Three.js
function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x88aaff, 50, 200);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Chão (quadra)
    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a5f1a });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Linhas da quadra
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-12, 0.1, -12), new THREE.Vector3(12, 0.1, -12),
        new THREE.Vector3(12, 0.1, 12), new THREE.Vector3(-12, 0.1, 12),
        new THREE.Vector3(-12, 0.1, -12)
    ]);
    const courtLines = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(courtLines);

    // Jogador (caixa simples)
    const playerGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 1.5, 8);
    player.castShadow = true;
    scene.add(player);

    // Bola
    const ballGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff8800, 
        shininess: 100 
    });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 3, 8);
    ball.castShadow = true;
    scene.add(ball);

    // Cesta
    const backboardGeometry = new THREE.BoxGeometry(0.2, 3, 2);
    const backboardMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const backboard = new THREE.Mesh(backboardGeometry, backboardMaterial);
    backboard.position.set(0, 5, -12);
    scene.add(backboard);

    // Aro da cesta
    const rimGeometry = new THREE.TorusGeometry(1.2, 0.1, 16, 32);
    const rimMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    basketRim = new THREE.Mesh(rimGeometry, rimMaterial);
    basketRim.rotation.x = Math.PI / 2;
    basketRim.position.set(0, 4.5, -12);
    scene.add(basketRim);

    // Rede (simples)
    basket = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 0.8, 1.5, 16, 1, true),
        new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    basket.position.set(0, 3.8, -12);
    basket.rotation.x = Math.PI;
    scene.add(basket);

    // Eventos
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);

    // Inicia o timer
    setInterval(updateTimer, 1000);

    animate();
}

// Timer
function updateTimer() {
    if (!gameRunning) return;
    timeLeft--;
    timeElement.textContent = timeLeft;
    if (timeLeft <= 0) {
        gameRunning = false;
        alert(`Fim de jogo! Pontuação final: ${score} pontos`);
    }
}

// Controles do mouse para mira e força
function onMouseDown(e) {
    if (e.button === 0 && gameRunning) {
        mouseDown = true;
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        power = 0;
    }
}

function onMouseUp(e) {
    if (e.button === 0 && mouseDown && gameRunning) {
        mouseDown = false;
        shootBall();
    }
}

function onMouseMove(e) {
    if (mouseDown) {
        const deltaX = e.clientX - mouseStartX;
        const deltaY = e.clientY - mouseStartY;
        power = Math.min(Math.sqrt(deltaX*deltaX + deltaY*deltaY) / 5, 100);
    }
}

// Arremesso da bola
function shootBall() {
    if (ball.userData.isFlying) return;

    const direction = new THREE.Vector3();
    direction.subVectors(basketRim.position, ball.position).normalize();

    // Ajusta com a mira do mouse (simplificado)
    direction.x += (mouseStartX - window.innerWidth/2) * 0.001;
    direction.y += 0.6; // arco para cima

    const force = power / 20 + 15; // força mínima + variável

    velocity.set(direction.x * force, direction.y * force, direction.z * force);

    ball.userData.isFlying = true;
    ball.userData.velocity = velocity;
}

// Atualiza física da bola (simples gravidade)
function updateBall() {
    if (!ball.userData.isFlying) return;

    ball.userData.velocity.y -= 0.35; // gravidade
    ball.position.add(ball.userData.velocity.clone().multiplyScalar(0.05));

    // Rotação da bola
    ball.rotation.x += 0.1;
    ball.rotation.z += 0.08;

    // Colisão com o chão
    if (ball.position.y < 0.6) {
        ball.position.y = 0.6;
        ball.userData.velocity.y = -ball.userData.velocity.y * 0.6;
        ball.userData.velocity.x *= 0.95;
        ball.userData.velocity.z *= 0.95;

        if (Math.abs(ball.userData.velocity.y) < 1) {
            ball.userData.isFlying = false;
            ball.userData.velocity.set(0, 0, 0);
        }
    }

    // Detecção de cesta
    const distToRim = ball.position.distanceTo(basketRim.position);
    if (distToRim < 1.4 && ball.position.y > 4 && ball.position.y < 5.5 && 
        Math.abs(ball.userData.velocity.y) > 2) {
        
        if (Math.abs(ball.position.x) < 1.3 && Math.abs(ball.position.z + 12) < 1) {
            score += 10 + combo * 2;
            combo++;
            scoreElement.textContent = score;
            comboElement.textContent = combo + "x";
            
            // Efeito visual simples
            ball.position.set(0, 3, 8);
            ball.userData.isFlying = false;
            alert("🏀 Cesta! +" + (10 + combo*2) + " pontos");
        }
    }
}

// Movimento do jogador
function updatePlayer() {
    const speed = 0.2;
    if (keys['w']) player.position.z -= speed;
    if (keys['s']) player.position.z += speed;
    if (keys['a']) player.position.x -= speed;
    if (keys['d']) player.position.x += speed;

    // Limites da quadra
    player.position.x = Math.max(-12, Math.min(12, player.position.x));
    player.position.z = Math.max(-10, Math.min(12, player.position.z));

    // Bola segue o jogador quando não está voando
    if (!ball.userData.isFlying) {
        ball.position.x = player.position.x;
        ball.position.z = player.position.z - 1.8;
        ball.position.y = player.position.y + 1.5;
    }
}

// Loop principal
function animate() {
    requestAnimationFrame(animate);

    if (gameRunning) {
        updatePlayer();
        updateBall();
    }

    // Camera segue o jogador um pouco
    camera.position.x = player.position.x * 0.3;
    camera.lookAt(player.position.x * 0.5, 4, -5);

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Inicia o jogo
init();