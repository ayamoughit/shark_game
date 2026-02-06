// ===== 🦈 ANGRY SHARK ATTACK - VERSION PROFESSEUR ULTIME 🦈 =====
// Simulation IA Réactive avec Steering Behaviors
// Comportements émergents - Chaque agent décide localement
// Master IA - CASA G1 2025-2026 - Projet Boids Avancé
// Démonstration: Flocking, Flee, Pursue, Wander, Obstacle Avoidance

// === ÉTAT DU JEU ===
let gameState = "start";
let difficulty = "normal";

// === AGENTS ===
let flock = [];
let shark = null;
let obstacles = [];

// === IMAGES ===
let fishImage, sharkImage;

// === PARAMÈTRES DYNAMIQUES ===
let SHARK_DETECTION_RADIUS;
let SHARK_HUNT_RADIUS;
let SHARK_EAT_DISTANCE;
let FISH_SPAWN_COUNT;
let GAME_DURATION;

// === SCORE & SYSTÈME ===
let score = 0;
let highScores = { easy: 0, normal: 0, hard: 0 };
let fishEaten = 0;
let combo = 0;
let comboTimer = 0;
let maxCombo = 0;
let gameTime;
let lastSecond = 0;

// === EFFETS VISUELS ===
let particles = [];
let floatingTexts = [];
let screenShake = 0;
let sharkTrail = [];

// === POWER-UPS ===
let powerUps = [];
let activePowerUp = null;
let powerUpTimer = 0;

// === OBSTACLE SOURIS ===
let obstacleSouris;

// === STATISTIQUES AVANCÉES ===
let totalFishSpawned = 0;
let goldenFishEaten = 0;
let gameStartTime = 0;
let totalPlayTime = 0;

// === MODE ACADÉMIQUE (pour le prof) ===
let showAcademicPanel = false;  // Touche 'A' pour afficher
let showForceVectors = false;   // Touche 'V' pour vecteurs
let showPerceptionRadius = false; // Touche 'P' pour rayons

// === BADGES & ACHIEVEMENTS ===
let badges = {
    firstBlood: false,      // Premier poisson
    comboMaster: false,     // Combo x10
    goldenHunter: false,    // 5 poissons dorés
    speedDemon: false,      // 50 poissons en 30s
    perfectGame: false      // 100 poissons en mode difficile
};

// === DÉCOR ===
let seaweeds = [];
let corals = [];
let rocks = [];
let backgroundFish = [];
let decorInitialized = false;

