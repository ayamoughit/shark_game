
// ========================================
// OBSTACLES DANGEREUX (Barils Radioactifs)
// ========================================

class Barrel {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, random(1, 3)); // Tombe doucement
        this.r = 25; // Rayon de collision
        this.angle = random(TWO_PI);
        this.rotSpeed = random(-0.05, 0.05);
        this.toDelete = false;
    }

    update() {
        this.pos.add(this.vel);
        this.angle += this.rotSpeed;

        // Si sort de l'écran par le bas
        if (this.pos.y > height + 50) {
            this.toDelete = true;
        }
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);

        // Dessin du Baril (Vert/Jaune radioactif)
        stroke(0);
        strokeWeight(2);
        fill(50, 200, 50); // Vert
        rectMode(CENTER);
        rect(0, 0, 40, 55, 5);

        // Bandes jaunes
        noStroke();
        fill(255, 255, 0);
        rect(0, -15, 40, 8);
        rect(0, 15, 40, 8);

        // Symbole radioactif (simple triangle/cercle)
        fill(0);
        ellipse(0, 0, 15);
        fill(255, 255, 0);
        ellipse(0, 0, 10); // Petit centre jaune

        pop();
    }
}
