
import BaseScene from "./BaseScene";

class MenuScene extends BaseScene {
    
    constructor(config) {
        super('MenuScene', config);
    
        this.menu = [
          {scene: 'PlayScene', text: 'Play'},
          {scene: 'LevelScene', text: 'Levels'},
          {scene: null, text: 'Exit'}
        ]
      }
    
    
    create() {
    super.create();
    this.createMenu(this.menu, (menuItem) => this.setupMenuEvents(menuItem));
    }

    setupMenuEvents(menuItem) {
    const textGO = menuItem.textGO;
    textGO.setInteractive();

    textGO.on('pointerover', () => {
        textGO.setStyle({fill: '#FF0'})
    })
    textGO.on('pointerout', () => {
        textGO.setStyle({fill: '#713E01'})
    })
    textGO.on('pointerup', () => {
        menuItem.scene && this.scene.start(menuItem.scene);

        if (menuItem.text === 'Exit') {
         this.game.destroy(true);
        }
    })
    }

}

export default MenuScene;