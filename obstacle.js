/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    OBSTACLE CLASS - ÉLÉMENT ENVIRONNEMENTAL               ║
 * ╠════════════════════════════════════════════════════════════════════════════╣
 * ║  Master IA - CASA G1 2025-2026                                            ║
 * ║  Module: Intelligence Artificielle Réactive                               ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * CONCEPT: OBSTACLE STATIQUE
 * ──────────────────────────
 * Les obstacles sont des éléments fixes de l'environnement que les agents
 * autonomes doivent percevoir et éviter.
 * 
 * RÔLE DANS L'IA RÉACTIVE:
 * ────────────────────────
 * Les obstacles génèrent des FORCES DE RÉPULSION que les agents intègrent
 * dans leur calcul de steering. Plus un agent est proche, plus la force
 * de répulsion est forte (relation inverse à la distance).
 * 
 * FORMULE DE RÉPULSION:
 * ────────────────────
 *   force = normalize(agent.pos - obstacle.pos) * strength
 *   strength = map(distance, 0, avoidRadius, maxForce, 0)
 */

class Obstacle {
    /**
     * Constructeur d'un obstacle
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} radius - Rayon de l'obstacle
     * @param {p5.Color} color - Couleur (optionnel)
     */
    constructor(x, y, radius, color = null) {
        // ═══════════════════════════════════════════════
        // PROPRIÉTÉS PHYSIQUES
        // ═══════════════════════════════════════════════
        this.pos = createVector(x, y);   // Position centrale
        this.r = radius;                  // Rayon
        this.color = color || this.generateRockColor();

        // Variation visuelle pour aspect naturel
        this.variation = random(0.8, 1.2);
        this.rotation = random(TWO_PI);
    }

    /**
     * Génère une couleur de roche naturelle
     * Utilise l'espace HSB pour des tons organiques
     */
    generateRockColor() {
        let baseHue = random(20, 40);     // Tons bruns/gris
        let saturation = random(20, 40);
        let brightness = random(30, 50);
        colorMode(HSB);
        let c = color(baseHue, saturation, brightness);
        colorMode(RGB);
        return c;
    }

    /**
     * CALCUL DE LA FORCE DE RÉPULSION
     * ────────────────────────────────
     * Cette méthode est appelée par chaque agent pour calculer
     * la force qu'il doit appliquer pour éviter cet obstacle.
     * 
     * Algorithme:
     *   1. Calculer la distance agent-obstacle
     *   2. Si dans le rayon d'évitement:
     *      - Créer vecteur "away" (agent - obstacle)
     *      - Normaliser
     *      - Multiplier par force inversement proportionnelle à distance
     *   3. Sinon retourner vecteur nul
     * 
     * @param {Boid|Vehicle} agent - L'agent qui doit éviter
     * @returns {p5.Vector} Force de répulsion à appliquer
     */
    getRepulsionForce(agent) {
        let d = agent.pos.dist(this.pos);        // Distance
        let avoidRadius = this.r + 50;            // Zone d'évitement

        if (d < avoidRadius && d > 0) {
            // Vecteur "away" = direction de fuite
            let away = p5.Vector.sub(agent.pos, this.pos);
            away.normalize();

            // Force inversement proportionnelle à la distance
            // Plus proche = plus forte répulsion
            let strength = map(d, 0, avoidRadius, 3, 0);
            away.mult(strength);

            return away;
        }

        return createVector(0, 0);  // Pas de force si hors zone
    }

    /**
     * Vérifie si un point est à l'intérieur de l'obstacle
     * Utile pour détection de collision
     */
    contains(x, y) {
        return dist(x, y, this.pos.x, this.pos.y) < this.r;
    }

    /**
     * AFFICHAGE DE L'OBSTACLE (Rocher stylisé)
     */
    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.rotation);

        // Ombre portée
        noStroke();
        fill(0, 0, 0, 50);
        ellipse(5, 5, this.r * 2 * this.variation, this.r * 1.8 * this.variation);

        // Rocher principal avec forme irrégulière
        fill(this.color);
        stroke(0, 0, 0, 80);
        strokeWeight(2);

        // Utilisation du bruit de Perlin pour forme organique
        beginShape();
        for (let a = 0; a < TWO_PI; a += PI / 6) {
            let r = this.r * (0.8 + 0.4 * noise(cos(a) + this.rotation, sin(a) + this.rotation));
            let x = r * cos(a);
            let y = r * sin(a) * 0.9;
            vertex(x, y);
        }
        endShape(CLOSE);

        // Détails visuels (mousse)
        noStroke();
        fill(30, 80, 40, 100);
        for (let i = 0; i < 3; i++) {
            let angle = random(TWO_PI);
            let dist = random(this.r * 0.3, this.r * 0.7);
            ellipse(
                cos(angle) * dist,
                sin(angle) * dist,
                random(8, 15),
                random(5, 10)
            );
        }

        // Reflets lumineux
        fill(255, 255, 255, 30);
        ellipse(-this.r * 0.3, -this.r * 0.3, this.r * 0.5, this.r * 0.4);

        pop();

        // ═══════════════════════════════════════════════
        // MODE DEBUG: Affichage zone de répulsion
        // ═══════════════════════════════════════════════
        if (Boid.debug) {
            push();
            noFill();
            stroke(255, 100, 100, 50);
            strokeWeight(1);
            ellipse(this.pos.x, this.pos.y, (this.r + 50) * 2);
            pop();
        }
    }
}
