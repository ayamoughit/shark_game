// Flocking
// Daniel Shiffman
// https://thecodingtrain.com/CodingChallenges/124-flocking-boids.html
// https://youtu.be/mhjuuHl6qHM

class Boid {
    static debug = false;
    constructor(x, y, image) {

        this.pos = createVector(x, y);

        this.vel = p5.Vector.random2D();
        this.vel.setMag(random(2, 4));
        this.acc = createVector();
        this.maxForce = 0.2;
        this.maxSpeed = 5;
        this.r = 6;

        // si le boid est une image
        if (image !== undefined) {
            this.image = image;

            // largeur image
            const li = this.image.width;
            // hauteur image
            const hi = this.image.height;
            // on remet les valeurs à l'échelle par rapport au rayon
            // du véhicule
            const ratio = li / hi;
            // la largeur de l'image sera égale à r
            this.imageL = this.r;
            // la hauteur de l'image sera égale à r/ratio
            this.imageH = this.r / ratio;
        }

        // Offset de rotation pour l'image (dépend de l'orientation originale)
        // Math.PI si l'image pointe vers la gauche, 0 si elle pointe vers la droite
        this.imageRotationOffset = Math.PI;

        this.perceptionRadius = 25;
        // pour le comportement align
        this.alignWeight = 1.5;
        // pour le comportement cohesion
        this.cohesionWeight = 1;
        // Pour la séparation
        this.separationWeight = 2;
        // Pour le confinement
        this.boundariesWeight = 10;

        // Paramètres comportement confinement
        this.boundariesX = 0;
        this.boundariesY = 0
        this.boundariesWidth = width;
        this.boundariesHeight = height;
        this.boundariesDistance = 25;

        // Paramètres  comportement Wander
        // pour comportement wander
        this.distanceCercle = 150;
        this.wanderRadius = 50;
        this.wanderTheta = 0;
        this.displaceRange = 0.1;

        // Propriété pour poisson doré (jeu)
        this.isGolden = false;

        // Niveau de panique (extension pour le jeu)
        this.panicLevel = 0;
        this.panicDecayRate = 0.01;
        this.fleeRadius = 150;

        // Pour évitement d'obstacles (méthode avoid du prof)
        this.largeurZoneEvitementDevantVaisseau = this.r / 2;
    }

    // Equivalent de "applyBehaviors" dans le code des autres exemples
    // flock signifie "se rassembler" en anglais
    flock(boids) {
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);
        let boundaries = this.boundaries(this.boundariesX, this.boundariesY, this.boundariesWidth, this.boundariesHeight, this.boundariesDistance);
        //let boundaries = this.boundaries(100, 200, 800, 400, 25);

        alignment.mult(this.alignWeight);
        cohesion.mult(this.cohesionWeight);
        separation.mult(this.separationWeight);
        boundaries.mult(this.boundariesWeight);

