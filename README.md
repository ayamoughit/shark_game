<div align="center">
  <h1>🦈 Angry Sharks - Simulation de Vie Artificielle</h1>
  <h3>Master IA - CASA G1 2025-2026</h3>
  
  <p><strong>Ce projet est réalisé par :</strong></p>
  <p>
    Moughit Aya<br>
    Kharraz Kenza
  </p>
</div>

<div align="center">
  <h3>🚀 <a href="https://ayamoughit.github.io/shark_game/">JOUER À LA DÉMO EN LIGNE</a> 🚀</h3>
  <p>(La version hébergée sur GitHub Pages est disponible ici : <a href="https://ayamoughit.github.io/shark_game/">https://ayamoughit.github.io/shark_game/</a>)</p>

  <h3>📺 <a href="https://youtu.be/8O0bICrAJOM">VOIR LA DÉMONSTRATION VIDÉO</a> 📺</h3>
  <p>(La vidéo de démonstration est disponible ici : <a href="https://youtu.be/8O0bICrAJOM">https://youtu.be/8O0bICrAJOM</a>)</p>
</div>

### 📝 Présentation du Projet
Ce projet est une simulation interactive basée sur les principes de **Vie Artificielle** et de **Comportements Réactifs**. Il met en scène un écosystème marin où un prédateur (le Requin) chasse des proies (les Poissons) qui tentent de survivre en groupe.

L'objectif était de transformer une simulation académique de **Boids** (basée sur les travaux de Craig Reynolds) en un jeu jouable ("Angry Sharks"), tout en respectant scrupuleusement les algorithmes vus en cours.

#

### 🎮 Fonctionnalités Principales
- **Mode Simulation (Regarder)** : L'IA contrôle tout. Le requin chasse en autonomie, les poissons fuient et se regroupent.
- **Mode Jeu (Jouer)** : L'utilisateur prend le contrôle du requin pour chasser, avec des contraintes de temps, de score et de dangers.

### 🧠 Comportements et Mise en Situation (Qui, Quoi, Comment, Pourquoi ?)

Tous les agents du jeu (Requin et Poissons) héritent de la classe `Boid`, qui implémente les comportements de pilotage (Steering Behaviors).

#### 1. Flocking (Le Banc de Poissons)
* **Qui ?** Les Poissons (`fishes.js`).
* **Quoi ?** Se déplacer en groupe cohérent.
* **Comment ?** Combinaison de trois règles :
    * **Séparation** : Éviter d'être trop collé aux voisins (pour ne pas se heurter).
    * **Alignement** : Aller dans la même direction que les voisins.
    * **Cohésion** : Rester proche du centre de masse du groupe.
* **Pourquoi ?** Pour simuler le comportement naturel des bancs de poissons et rendre la chasse plus difficile pour le prédateur (dilution du risque).

#### 2. Seek & Flee (Chasse et Fuite)
* **Qui ?**
    * **Seek (Chercher)** : Le Requin cherche le poisson le plus proche.
    * **Flee (Fuir)** : Les Poissons fuient le Requin s'il est trop près.
* **Comment ?**
    * `Seek` calcule un vecteur "vitesse désirée" vers la cible et applique une force pour tourner progressivement.
    * `Flee` fait l'inverse.
* **Pourquoi ?** C'est la base de l'interaction Prédateur-Proie.

#### 3. Wander (Exploration)
* **Qui ?** Le Requin (quand il n'a pas de proie) et les Poissons (quand ils sont calmes).
* **Comment ?** On projette un cercle devant l'agent et on choisit un point aléatoire sur ce cercle à chaque frame. Cela crée un mouvement fluide et naturel, moins erratique que le hasard pur.
* **Pourquoi ?** Pour donner l'illusion d'une "volonté" de se promener et d'explorer l'environnement.

#### 4. Obstacle Avoidance (Évitement d'Obstacles)
* **Qui ?** Tous les agents (Requin et Poissons) face aux obstacles (cercles).
* **Comment ?** L'agent projette un vecteur "antenne" (`ahead`) devant lui. Si ce vecteur intersecte un obstacle, une force latérale est appliquée pour l'éviter.
* **Pourquoi ?** Pour naviguer dans un environnement complexe sans se cogner bêtement.

#### 5. Path Following (Suivi de Chemin)
* **Note** : Bien que non utilisé activement dans le gameplay actuel, l'algorithme complet de suivi de chemin (Path Following) a été implémenté dans la classe `Boid` (`follow()`) pour respecter l'intégralité des enseignements du cours.

### 🔧 Choix Techniques et Respect des Consignes

#### Suppression de `Vehicle.js`
Conformément aux directives du professeur pour ce rendu spécifique :
*"Enlever la classe Vehicle.js et tout mettre dans Boid.js en respectant son code qui est la base."*

Nous avons fusionné la logique de base dans `Boid.js`. Cependant, nous avons **strictement conservé** l'implémentation académique des méthodes (`seek`, `arrive`, `wander`, `avoid`, `flock`). Le fichier `boid.js` est donc une "super-classe" qui contient toute l'intelligence artificielle du projet.

Les classes `Shark` (Requin) et `Fish` (Poisson) héritent de `Boid` et ne font que paramétrer ces comportements (vitesse max, force max, rayon de perception) sans réécrire les algorithmes de mouvement.

### 🚀 Outils IA Utilisés & Prompt Engineering

Pour la réalisation du projet, nous avons utilisé l'assistant de codage génératif **Antigravity**. L'objectif était de l'utiliser comme un assistant de programmation (Pair Programming) tout en gardant le contrôle sur l'architecture.

#### Exemples de Prompts Utilisés

##### 1. Définition des Règles de Base (Structure Académique)
"J'utilise antigravity pour un projet de développement en P5js. Je voudrais lui indiquer des guidelines générales comme 'Tu utiliseras des modèles de comportements qui suivent les principes exposés par Craig Reynolds dans son article sur les steering behaviors', 'Tu ne modifieras pas la classe Vehicule.js qui contient les propriétés et comportements de base de tous les véhicules qui seront dans le projet, à la place tu pourras faire des sous-classes et spécialiser des méthodes comme show, applyBehaviors etc.'
Dans quel fichier reconnu automatiquement par antigravity puis-je spécifier ces règles ?"

##### 2. Création de Comportements Spécifiques (Chasse)
"Ajoute une méthode `hunt(preyList)` à la classe `Shark` qui hérite de `Boid`. Le requin doit utiliser le comportement `seek` pour poursuivre la proie la plus proche, mais seulement si elle est à moins de 200 pixels. Sinon, il doit utiliser `wander` pour explorer la zone. Assure-toi d'utiliser les méthodes existantes de `Boid` sans les réécrire."

##### 3. Ajout de "Game Feel" (Particules et Animation)
"Je veux que le jeu soit plus dynamique visuellement. Quand le requin mange un poisson, génère un système de particules (`particles.js`) qui simule une explosion de sang. Les particules doivent ralentir progressivement et disparaître. Crée aussi une animation de 'morsure' (`snap`) dans la méthode `show()` du requin en utilisant une transformation d'échelle (`scale`) temporaire sur quelques frames."

##### 4. Gestion des Modes de Jeu (UI et Logique)
"Implémente un système de bascule entre un mode 'Simulation' (où le requin chasse tout seul) et un mode 'Joueur' (où je contrôle le requin à la souris). Ajoute des boutons HTML pour changer de mode. En mode 'Simulation', désactive les dangers (barils radioactifs) pour qu'on puisse juste observer les comportements de flocking tranquille."

### 🏆 Ce dont nous sommes le plus fiers

1.  **L'Immersion Visuelle** : L'ajout de l'animation de "coup de dent" (`snap`) du requin, du nuage de sang (`particles.js`) et du **clignotement rouge de l'écran** lorsque le temps est presque écoulé (10 dernières secondes) rend l'action satisfaisante et viscérale ("Game Feel").
2.  **La Robustesse du Code** : Avoir réussi à faire cohabiter un **jeu d'arcade** (vies, score, combos, game over) avec une **simulation de vie artificielle** rigoureuse (Boids, Steering Behaviors) sans "tricher" sur la physique ou les vecteurs. Les agents se déplacent vraiment selon les lois de Reynolds, même quand le joueur joue.

### ⚠️ Difficultés Rencontrées

1.  **Réglage des Forces** : Trouver le bon équilibre entre la force de cohésion (les poissons restent groupés) et la force de fuite (ils ne se laissent pas manger). Au début, les poissons formaient une boule immobile ou explosaient dans tous les sens.
2.  **Gestion des États** : Gérer la transition entre le mode "Automatique" (Regarder) et le mode "Manuel" (Jouer), notamment pour faire apparaître/disparaître les dangers (Barils Radioactifs) qui ne doivent pas être là en mode simulation.
