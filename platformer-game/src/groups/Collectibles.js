import Phaser from "phaser";
import Collectible from "../collectibles/Collectible";

class Collectibles extends Phaser.Physics.Arcade.StaticGroup {
    constructor(scene) {
        super(scene.physics.world, scene);

        this.createFromConfig({
            classType: Collectible
        })
    }

    mapProperties(propertiesList) {
        if(!propertiesList || propertiesList.length === 0) { return {}; }

        return propertiesList.reduce( (map, obj) => {
            map[obj.name] = obj.value;
            return map;
        }, {})
    }

    addFromLayer(layer) {
        const {score: defaultScore, type} = this.mapProperties(layer.properties);
        
        layer.objects.forEach(collectibleObj => {
            const collectible = this.get(collectibleObj.x, collectibleObj.y, type);
            const props = this.mapProperties(collectibleObj.properties);
            
            collectible.score = props.score || defaultScore; 
        })
    }
}

export default Collectibles;