/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    FISH CLASSES - TYPES DE POISSONS                       ║
 * ╠════════════════════════════════════════════════════════════════════════════╣
 * ║  Master IA - CASA G1 2025-2026                                            ║
 * ║  Module: Intelligence Artificielle Réactive                               ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * CONCEPT: HÉRITAGE ET POLYMORPHISME
 * ───────────────────────────────────
 * Ces classes étendent Boid pour créer des variantes de poissons
 * avec des caractéristiques différentes:
 *   • SwiftFish: petit et rapide (proie difficile à attraper)
 *   • TankFish: gros et lent (proie facile mais plus de points)
 * 
 * La logique de déplacement (update, flock, flee) reste dans Boid.
 */

/**
 * SWIFTFISH - Poisson Rapide
 * ──────────────────────────
 * Petit poisson bleuté très agile et difficile à attraper.
 * Bonus: vitesse élevée, taille réduite
 */
class SwiftFish extends Boid {
    constructor(x, y, image) {
        super(x, y, image);

        // Caractéristiques du poisson rapide
        this.r = 25;                          // Petit
        this.maxSpeed = 15;                    // Très rapide
        this.maxForce = 0.35;                 // Plus réactif
        this.tint = color(100, 200, 255);     // Bleuté

        // Bonus de perception
        this.perceptionRadius = 35;
        this.fleeRadius = 180;                // Détecte le danger plus tôt
    }
}

/**
 * TANKFISH - Poisson Costaud
 * ──────────────────────────
 * Gros poisson rougeâtre, lent mais vaut plus de points.
 * Bonus: taille imposante, facile à voir
 */
class TankFish extends Boid {
    constructor(x, y, image) {
        super(x, y, image);

        // Caractéristiques du poisson costaud
        this.r = 70;                          // Gros
        this.maxSpeed = 3.5;                  // Lent
        this.maxForce = 0.15;                 // Moins réactif
        this.tint = color(255, 100, 100);     // Rougeâtre

        // Perception réduite
        this.perceptionRadius = 20;
        this.fleeRadius = 120;                // Réagit tard au danger
    }
}

/**
 * TURTLE - Tortue de mer
 * ──────────────────────
 * Nage lentement, ignore les règles de flocking strictes.
 * Se déplace de manière fluide et majestueuse.
 */
class Turtle extends Boid {
    constructor(x, y) {
        super(x, y);
        this.r = 60;
        this.maxSpeed = 2; // Lent
        this.maxForce = 0.05;
        this.color = color(60, 180, 80);
        this.shellColor = color(40, 120, 60);

        // La tortue erre tranquillement
        this.wanderRadius = 80;
        this.displaceRange = 0.05;
    }

    // Comportement spécifique : Nage tranquille
    flock(boids) {
        // La tortue s'en fiche des autres, elle fait sa vie (Wander)
        let wander = this.wander();
        wander.mult(1.0);
        this.applyForce(wander);

        // Elle reste dans l'écran
        this.edges();
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);

        // Orientation douce (pas de demi-tour brutal)
        let angle = this.vel.heading();

        // Si elle va vers la gauche, on flip (pour vue de côté)
        if (this.vel.x < 0) {
            scale(-1, 1);
            angle = PI - angle; // Ajustement angle
        }

        // Rotation légère pour l'inclinaison
        rotate(this.vel.heading());

        // Dessin de la tortue (vue de dessus/côté stylisée)
        noStroke();

        // Parrettes (Nageoires)
        fill(this.color);
        push();
        rotate(sin(frameCount * 0.1) * 0.3); // Nage
        ellipse(15, -15, 25, 10);
        ellipse(15, 15, 25, 10);
        pop();

        push();
        rotate(-sin(frameCount * 0.1) * 0.3);
        ellipse(-15, -18, 20, 8);
        ellipse(-15, 18, 20, 8);
        pop();

        // Carapace
        fill(this.shellColor);
        ellipse(0, 0, this.r, this.r * 0.8);

