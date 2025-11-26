import Phaser from "phaser";
import cpuSocketClosed from "../assets/components/cpu/cpuSocket.png";
import cpuSocketGlow from "../assets/components/cpu/cpuSocketGlow.png";
import cpuSocketOpen from "../assets/components/cpu/cpuSocketOpen.png";
import cpuInstalled from "../assets/components/cpu/cpuInstalled.png";
import cpuLast from "../assets/components/cpu/cpuSocketwCPU.png";
import cpuImg from "../assets/components/cpu/cpu.png";

export default class CpuScene extends Phaser.Scene {
  constructor() {
    super("cpu");
  }

  preload() {
    this.load.image("cpu", cpuImg);
    this.load.image("cpuSocketClosed", cpuSocketClosed);
    this.load.image("cpuSocketGlow", cpuSocketGlow);
    this.load.image("cpuSocketOpen", cpuSocketOpen);
    this.load.image("cpuInstalled", cpuInstalled);
    this.load.image("cpuLast", cpuLast);
  }

  create() {
    this.buildStep = 0;
    this.onCheckpointComplete = this.game.onCheckpointComplete;
    this.savedCheckpoints = this.game.savedCheckpoints;

    const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background");
    bg.setDisplaySize(this.scale.width, this.scale.height);

    this.instructionText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.08,
      "Open the CPU Socket",
      { fontSize: "32px", color: "#ffffff", fontStyle: "bold" }
    ).setOrigin(0.5);

    const slotW = this.scale.width * 0.38;
    const slotH = this.scale.height * 0.7;

    this.socket = this.add.image(
      this.scale.width * 0.5,
      this.scale.height * 0.5,
      "cpuSocketClosed"
    ).setDisplaySize(slotW, slotH);

    this.socketGlow = this.add.image(this.socket.x, this.socket.y, "cpuSocketGlow")
      .setDisplaySize(slotW, slotH)
      .setAlpha(0);

    this.socket.setInteractive({
      pixelPerfect: true,
      alphaTolerance: 1
    });

    // Hover effect
    this.socket.on("pointerover", () => {
      if (this.buildStep === 0 || this.buildStep === 2) this.socketGlow.setAlpha(1);
    });
    this.socket.on("pointerout", () => {
      if (this.buildStep === 0 || this.buildStep === 2) this.socketGlow.setAlpha(0);
    });

    // Click interaction
    this.socket.on("pointerdown", () => {
      if (this.buildStep === 0) {
        // Open the socket
        this.buildStep = 1;
        this.socket.setTexture("cpuSocketOpen");
        this.instructionText.setText("Insert the Component");
        this.socketGlow.setAlpha(0);
      } else if (this.buildStep === 2) {
        // Close the socket after CPU installed
        this.buildStep = 3;
        this.installedCpu.setTexture("cpuLast");
        this.instructionText.setText("CPU Installed and Socket Closed!");
        this.socketGlow.setAlpha(0);
        
        // Emit checkpoint completion
        console.log("CPU checkpoint emitting:", { component: "cpu", progress: 100, isCompleted: true });
        if (this.onCheckpointComplete) {
          this.onCheckpointComplete("cpu", 100, true);
        } else {
          console.warn("onCheckpointComplete not available");
        }
      }
    });

    // CPU draggable
    const cpuW = this.scale.width * 0.1;
    const cpuH = this.scale.height * 0.20;
    this.cpu = this.add.image(this.scale.width * 0.2, this.scale.height * 0.8, "cpu")
      .setDisplaySize(cpuW, cpuH)
      .setInteractive();

    this.input.setDraggable(this.cpu);

    this.input.on("drag", (pointer, obj, dragX, dragY) => {
      if (this.buildStep !== 1) return;
      obj.x = dragX;
      obj.y = dragY;
    });

    this.input.on("dragend", (pointer, obj, dropped) => {
      if (this.buildStep !== 1) return;
      if (!dropped) {
        obj.x = this.scale.width * 0.2;
        obj.y = this.scale.height * 0.8;
      }
    });

    // Drop zone
    this.dropZone = this.add.zone(this.socket.x, this.socket.y, slotW * 0.5, slotH * 0.5)
      .setRectangleDropZone(slotW * 0.5, slotH * 0.5);

    // Drop event
    this.input.on("drop", (_, obj, zone) => {
      if (this.buildStep !== 1) return;
      if (zone !== this.dropZone) return;

      obj.destroy(); // remove draggable CPU

      this.buildStep = 2; // CPU inserted, socket still open

      // Show installed CPU image
      this.installedCpu = this.add.image(
        this.socket.x,
        this.socket.y,
        "cpuInstalled"
      ).setDisplaySize(slotW, slotH);

      this.instructionText.setText("Close the CPU Socket!");
      this.socketGlow.setAlpha(1); // glow to indicate click action
    });

    // Back button
    this.add.text(50, 50, "← Back", { fontSize: "20px", color: "#ffffff" })
      .setInteractive()
      .on("pointerdown", () => this.scene.start("menu-scene"));
  }
}