function preload() {
    fishImage = loadImage('assets/fish.png');
    sharkImage = loadImage('assets/shark.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont('Arial');
    loadHighScores();
}

function loadHighScores() {
    ['easy', 'normal', 'hard'].forEach(d => {
        let saved = localStorage.getItem('sharkHighScore_' + d);
        if (saved) highScores[d] = parseInt(saved);
    });
}

function saveHighScore() {
    if (score > highScores[difficulty]) {
        highScores[difficulty] = score;
        localStorage.setItem('sharkHighScore_' + difficulty, score.toString());
    }
}

// ========================================
// CONFIGURATION DIFFICULTÉ
// ========================================

function setDifficulty(level) {
    difficulty = level;
    switch (level) {
        case "easy":
            SHARK_DETECTION_RADIUS = 150;
            SHARK_HUNT_RADIUS = 200;
            SHARK_EAT_DISTANCE = 40;
            FISH_SPAWN_COUNT = 40;
            GAME_DURATION = 90;
            break;
        case "normal":
            SHARK_DETECTION_RADIUS = 200;
            SHARK_HUNT_RADIUS = 300;
            SHARK_EAT_DISTANCE = 50;
            FISH_SPAWN_COUNT = 30;
            GAME_DURATION = 60;
            break;
        case "hard":
            SHARK_DETECTION_RADIUS = 250;
            SHARK_HUNT_RADIUS = 400;
            SHARK_EAT_DISTANCE = 60;
            FISH_SPAWN_COUNT = 20;
            GAME_DURATION = 45;
            break;
    }
}

// ========================================
// INITIALISATION
// ========================================

function initSimulation() {
    flock = [];
    obstacles = [];
    particles = [];
    floatingTexts = [];
    powerUps = [];
    sharkTrail = [];
    score = 0;
    fishEaten = 0;
    goldenFishEaten = 0;
    combo = 0;
    comboTimer = 0;
    maxCombo = 0;
    gameTime = GAME_DURATION;
    lastSecond = millis();
    totalFishSpawned = 0;
    activePowerUp = null;
    powerUpTimer = 0;
    decorInitialized = false;

    obstacleSouris = new Obstacle(mouseX, mouseY, 60, "rgba(100, 255, 150, 0.5)");

    // Créer le REQUIN
    shark = new Boid(width / 2, height / 2, sharkImage);
    shark.r = 160;
    shark.imageRotationOffset = 0;  // L'image du requin pointe vers la droite
    shark.maxSpeed = difficulty === "hard" ? 7 : 6;
    shark.maxForce = 0.25;
    shark.distanceCercle = 200;
    shark.wanderRadius = 80;
    shark.displaceRange = 0.15;

    // Spawner les poissons
    for (let i = 0; i < FISH_SPAWN_COUNT; i++) {
        spawnFish(random(100, width - 100), random(100, height - 150));
    }

    // Ajouter quelques obstacles initiaux
    for (let i = 0; i < 3; i++) {
        obstacles.push(new Obstacle(random(200, width - 200), random(200, height - 200), random(40, 70)));
    }
}

function spawnFish(x, y, isGolden = false) {
    const fish = new Boid(x, y, fishImage);
    fish.r = random(35, 55);
    fish.maxSpeed = random(4.5, 6.5);
    fish.perceptionRadius = random(60, 90);
    fish.fleeRadius = SHARK_DETECTION_RADIUS;
    fish.isGolden = isGolden || random() < 0.08;  // 8% de chance d'être doré
    flock.push(fish);
    totalFishSpawned++;
}

function spawnPowerUp() {
    if (powerUps.length < 2 && random() < 0.01) {
        let types = ['speed', 'magnet', 'freeze', 'double'];
        powerUps.push({
            x: random(100, width - 100),
            y: random(100, height - 150),
            type: random(types),
            size: 40,
            pulse: 0
        });
    }
}

// ========================================
// BOUCLE PRINCIPALE
// ========================================

function draw() {
    drawOceanBackground();

    switch (gameState) {
        case "start":
            drawStartScreen();
            break;
        case "playing":
            updateGame();
            drawGame();
            break;
        case "paused":
            drawGame();
            drawPauseScreen();
            break;
        case "gameover":
            drawGame();
            drawGameOverScreen();
            break;
        case "win":
            drawGame();
            drawWinScreen();
            break;
    }
}

function updateGame() {
    // Timer
    if (millis() - lastSecond >= 1000) {
        gameTime--;
        lastSecond = millis();

        // Spawn de nouveaux poissons
        if (gameTime % 8 === 0 && flock.length < 60) {
            for (let i = 0; i < 4; i++) {
                let edge = floor(random(4));
                let x, y;
                switch (edge) {
                    case 0: x = random(width); y = -30; break;
                    case 1: x = random(width); y = height + 30; break;
                    case 2: x = -30; y = random(height); break;
                    case 3: x = width + 30; y = random(height); break;
                }
                spawnFish(x, y);
            }
        }

        if (gameTime <= 0) {
            endGame(false);
        }
    }

    // Combo decay
    if (comboTimer > 0) {
        comboTimer--;
    } else if (combo > 0) {
        combo = 0;
    }

    // Power-ups
    spawnPowerUp();
    if (powerUpTimer > 0) {
        powerUpTimer--;
        if (powerUpTimer <= 0) {
            deactivatePowerUp();
        }
    }

    // Condition de victoire - manger 100 poissons
    if (fishEaten >= 100) {
        endGame(true);
    }
}

function drawGame() {
    push();
    if (screenShake > 0) {
        translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
        screenShake *= 0.9;
    }

    obstacleSouris.pos.x = mouseX;
    obstacleSouris.pos.y = mouseY;

    for (let obs of obstacles) {
        obs.show();
    }
    obstacleSouris.show();

    // Power-ups
    drawPowerUps();

    updateFish();
    updateShark();
    updateParticles();
    updateFloatingTexts();

    pop();

    drawUI();
}

// ========================================
// POWER-UPS
// ========================================

function drawPowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let pu = powerUps[i];
        pu.pulse += 0.1;

        let size = pu.size + sin(pu.pulse) * 5;

        // Halo
        push();
        noFill();
        for (let j = 3; j > 0; j--) {
            stroke(255, 255, 100, 30 * j);
            strokeWeight(3);
            ellipse(pu.x, pu.y, size + j * 15);
        }

        // Icône
        let colors = {
            'speed': color(255, 100, 100),
            'magnet': color(100, 100, 255),
            'freeze': color(100, 255, 255),
            'double': color(255, 200, 50)
        };

        fill(colors[pu.type]);
        stroke(255);
        strokeWeight(3);
        ellipse(pu.x, pu.y, size);

        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(20);
        let icons = { 'speed': '⚡', 'magnet': '🧲', 'freeze': '❄️', 'double': '×2' };
        text(icons[pu.type], pu.x, pu.y);
        pop();

        // Check collision
        if (shark && shark.pos.dist(createVector(pu.x, pu.y)) < pu.size) {
            activatePowerUp(pu.type);
            powerUps.splice(i, 1);
        }
    }
}

function activatePowerUp(type) {
    activePowerUp = type;
    powerUpTimer = 300;  // 5 secondes

    createFloatingText(shark.pos.x, shark.pos.y - 50, getPowerUpName(type), true);

    switch (type) {
        case 'speed':
            shark.maxSpeed *= 1.5;
            break;
        case 'magnet':
            // Les poissons sont attirés
            break;
        case 'freeze':
            // Les poissons sont gelés
            for (let fish of flock) {
                fish.maxSpeed = 0.5;
            }
            break;
        case 'double':
            // Double points déjà géré dans eatFish
            break;
    }
}

function deactivatePowerUp() {
    switch (activePowerUp) {
        case 'speed':
            shark.maxSpeed = 6;
            break;
        case 'freeze':
            for (let fish of flock) {
                fish.maxSpeed = random(4.5, 6.5);
            }
            break;
    }
    activePowerUp = null;
}

function getPowerUpName(type) {
    let names = {
        'speed': '⚡ VITESSE!',
        'magnet': '🧲 AIMANT!',
        'freeze': '❄️ GEL!',
        'double': '×2 DOUBLE!'
    };
    return names[type];
}

// ========================================
// MISE À JOUR DES POISSONS
// ========================================