        // Détails carapace
        fill(this.color);
        ellipse(0, 0, this.r * 0.6, this.r * 0.5);

        // Tête
        fill(this.color);
        ellipse(32, 0, 25, 20);

        // Yeux
        fill(0);
        ellipse(36, -5, 3);
        ellipse(36, 5, 3);

        pop();
    }
}

/**
 * CRAB - Crabe
 * ────────────
 * Marche au fond de l'eau.
 * Ne nage pas, reste bloqué en bas (gravité simulée).
 */
class Crab extends Boid {
    constructor(x, y) {
        super(x, y);
        this.r = 30;
        this.maxSpeed = 1.5;
        this.maxForce = 0.2;
        this.color = color(220, 60, 60); // Rouge
        this.yBottom = height - 20; // Sol
        this.walkOffset = random(100);
    }

    update() {
        // Gravité : le crabe tombe toujours au fond
        if (this.pos.y < height - 30) {
            this.pos.y += 2;
        } else {
            this.pos.y = height - 30;
        }

        // Marche latérale (Wander 1D)
        this.wanderTheta += random(-0.2, 0.2);
        let vx = cos(this.wanderTheta) * this.maxSpeed;
        this.vel.x = vx;
        this.vel.y = 0;

        this.pos.x += this.vel.x;

        // Wrap x
        if (this.pos.x > width) this.pos.x = 0;
        else if (this.pos.x < 0) this.pos.x = width;
    }

    flock(boids) {
        // Le crabe ne flock pas vraiment
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);

        // Animation de marche (bobbing)
        let bob = sin(frameCount * 0.2 + this.walkOffset) * 3;
        translate(0, bob);

        noStroke();
        fill(this.color);

        // Corps
        ellipse(0, 0, 40, 25);

        // Pinces
        push();
        translate(15, -10);
        rotate(-0.5 + sin(frameCount * 0.2) * 0.2);
        ellipse(10, 0, 15, 10); // Bras
        ellipse(18, 0, 12, 12); // Pince
        pop();

        push();
        translate(-15, -10);
        rotate(0.5 - sin(frameCount * 0.2) * 0.2);
        ellipse(-10, 0, 15, 10);
        ellipse(-18, 0, 12, 12);
        pop();

        // Yeux sur tiges
        stroke(this.color);
        strokeWeight(2);
        line(5, -10, 8, -20);
        line(-5, -10, -8, -20);

        noStroke();
        fill(255);
        ellipse(8, -20, 8, 8);
        ellipse(-8, -20, 8, 8);

        fill(0);
        ellipse(8, -20, 3);
        ellipse(-8, -20, 3);

        // Pattes (animation rapide)
        stroke(this.color);
        strokeWeight(2);
        let legAngle = sin(frameCount * 0.5) * 0.5;

        for (let i = 0; i < 3; i++) {
            line(10 - i * 5, 10, 20 - i * 8 + legAngle * 5, 20); // Droite
            line(-10 + i * 5, 10, -20 + i * 8 - legAngle * 5, 20); // Gauche
        }

        pop();
    }
}

/**
 * SPINY FISH - Poisson Épineux
 * ────────────────────────────
 * Petit poisson agressif couvert d'épines.
 * DANGER: Enlève une vie si mangé !
 */
class SpinyFish extends Boid {
    constructor(x, y, image) {
        super(x, y, image);
        this.r = 35;
        this.maxSpeed = 4;
        this.maxForce = 0.2;
        // this.tint = color(100, 255, 100); // Pas de teinte toxique, ou juste vert joli ?
        // L'utilisateur veut un "poisson normal". On garde peut-être une couleur distincte pour variété ?
        // "tu ppeux le faire en poisson normal" -> Boid standard.
        // Je vais laisser la classe mais sans propriétés spéciales.
        this.perceptionRadius = 50;
        this.isHazard = false;
    }

    // Pas de show() override -> Utilise Boid.show() standard
}
