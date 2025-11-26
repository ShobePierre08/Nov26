import Phaser from "phaser";
import cmosSlot from "../assets/components/cmos/cmosslot.png";
import cmosBatt from "../assets/components/cmos/cmosbatt.png";
import cmosLock from "../assets/components/cmos/cmosinserted.png";
import cmosInsert from "../assets/components/cmos/cmoslock.png";
import hand from "../assets/components/cmos/hand.png";

export default class CmosScene extends Phaser.Scene {
  constructor() {
    super("cmos");
  }

  preload() {
    this.load.image("cmosbatt", cmosBatt);
    this.load.image("cmosSlot", cmosSlot);
    this.load.image("cmos_insert", cmosInsert);
    this.load.image("cmos_locked", cmosLock);
    this.load.image("lockLever", hand);
  }

  create() {
    this.buildStep = 0;
    this.onCheckpointComplete = this.game.onCheckpointComplete;
    this.savedCheckpoints = this.game.savedCheckpoints;

    // Background
    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background");
    bg.setDisplaySize(this.scale.width, this.scale.height);

    // Sizes
    const SLOT_W = this.scale.width * 0.5;
    const SLOT_H = this.scale.height * 0.5;
    const BATTERY_W = SLOT_W * 0.3;
    const BATTERY_H = SLOT_H * 0.3;
    const INSERTED_W = SLOT_W * 0.85;
    const INSERTED_H = SLOT_H * 0.85;
    const LOCKED_W = INSERTED_W;
    const LOCKED_H = INSERTED_H;

    // Instructions
    this.instructionText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.08, "Place the CMOS Battery", {
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // CMOS Slot Visual
    const slotImage = this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, "cmosSlot")
      .setDisplaySize(SLOT_W, SLOT_H);

    // Smaller drop zone
    const dropZone = this.add.zone(slotImage.x, slotImage.y, SLOT_W * 0.5, SLOT_H * 0.5)
      .setRectangleDropZone(SLOT_W * 0.5, SLOT_H * 0.5);

    // CMOS Battery
    const cmos = this.add.image(this.scale.width * 0.2, this.scale.height * 0.8, "cmosbatt")
      .setInteractive()
      .setDisplaySize(BATTERY_W, BATTERY_H);
    this.input.setDraggable(cmos);

    // Lever
    const leverStartY = this.scale.height * 0.58;
    const leverEndY = leverStartY + 80;
    const lockLever = this.add.image(this.scale.width * 0.5, this.scale.height * 0.45, "lockLever")
      .setInteractive()
      .setScale(0.1)
      .setVisible(false)
      .setDepth(10); // always in front
    this.input.setDraggable(lockLever);

    // Drag Events
    this.input.on("drag", (_, gameObject, dragX, dragY) => {
      // Drag CMOS battery
      if (this.buildStep === 0 && gameObject === cmos) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }

      // Drag lever
      if (this.buildStep === 1 && gameObject === lockLever) {
        gameObject.y = Phaser.Math.Clamp(dragY, leverStartY, leverEndY);

        if (gameObject.y >= leverEndY) {
          this.buildStep = 2;

          // Smooth transition: change battery to locked state
          this.tweens.add({
            targets: this.insertedBattery,
            alpha: 0,
            duration: 150,
            onComplete: () => {
              this.insertedBattery.setTexture("cmos_locked").setDisplaySize(LOCKED_W, LOCKED_H).setAlpha(1);
            }
          });

          this.instructionText.setText("CMOS Battery Locked In!");

          // Hide lever
          lockLever.setVisible(false);
          lockLever.y = leverStartY;
          
          // Emit checkpoint completion
          console.log("CMOS checkpoint emitting:", { component: "cmos", progress: 100, isCompleted: true });
          if (this.onCheckpointComplete) {
            this.onCheckpointComplete("cmos", 100, true);
          } else {
            console.warn("onCheckpointComplete not available");
          }
        }
      }
    });

    this.input.on("dragend", (_, gameObject, dropped) => {
      if (this.buildStep === 0 && gameObject === cmos && !dropped) {
        gameObject.x = this.scale.width * 0.2;
        gameObject.y = this.scale.height * 0.8;
      }
    });

    // Drop Event
    this.input.on("drop", (_, gameObject, dz) => {
      if (this.buildStep !== 0) return;

      gameObject.destroy();
      slotImage.setVisible(false);

      this.insertedBattery = this.add.image(dz.x, dz.y, "cmos_insert")
        .setDisplaySize(INSERTED_W, INSERTED_H);

      this.buildStep = 1;
      lockLever.setVisible(true);

      this.instructionText.setText("Push down the battery to lock it in place");
    });

    // Back button
    this.add.text(50, 50, "← Back", { fontSize: "20px", color: "#ffffff" })
      .setInteractive()
      .on("pointerdown", () => this.scene.start("menu-scene"));
  }
}