function updateFish() {
    for (let i = flock.length - 1; i >= 0; i--) {
        let fish = flock[i];

        fish.flock(flock);

        // Si power-up aimant, attirer vers le requin
        if (activePowerUp === 'magnet') {
            let attract = p5.Vector.sub(shark.pos, fish.pos);
            attract.setMag(0.5);
            fish.applyForce(attract);
        } else {
            let fleeForce = fish.fleeFromDanger(shark, SHARK_DETECTION_RADIUS);
            fish.applyForce(fleeForce);
        }

        fish.fleeFromDanger(obstacleSouris, obstacleSouris.r + 40);

        for (let obs of obstacles) {
            let avoidForce = obs.getRepulsionForce(fish);
            avoidForce.mult(6);
            fish.applyForce(avoidForce);
        }

        let boundForce = fish.boundaries();
        boundForce.mult(fish.boundariesWeight);
        fish.applyForce(boundForce);

        fish.edges();
        fish.update();

        // Visualisation académique des zones de perception
        if (showPerceptionRadius) {
            push();
            noFill();

            // Zone de perception flocking
            stroke(100, 200, 255, 50);
            strokeWeight(1);
            ellipse(fish.pos.x, fish.pos.y, fish.perceptionRadius * 2);

            // Zone de fuite (danger)
            stroke(255, 100, 100, 40);
            ellipse(fish.pos.x, fish.pos.y, fish.fleeRadius * 2);
            pop();
        }

        // Visualisation des vecteurs de vélocité
        if (showForceVectors) {
            push();
            stroke(0, 255, 0, 180);
            strokeWeight(2);
            let velEnd = p5.Vector.add(fish.pos, p5.Vector.mult(fish.vel, 5));
            line(fish.pos.x, fish.pos.y, velEnd.x, velEnd.y);

            // Flèche
            fill(0, 255, 0);
            noStroke();
            push();
            translate(velEnd.x, velEnd.y);
            rotate(fish.vel.heading());
            triangle(0, 0, -8, -4, -8, 4);
            pop();
            pop();
        }

        // Affichage spécial pour poisson doré
        if (fish.isGolden) {
            push();
            noFill();
            stroke(255, 215, 0, 150 + sin(frameCount * 0.1) * 100);
            strokeWeight(3);
            ellipse(fish.pos.x, fish.pos.y, fish.r * 1.5);
            pop();
        }

        fish.show();
    }
}

// ========================================
// MISE À JOUR DU REQUIN
// ========================================

function updateShark() {
    // Trail effect
    if (frameCount % 3 === 0) {
        sharkTrail.push({
            x: shark.pos.x,
            y: shark.pos.y,
            angle: shark.vel.heading(),
            life: 30
        });
    }

    // Draw trail
    for (let i = sharkTrail.length - 1; i >= 0; i--) {
        let t = sharkTrail[i];
        t.life--;
        if (t.life <= 0) {
            sharkTrail.splice(i, 1);
        } else {
            push();
            let alpha = map(t.life, 0, 30, 0, 80);
            fill(100, 150, 200, alpha);
            noStroke();
            ellipse(t.x, t.y, 30 * (t.life / 30));
            pop();
        }
    }

    // Wander
    let wanderForce = shark.wander();
    wanderForce.mult(0.8);
    shark.applyForce(wanderForce);

    // Chasse
    if (flock.length > 0) {
        // Priorité aux poissons dorés
        let target = null;
        let closestGolden = null;
        let closestNormal = null;
        let minGoldenDist = Infinity;
        let minNormalDist = Infinity;

        for (let fish of flock) {
            let d = shark.pos.dist(fish.pos);
            if (fish.isGolden && d < minGoldenDist) {
                minGoldenDist = d;
                closestGolden = fish;
            } else if (d < minNormalDist) {
                minNormalDist = d;
                closestNormal = fish;
            }
        }

        target = (closestGolden && minGoldenDist < SHARK_HUNT_RADIUS * 1.5) ? closestGolden : closestNormal;

        if (target) {
            let distToFish = shark.pos.dist(target.pos);

            if (distToFish < SHARK_HUNT_RADIUS) {
                let pursueForce = shark.pursue(target);
                let strength = map(distToFish, 0, SHARK_HUNT_RADIUS, 5, 1);
                pursueForce.mult(strength);
                shark.applyForce(pursueForce);

                // Ligne de chasse stylée
                push();
                let lineColor = target.isGolden ? color(255, 215, 0) : color(255, 50, 50);
                stroke(lineColor);
                strokeWeight(2);
                drawingContext.setLineDash([8, 8]);
                line(shark.pos.x, shark.pos.y, target.pos.x, target.pos.y);
                drawingContext.setLineDash([]);

                // Indicateur de cible
                noFill();
                stroke(lineColor);
                strokeWeight(2);
                let pulseSize = 30 + sin(frameCount * 0.15) * 10;
                ellipse(target.pos.x, target.pos.y, pulseSize);
                pop();
            }
        }
    }

    // Manger les poissons
    for (let i = flock.length - 1; i >= 0; i--) {
        let fish = flock[i];
        let distToFish = shark.pos.dist(fish.pos);

        if (distToFish < SHARK_EAT_DISTANCE + shark.r / 3) {
            eatFish(fish, i);
        }
    }

    // Éviter obstacles
    for (let obs of obstacles) {
        let avoidForce = obs.getRepulsionForce(shark);
        avoidForce.mult(4);
        shark.applyForce(avoidForce);
    }

    let boundForce = shark.boundaries();
    boundForce.mult(10);
    shark.applyForce(boundForce);

    shark.edges();
    shark.update();

    // Zone de danger
    push();
    noFill();
    stroke(255, 0, 0, 30 + sin(frameCount * 0.1) * 20);
    strokeWeight(4);
    ellipse(shark.pos.x, shark.pos.y, SHARK_EAT_DISTANCE * 2 + shark.r * 0.7);
    pop();

    // Power-up actif visuellement
    if (activePowerUp) {
        push();
        noFill();
        let puColor = { 'speed': [255, 100, 100], 'magnet': [100, 100, 255], 'freeze': [100, 255, 255], 'double': [255, 200, 50] };
        stroke(...puColor[activePowerUp], 150);
        strokeWeight(5);
        ellipse(shark.pos.x, shark.pos.y, shark.r * 1.4 + sin(frameCount * 0.2) * 10);
        pop();
    }

    shark.show();
}

