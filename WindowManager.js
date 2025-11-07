// Classe pour gérer plusieurs fenêtres du navigateur qui communiquent entre elles
export default class WindowManager {
  // Variables privées (# = privé, accessible seulement dans cette classe)
  #allWindows;                    // Liste de toutes les fenêtres ouvertes
  #windowIdCounter;               // Compteur pour donner un ID unique à chaque fenêtre
  #currentWindowId;               // ID de la fenêtre actuelle
  #currentWindowData;             // Données de la fenêtre actuelle (position, taille, etc.)
  #onWindowResizeCallback;        // Fonction à appeler quand la fenêtre change de taille
  #onWindowListChangeCallback;    // Fonction à appeler quand la liste des fenêtres change
  
  constructor() {
    // Écoute les changements dans le localStorage (quand une autre fenêtre modifie les données)
    addEventListener("storage", (e) => {
      if (e.key === "windows") {
        // Une autre fenêtre a modifié la liste des fenêtres
        let newWindows = JSON.parse(e.newValue);
        let hasChanged = this.#checkWindowsChanged(
          this.#allWindows,
          newWindows
        );

        // Met à jour notre liste locale
        this.#allWindows = newWindows;

        // Si quelque chose a changé, on appelle la fonction callback
        if (hasChanged && this.#onWindowListChangeCallback) {
          this.#onWindowListChangeCallback();
        }
      }
    });

    // Écoute quand la fenêtre va se fermer
    window.addEventListener("beforeunload", () => {
      // Trouve notre fenêtre dans la liste
      let myIndex = this.#findMyWindowIndex();
      // La supprime de la liste
      this.#allWindows.splice(myIndex, 1);
      // Sauvegarde la nouvelle liste
      this.#saveToStorage();
    });
  }
  // Vérifie si la liste des fenêtres a changé
  #checkWindowsChanged(oldWindows, newWindows) {
    // Si pas d'anciennes fenêtres ou nombre différent = changement
    if (!oldWindows || oldWindows.length != newWindows.length) return true;
    
    // Compare chaque fenêtre une par une
    for (let i = 0; i < oldWindows.length; i++) {
      if (oldWindows[i].id != newWindows[i].id) return true;
    }
    return false; // Aucun changement détecté
  }
  // Trouve l'index de notre fenêtre dans la liste de toutes les fenêtres
  #findMyWindowIndex() {
    for (let i = 0; i < this.#allWindows.length; i++) {
      if (this.#allWindows[i].id == this.#currentWindowId) return i;
    }
    return -1; // Pas trouvé
  }
  // Sauvegarde la liste des fenêtres dans le localStorage du navigateur
  #saveToStorage() {
    localStorage.setItem("windows", JSON.stringify(this.#allWindows));
  }
  // Récupère la position et la taille actuelle de la fenêtre
  #getWindowShape() {
    return {
      x: window.screenLeft,    // Position X sur l'écran
      y: window.screenTop,     // Position Y sur l'écran
      w: window.innerWidth,    // Largeur de la fenêtre
      h: window.innerHeight,   // Hauteur de la fenêtre
    };
  }
  // Initialise cette fenêtre (à appeler au début)
  init(extraData) {
    // Récupère la liste des fenêtres existantes (ou liste vide si première fois)
    this.#allWindows = JSON.parse(localStorage.getItem("windows")) || [];
    // Récupère le compteur d'ID (ou 0 si première fois)
    this.#windowIdCounter = parseInt(localStorage.getItem("count")) || 0;
    // Incrémente pour avoir un nouvel ID unique
    this.#windowIdCounter++;

    // Assigne l'ID à cette fenêtre
    this.#currentWindowId = this.#windowIdCounter;
    // Récupère la position/taille actuelle
    let shape = this.#getWindowShape();
    // Crée l'objet de données pour cette fenêtre
    this.#currentWindowData = {
      id: this.#currentWindowId,
      shape: shape,
      metaData: extraData,        // Données personnalisées passées en paramètre
    };

    // Ajoute cette fenêtre à la liste
    this.#allWindows.push(this.#currentWindowData);
    // Sauvegarde le nouveau compteur
    localStorage.setItem("count", this.#windowIdCounter);
    // Sauvegarde la liste mise à jour
    this.#saveToStorage();
  }
  // Met à jour les données de la fenêtre (à appeler régulièrement, ex: dans une boucle)
  update() {
    // Récupère la position/taille actuelle
    let currentShape = this.#getWindowShape();

    // Vérifie si quelque chose a changé (position ou taille)
    if (
      currentShape.x != this.#currentWindowData.shape.x ||
      currentShape.y != this.#currentWindowData.shape.y ||
      currentShape.w != this.#currentWindowData.shape.w ||
      currentShape.h != this.#currentWindowData.shape.h
    ) {
      // Met à jour nos données locales
      this.#currentWindowData.shape = currentShape;
      // Met à jour dans la liste globale
      let myIndex = this.#findMyWindowIndex();
      this.#allWindows[myIndex].shape = currentShape;

      // Appelle la fonction callback si elle existe
      if (this.#onWindowResizeCallback) this.#onWindowResizeCallback();
      // Sauvegarde les changements
      this.#saveToStorage();
    }
  }
  // Définit une fonction à appeler quand la fenêtre change de taille/position
  setWinShapeChangeCallback(callback) {
    this.#onWindowResizeCallback = callback;
  }

  // Définit une fonction à appeler quand la liste des fenêtres change
  setWinChangeCallback(callback) {
    this.#onWindowListChangeCallback = callback;
  }

  // Retourne la liste de toutes les fenêtres
  getWindows() {
    return this.#allWindows;
  }

  // Retourne les données de cette fenêtre
  getThisWindowData() {
    return this.#currentWindowData;
  }

  // Retourne l'ID de cette fenêtre
  getThisWindowID() {
    return this.#currentWindowId;
  }
}
