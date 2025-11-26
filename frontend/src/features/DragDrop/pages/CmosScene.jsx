import Phaser from "phaser";
import { Tray } from "../components/Tray.jsx";
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
    this.savedCheckpoints = this.game.savedCheckpoints || {};

    // Check if CMOS is already completed
    const isCmosCompleted = this.savedCheckpoints?.cmos?.completed ?? false;

    // Background
    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background");
    bg.setDisplaySize(this.scale.width, this.scale.height);

    // Sizes
    const SLOT_W = this.scale.width * 0.5;
    const SLOT_H = this.scale.height * 0.5;
    const INSERTED_W = SLOT_W * 0.85;
    const INSERTED_H = SLOT_H * 0.85;
    const LOCKED_W = INSERTED_W;
    const LOCKED_H = INSERTED_H;

    // Instructions
    this.instructionText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.08, isCmosCompleted ? "CMOS Battery Installed - Task Complete!" : "Place the CMOS Battery", {
        fontSize: "32px",
        color: isCmosCompleted ? "#00ff00" : "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // CMOS Slot Visual
    const slotImage = this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, isCmosCompleted ? "cmos_locked" : "cmosSlot")
      .setDisplaySize(SLOT_W, SLOT_H);

    // Smaller drop zone
    const dropZone = this.add.zone(slotImage.x, slotImage.y, SLOT_W * 0.5, SLOT_H * 0.5)
      .setRectangleDropZone(SLOT_W * 0.5, SLOT_H * 0.5);

    // Lever
    const leverStartY = this.scale.height * 0.58;
    const leverEndY = leverStartY + 80;
    const lockLever = this.add.image(this.scale.width * 0.5, this.scale.height * 0.45, "lockLever")
      .setScale(0.1)
      .setVisible(false)
      .setDepth(10); // always in front

    // Only make interactive and setup events if not completed
    if (!isCmosCompleted) {
      lockLever.setInteractive();
      this.input.setDraggable(lockLever);

      // Create and show tray
      this.showTray(dropZone, slotImage, lockLever, leverStartY, leverEndY, INSERTED_W, INSERTED_H, LOCKED_W, LOCKED_H);

      // Drag Events
      this.input.on("drag", (_, gameObject, dragX, dragY) => {
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

            // Auto-return to menu after completion
            this.time.delayedCall(2000, () => this.scene.start("menu-scene"));
          }
        }
      });

      this.input.on("dragend", (_, gameObject, dropped) => {
        // Reset dragged components from tray
        if (this.buildStep === 0 && !dropped && this.draggables.includes(gameObject)) {
          this.tray.resetComponentPosition(gameObject);
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
    } else {
      // If completed, show message and auto-return after delay
      this.time.delayedCall(3000, () => this.scene.start("menu-scene"));
    }

    // Back button
    this.add.text(50, 50, "← Back", { fontSize: "20px", color: "#ffffff" })
      .setInteractive()
      .on("pointerdown", () => this.scene.start("menu-scene"));
  }

  showTray(dropZone, slotImage, lockLever, leverStartY, leverEndY, INSERTED_W, INSERTED_H, LOCKED_W, LOCKED_H) {
    const components = [
      { key: "cmosbatt", correct: true },
    ];

    this.tray = new Tray(this, components, {
      position: 'right',
      width: this.scale.width * 0.2,
    });

    this.tray.show();
    this.draggables = this.tray.getDraggables();

    // Drag events for tray components
    this.input.on("drag", (pointer, obj, dragX, dragY) => {
      if (this.buildStep === 0 && this.draggables.includes(obj)) {
        obj.x = dragX;
        obj.y = dragY;
      }
    });
  }
}
