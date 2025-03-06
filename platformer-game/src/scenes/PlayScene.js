import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemies from '../groups/Enemies';
import Collectibles from '../groups/Collectibles';
import Hud from '../hud';
import EventEmitter from '../events/Emitter';
import initAnims from '../anims';

class PlayScene extends Phaser.Scene {

  constructor(config) {
    super('PlayScene');
    this.config = config;
  }

  create({gameStatus}) {
    this.score = 0;
    this.hud = new Hud(this, 0, 0);

    this.playBgMusic();
    this.collectSound = this.sound.add('coin-pickup', {volume: 0.1});

    const map = this.createMap();

    initAnims(this.anims);

    const layers = this.createLayers(map);
    const playerZones = this.getPlayerZones(layers.playerZones);
    const player = this.createPlayer(playerZones.start);
    const enemies = this.createEnemies(layers.enemySpawns, layers.platformsColliders);
    const collectibles = this.createCollectibles(layers.collectibles);

    this.createEnemyColliders(enemies, {
      colliders: {
        platformsColliders: layers.platformsColliders,
        player
      }
    });

    this.createPlayerColliders(player, {
      colliders: {
        platformsColliders: layers.platformsColliders,
        projectiles: enemies.getProjectiles(),
        collectibles,
        traps: layers.traps
      }
    });

    this.createBG(map);
    this.createBackButton();
    this.createEndOfLevel(playerZones.end, player);
    this.setupFollowupCameraOn(player);

    if(gameStatus === 'PLAYER_LOSE') { return; }
    this.createGameEvents();
    
  }

  playBgMusic() {
    if (this.sound.get('theme')) { return; }

    this.sound.add('theme', {loop: true, volume: 0.03}).play();
  }

  createMap() {
    const map = this.make.tilemap({key: `level_${this.getCurrentLevel()}`});
    map.addTilesetImage('main_lev_build_1', 'tiles-1');
    map.addTilesetImage('bg_spikes_tileset', 'bg-spikes-tileset')
    return map;
  }

  createLayers(map) {
    const tileset = map.getTileset('main_lev_build_1');
    const tilesetBg = map.getTileset('bg_spikes_tileset');

    map.createLayer('distance', tilesetBg).setDepth(-12);

    const platformsColliders = map.createLayer('platforms_colliders', tileset);
    const environment = map.createLayer('environment', tileset).setDepth(-2);
    const platforms = map.createLayer('platforms', tileset);
    const playerZones = map.getObjectLayer('player_zones');
    const enemySpawns = map.getObjectLayer('enemy_spawns');
    const collectibles = map.getObjectLayer('collectibles');
    const traps = map.createLayer('traps', tileset);

    platformsColliders.setCollisionByProperty({collides: true});
    traps.setCollisionByExclusion(-1);

    return { 
      environment, 
      platforms, 
      platformsColliders, 
      playerZones, 
      enemySpawns,
      collectibles,
      traps };
  }

  createBG(map) {
    const bgObject = map.getObjectLayer('distance_bg').objects[0];
    
    this.spikesImage = this.add.tileSprite(bgObject.x, bgObject.y, this.config.width, bgObject.height, 'bg-spikes-dark')
      .setOrigin(0, 1)
      .setDepth(-10)
      .setScrollFactor(0, 1);

    this.skyImage = this.add.tileSprite(0, 0, this.config.width, 180, 'sky-play')
      .setOrigin(0, 0)
      .setDepth(-11)
      .setScale(1.1)
      .setScrollFactor(0, 1);
  }

  createBackButton() {
    const btn = this.add.image(this.config.rightBottomCorner.x, this.config.rightBottomCorner.y, 'back')
      .setOrigin(1)
      .setScrollFactor(0)
      .setScale(2)
      .setInteractive();

    btn.on('pointerup', () => {
      this.scene.start('MenuScene')
    })
  }

  createGameEvents() {
    EventEmitter.on('PLAYER_LOSE', () => {
      this.scene.restart({gameStatus: 'PLAYER_LOSE'});
    })
  }

  createCollectibles(collectibleLayer) {
    const collectibles = new Collectibles(this).setDepth(-1);

    collectibles.addFromLayer(collectibleLayer);
    collectibles.playAnimation('diamond-shine');

    return collectibles;
  }

  createPlayer(start) {
    return new Player(this, start.x, start.y);
  }

  createEnemies(spawnLayer, platformsColliders) {
    const enemies = new Enemies(this);
    const enemyTypes = enemies.getTypes();

    spawnLayer.objects.forEach((spawnPoint, i) => {
      const enemy = new enemyTypes[spawnPoint.type](this, spawnPoint.x, spawnPoint.y);
      enemy.setPlatformColliders(platformsColliders);
      enemies.add(enemy);
    })

    return enemies;
  }

  onPlayerCollision(enemy, player) {
    player.takesHit(enemy);
  }

  onHit(entity, source) {
    entity.takesHit(source);
  }

  onCollect(entity, collectible) {
    this.score += collectible.score;
    this.hud.updateScoreboard(this.score);
    this.collectSound.play();
    collectible.disableBody(true, true);
  }

  createEnemyColliders(enemies, { colliders }) {
    enemies
      .addCollider(colliders.platformsColliders)
      .addCollider(colliders.player, this.onPlayerCollision)
      .addCollider(colliders.player.projectiles, this.onHit)
      .addOverlap(colliders.player.meleeWeapon, this.onHit)
  }

  createPlayerColliders(player, { colliders }) {
    player
      .addCollider(colliders.platformsColliders)
      .addCollider(colliders.projectiles, this.onHit)
      .addCollider(colliders.traps, this.onHit)
      .addOverlap(colliders.collectibles, this.onCollect, this)
  }

  setupFollowupCameraOn(player) {
    const { height, width, mapOffset, zoomFactor } = this.config;
    this.physics.world.setBounds(0, 0, width + mapOffset, height + 200);
    this.cameras.main.setBounds(0, 0, width + mapOffset, height).setZoom(zoomFactor);
    this.cameras.main.startFollow(player);
  }

  getPlayerZones(playerZonesLayer) {
    const playerZones = playerZonesLayer.objects;
    return {
      start: playerZones.find(zone => zone.name === 'startZone'),
      end: playerZones.find(zone => zone.name === 'endZone')
    }
  }

  getCurrentLevel() {
    return this.registry.get('level') || 1;
  }

  createEndOfLevel(end, player) {
    const endOfLevel = this.physics.add.sprite(end.x, end.y, 'end')
      .setAlpha(0)
      .setSize(5, 200)
      .setOrigin(1,1);

    const eolOverlap = this.physics.add.overlap(player, endOfLevel, () => {
      eolOverlap.active = false;

      if (this.registry.get('level') === this.config.lastLevel) {
        this.scene.start('CreditScene');
        return;
      }

      this.registry.inc('level', 1);
      this.registry.inc('unlocked-levels', 1);
      this.scene.restart({gameStatus: 'LEVEL_COMPLETED'})
    })
  }

  update() {
    this.spikesImage.tilePositionX = this.cameras.main.scrollX * 0.3;
    this.skyImage.tilePositionX = this.cameras.main.scrollX * 0.1;
  }
}

export default PlayScene;