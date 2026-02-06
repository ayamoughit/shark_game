/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                  VEHICLE CLASS - BASE DES AGENTS AUTONOMES                ║
 * ╠════════════════════════════════════════════════════════════════════════════╣
 * ║  Master IA - CASA G1 2025-2026                                            ║
 * ║  Module: Intelligence Artificielle Réactive                               ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * CONCEPT: AGENT AUTONOME (Craig Reynolds)
 * ────────────────────────────────────────
 * Un véhicule autonome possède:
 *   • Position et orientation dans l'espace
 *   • Capacité de locomotion (vélocité limitée)
 *   • Capacité de perception (voir les voisins, obstacles)
 *   • Capacité de décision (steering behaviors)
 * 
 * MODÈLE PHYSIQUE SIMPLIFIÉ:
 * ─────────────────────────
 *   acceleration = somme(forces) / masse  (masse = 1 pour simplifier)
 *   velocity += acceleration
 *   velocity = truncate(velocity, maxSpeed)
 *   position += velocity
 * 
 * STEERING FORCE (Force de direction):
 * ────────────────────────────────────
 *   steering = desired - velocity
 *   
 * Cette formule est la BASE de tous les comportements:
 *   • SEEK: desired = normalize(target - position) * maxSpeed
 *   • FLEE: desired = normalize(position - target) * maxSpeed  
 *   • WANDER: desired vers un point sur un cercle projeté
 */

class Vehicle {
    static debug = false;  // Affichage des vecteurs de debug

    /**
     * Constructeur d'un véhicule autonome
     * @param {number} x - Position initiale X
     * @param {number} y - Position initiale Y
     */
    constructor(x, y) {
        // ═══════════════════════════════════════════════
        // VECTEURS CINÉMATIQUES
        // ═══════════════════════════════════════════════
        this.pos = createVector(x, y);        // Position (pixels)
        this.vel = p5.Vector.random2D();      // Vélocité (direction + magnitude)
        this.acc = createVector(0, 0);        // Accélération (reset chaque frame)

        // ═══════════════════════════════════════════════
        // CONTRAINTES PHYSIQUES
        // ═══════════════════════════════════════════════
        this.maxSpeed = 4;     // Vitesse max (limite la vélocité)
        this.maxForce = 0.2;   // Force max (limite le steering)
        this.r = 5;            // Rayon (collision/affichage)
        this.color = 255;

        // Pour évitement d'obstacles
        this.largeurZoneEvitementDevantVaisseau = this.r / 2;
    }

    /**
     * MISE À JOUR PHYSIQUE (appelée chaque frame)
     * ─────────────────────────────────────────────
     * Intégration d'Euler simplifiée:
     *   vel += acc
     *   pos += vel
     *   acc = 0 (reset pour prochaine frame)
     */
    update() {
        this.vel.add(this.acc);              // Intégrer l'accélération
        this.vel.limit(this.maxSpeed);       // Limiter la vitesse
        this.pos.add(this.vel);              // Mettre à jour la position
        this.acc.set(0, 0);                  // Reset l'accélération
    }

    /**
     * APPLIQUER UNE FORCE
     * ───────────────────
     * Les forces s'accumulent dans l'accélération
     * F = ma → a = F/m (avec m=1, a = F)
     */
    applyForce(force) {
        this.acc.add(force);
    }