        this.applyForce(alignment);
        this.applyForce(cohesion);
        this.applyForce(separation);
        this.applyForce(boundaries);
    }

    align(boids) {
        let perceptionRadius = this.perceptionRadius;

        let steering = createVector();
        let total = 0;
        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
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

    separation(boids) {
        let perceptionRadius = this.perceptionRadius;

        let steering = createVector();
        let total = 0;

        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.div(d * d);
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

    cohesion(boids) {
        let perceptionRadius = 2 * this.perceptionRadius;

        let steering = createVector();
        let total = 0;

        for (let other of boids) {
            let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
            if (other != this && d < perceptionRadius) {
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

    seek(target) {
        let desired = p5.Vector.sub(target, this.pos);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    arrive(target) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();

        // Rayon d'arrivée (ralentissement pour s'arrêter doucement)
        // Rayon d'arrivée (ralentissement pour s'arrêter doucement)
        if (d < 10) { // Réduit de 100 à 10 pour qu'il "colle" plus à la souris
            let m = map(d, 0, 10, 0, this.maxSpeed);
            desired.setMag(m);
        } else {
            desired.setMag(this.maxSpeed);
        }

        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    flee(target) {
        // inverse de seek ! 
        let force = this.seek(target).mult(-1);
        return force;
    }

    // Poursuite d'un point devant la target (prédiction)
    // Cette méthode anticipe où sera la cible dans quelques frames
    pursue(vehicle) {
        let target = vehicle.pos.copy();
        let prediction = vehicle.vel.copy();
        prediction.mult(10);  // Prédire 10 frames dans le futur
        target.add(prediction);

        if (Boid.debug) {
            fill(0, 255, 0);
            circle(target.x, target.y, 16);
        }

        return this.seek(target);
    }

    // Evade = inverse de pursue
    evade(vehicle) {
        let pursuit = this.pursue(vehicle);
        pursuit.mult(-1);
        return pursuit;
    }

    fleeWithTargetRadius(target) {
        const d = this.pos.dist(target.pos);
        let rayonZoneAFuir = target.r + 10;

        if (d < rayonZoneAFuir) {
            // On dessine le cercle de la zone à fuir
            push();
            stroke("red");
            strokeWeight(2);
            circle(target.pos.x, target.pos.y, rayonZoneAFuir * 2);
            pop();

            // je fuis la cible, on réutilise le comportement flee
            const fleeForce = this.flee(target.pos);
            fleeForce.mult(100);
            this.applyForce(fleeForce);
        }
    }

    // Fuir un danger avec un rayon de perception (extension pour le jeu)
    fleeFromDanger(danger, fleeRadius) {
        const d = this.pos.dist(danger.pos);

        if (d < fleeRadius) {
            // Augmenter le niveau de panique
            let panicIncrease = map(d, 0, fleeRadius, 0.3, 0.05);
            this.panicLevel = min(1, this.panicLevel + panicIncrease);

            // je fuis le danger
            const fleeForce = this.flee(danger.pos);

            // Force plus forte quand le danger est proche
            let strength = map(d, 0, fleeRadius, 8, 2);
            fleeForce.mult(strength);

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

    wander() {
        // point devant le véhicule, centre du cercle

        let centreCercleDevant = this.vel.copy();
        centreCercleDevant.setMag(this.distanceCercle);
        centreCercleDevant.add(this.pos);

        if (Boid.debug) {
            // on le dessine sous la forme d'une petit cercle rouge
            fill("red");
            circle(centreCercleDevant.x, centreCercleDevant.y, 8);

            // Cercle autour du point
            noFill();
            stroke("white");
            circle(centreCercleDevant.x, centreCercleDevant.y, this.wanderRadius * 2);

            // on dessine une ligne qui relie le vaisseau à ce point
            // c'est la ligne blanche en face du vaisseau
            line(this.pos.x, this.pos.y, centreCercleDevant.x, centreCercleDevant.y);
        }

        // On va s'occuper de calculer le point vert SUR LE CERCLE
        // il fait un angle wanderTheta avec le centre du cercle
        // l'angle final par rapport à l'axe des X c'est l'angle du vaisseau
        // + cet angle
        let wanderAngle = this.vel.heading() + this.wanderTheta;
        // on calcule les coordonnées du point vert
        let pointSurCercle = createVector(this.wanderRadius * cos(wanderAngle), this.wanderRadius * sin(wanderAngle));
        // on ajoute la position du vaisseau
        pointSurCercle.add(centreCercleDevant);

        // maintenant pointSurCercle c'est un point sur le cercle
        // on le dessine sous la forme d'un cercle vert
        if (Boid.debug) {
            fill("lightGreen");
            circle(pointSurCercle.x, pointSurCercle.y, 8);

            // on dessine une ligne qui va du vaisseau vers le point sur le 
            // cercle
            line(this.pos.x, this.pos.y, pointSurCercle.x, pointSurCercle.y);

        }
        // on dessine le vecteur desiredSpeed qui va du vaisseau au point vert
        let desiredSpeed = p5.Vector.sub(pointSurCercle, this.pos);


        // On a donc la vitesse désirée que l'on cherche qui est le vecteur
        // allant du vaisseau au cercle vert. On le calcule :
        // ci-dessous, steer c'est la desiredSpeed directement !
        // Voir l'article de Craig Reynolds, Daniel Shiffman s'est trompé
        // dans sa vidéo, on ne calcule pas la formule classique
        // force = desiredSpeed - vitesseCourante, mais ici on a directement
        // force = desiredSpeed
        let force = p5.Vector.sub(desiredSpeed, this.vel);
        force.setMag(this.maxForce);

        // On déplace le point vert sur le cerlcle (en radians)
        this.wanderTheta += random(-this.displaceRange, this.displaceRange);

        return force;
    }

    // Permet de rester dans les limites d'une zone rectangulaire.
    // Lorsque le véhicule s'approche d'un bord vertical ou horizontal
    // on calcule la vitesse désirée dans la direction "réfléchie" par
    // rapport au bord (comme au billard).
    // Par exemple, si le véhicule s'approche du bord gauche à moins de 
    // 25 pixels (valeur par défaut de la variable d),
    // on calcule la vitesse désirée en gardant le x du vecteur vitesse
    // et en mettant son y positif. x vaut maxSpeed et y vaut avant une valeur
    // négative (puisque le véhicule va vers la gauche), on lui donne un y positif
    // ça c'est pour la direction à prendre (vitesse désirée). Une fois la direction
    // calculée on lui donne une norme égale à maxSpeed, puis on calcule la force
    // normalement : force = vitesseDesiree - vitesseActuelle
    // paramètres = un rectangle (bx, by, bw, bh) et une distance d
    boundaries(bx, by, bw, bh, d) {
        let vitesseDesiree = null;

        const xBordGauche = bx + d;
        const xBordDroite = bx + bw - d;
        const yBordHaut = by + d;
        const yBordBas = by + bh - d;

        // si le véhicule est trop à gauche ou trop à droite
        if (this.pos.x < xBordGauche) {
            // 
            vitesseDesiree = createVector(this.maxSpeed, this.vel.y);
        } else if (this.pos.x > xBordDroite) {
            vitesseDesiree = createVector(-this.maxSpeed, this.vel.y);
        }

        if (this.pos.y < yBordHaut) {
            vitesseDesiree = createVector(this.vel.x, this.maxSpeed);
        } else if (this.pos.y > yBordBas) {
            vitesseDesiree = createVector(this.vel.x, -this.maxSpeed);
        }

        if (vitesseDesiree !== null) {
            vitesseDesiree.setMag(this.maxSpeed);
            const force = p5.Vector.sub(vitesseDesiree, this.vel);
            force.limit(this.maxForce);
            return force;
        }

        if (Boid.debug) {
            // dessin du cadre de la zone
            push();

            noFill();
            stroke("white");
            rect(bx, by, bw, bh);

            // et du rectangle intérieur avec une bordure rouge de d pixels
            stroke("red");
            rect(bx + d, by + d, bw - 2 * d, bh - 2 * d);

            pop();
        }

        // si on est pas près du bord (vitesse désirée nulle), on renvoie un vecteur nul
        return createVector(0, 0);
    }

    getVehiculeLePlusProche(vehicules) {
        let plusPetiteDistance = Infinity;
        let vehiculeLePlusProche;

        vehicules.forEach(v => {
            if (v != this) {
                // Je calcule la distance entre le vaisseau et le vehicule
                const distance = this.pos.dist(v.pos);
                if (distance < plusPetiteDistance) {
                    plusPetiteDistance = distance;
                    vehiculeLePlusProche = v;
                }
            }
        });

        return vehiculeLePlusProche;
    }

    // Évitement d'obstacles (extension pour le jeu)
    avoidObstacles(obstacles) {
        let totalForce = createVector();

        for (let obstacle of obstacles) {
            let d = this.pos.dist(obstacle.pos);
            let avoidRadius = obstacle.r + 40;

            if (d < avoidRadius) {
                let away = p5.Vector.sub(this.pos, obstacle.pos);
                away.normalize();
                let strength = map(d, 0, avoidRadius, 5, 0.5);
                away.mult(strength);
                totalForce.add(away);

                if (d < obstacle.r + this.r) {
                    away.setMag(obstacle.r + this.r - d + 5);
                    this.pos.add(away);
                    this.vel.mult(-0.5);
                }
            }
        }

        return totalForce;
    }

    // Évitement d'obstacles (version du professeur avec ahead/ahead2)
    avoid(obstacles) {
        // calcul d'un vecteur ahead devant le véhicule
        let ahead = this.vel.copy();
        ahead.mult(30);
        // on calcue ahead2 deux fois plus petit
        let ahead2 = ahead.copy();
        ahead2.mult(0.5);

        if (Boid.debug) {
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

        if (Boid.debug) {
            fill("red");
            circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
            fill("blue");
            circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);

            push();
            stroke(100, 100);
            strokeWeight(this.largeurZoneEvitementDevantVaisseau);
            line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
            pop();
        }

        // si la distance est < rayon de l'obstacle, collision possible
        if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
            let force;
            if (distance1 < distance2) {
                force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
            } else {
                force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
            }

            if (Boid.debug) {
                this.drawVector(obstacleLePlusProche.pos, force, "yellow");
            }

            force.setMag(this.maxSpeed);
            force.sub(this.vel);
            force.limit(this.maxForce / 2);
            return force;
        } else {
            return createVector(0, 0);
        }
    }

    /**
     * PATH FOLLOWING (Suivi de chemin)
     * ───────────────────────────────
     * Algorithme de Reynolds:
     * 1. Prédire la position future
     * 2. Trouver la projection sur le chemin
     * 3. Si trop loin, se diriger vers le chemin
     */
    follow(path) {
        // Prédiction de la position future
        let predict = this.vel.copy();
        predict.normalize();
        predict.mult(25); // Look ahead
        let predictLoc = p5.Vector.add(this.pos, predict);

        let worldRecord = 1000000;
        let target = null;
        let normal = null;

        // Trouver le segment le plus proche
        for (let i = 0; i < path.points.length - 1; i++) {
            let a = path.points[i];
            let b = path.points[i + 1];

            // Point normal sur le segment
            let normalPoint = this.getNormalPoint(predictLoc, a, b);

            // Gérer le cas où le point normal est hors du segment
            if (normalPoint.x < min(a.x, b.x) || normalPoint.x > max(a.x, b.x) ||
                normalPoint.y < min(a.y, b.y) || normalPoint.y > max(a.y, b.y)) {
                normalPoint = b.copy();
            }

            let distance = p5.Vector.dist(predictLoc, normalPoint);

            if (distance < worldRecord) {
                worldRecord = distance;
                normal = normalPoint;

                // Cible devant sur le chemin
                let dir = p5.Vector.sub(b, a);
                dir.normalize();
                dir.mult(25); // Target ahead distance
                target = p5.Vector.add(normalPoint, dir);
            }
        }

        // Si on est dans le chemin, pas de force
        if (worldRecord > path.radius) {
            return this.seek(target);
        } else {
            return createVector(0, 0);
        }
    }

    // Helper pour trouver la projection normale sur un segment
    getNormalPoint(p, a, b) {
        let ap = p5.Vector.sub(p, a);
        let ab = p5.Vector.sub(b, a);
        ab.normalize();
        ab.mult(ap.dot(ab));
        let normalPoint = p5.Vector.add(a, ab);
        return normalPoint;
    }

    // Trouver l'obstacle le plus proche
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

    // Dessiner un vecteur (debug)
    drawVector(pos, v, color) {
        push();
        strokeWeight(3);
        stroke(color);
        line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
        let arrowSize = 5;
        translate(pos.x + v.x, pos.y + v.y);
        rotate(v.heading());
        translate(-arrowSize / 2, 0);
        triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
        pop();
    }


    /**
     * PATH FOLLOWING (Suivi de chemin) - Optionnel mais présent pour respecter le code du prof
     * Algorithme de Reynolds
     */
    follow(path) {
        // Prédiction de la position future
        let predict = this.vel.copy();
        predict.normalize();
        predict.mult(25); // Look ahead
        let predictLoc = p5.Vector.add(this.pos, predict);

        let worldRecord = 1000000;
        let target = null;
        let normal = null;

        // Trouver le segment le plus proche
        for (let i = 0; i < path.points.length - 1; i++) {
            let a = path.points[i];
            let b = path.points[i + 1];

            // Point normal sur le segment
            let normalPoint = this.getNormalPoint(predictLoc, a, b);

            // Gérer le cas où le point normal est hors du segment
            if (normalPoint.x < min(a.x, b.x) || normalPoint.x > max(a.x, b.x) ||
                normalPoint.y < min(a.y, b.y) || normalPoint.y > max(a.y, b.y)) {
                normalPoint = b.copy();
            }

            let distance = p5.Vector.dist(predictLoc, normalPoint);

            if (distance < worldRecord) {
                worldRecord = distance;
                normal = normalPoint;

                // Cible devant sur le chemin
                let dir = p5.Vector.sub(b, a);
                dir.normalize();
                dir.mult(25); // Target ahead distance
                target = p5.Vector.add(normalPoint, dir);
            }
        }

        // Si on est dans le chemin (avec marge), pas de force
        if (worldRecord > path.radius) {
            return this.seek(target);
        } else {
            return createVector(0, 0);
        }
    }

    // Helper pour trouver la projection normale sur un segment
    getNormalPoint(p, a, b) {
        let ap = p5.Vector.sub(p, a);
        let ab = p5.Vector.sub(b, a);
        ab.normalize();
        ab.mult(ap.dot(ab));
        let normalPoint = p5.Vector.add(a, ab);
        return normalPoint;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        this.pos.add(this.vel);
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.acc.mult(0);

        // Mise à jour du niveau de panique
        this.updatePanic();
    }

    show() {
        if (this.image !== undefined) {
            imageMode(CENTER);

            // On regarde la direction dans laquelle le boid va :
            push();
            translate(this.pos.x, this.pos.y);

            // CORRECTION SENS : Flip Horizontal simple
            // On suppose que l'image de base regarde vers la DROITE
            if (this.vel.x < 0) {
                scale(-1, 1); // Miroir horizontal
            }

            // On peut ajouter une légère rotation pour le "tangage" (climb/dive)
            // mais on limite pour éviter le retournement
            let tilt = atan2(this.vel.y, abs(this.vel.x));
            rotate(tilt);

            // Appliquer le tint si défini (pour les classes enfants)
            if (this.tint) {
                tint(this.tint);
            }

            // Dessiner l'image
            image(this.image, 0, 0, this.r, this.r);

            // Réinitialiser le tint
            if (this.tint) {
                noTint();
            }

            pop();

            return;
        } else {
            strokeWeight(this.r);
            stroke(255);
            point(this.pos.x, this.pos.y);
        }
    }

    edges() {
        if (this.pos.x > width) {
            this.pos.x = 0;
        } else if (this.pos.x < 0) {
            this.pos.x = width;
        }
        if (this.pos.y > height) {
            this.pos.y = 0;
        } else if (this.pos.y < 0) {
            this.pos.y = height;
        }
    }

    // Méthode avoid du prof
    avoid(obstacles) {
        // calcul d'un vecteur ahead devant le véhicule
        // il regarde par exemple 50 frames devant lui
        let ahead = this.vel.copy();
        ahead.mult(30);
        //on calcue ahead2 deux fois plus petit
        let ahead2 = ahead.copy();
        ahead2.mult(0.5);

        if (Boid.debug) {
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

        if (Boid.debug) {
            // On dessine le point au bout du vecteur ahead pour debugger
            fill("red");
            circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
            fill("blue");
            circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);

            // On dessine la zone d'évitement
            // Pour cela on trace une ligne large qui va de la position du vaisseau
            // jusqu'au point au bout de ahead
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
            if (Boid.debug) {
                // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
                this.drawVector(obstacleLePlusProche.pos, force, "yellow");
            }
            // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
            // on limite ce vecteur à la longueur maxSpeed
            // force est la vitesse désirée
            force.setMag(this.maxSpeed);
            // on calcule la force à appliquer pour atteindre la cible avec la formule
            // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
            force.sub(this.vel);
            // on limite cette force à la longueur maxForce
            force.limit(this.maxForce / 2);
            return force;
        } else {
            // pas de collision possible
            return createVector(0, 0);
        }
    }

    getObstacleLePlusProche(obstacles) {
        let plusPetiteDistance = 100000000;
        let obstacleLePlusProche = undefined;

        obstacles.forEach(o => {
            // Je calcule la distance entre le vaisseau et l'obstacle
            const distance = this.pos.dist(o.pos);

            if (distance < plusPetiteDistance) {
                plusPetiteDistance = distance;
                obstacleLePlusProche = o;
            }
        });

        return obstacleLePlusProche;
    }

    drawVector(pos, v, color) {
        push();
        // Dessin du vecteur vitesse
        // Il part du centre du véhicule et va dans la direction du vecteur vitesse
        strokeWeight(3);
        stroke(color);
        line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
        // dessine une petite fleche au bout du vecteur vitesse
        let arrowSize = 5;
        translate(pos.x + v.x, pos.y + v.y);
        rotate(v.heading());
        translate(-arrowSize / 2, 0);
        triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
        pop();
    }

}
