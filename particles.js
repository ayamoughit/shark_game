
// ========================================
// SYSTÈME DE PARTICULES (Sang & Effets)
// ========================================

class Particle {
    constructor(x, y, color) {
        this.pos = createVector(x, y);
        // Explosion plus diffuse ("nuage de sang")
        this.vel = p5.Vector.random2D();
        this.vel.mult(random(1, 6));
        this.acc = createVector(0, 0);
        this.color = color || [200, 0, 0]; // Rouge sang par défaut
        this.alpha = 255;
        this.life = 255;
        this.decay = random(3, 8); // Disparaît doucement
        this.size = random(5, 12); // Gouttes de taille variable
    }

    update() {
        this.vel.mult(0.92); // Friction pour arrêter les particules (effet "tache")
        this.pos.add(this.vel);
        this.life -= this.decay;
    }

    show() {
        noStroke();
        fill(this.color[0], this.color[1], this.color[2], this.life);
        ellipse(this.pos.x, this.pos.y, this.size);
    }

    isDead() {
        return this.life <= 0;
    }
}

function updateParticles() {
    if (!particles) return;
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.show();
        if (p.isDead()) {
            particles.splice(i, 1);
        }
    }
}

function createEatEffect(x, y, isGolden) {
    let count = isGolden ? 60 : 40; // Nuage dense

    for (let i = 0; i < count; i++) {
        let col = isGolden ? [255, 215, 0] : [random(150, 255), 0, 0]; // Dégradé de rouge
        let p = new Particle(x, y, col);
        // Ajustement pour effet "Nuage" (moins d'explosion, plus de fumée)
        p.vel.mult(0.5);
        p.life = random(200, 255);
        p.decay = random(2, 5); // Reste plus longtemps
        p.size = random(8, 20); // Plus grosses taches
        particles.push(p);
    }
}

function createFloatingText(x, y, txt, isBig) {
    floatingTexts.push({
        x: x,
        y: y,
        text: txt,
        life: 60,
        size: isBig ? 32 : 20,
        color: isBig ? [255, 220, 0] : [255, 255, 255],
        vy: -2
    });
}

function updateFloatingTexts() {
    if (!floatingTexts) return;
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.vy *= 0.9;
        ft.life -= 1.5;

        if (ft.life <= 0) {
            floatingTexts.splice(i, 1);
        } else {
            push();
            fill(ft.color[0], ft.color[1], ft.color[2], map(ft.life, 0, 60, 0, 255));
            stroke(0);
            strokeWeight(2);
            textAlign(CENTER, CENTER);
            textSize(ft.size);
            textStyle(BOLD);
            text(ft.text, ft.x, ft.y);
            pop();
        }
    }
}