function eatFish(fish, index) {
    combo++;
    comboTimer = 120;
    if (combo > maxCombo) maxCombo = combo;

    let basePoints = fish.isGolden ? 50 : 10;
    let comboMultiplier = min(combo, 15);
    let points = basePoints * comboMultiplier;

    if (activePowerUp === 'double') points *= 2;

    score += points;

    // Effets
    createEatEffect(fish.pos.x, fish.pos.y, fish.isGolden);
    let text = fish.isGolden ? "🌟 +" + points + "!" : "+" + points;
    createFloatingText(fish.pos.x, fish.pos.y, text, combo > 1 || fish.isGolden);

    screenShake = 6 + combo * 1.5;

    flock.splice(index, 1);
    fishEaten++;
    if (fish.isGolden) goldenFishEaten++;
}

function endGame(isWin) {
    gameState = isWin ? "win" : "gameover";
    saveHighScore();
}

// ========================================
// EFFETS VISUELS
// ========================================

function createEatEffect(x, y, isGolden) {
    let colors = isGolden ?
        [color(255, 215, 0), color(255, 240, 100), color(255, 180, 50)] :
        [color(255, 100, 100), color(255, 200, 100), color(255, 150, 150)];

    for (let i = 0; i < 30; i++) {
        particles.push({
            x: x, y: y,
            vx: random(-10, 10),
            vy: random(-10, 10),
            life: 70,
            size: random(6, 14),
            color: random(colors),
            type: 'splash'
        });
    }

    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x + random(-25, 25),
            y: y + random(-25, 25),
            vx: random(-1.5, 1.5),
            vy: random(-4, -1),
            life: 90,
            size: random(4, 10),
            color: color(255, 255, 255, 180),
            type: 'bubble'
        });
    }

    // Onde de choc
    particles.push({
        x: x, y: y,
        life: 30,
        size: 20,
        color: isGolden ? color(255, 215, 0, 100) : color(255, 100, 100, 100),
        type: 'shockwave'
    });
}

function createFloatingText(x, y, text, isSpecial) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        life: 80,
        isSpecial: isSpecial
    });
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];

        if (p.type === 'shockwave') {
            p.size += 15;
            p.life--;
            if (p.life <= 0) {
                particles.splice(i, 1);
            } else {
                let alpha = map(p.life, 0, 30, 0, 100);
                noFill();
                stroke(red(p.color), green(p.color), blue(p.color), alpha);
                strokeWeight(3);
                ellipse(p.x, p.y, p.size);
            }
            continue;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'splash') {
            p.vy += 0.2;
            p.vx *= 0.97;
        } else if (p.type === 'bubble') {
            p.vy -= 0.03;
            p.x += sin(frameCount * 0.1 + i) * 0.7;
        }

        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            let alpha = map(p.life, 0, 70, 0, 255);
            fill(red(p.color), green(p.color), blue(p.color), alpha);
            noStroke();
            ellipse(p.x, p.y, p.size * (p.life / 70));
        }
    }
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y -= 2.5;
        ft.life--;

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        } else {
            let alpha = map(ft.life, 0, 80, 0, 255);
            let size = ft.isSpecial ? 36 : 26;
            let scale = ft.life > 60 ? map(ft.life, 80, 60, 1.5, 1) : 1;

            push();
            textAlign(CENTER, CENTER);
            textSize(size * scale);
            textStyle(BOLD);

            fill(0, 0, 0, alpha * 0.6);
            text(ft.text, ft.x + 3, ft.y + 3);

            if (ft.isSpecial) {
                fill(255, 220, 80, alpha);
            } else {
                fill(255, 255, 255, alpha);
            }
            text(ft.text, ft.x, ft.y);
            pop();
        }
    }
}

// ========================================
// FOND OCÉANIQUE AMÉLIORÉ
// ========================================

function initDecor() {
    if (decorInitialized) return;

    seaweeds = [];
    for (let i = 0; i < 18; i++) {
        seaweeds.push({
            x: random(width),
            height: random(100, 200),
            segments: floor(random(6, 12)),
            color: color(random(50, 100), random(160, 200), random(80, 120)),
            phase: random(TWO_PI)
        });
    }

    corals = [];
    for (let i = 0; i < 15; i++) {
        corals.push({
            x: random(width),
            y: height - random(15, 70),
            type: floor(random(3)),
            size: random(35, 80),
            color: color(
                random(220, 255),
                random(100, 200),
                random(120, 220)
            )
        });
    }

    rocks = [];
    for (let i = 0; i < 10; i++) {
        rocks.push({
            x: random(width),
            y: height - random(5, 50),
            w: random(80, 180),
            h: random(40, 90)
        });
    }

    backgroundFish = [];
    for (let i = 0; i < 25; i++) {
        backgroundFish.push({
            x: random(width),
            y: random(80, height - 180),
            size: random(4, 12),
            speed: random(0.3, 1.2),
            color: color(random(150, 255), random(150, 255), random(180, 255), 60)
        });
    }

    decorInitialized = true;
}