    /**
     * AFFICHAGE DU VÉHICULE
     * ─────────────────────
     * Triangle orienté dans la direction du mouvement
     */
    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());          // Orienter vers la direction
        fill(this.color);
        noStroke();
        triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
        pop();
    }

    /**
     * GESTION DES BORDS (Wrap-around)
     * ────────────────────────────────
     * Téléportation de l'autre côté de l'écran
     */
    edges() {
        if (this.pos.x > width + this.r) this.pos.x = -this.r;
        if (this.pos.x < -this.r) this.pos.x = width + this.r;
        if (this.pos.y > height + this.r) this.pos.y = -this.r;
        if (this.pos.y < -this.r) this.pos.y = height + this.r;
    }

    // ═══════════════════════════════════════════════════════════════
    //                    STEERING BEHAVIORS (Reynolds)
    // ═══════════════════════════════════════════════════════════════

    /**
     * SEEK (Recherche) - Comportement de base
     * ───────────────────────────────────────
     * Se diriger vers une cible à vitesse maximale
     * 
     * Algorithme:
     *   1. desired = target - position (vecteur vers cible)
     *   2. desired.normalize() * maxSpeed (vitesse désirée)
     *   3. steering = desired - velocity (correction de trajectoire)
     *   4. steering.limit(maxForce) (limiter la force)
     * 
     * @param {p5.Vector} target - Position de la cible
     * @returns {p5.Vector} Force de steering
     */
    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);  // Vecteur vers cible
        desired.setMag(this.maxSpeed);                   // Vitesse désirée max
        let steer = p5.Vector.sub(desired, this.vel);    // Correction de trajectoire
        steer.limit(this.maxForce);                      // Limiter la force
        return steer;
    }

    /**
     * FLEE (Fuite) - Opposé de Seek
     * ─────────────────────────────
     * S'éloigner d'une menace à vitesse maximale
     * 
     * @param {p5.Vector} target - Position du danger
     * @returns {p5.Vector} Force de steering (fuite)
     */
    flee(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);
        desired.mult(-1);  // ← INVERSE: fuir au lieu de chercher
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    /**
     * OBSTACLE AVOIDANCE (Évitement d'obstacles)
     * ──────────────────────────────────────────
     * Projeter un vecteur "ahead" devant le véhicule
     * Si collision détectée → force latérale d'évitement
     * 
     * @param {Array} obstacles - Liste des obstacles
     * @returns {p5.Vector} Force d'évitement
     */
    avoid(obstacles) {
        // calcul d'un vecteur ahead devant le véhicule
        // il regarde par exemple 50 frames devant lui
        let ahead = this.vel.copy();
        ahead.mult(30);
        //on calcue ahead2 deux fois plus petit
        let ahead2 = ahead.copy();
        ahead2.mult(0.5);

        if (Vehicle.debug) {
            // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
            this.drawVector(this.pos, ahead, "yellow");
        }

        // Calcul des coordonnées du point au bout de ahead
        let pointAuBoutDeAhead = this.pos.copy().add(ahead);
        let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);

        // Detection de l'obstacle le plus proche
        let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

        // Si pas d'obstacle, on renvoie un vecteur nul
        if (obstacleLePlusProche == undefined) {
            return createVector(0, 0);
        }

        // On calcule la distance entre le cercle et le bout du vecteur ahead
        let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
        let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
        let distance = min(distance1, distance2);

        if (Vehicle.debug) {
            // On dessine le point au bout du vecteur ahead pour debugger
            fill("red");
            circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
            fill("blue");
            circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);

            // On dessine la zone d'évitement
            push();
            stroke(100, 100);
            strokeWeight(this.largeurZoneEvitementDevantVaisseau);
            line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
            pop();
        }

        // si la distance est < rayon de l'obstacle
        // il y a collision possible et on dessine l'obstacle en rouge
        if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
            // collision possible 

            // calcul de la force d'évitement. C'est un vecteur qui va
            // du centre de l'obstacle vers le point au bout du vecteur ahead
            let force;
            if (distance1 < distance2) {
                force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
            } else {
                force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
            }

            if (Vehicle.debug) {
                // on le dessine en jaune pour vérifier qu'il est ok
                this.drawVector(obstacleLePlusProche.pos, force, "yellow");
            }

            // force est la vitesse désirée
            force.setMag(this.maxSpeed);
            // force = vitesse désirée - vitesse courante
            force.sub(this.vel);
            // on limite cette force à la longueur maxForce
            force.limit(this.maxForce / 2);
            return force;
        } else {
            // pas de collision possible
            return createVector(0, 0);
        }
    }

    /**
     * Trouver l'obstacle le plus proche
     */
    getObstacleLePlusProche(obstacles) {
        let plusPetiteDistance = 100000000;
        let obstacleLePlusProche = undefined;

        obstacles.forEach(o => {
            const distance = this.pos.dist(o.pos);
            if (distance < plusPetiteDistance) {
                plusPetiteDistance = distance;
                obstacleLePlusProche = o;
            }
        });

        return obstacleLePlusProche;
    }

    /**
     * Dessiner un vecteur (debug)
     */
    drawVector(pos, v, color) {
        push();
        strokeWeight(3);
        stroke(color);
        line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
        // petite flèche au bout
        let arrowSize = 5;
        translate(pos.x + v.x, pos.y + v.y);
        rotate(v.heading());
        translate(-arrowSize / 2, 0);
        triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
        pop();
    }

    /**
     * WANDER (Errance) - Exploration pseudo-aléatoire
     * ────────────────────────────────────────────────
     * Technique de Reynolds:
     *   1. Projeter un cercle devant le véhicule
     *   2. Choisir un point sur ce cercle (angle theta)
     *   3. Seek vers ce point
     *   4. Faire varier theta aléatoirement
     * 
     * Résultat: mouvement naturel et organique
     * 
     * @returns {p5.Vector} Force de steering (wander)
     */
    wander() {
        // Centre du cercle de wander (projeté devant)
        let wanderPoint = this.vel.copy();
        wanderPoint.setMag(100);  // Distance du cercle
        wanderPoint.add(this.pos);

        // Point sur le cercle
        let wanderRadius = 50;
        if (this.wanderTheta === undefined) {
            this.wanderTheta = 0;
        }

        let theta = this.wanderTheta + this.vel.heading();
        let x = wanderRadius * cos(theta);
        let y = wanderRadius * sin(theta);
        wanderPoint.add(x, y);

        // Force de steering vers le point
        let steer = this.seek(wanderPoint);

        // Variation aléatoire pour le prochain frame
        this.wanderTheta += random(-0.2, 0.2);

        return steer;
    }
}
