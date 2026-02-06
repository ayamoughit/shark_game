/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    BOID CLASS - STEERING BEHAVIORS                        ║
 * ╠════════════════════════════════════════════════════════════════════════════╣
 * ║  Master IA - CASA G1 2025-2026                                            ║
 * ║  Module: Intelligence Artificielle Réactive                               ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * RÉFÉRENCES THÉORIQUES:
 * ─────────────────────
 * • Craig Reynolds (1987) - "Flocks, Herds, and Schools: A Distributed 
 *   Behavioral Model" - Papier fondateur des Boids
 * • Reynolds (1999) - "Steering Behaviors for Autonomous Characters" - GDC
 * 
 * CONCEPT FONDAMENTAL - IA RÉACTIVE:
 * ──────────────────────────────────
 * Chaque agent (Boid) prend ses décisions LOCALEMENT en fonction de:
 *   1. Son état interne (position, vélocité, niveau de panique)
 *   2. Les agents dans son rayon de perception
 *   3. Les obstacles et dangers environnants
 * 
 * → Pas de planification globale, pas de communication centralisée
 * → Le comportement collectif ÉMERGE des interactions locales
 * 
 * STEERING BEHAVIORS IMPLÉMENTÉS:
 * ───────────────────────────────
 * 1. FLOCKING (comportement de banc):
 *    - Alignment: s'orienter dans la même direction que les voisins
 *    - Cohesion: rester proche du centre du groupe
 *    - Separation: maintenir une distance minimale
 * 
 * 2. FLEE (fuite): s'éloigner d'une menace
 * 3. PURSUE (poursuite): anticiper la position future de la cible
 * 4. WANDER (errance): exploration pseudo-aléatoire
 * 5. OBSTACLE AVOIDANCE: évitement d'obstacles
 * 
 * FORMULE DE STEERING (Reynolds):
 * ───────────────────────────────
 *   steering = desired_velocity - current_velocity
 *   steering = truncate(steering, max_force)
 */

class Boid {
    static debug = false;  // Mode debug pour visualiser les forces

    constructor(x, y, image) {
        // ═══════════════════════════════════════════════
        // VECTEURS DE MOUVEMENT (Modèle cinématique)
        // ═══════════════════════════════════════════════
        this.pos = createVector(x, y);           // Position actuelle
        this.vel = p5.Vector.random2D();         // Vélocité (direction + magnitude)
        this.vel.setMag(random(2, 4));           // Vitesse initiale aléatoire
        this.acc = createVector();               // Accélération (somme des forces)

        // Contraintes physiques
        this.maxForce = 0.2;   // Force max de steering (réactivité)
        this.maxSpeed = 5;     // Vitesse maximale
        this.r = 6;            // Rayon du boid (pour collision/affichage)

        // ═══════════════════════════════════════════════
        // APPARENCE VISUELLE
        // ═══════════════════════════════════════════════
        if (image !== undefined) {
            this.image = image;
        } else {
            this.color = color(100, 200, 255);
        }

        // ═══════════════════════════════════════════════
        // PARAMÈTRES FLOCKING (Reynolds)
        // Poids des 3 règles fondamentales
        // ═══════════════════════════════════════════════
        this.perceptionRadius = 50;      // Rayon de vision pour flocking
        this.alignWeight = 1.5;          // Poids de l'alignement
        this.cohesionWeight = 1.0;       // Poids de la cohésion
        this.separationWeight = 2.0;     // Poids de la séparation (prioritaire)
        this.boundariesWeight = 10;      // Force de répulsion des bords

        // ═══════════════════════════════════════════════
        // LIMITES DE L'ENVIRONNEMENT
        // ═══════════════════════════════════════════════
        this.boundariesX = 0;
        this.boundariesY = 0;
        this.boundariesWidth = width;
        this.boundariesHeight = height;
        this.boundariesDistance = 50;

        // ═══════════════════════════════════════════════
        // WANDER BEHAVIOR (Exploration)
        // Basé sur un cercle projeté devant l'agent
        // ═══════════════════════════════════════════════
        this.distanceCercle = 150;       // Distance du cercle de wander
        this.wanderRadius = 50;          // Rayon du cercle de wander
        this.wanderTheta = 0;            // Angle courant sur le cercle
        this.displaceRange = 0.3;        // Amplitude du déplacement aléatoire

        // ═══════════════════════════════════════════════
        // ÉTAT ÉMOTIONNEL (Extension du modèle)
        // Simule le stress/panique du poisson
        // ═══════════════════════════════════════════════
        this.panicLevel = 0;             // 0 = calme, 1 = panique maximale
        this.panicDecayRate = 0.01;      // Vitesse de retour au calme
        this.fleeRadius = 150;           // Rayon de détection du danger
    }

