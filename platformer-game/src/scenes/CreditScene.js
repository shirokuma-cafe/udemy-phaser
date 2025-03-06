
import BaseScene from "./BaseScene";

class CreditScene extends BaseScene {
    
    constructor(config) {
        super('CreditScene', {...config, canGoBack: true});
    
        this.menu = [
            {scene: null, text: 'Thank you for playing'},
            {scene: null, text: 'Author: shiromkuma-cafe'}
        ]
      }
    
    
    create() {
        super.create();
        this.createMenu(this.menu, () => {});
    }

}

export default CreditScene;