function drawOceanBackground() {
    initDecor();

    // Gradient sublime
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(
            color(80, 210, 255),   // Cyan brillant
            color(25, 90, 150),    // Bleu profond
            inter
        );
        stroke(c);
        line(0, y, width, y);
    }

    // Rayons de soleil animés
    push();
    noStroke();
    for (let i = 0; i < 10; i++) {
        let x = (frameCount * 0.15 + i * 120) % (width + 500) - 250;
        for (let j = 0; j < 3; j++) {
            fill(255, 255, 200, 4 + j * 3);
            beginShape();
            vertex(x + j * 10, 0);
            vertex(x + 100 + j * 10, 0);
            vertex(x + 300 + j * 20, height);
            vertex(x + 120 + j * 20, height);
            endShape(CLOSE);
        }
    }
    pop();

    // Fond sableux avec dégradé
    push();
    noStroke();
    for (let y = height - 140; y < height; y++) {
        let sandAlpha = map(y, height - 140, height, 0, 255);
        let sandColor = lerpColor(
            color(200, 180, 140, 0),
            color(255, 235, 200, 255),
            map(y, height - 140, height, 0, 1)
        );
        fill(sandColor);
        rect(0, y, width, 1);
    }

    for (let i = 0; i < 150; i++) {
        let sx = (i * 13.7 + sin(i) * 20) % width;
        let sy = height - random(5, 120);
        fill(255, 240, 200, random(40, 100));
        ellipse(sx, sy, random(2, 7));
    }
    pop();

    // Rochers avec détails
    push();
    for (let rock of rocks) {
        // Ombre
        fill(0, 0, 0, 30);
        noStroke();
        beginShape();
        vertex(rock.x - rock.w / 2 + 10, rock.y + 5);
        vertex(rock.x - rock.w / 3 + 10, rock.y - rock.h * 0.8 + 5);
        vertex(rock.x + 10, rock.y - rock.h + 5);
        vertex(rock.x + rock.w / 3 + 10, rock.y - rock.h * 0.7 + 5);
        vertex(rock.x + rock.w / 2 + 10, rock.y + 5);
        endShape(CLOSE);

        // Rocher
        fill(130, 120, 110);
        stroke(110, 100, 90);
        strokeWeight(2);
        beginShape();
        vertex(rock.x - rock.w / 2, rock.y);
        vertex(rock.x - rock.w / 3, rock.y - rock.h * 0.8);
        vertex(rock.x, rock.y - rock.h);
        vertex(rock.x + rock.w / 3, rock.y - rock.h * 0.7);
        vertex(rock.x + rock.w / 2, rock.y);
        endShape(CLOSE);

        // Mousse
        fill(70, 150, 90, 200);
        noStroke();
        ellipse(rock.x - rock.w / 4, rock.y - rock.h / 2, rock.w / 3, rock.h / 3);
    }
    pop();

    // Coraux vibrants
    push();
    for (let coral of corals) {
        fill(coral.color);
        noStroke();

        if (coral.type === 0) {
            for (let j = 0; j < 6; j++) {
                let angle = -PI / 2 + (j - 2.5) * 0.25;
                let len = coral.size * (0.6 + random(0.4));
                let x2 = coral.x + cos(angle) * len;
                let y2 = coral.y + sin(angle) * len;
                strokeWeight(10);
                stroke(coral.color);
                line(coral.x, coral.y, x2, y2);
                fill(coral.color);
                noStroke();
                ellipse(x2, y2, 18);
            }
        } else if (coral.type === 1) {
            ellipse(coral.x, coral.y - coral.size / 2, coral.size * 1.1, coral.size);
            for (let j = 0; j < 10; j++) {
                let a = j * TWO_PI / 10;
                ellipse(coral.x + cos(a) * coral.size * 0.35, coral.y - coral.size / 2 + sin(a) * coral.size * 0.35, coral.size * 0.35);
            }
        } else {
            for (let j = 0; j < 5; j++) {
                let xOff = (j - 2) * 14;
                rect(coral.x + xOff - 6, coral.y - coral.size, 12, coral.size, 6);
            }
        }
    }
    pop();

    // Algues fluides
    push();
    noFill();
    strokeWeight(7);
    for (let seaweed of seaweeds) {
        stroke(seaweed.color);
        beginShape();
        let baseX = seaweed.x;
        let baseY = height - 5;
        vertex(baseX, baseY);
        for (let j = 1; j <= seaweed.segments; j++) {
            let segmentY = baseY - (seaweed.height / seaweed.segments) * j;
            let wave = sin(frameCount * 0.025 + seaweed.phase + j * 0.4) * (12 + j * 2.5);
            vertex(baseX + wave, segmentY);
        }
        endShape();
    }
    pop();

    // Poissons décoratifs fluides
    push();
    for (let fish of backgroundFish) {
        fish.x -= fish.speed;
        if (fish.x < -20) {
            fish.x = width + 20;
            fish.y = random(80, height - 180);
        }
        fill(fish.color);
        noStroke();
        push();
        translate(fish.x, fish.y + sin(frameCount * 0.05 + fish.x * 0.01) * 3);
        ellipse(0, 0, fish.size * 2.2, fish.size);
        triangle(-fish.size * 1.1, 0, -fish.size * 1.8, -fish.size * 0.6, -fish.size * 1.8, fish.size * 0.6);
        pop();
    }
    pop();

    // Bulles réalistes
    push();
    for (let i = 0; i < 35; i++) {
        let bx = (i * 77 + frameCount * 0.25) % width;
        let by = height - ((frameCount * 0.5 + i * 50) % (height + 60));
        let size = 4 + sin(frameCount * 0.03 + i) * 3;

        fill(255, 255, 255, 35);
        noStroke();
        ellipse(bx, by, size);

        fill(255, 255, 255, 120);
        ellipse(bx - size * 0.25, by - size * 0.25, size * 0.35);
    }
    pop();
}