    // ========================================
    // COMPORTEMENT FLOCKING (Poissons)
    // ========================================

    flock(boids) {
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);
        let boundaries = this.boundaries();

        // Poids ajustés selon le niveau de panique
        // En panique: moins de cohésion, plus de séparation
        let panicFactor = this.panicLevel;

        alignment.mult(this.alignWeight * (1 - panicFactor * 0.5));
        cohesion.mult(this.cohesionWeight * (1 - panicFactor * 0.8));
        separation.mult(this.separationWeight * (1 + panicFactor * 2));
        boundaries.mult(this.boundariesWeight);

        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);
        this.applyForce(boundaries);
    }

    // Alignement: s'orienter comme les voisins
    align(boids) {
        let steering = createVector();
        let total = 0;

        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other !== this && d < this.perceptionRadius) {
                steering.add(other.vel);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    // Séparation: éviter les collisions avec les voisins proches
    separation(boids) {
        let steering = createVector();
        let total = 0;
        let separationRadius = this.perceptionRadius * 0.6;

        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other !== this && d < separationRadius && d > 0) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.div(d * d); // Force inversement proportionnelle à la distance
                steering.add(diff);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    // Cohésion: se rapprocher du centre de masse du groupe
    cohesion(boids) {
        let steering = createVector();
        let total = 0;
        let cohesionRadius = this.perceptionRadius * 2;

        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other !== this && d < cohesionRadius) {
                steering.add(other.pos);
                total++;
            }
        }

        if (total > 0) {
            steering.div(total);
            steering.sub(this.pos);
            steering.setMag(this.maxSpeed);
            steering.sub(this.vel);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    // ========================================
    // COMPORTEMENTS DE STEERING DE BASE
    // ========================================

    // Seek: se diriger vers une cible
    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    // Flee: fuir une position
    flee(target) {
        return this.seek(target).mult(-1);
    }

    // Pursue: prédire et poursuivre une cible mobile
    pursue(target) {
        // Prédiction de la position future de la cible
        let prediction = target.vel.copy();
        prediction.mult(10); // Prédire 10 frames dans le futur
        let futurePos = p5.Vector.add(target.pos, prediction);

        if (Boid.debug) {
            push();
            stroke(255, 100, 100);
            line(target.pos.x, target.pos.y, futurePos.x, futurePos.y);
            fill(255, 0, 0);
            circle(futurePos.x, futurePos.y, 10);
            pop();
        }

        return this.seek(futurePos);
    }

    // ========================================
    // FLEE AVEC RAYON (PANIQUE)
    // ========================================

    // Fuir si le danger est dans le rayon de perception
    fleeFromDanger(danger, fleeRadius) {
        const d = this.pos.dist(danger.pos);

        if (d < fleeRadius) {
            // Augmenter le niveau de panique
            let panicIncrease = map(d, 0, fleeRadius, 0.3, 0.05);
            this.panicLevel = min(1, this.panicLevel + panicIncrease);

            // Calculer la force de fuite
            const fleeForce = this.flee(danger.pos);

            // Force plus forte quand le danger est proche
            let strength = map(d, 0, fleeRadius, 8, 2);
            fleeForce.mult(strength);

            // Augmenter temporairement la vitesse max en panique
            this.vel.setMag(min(this.vel.mag() * 1.05, this.maxSpeed * 1.5));

            return fleeForce;
        }

        return createVector(0, 0);
    }

    // Mise à jour du niveau de panique (retour progressif au calme)
    updatePanic() {
        if (this.panicLevel > 0) {
            this.panicLevel = max(0, this.panicLevel - this.panicDecayRate);
        }
    }

    // ========================================
    // ÉVITEMENT D'OBSTACLES (Rochers)
    // ========================================

    avoidObstacles(obstacles) {
        let totalForce = createVector();

        for (let obstacle of obstacles) {
            let d = this.pos.dist(obstacle.pos);
            let avoidRadius = obstacle.r + 40; // Marge de sécurité

            if (d < avoidRadius) {
                // Direction opposée à l'obstacle
                let away = p5.Vector.sub(this.pos, obstacle.pos);
                away.normalize();

                // Force inversement proportionnelle à la distance
                let strength = map(d, 0, avoidRadius, 5, 0.5);
                away.mult(strength);

                totalForce.add(away);

                // Collision dure: téléporter hors de l'obstacle
                if (d < obstacle.r + this.r) {
                    away.setMag(obstacle.r + this.r - d + 5);
                    this.pos.add(away);
                    // Inverser partiellement la vélocité
                    this.vel.mult(-0.5);
                }
            }
        }

        return totalForce;
    }

    // ========================================
    // WANDER (Comportement naturel du requin)
    // ========================================

    wander() {
        // Cercle de wander devant l'agent
        let centreCercle = this.vel.copy();
        centreCercle.setMag(this.distanceCercle);
        centreCercle.add(this.pos);

        if (Boid.debug) {
            push();
            fill(255, 0, 0);
            circle(centreCercle.x, centreCercle.y, 8);
            noFill();
            stroke(255, 255, 255, 100);
            circle(centreCercle.x, centreCercle.y, this.wanderRadius * 2);
            stroke(255, 255, 0);
            line(this.pos.x, this.pos.y, centreCercle.x, centreCercle.y);
            pop();
        }

        // Point sur le cercle
        let wanderAngle = this.vel.heading() + this.wanderTheta;
        let pointSurCercle = createVector(
            this.wanderRadius * cos(wanderAngle),
            this.wanderRadius * sin(wanderAngle)
        );
        pointSurCercle.add(centreCercle);

        if (Boid.debug) {
            push();
            fill(0, 255, 0);
            circle(pointSurCercle.x, pointSurCercle.y, 8);
            stroke(0, 255, 0);
            line(this.pos.x, this.pos.y, pointSurCercle.x, pointSurCercle.y);
            pop();
        }

        // Force vers le point
        let desired = p5.Vector.sub(pointSurCercle, this.pos);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.setMag(this.maxForce);

        // Variation aléatoire de l'angle
        this.wanderTheta += random(-this.displaceRange, this.displaceRange);

        return steer;
    }

    // ========================================
    // LIMITES DE L'ENVIRONNEMENT
    // ========================================

    boundaries() {
        let desired = null;
        const d = this.boundariesDistance;
        const bx = this.boundariesX;
        const by = this.boundariesY;
        const bw = this.boundariesWidth;
        const bh = this.boundariesHeight;

        if (this.pos.x < bx + d) {
            desired = createVector(this.maxSpeed, this.vel.y);
        } else if (this.pos.x > bx + bw - d) {
            desired = createVector(-this.maxSpeed, this.vel.y);
        }

        if (this.pos.y < by + d) {
            desired = createVector(this.vel.x, this.maxSpeed);
        } else if (this.pos.y > by + bh - d) {
            desired = createVector(this.vel.x, -this.maxSpeed);
        }

        if (desired !== null) {
            desired.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(this.maxForce);
            return steer;
        }

        return createVector(0, 0);
    }

    // Rebond dur aux bords
    edges() {
        if (this.pos.x > width) this.pos.x = width;
        else if (this.pos.x < 0) this.pos.x = 0;
        if (this.pos.y > height) this.pos.y = height;
        else if (this.pos.y < 0) this.pos.y = 0;
    }

    // ========================================
    // UTILITAIRES
    // ========================================

    // Trouver le boid le plus proche
    getClosest(boids) {
        let minDist = Infinity;
        let closest = null;

        for (let b of boids) {
            if (b !== this) {
                let d = this.pos.dist(b.pos);
                if (d < minDist) {
                    minDist = d;
                    closest = b;
                }
            }
        }

        return closest;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);

        // Retour progressif au calme
        this.updatePanic();
    }

    show() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());

        if (this.image) {
            imageMode(CENTER);
            // Rotation supplémentaire pour l'image (face à droite)
            //rotate(PI);
            image(this.image, 0, 0, this.r, this.r);
        } else {
            // Triangle par défaut avec couleur selon panique
            let panicColor = lerpColor(
                this.color || color(100, 200, 255),
                color(255, 100, 100),
                this.panicLevel
            );
            fill(panicColor);
            stroke(255, 150);
            strokeWeight(1);
            triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
        }

        pop();

        // Affichage debug
        if (Boid.debug) {
            push();
            noFill();
            stroke(100, 200, 255, 50);
            ellipse(this.pos.x, this.pos.y, this.perceptionRadius * 2);

            // Indicateur de panique
            if (this.panicLevel > 0.1) {
                fill(255, 0, 0, this.panicLevel * 100);
                noStroke();
                ellipse(this.pos.x, this.pos.y - this.r, 5);
            }
            pop();
        }
    }
}
