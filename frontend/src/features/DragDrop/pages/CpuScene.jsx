import Phaser from "phaser";
import { Tray } from "../components/Tray.jsx";
import cpuSocketClosed from "../assets/components/cpu/cpuSocket.png";
import cpuSocketGlow from "../assets/components/cpu/cpuSocketGlow.png";
import cpuSocketOpen from "../assets/components/cpu/cpuSocketOpen.png";
import cpuInstalled from "../assets/components/cpu/cpuInstalled.png";
import cpuLast from "../assets/components/cpu/cpuSocketwCPU.png";
import cpuImg from "../assets/components/cpu/cpu.png";
import ramImg from "../assets/components/ram/ram.png";
import cmosImg from "../assets/components/cmos/cmosbatt.png";
import backgroundImg from "../assets/background.png";

export default class CpuScene extends Phaser.Scene {
  constructor() {
    super("cpu");
  }

  preload() {
    this.load.image("background", backgroundImg);
    this.load.image("cpu", cpuImg);
    this.load.image("ram", ramImg);
    this.load.image("cmos", cmosImg);

    this.load.image("cpuSocketClosed", cpuSocketClosed);
    this.load.image("cpuSocketGlow", cpuSocketGlow);
    this.load.image("cpuSocketOpen", cpuSocketOpen);
    this.load.image("cpuInstalled", cpuInstalled);
    this.load.image("cpuLast", cpuLast);
  }

  create() {
    this.buildStep = 0;
    this.onCheckpointComplete = this.game.onCheckpointComplete;
    this.savedCheckpoints = this.game.savedCheckpoints || {};

    // Check if CPU is already completed
    const isCpuCompleted = this.savedCheckpoints?.cpu?.completed ?? false;

    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background")
      .setDisplaySize(this.scale.width, this.scale.height);

    this.instructionText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.08,
      isCpuCompleted ? "CPU Already Installed - Task Complete!" : "Open the CPU Socket",
      { fontSize: "32px", color: isCpuCompleted ? "#00ff00" : "#ffffff", fontStyle: "bold" }
    ).setOrigin(0.5);

    // Socket setup
    const slotW = this.scale.width * 0.38;
    const slotH = this.scale.height * 0.7;
    const socketX = this.scale.width * 0.5;
    const socketY = this.scale.height * 0.5;

    this.socket = this.add.image(socketX, socketY, isCpuCompleted ? "cpuLast" : "cpuSocketClosed")
      .setDisplaySize(slotW, slotH);

    // Only make interactive if not completed
    if (!isCpuCompleted) {
      this.socket.setInteractive({ pixelPerfect: true, alphaTolerance: 1 });
    }

    this.socketGlow = this.add.image(socketX, socketY, "cpuSocketGlow")
      .setDisplaySize(slotW, slotH)
      .setAlpha(0);

    // Only setup hover/click if not completed
    if (!isCpuCompleted) {
      // Hover glow
      this.socket.on("pointerover", () => {
        if (this.buildStep === 0 || this.buildStep === 2) this.socketGlow.setAlpha(1);
      });
      this.socket.on("pointerout", () => {
        if (this.buildStep === 0 || this.buildStep === 2) this.socketGlow.setAlpha(0);
      });

      // Socket click handler
      this.socket.on("pointerdown", () => {
        if (this.buildStep === 0) {
          // Open socket
          this.buildStep = 1;
          this.socket.setTexture("cpuSocketOpen");
          this.instructionText.setText("Select the CPU from the tray");

          // Hide glow immediately
          this.socketGlow.setAlpha(0);

          // Show tray (draggables)
          this.showTray();
        } else if (this.buildStep === 2) {
          // Close socket after CPU installed
          this.buildStep = 3;
          this.installedCpu.setTexture("cpuLast");
          this.instructionText.setText("CPU Installed and Socket Closed!");
          this.socketGlow.setAlpha(0);

          if (this.onCheckpointComplete) {
            this.onCheckpointComplete("cpu", 100, true);
          }

          // Auto-return to menu
          this.time.delayedCall(2000, () => this.scene.start("menu-scene"));
        }
      });
    } else {
      // If completed, show a message and auto-return after delay
      this.time.delayedCall(3000, () => this.scene.start("menu-scene"));
    }

    // Back button
    this.add.text(50, 50, "← Back", { fontSize: "20px", color: "#ffffff" })
      .setInteractive()
      .on("pointerdown", () => this.scene.start("menu-scene"));
  }

  showTray() {
    const components = [
      { key: "cpu", correct: true },
      { key: "ram", correct: false },
      { key: "cmos", correct: false },
    ];

    this.tray = new Tray(this, components, {
      position: 'right',
      width: this.scale.width * 0.2,
    });

    this.tray.show();
    this.draggables = this.tray.getDraggables();

    // Drag events
    this.input.on("drag", (pointer, obj, dragX, dragY) => {
      if (this.buildStep !== 1) return;
      obj.x = dragX;
      obj.y = dragY;
    });

    this.input.on("dragend", (pointer, obj) => {
      if (this.buildStep !== 1) return;

      // Drop detection using world coordinates
      const dropZoneX = this.socket.x;
      const dropZoneY = this.socket.y;
      const dropZoneW = this.socket.displayWidth * 0.5;
      const dropZoneH = this.socket.displayHeight * 0.5;

      if (
        obj.x > dropZoneX - dropZoneW / 2 &&
        obj.x < dropZoneX + dropZoneW / 2 &&
        obj.y > dropZoneY - dropZoneH / 2 &&
        obj.y < dropZoneY + dropZoneH / 2
      ) {
        if (obj.componentData.correct) {
          // Correct drop
          obj.destroy();
          this.buildStep = 2;

          this.installedCpu = this.add.image(
            this.socket.x,
            this.socket.y,
            "cpuInstalled"
          ).setDisplaySize(this.socket.displayWidth, this.socket.displayHeight);

          this.instructionText.setText("Close the CPU Socket!");
          this.socketGlow.setAlpha(1);
        } else {
          // Wrong drop → red flash
          this.socketGlow.setTint(0xff0000);
          this.time.delayedCall(500, () => this.socketGlow.clearTint());

          // Reset position to tray
          this.tray.resetComponentPosition(obj);
        }
      } else {
        // Not dropped in zone → reset to tray
        this.tray.resetComponentPosition(obj);
      }
    });
  }
}