// ========================================
// ÉCRANS
// ========================================

function drawStartScreen() {
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);

    // Requin animé
    if (sharkImage) {
        push();
        imageMode(CENTER);
        let sharkY = height / 4 + sin(frameCount * 0.03) * 10;
        image(sharkImage, width / 2, sharkY, 200, 130);
        pop();
    }

    // Titre avec effet
    for (let i = 3; i >= 0; i--) {
        fill(0, 0, 0, 50);
        textSize(90 + i * 2);
        textStyle(BOLD);
        text("ANGRY SHARK", width / 2 + i * 2, height / 3 + 60 + i * 2);
    }

    fill(255, 50, 50);
    textSize(90);
    text("ANGRY SHARK", width / 2, height / 3 + 60);

    fill(255, 220, 80);
    textSize(65);
    text("ATTACK!", width / 2, height / 3 + 140);

    // Sélection difficulté
    fill(255);
    textSize(22);
    textStyle(NORMAL);
    text("Choisissez votre difficulté:", width / 2, height / 2);

    // Boutons centrés simplement
    let btnW = 200;
    let btnH = 90;
    let spacing = 220;
    let baseY = height / 2 + 100;

    // Stocker les positions des boutons globalement avec détails
    window.diffButtons = [
        {
            x: width / 2 - spacing, y: baseY, w: btnW, h: btnH, level: "easy", name: "FACILE",
            color: [80, 180, 80], time: "90s", fish: "40", desc: "Requin lent"
        },
        {
            x: width / 2, y: baseY, w: btnW, h: btnH, level: "normal", name: "NORMAL",
            color: [200, 170, 50], time: "60s", fish: "30", desc: "Équilibré"
        },
        {
            x: width / 2 + spacing, y: baseY, w: btnW, h: btnH, level: "hard", name: "DIFFICILE",
            color: [200, 70, 70], time: "45s", fish: "20", desc: "Requin rapide!"
        }
    ];

    let anyHover = false;

    for (let btn of window.diffButtons) {
        let hover = mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 &&
            mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2;

        if (hover) anyHover = true;

        // Bouton avec effet
        push();
        if (hover) {
            // Glow effect
            drawingContext.shadowBlur = 20;
            drawingContext.shadowColor = `rgb(${btn.color[0]}, ${btn.color[1]}, ${btn.color[2]})`;
            fill(btn.color[0], btn.color[1], btn.color[2]);
        } else {
            fill(btn.color[0] * 0.5, btn.color[1] * 0.5, btn.color[2] * 0.5);
        }
        stroke(btn.color[0] * 0.3, btn.color[1] * 0.3, btn.color[2] * 0.3);
        strokeWeight(3);
        rectMode(CENTER);
        rect(btn.x, btn.y, btn.w, btn.h, 15);
        pop();

        // Texte du bouton
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);

        textSize(22);
        textStyle(BOLD);
        text(btn.name, btn.x, btn.y - 25);

        textSize(13);
        textStyle(NORMAL);
        fill(220);
        text("⏱️ " + btn.time + " | 🐟 " + btn.fish, btn.x, btn.y);

        fill(180);
        textSize(11);
        text(btn.desc, btn.x, btn.y + 18);

        fill(255, 200, 50);
        textSize(10);
        text("🏆 " + highScores[btn.level], btn.x, btn.y + 35);
    }

    // Instructions
    fill(200);
    textSize(16);
    textStyle(NORMAL);
    text("🎯 Objectif: Manger 100 poissons avant la fin du temps!", width / 2, height - 80);

    fill(150);
    textSize(13);
    text("🌟 Poissons dorés = 50 pts | ⚡ Power-ups = bonus | 🔥 Combos = multiplicateur", width / 2, height - 55);

    fill(100);
    textSize(12);
    text("Appuyez sur ESPACE pour démarrer en mode Normal", width / 2, height - 30);

    if (anyHover) cursor(HAND);
    else cursor(ARROW);
}

function drawPauseScreen() {
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);
    fill(255);
    textSize(60);
    textStyle(BOLD);
    text("⏸️ PAUSE", width / 2, height / 2 - 40);

    textSize(24);
    textStyle(NORMAL);
    text("Appuyez sur ESPACE pour continuer", width / 2, height / 2 + 30);
}

function drawGameOverScreen() {
    // Pas de fond - le jeu reste visible en arrière-plan

    textAlign(CENTER, CENTER);

    // Titre rose/corail
    fill(255, 100, 120);
    textSize(55);
    textStyle(BOLD);
    text("⏰ TEMPS ÉCOULÉ!", width / 2, height / 2 - 80);

    // Score final
    fill(255);
    textSize(26);
    textStyle(NORMAL);
    text("Score Final: " + score, width / 2, height / 2 - 20);

    // Stats en gris clair
    fill(180);
    textSize(18);
    text("🐟 Poissons mangés: " + fishEaten, width / 2, height / 2 + 15);

    fill(255, 215, 0);
    text("🌟 Poissons dorés: " + goldenFishEaten, width / 2, height / 2 + 40);

    fill(255, 150, 100);
    text("🔥 Combo max: x" + maxCombo, width / 2, height / 2 + 65);

    drawRestartButton();
}

