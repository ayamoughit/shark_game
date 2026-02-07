# 📜 Règles du Jeu - Angry Sharks

Bienvenue dans **Angry Sharks**, une simulation de vie artificielle transformée en jeu d'arcade !

## 🎯 1. Objectif du Jeu
*   Vous incarnez un **Grand Requin Blanc**.
*   Votre but est de survivre et de manger **100 poissons** avant la fin du temps imparti.
*   **Attention** : Si vos **3 Vies (❤️❤️❤️)** tombent à 0 ou si le **Temps (⏱️)** est écoulé, c'est **Game Over** !

---

## 🎮 2. Commandes (Contrôles)

Vous avez le choix entre **deux modes de jeu** :

### 🕹️ Mode Joueur (Player - Manuel)
C'est le mode principal où **vous** jouez.
| Méthode | Description |
| :--- | :--- |
| **🖱️ Souris** | Le requin nage naturellement vers votre curseur. C'est le mode le plus fluide et intuitif. |
| **⌨️ Clavier** | Utilisez les **Flèches Directionnelles** ou **ZQSD** pour un contrôle précis et direct. |
| **Espace** / **P** | Mettre le jeu en **Pause**. |
| **O** | **Ajouter un Obstacle** sous la souris (pour tester l'évitement). |

### 🍿 Mode Observateur (Watch - Auto)
L'IA prend le contrôle total du requin pour une démonstration pure des comportements (Seek, Wander, Pursue). Installez-vous et regardez la simulation !

---

## 🏆 3. Système de Score

Manger des poissons vous rapporte des points. Essayez de battre le record !

*   🐟 **Poisson Normal** : **+10 points**.
*   🌟 **Poisson Doré** : **+50 points** (Ils sont rares et rapides !).
*   🔥 **SYSTÈME DE COMBO** : Mangez des poissons rapidement à la suite pour augmenter votre multiplicateur de score (jusqu'à **x15** !).

---

## ⚡ 4. Bonus (Power-Ups)

Des **Orbes Magiques** apparaissent parfois. Attrapez-les pour obtenir des super-pouvoirs temporaires :

| Icône | Pouvoir | Effet |
| :---: | :--- | :--- |
| ⚡ | **Vitesse** | Vous nagez beaucoup plus vite pour attraper les fuyards. |
| 🧲 | **Aimant** | Attire magnétiquement tous les poissons vers votre gueule ! |
| ❄️ | **Gel** | "Gèle" les poissons (ils deviennent très lents). |
| **×2** | **Double** | Double tous les points gagnés pendant 5 secondes. |

---

## 💀 5. Dangers & Obstacles

L'océan est dangereux et encombré !


*   🛢️ **Barils Toxiques** : Évitez-les absolument ! Les toucher vous fait perdre une vie et vous repousse violemment.
*   🪨 **Rochers (Cercles)** : Ce ne sont **pas des dangers mortels**, mais des obstacles physiques. Si vous foncez dedans, une force de répulsion (**Obstacle Avoidance**) vous repousse pour vous empêcher de passer. (Appuyez sur **O** pour en ajouter !)

---

## 🛠️ 6. Commandes de Débogage (Pour le Professeur)

Ces touches permettent de visualiser les algorithmes en temps réel :

| Touche | Fonctionnalité |
| :---: | :--- |
| **A** | Afficher/Masquer le **Panneau Académique** (infos techniques). |
| **V** | Afficher/Masquer les **Vecteurs de Force** (bâtons verts sur les poissons). |
| **F** | Afficher/Masquer les **Rayons de Perception** (cercles de vision). |
| **D** | Activer le mode **Debug Global** (infos sur tous les boids). |
| **R** | **Réinitialiser** la simulation (retour au menu). |


