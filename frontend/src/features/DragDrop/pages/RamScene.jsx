import Phaser from "phaser";
import { Tray } from "../components/Tray.jsx";
import RamImg from "../assets/components/ram/ram.png";
import RamSlot from "../assets/components/ram/ramSlot.png";
import RamSlotMid from "../assets/components/ram/ramSlotMid.png";
import RamSlotInstalled from "../assets/components/ram/ramInstalled.png";
import RamSlotGlow from "../assets/components/ram/ramSlotGlow.png";

export default class RamScene extends Phaser.Scene {
  constructor() {
    super("ram");
  }

  preload() {
    this.load.image("ram", RamImg);
    this.load.image("ramSlot", RamSlot);
    this.load.image("ramSlotMid", RamSlotMid);
    this.load.image("ramSlotInstalled", RamSlotInstalled);
    this.load.image("ramSlotGlow", RamSlotGlow);
  }

  create() {
    this.step = 0;
    this.onCheckpointComplete = this.game.onCheckpointComplete;
    this.savedCheckpoints = this.game.savedCheckpoints || {};

    // Check if RAM is already completed
    const isRamCompleted = this.savedCheckpoints?.ram?.completed ?? false;

    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background");
    bg.setDisplaySize(this.scale.width, this.scale.height);

    this.instruction = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.08,
      isRamCompleted ? "RAM Already Installed - Task Complete!" : "Open the RAM slot",
      { fontSize: "32px", color: isRamCompleted ? "#00ff00" : "#fff", fontStyle: "bold" }
    ).setOrigin(0.5);

    const slotW = this.scale.width * 0.5;
    const slotH = this.scale.height * 0.6;

    // RAM slot
    this.slot = this.add.image(
      this.scale.width * 0.5,
      this.scale.height * 0.45,
      isRamCompleted ? "ramSlotInstalled" : "ramSlot"
    ).setDisplaySize(slotW, slotH);

    // Glow effect
    this.slotGlow = this.add.image(this.slot.x, this.slot.y, "ramSlotGlow")
      .setDisplaySize(slotW, slotH)
      .setAlpha(0);

    // Hotspot for clicking
    this.slotHotspot = this.add.zone(this.slot.x, this.slot.y, slotW, slotH)
      .setRectangleDropZone(slotW, slotH)
      .setInteractive({ cursor: "pointer" });

    // Only setup interaction if not completed
    if (!isRamCompleted) {
      // Hover glow for step 0
      this.slotHotspot.on("pointerover", () => {
        if (this.step === 0 || this.step === 2) this.slotGlow.setAlpha(1);
      });
      this.slotHotspot.on("pointerout", () => {
        if (this.step === 0 || this.step === 2) this.slotGlow.setAlpha(0);
      });

      // Click logic - consolidated
      this.slotHotspot.on("pointerdown", () => {
        if (this.step === 0) {
          // Step 0 → click to start dragging
          this.step = 1;
          this.instruction.setText("Drag the RAM into the slot");
          this.slotGlow.setAlpha(0);
          this.showTray();
        } else if (this.step === 2) {
          // Step 2 → lock click → final
          this.slot.setTexture("ramSlotInstalled");
          this.slotGlow.setAlpha(0);
          this.instruction.setText("RAM Installed!");
          this.step = 3; // finished
          
          // Emit checkpoint completion with logging
          console.log("RAM checkpoint emitting:", { component: "ram", progress: 100, isCompleted: true });
          if (this.onCheckpointComplete) {
            this.onCheckpointComplete("ram", 100, true);
          } else {
            console.warn("onCheckpointComplete not available");
          }

          // Auto-return to menu after completion
          this.time.delayedCall(2000, () => this.scene.start("menu-scene"));
        }
      });

      // Drop zone
      this.dropZone = this.add.zone(
        this.slot.x,
        this.slot.y,
        slotW * 0.8,
        slotH * 0.6
      ).setRectangleDropZone(slotW * 0.8, slotH * 0.6);

      this.input.on("drop", (pointer, obj, zone) => {
        if (this.step !== 1) return;
        if (zone !== this.dropZone) return;

        // Destroy the dragged RAM sprite
        obj.destroy();

        // Change slot to show RAM partially inserted
        this.slot.setTexture("ramSlotMid");

        this.step = 2;
        this.instruction.setText("Click the slot to lock the RAM in place");
      });
    } else {
      // If completed, show message and auto-return after delay
      this.time.delayedCall(3000, () => this.scene.start("menu-scene"));
    }

    // Back button
    this.add.text(50, 50, "← Back", { fontSize: "20px", color: "#fff" })
      .setInteractive()
      .on("pointerdown", () => this.scene.start("menu-scene"));
  }

  showTray() {
    const components = [
      { key: "ram", correct: true },
    ];

    this.tray = new Tray(this, components, {
      position: 'right',
      width: this.scale.width * 0.2,
    });

    this.tray.show();
    this.draggables = this.tray.getDraggables();

    // Drag events
    this.input.on("drag", (pointer, obj, dragX, dragY) => {
      if (this.step !== 1) return;
      obj.x = dragX;
      obj.y = dragY;
    });

    this.input.on("dragend", (pointer, obj) => {
      if (this.step !== 1) return;
      // Reset to tray if not dropped in zone
      this.tray.resetComponentPosition(obj);
    });
  }
}