function drawWinScreen() {
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);

    // Animation de victoire
    for (let i = 0; i < 5; i++) {
        fill(255, 220, 80, 30);
        let size = 200 + sin(frameCount * 0.05 + i * 0.5) * 50 + i * 80;
        ellipse(width / 2, height / 3, size, size);
    }

    fill(80, 255, 120);
    textSize(80);
    textStyle(BOLD);
    text("🎉 VICTOIRE! 🎉", width / 2, height / 4);

    fill(255);
    textSize(35);
    text("100 poissons dévorés!", width / 2, height / 2 - 60);

    fill(255, 220, 80);
    textSize(45);
    text("Score: " + score, width / 2, height / 2);

    fill(100, 200, 255);
    textSize(28);
    text("Temps restant: " + gameTime + "s (+bonus " + gameTime * 10 + " pts!)", width / 2, height / 2 + 50);

    if (score >= highScores[difficulty]) {
        fill(255, 100, 255);
        textSize(30);
        text("🏆 NOUVEAU RECORD!", width / 2, height / 2 + 100);
    }

    drawRestartButton();
}

function drawRestartButton() {
    let btnX = width / 2;
    let btnY = height / 2 + 180;
    let btnW = 240;
    let btnH = 65;

    let hover = mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 &&
        mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;

    fill(hover ? color(80, 200, 100) : color(50, 160, 70));
    stroke(30, 120, 50);
    strokeWeight(4);
    rectMode(CENTER);
    rect(btnX, btnY, btnW, btnH, 15);

    fill(255);
    noStroke();
    textSize(30);
    textStyle(BOLD);
    text("🔄 REJOUER", btnX, btnY);

    if (hover) cursor(HAND);
}

// ========================================
// INTERFACE UTILISATEUR
// ========================================

function drawUI() {
    push();

    // Panneau score (gauche)
    fill(0, 0, 0, 200);
    noStroke();
    rectMode(CORNER);
    rect(10, 10, 220, 150, 18);

    fill(255);
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);
    text("🏆 SCORE", 28, 22);

    fill(255, 220, 80);
    textSize(42);
    text(score, 28, 42);

    // Combo
    if (combo > 1) {
        fill(255, 100, 100);
        textSize(24);
        text("🔥 COMBO x" + combo, 28, 95);

        let comboProgress = comboTimer / 120;
        fill(50);
        rect(28, 125, 175, 10, 5);

        // Gradient pour la barre
        let barColor = lerpColor(color(255, 100, 100), color(255, 200, 50), comboProgress);
        fill(barColor);
        rect(28, 125, 175 * comboProgress, 10, 5);
    } else {
        fill(180);
        textSize(15);
        textStyle(NORMAL);
        text("🐟 Mangés: " + fishEaten + " / 100", 28, 100);
        text("🐠 En vie: " + flock.length, 28, 122);
    }

    // Timer (droite)
    fill(0, 0, 0, 200);
    rect(width - 170, 10, 160, 95, 18);

    let timerColor = gameTime <= 10 ? color(255, 80, 80) : color(255);
    if (gameTime <= 10) {
        timerColor = lerpColor(color(255, 80, 80), color(255, 200, 80), sin(frameCount * 0.3) * 0.5 + 0.5);
    }
    fill(timerColor);
    textAlign(CENTER, TOP);
    textSize(16);
    textStyle(BOLD);
    text("⏱️ TEMPS", width - 90, 20);

    textSize(48);
    text(gameTime + "s", width - 90, 45);

    // Power-up actif
    if (activePowerUp) {
        fill(0, 0, 0, 200);
        rect(width / 2 - 100, 10, 200, 50, 12);

        fill(255, 220, 80);
        textAlign(CENTER, CENTER);
        textSize(20);
        textStyle(BOLD);
        text(getPowerUpName(activePowerUp), width / 2, 35);

        // Timer bar
        fill(50);
        rect(width / 2 - 80, 50, 160, 6, 3);
        fill(255, 200, 50);
        rect(width / 2 - 80, 50, 160 * (powerUpTimer / 300), 6, 3);
    }

    // High Score (haut centre)
    fill(0, 0, 0, 180);
    rectMode(CENTER);
    rect(width / 2, 85, 200, 45, 12);

    fill(255, 200, 50);
    textSize(18);
    text("🏆 Record: " + highScores[difficulty], width / 2, 85);

    // Difficulté
    let diffColors = { easy: [100, 200, 100], normal: [200, 180, 50], hard: [200, 80, 80] };
    fill(...diffColors[difficulty]);
    textSize(14);
    text(difficulty.toUpperCase(), width / 2, 105);

    // Contrôles (bas gauche)
    fill(0, 0, 0, 180);
    rectMode(CORNER);
    rect(10, height - 110, 320, 100, 12);

    fill(255);
    textAlign(LEFT, TOP);
    textSize(13);
    textStyle(BOLD);
    text("CONTRÔLES:", 25, height - 100);
    textStyle(NORMAL);
    fill(200);
    text("🖱️ Glisser: Ajouter poissons", 25, height - 82);
    text("⌨️ O: Obstacle | D: Debug | R: Reset", 25, height - 64);

    fill(100, 200, 255);
    text("📊 A: Panneau IA | V: Vecteurs | F: Zones", 25, height - 46);

    fill(150);
    text("⏸️ P ou ESPACE: Pause", 25, height - 28);

    // Panneau académique (si activé)
    if (showAcademicPanel) {
        drawAcademicPanel();
    }

    pop();
}

// ========================================
// PANNEAU ACADÉMIQUE (Démonstration IA)
// ========================================

