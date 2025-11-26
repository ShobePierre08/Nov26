export class Tray {
  constructor(scene, components, options = {}) {
    this.scene = scene;
    this.components = components;
    this.draggables = [];
    this.trayBg = null;
    this.position = 'right'; // default position
    this.width = (scene && scene.scale) ? scene.scale.width * 0.2 : 200;
    this.bgColor = 0x333333;
    this.bgAlpha = 0.8;
    this.componentSize = 0.7;
    this.animationDuration = 400;
    this.animationEase = 'Power2';
    
    // Apply custom options
    if (options && typeof options === 'object') {
      if (options.position) this.position = options.position;
      if (options.width) this.width = options.width;
      if (options.bgColor !== undefined) this.bgColor = options.bgColor;
      if (options.bgAlpha !== undefined) this.bgAlpha = options.bgAlpha;
      if (options.componentSize) this.componentSize = options.componentSize;
      if (options.animationDuration) this.animationDuration = options.animationDuration;
      if (options.animationEase) this.animationEase = options.animationEase;
    }
  }

  show(buildStep = 1) {
    if (!this.scene) {
      console.error('Tray: Scene is undefined');
      return;
    }

    if (!this.scene.scale) {
      console.error('Tray: Scene.scale is undefined');
      return;
    }

    const screenW = this.scene.scale.width;
    const screenH = this.scene.scale.height;

    // Update width if not already set properly
    if (!this.width || this.width === 200) {
      this.width = screenW * 0.2;
    }

    let trayX, trayY, startX, startY, endX, endY;
    let isVertical = this.position === 'right' || this.position === 'left';

    if (this.position === 'right') {
      trayX = screenW + this.width / 2;
      trayY = screenH / 2;
      startX = trayX;
      endX = screenW - this.width / 2;
      startY = trayY;
      endY = trayY;
    } else if (this.position === 'left') {
      trayX = -this.width / 2;
      trayY = screenH / 2;
      startX = trayX;
      endX = this.width / 2;
      startY = trayY;
      endY = trayY;
    } else if (this.position === 'top') {
      trayX = screenW / 2;
      trayY = -screenH * 0.09;
      startX = trayX;
      endX = trayX;
      startY = trayY;
      endY = screenH * 0.09;
    } else if (this.position === 'bottom') {
      trayX = screenW / 2;
      trayY = screenH + screenH * 0.09;
      startX = trayX;
      endX = trayX;
      startY = trayY;
      endY = screenH - screenH * 0.09;
    }

    // Create tray background
    if (isVertical) {
      this.trayBg = this.scene.add.rectangle(startX, startY, this.width, screenH, this.bgColor, this.bgAlpha)
        .setOrigin(0.5, 0.5);
    } else {
      this.trayBg = this.scene.add.rectangle(startX, startY, screenW, screenH * 0.18, this.bgColor, this.bgAlpha)
        .setOrigin(0.5, 0.5);
    }

    // Create component images
    const numComponents = this.components.length;
    const spacing = isVertical 
      ? screenH / (numComponents + 1) 
      : screenW / (numComponents + 1);

    this.components.forEach((comp, i) => {
      let imgX, imgY;
      
      if (isVertical) {
        imgX = startX;
        imgY = spacing * (i + 1);
      } else {
        imgX = spacing * (i + 1);
        imgY = startY + screenH * 0.09;
      }

      const img = this.scene.add.image(imgX, imgY, comp.key)
        .setDisplaySize(this.width * this.componentSize, this.width * this.componentSize)
        .setInteractive({ draggable: true });

      img.componentData = comp;
      this.draggables.push(img);
      this.scene.input.setDraggable(img);
    });

    // Animate tray in
    const tweenConfig = {
      targets: [this.trayBg].concat(this.draggables),
      duration: this.animationDuration,
      ease: this.animationEase,
    };

    if (endX !== startX) {
      tweenConfig.x = endX;
    }
    if (endY !== startY) {
      tweenConfig.y = endY;
    }

    this.scene.tweens.add(tweenConfig);
  }

  getDraggables() {
    return this.draggables;
  }

  getTrayPosition() {
    if (!this.scene || !this.scene.scale) {
      console.error('Tray: Scene or scene.scale is undefined');
      return { x: 0, y: 0 };
    }

    const { width: screenW, height: screenH } = this.scene.scale;

    if (this.position === 'right') {
      return { x: screenW - this.width / 2, y: screenH / 2 };
    } else if (this.position === 'left') {
      return { x: this.width / 2, y: screenH / 2 };
    } else if (this.position === 'top') {
      return { x: screenW / 2, y: screenH * 0.09 };
    } else if (this.position === 'bottom') {
      return { x: screenW / 2, y: screenH - screenH * 0.09 };
    }
  }

  resetComponentPosition(obj) {
    const trayPos = this.getTrayPosition();

    if (this.position === 'right' || this.position === 'left') {
      obj.x = trayPos.x;
    } else if (this.position === 'top' || this.position === 'bottom') {
      obj.y = trayPos.y;
    }
  }

  destroy() {
    this.draggables.forEach(d => d.destroy());
    if (this.trayBg) this.trayBg.destroy();
    this.draggables = [];
    this.trayBg = null;
  }
}
