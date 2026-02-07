/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    SHARK CLASS - AGENT PRÉDATEUR                          ║
 * ╠════════════════════════════════════════════════════════════════════════════╣
 * ║  Master IA - CASA G1 2025-2026                                            ║
 * ║  Module: Intelligence Artificielle Réactive                               ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * CONCEPT: PRÉDATEUR AUTONOME
 * ───────────────────────────
 * Le requin est un agent prédateur qui utilise les steering behaviors:
 *   • WANDER: exploration de l'environnement quand pas de proie
 *   • HUNT (basé sur SEEK): chasse de la proie la plus proche
 * 
 * HIÉRARCHIE DES COMPORTEMENTS:
 * ─────────────────────────────
 *   1. Si proie dans le rayon de vision → HUNT (seek vers proie)
 *   2. Sinon → WANDER (exploration)
 * 
 * Cette classe HÉRITE de Boid pour réutiliser les comportements de base.
 */

class Shark extends Boid {

    /**
     * Constructeur du requin prédateur
     * @param {number} x - Position initiale X
     * @param {number} y - Position initiale Y
     * @param {p5.Image} image - Image du requin
     */
    constructor(x, y, image) {
        super(x, y, image);  // Appel du constructeur parent (Boid)

        // ═══════════════════════════════════════════════
        // PARAMÈTRES SPÉCIFIQUES AU PRÉDATEUR
        // ═══════════════════════════════════════════════
        this.maxSpeed = 5;              // Plus rapide que les proies
        this.maxForce = 0.3;            // Plus réactif
        this.r = 20;                    // Plus grand
        this.color = color(200, 50, 50); // Rouge = prédateur

        // Rayon de vision pour la chasse
        this.visionRadius = 200;

        // Image du requin pointe vers la droite
        this.imageRotationOffset = 0;

        this.eatAnim = 0; // Timer pour l'animation de manger
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);

        // Effet "Manger" (Scale up/down simple)
        // Effet "Manger" (Snap / Morsure vive)
        let scaleX = 1;
        let scaleY = 1;

        if (this.eatAnim > 0) {
            // Animation en 2 temps : Ouvre la gueule (10 frames) -> Ferme (10 frames)
            let progress = this.eatAnim / 20; // De 1.0 à 0.0

            if (progress > 0.5) {
                // Phase 1 : Ouvre / Lunge avant
                scaleX = 1.4; // S'étire encore plus
                scaleY = 0.7; // S'aplatit
            } else {
                // Phase 2 : Croque / Impact
                scaleX = 1.0;
                scaleY = 1.3; // Gonfle sous l'impact
            }
            this.eatAnim--;
        }

        // Orientation
        if (this.vel.x < 0) {
            scale(-1 * scaleX, 1 * scaleY);
            rotate(-this.vel.heading() + PI);
        } else {
            scale(1 * scaleX, 1 * scaleY);
            rotate(this.vel.heading());
        }

        // Dessin (Image ou Forme)
        if (this.image) {
            imageMode(CENTER);
            image(this.image, 0, 0, this.r * 2.5, this.r * 2.5); // Requin plus grand
        } else {
            // Dessin triangle simple si pas d'image
            fill(this.color);
            noStroke();
            triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
        }

        pop();
    }

    /**
     * COMPORTEMENT DE CHASSE (Hunt)
     * ─────────────────────────────
     * Algorithme:
     *   1. Parcourir tous les boids (proies potentielles)
     *   2. Trouver le plus proche dans le rayon de vision
     *   3. Si trouvé → SEEK vers cette proie
     *   4. Sinon → WANDER pour explorer
     * 
     * C'est un exemple de HIÉRARCHIE DE COMPORTEMENTS:
     * Le wander est le comportement par défaut (fallback)
     * 
     * @param {Array} boids - Liste des proies potentielles
     * @returns {p5.Vector} Force de steering
     */
    hunt(boids) {
        let closest = null;      // Proie la plus proche
        let dMin = Infinity;     // Distance minimale

        // ────────────────────────────────────────────
        // PHASE 1: PERCEPTION - Chercher la proie
        // ────────────────────────────────────────────
        for (let b of boids) {
            let d = p5.Vector.dist(this.pos, b.pos);

            // Vérifier si dans le rayon de vision ET plus proche
            if (d < this.visionRadius && d < dMin) {
                dMin = d;
                closest = b;
            }
        }

        // ────────────────────────────────────────────
        // PHASE 2: DÉCISION - Chasser ou explorer
        // ────────────────────────────────────────────
        if (closest) {
            // Proie détectée → SEEK
            return this.seek(closest.pos);
        }

        // Pas de proie → WANDER (exploration)
        return this.wander();
    }
}