function drawAcademicPanel() {
    push();

    // Panneau à droite
    let panelX = width - 320;
    let panelY = 130;
    let panelW = 310;
    let panelH = 400;

    fill(0, 0, 30, 230);
    stroke(100, 150, 255);
    strokeWeight(2);
    rectMode(CORNER);
    rect(panelX, panelY, panelW, panelH, 15);

    // Titre
    fill(100, 200, 255);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);
    text("📊 ANALYSE IA RÉACTIVE", panelX + 15, panelY + 15);

    fill(200);
    textStyle(NORMAL);
    textSize(12);

    let y = panelY + 45;
    let lineH = 18;

    // Infos requin
    fill(255, 100, 100);
    textStyle(BOLD);
    text("🦈 REQUIN (Prédateur)", panelX + 15, y);
    fill(200);
    textStyle(NORMAL);
    y += lineH;

    if (shark) {
        text("Position: (" + floor(shark.pos.x) + ", " + floor(shark.pos.y) + ")", panelX + 25, y);
        y += lineH;
        text("Vitesse: " + shark.vel.mag().toFixed(2) + " px/frame", panelX + 25, y);
        y += lineH;
        text("Direction: " + degrees(shark.vel.heading()).toFixed(0) + "°", panelX + 25, y);
        y += lineH;
        text("Comportements: Wander + Pursue", panelX + 25, y);
    }

    y += lineH + 10;

    // Infos poissons
    fill(100, 200, 255);
    textStyle(BOLD);
    text("🐟 POISSONS (Proies) - Boids", panelX + 15, y);
    fill(200);
    textStyle(NORMAL);
    y += lineH;

    text("Population: " + flock.length + " agents", panelX + 25, y);
    y += lineH;

    let avgPanic = 0;
    if (flock.length > 0) {
        for (let f of flock) avgPanic += f.panicLevel || 0;
        avgPanic /= flock.length;
    }
    text("Panique moyenne: " + (avgPanic * 100).toFixed(0) + "%", panelX + 25, y);
    y += lineH;
    text("Comportements: Flocking + Flee", panelX + 25, y);
    y += lineH + 5;

    // Règles de flocking
    fill(100, 255, 150);
    textStyle(BOLD);
    text("📐 STEERING BEHAVIORS", panelX + 15, y);
    fill(180);
    textStyle(NORMAL);
    y += lineH;

    text("• Alignment: suivre voisins", panelX + 25, y);
    y += lineH;
    text("• Cohesion: rester groupé", panelX + 25, y);
    y += lineH;
    text("• Separation: éviter collision", panelX + 25, y);
    y += lineH;
    text("• Flee: fuir le danger", panelX + 25, y);
    y += lineH;
    text("• Wander: exploration", panelX + 25, y);
    y += lineH;
    text("• Pursue: prédiction cible", panelX + 25, y);

    y += lineH + 10;

    // Stats temps réel
    fill(255, 200, 100);
    textStyle(BOLD);
    text("⚡ STATS TEMPS RÉEL", panelX + 15, y);
    fill(200);
    textStyle(NORMAL);
    y += lineH;

    text("FPS: " + floor(frameRate()), panelX + 25, y);
    y += lineH;
    text("Particules: " + particles.length, panelX + 25, y);
    y += lineH;
    text("Obstacles: " + obstacles.length, panelX + 25, y);

    pop();
}

// ========================================
// INTERACTIONS
// ========================================

function mousePressed() {
    if (gameState === "start") {
        // Utiliser les boutons définis dans drawStartScreen
        if (window.diffButtons) {
            for (let btn of window.diffButtons) {
                if (mouseX > btn.x - btn.w / 2 && mouseX < btn.x + btn.w / 2 &&
                    mouseY > btn.y - btn.h / 2 && mouseY < btn.y + btn.h / 2) {
                    setDifficulty(btn.level);
                    gameState = "playing";
                    initSimulation();
                    return;
                }
            }
        }
    } else if (gameState === "gameover" || gameState === "win") {
        let btnX = width / 2;
        let btnY = height / 2 + 180;
        let btnW = 240;
        let btnH = 65;

        if (mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 &&
            mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2) {
            gameState = "start";
        }
    }
}

function mouseDragged() {
    if (gameState === "playing" && frameCount % 3 === 0) {
        spawnFish(mouseX + random(-20, 20), mouseY + random(-20, 20));
    }
}

function keyPressed() {
    if (gameState === "start") {
        if (key === ' ') {
            setDifficulty("normal");
            gameState = "playing";
            initSimulation();
        }
    } else if (gameState === "playing") {
        if (key === ' ' || key === 'p' || key === 'P') {
            gameState = "paused";
        } else if (key === 'd' || key === 'D') {
            Boid.debug = !Boid.debug;
        } else if (key === 'o' || key === 'O') {
            let obs = new Obstacle(mouseX, mouseY, random(40, 70));
            obstacles.push(obs);
        } else if (key === 'r' || key === 'R') {
            gameState = "start";
        } else if (key === 'a' || key === 'A') {
            showAcademicPanel = !showAcademicPanel;
        } else if (key === 'v' || key === 'V') {
            showForceVectors = !showForceVectors;
        } else if (key === 'f' || key === 'F') {
            showPerceptionRadius = !showPerceptionRadius;
        }
    } else if (gameState === "paused") {
        if (key === ' ' || key === 'p' || key === 'P') {
            gameState = "playing";
            lastSecond = millis();
        }
    } else if (gameState === "gameover" || gameState === "win") {
        if (key === ' ') {
            gameState = "start";
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    decorInitialized = false;
}
