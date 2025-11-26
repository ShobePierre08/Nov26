import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

import CmosScene from "../pages/CmosScene.jsx";
import CpusScene from "../pages/CpuScene.jsx";
import RamScene from "../pages/RamScene.jsx";

import motherImg from "../assets/motherboard.png";
import backgroundImg from "../assets/background.png";

import cpuMaskImg from "../assets/cpu_mask.png";
import cmosMaskImg from "../assets/cmos_mask.png";
import ramMaskImg from "../assets/ram_mask.png";
import gpuMaskImg from "../assets/gpu_mask.png";
import sataMaskImg from "../assets/sata_mask.png";
import periMaskImg from "../assets/peri_mask.png";

export default function PhaserSimulator({ onCheckpointComplete, savedCheckpoints }) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);

  // Track size of container
  const [gameSize, setGameSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  /* ----------------------------------------------------------
     RESIZE HANDLING (Optimized)
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();

      const width = Math.max(rect.width, 400);
      const height = Math.max(rect.height, 300);

      setGameSize({ width, height });

      // Resize Phaser canvas if already created
      if (gameRef.current?.scale) {
        gameRef.current.scale.resize(width, height);
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    // Kickstart once
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  /* ----------------------------------------------------------
     UPDATE CALLBACKS INTO PHASER INSTANCE
  ---------------------------------------------------------- */
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.onCheckpointComplete = onCheckpointComplete;
      gameRef.current.savedCheckpoints = savedCheckpoints;
    }
  }, [onCheckpointComplete, savedCheckpoints]);

  /* ----------------------------------------------------------
     CREATE PHASER GAME
  ---------------------------------------------------------- */
  useEffect(() => {
    if (gameRef.current) return; // prevent duplicate game instances

    /* -----------------------------------------
       MENU SCENE
    ------------------------------------------*/
    class MenuScene extends Phaser.Scene {
      constructor() {
        super("menu-scene");
      }

      preload() {
        this.load.image("motherboard", motherImg);
        this.load.image("background", backgroundImg);

        this.load.image("cpuMask", cpuMaskImg);
        this.load.image("cmosMask", cmosMaskImg);
        this.load.image("ramMask", ramMaskImg);
        this.load.image("gpuMask", gpuMaskImg);
        this.load.image("sataMask", sataMaskImg);
        this.load.image("periMask", periMaskImg);
      }

      // Create one hotspot (full-board for each part)
      createHotspot(def, textureKey, tooltip) {
        const { boardX, boardY, boardWidth, boardHeight } = this;

        const x = boardX + (def.x - 0.5) * boardWidth;
        const y = boardY + (def.y - 0.5) * boardHeight;
        const w = def.w * boardWidth;
        const h = def.h * boardHeight;

        // CLICK MASK
        const mask = this.add.image(x, y, textureKey).setDisplaySize(w, h);
        mask.setDepth(5);
        mask.setAlpha(0.001); // invisible
        mask.setInteractive({ pixelPerfect: true, alphaTolerance: 10 });

        // HIGHLIGHT (same mask texture)
        const highlight = this.add.image(x, y, textureKey).setDisplaySize(w, h);
        highlight.setDepth(4);
        highlight.setVisible(false);
        highlight.setAlpha(0); // fade in

        // COMPLETION BADGE
        const isCompleted = this.game.savedCheckpoints?.[def.sceneId]?.completed ?? false;
        if (isCompleted) {
          const badge = this.add.text(x + w / 4, y - h / 4, "✓", {
            fontSize: "48px",
            color: "#00ff00",
            fontStyle: "bold",
            shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 5, fill: true }
          }).setOrigin(0.5).setDepth(6);
          
          const bgCircle = this.add.circle(x + w / 4, y - h / 4, 35, 0x00aa00, 0.8).setDepth(5.5);
        }

        // Hover
        mask.on("pointerover", (pointer) => {
          highlight.setVisible(true);

          this.tweens.add({
            targets: highlight,
            alpha: 1,
            duration: 150,
            ease: "Sine.easeInOut"
          });

          const isCompleted = this.game.savedCheckpoints?.[def.sceneId]?.completed ?? false;
          tooltip.setText(isCompleted ? `${def.label} - ✓ Completed` : def.label);
          tooltip.setPosition(pointer.worldX, pointer.worldY - 30);
          tooltip.setVisible(true);
        });

        mask.on("pointermove", (pointer) => {
          tooltip.setPosition(pointer.worldX, pointer.worldY - 30);
        });

        mask.on("pointerout", () => {
          tooltip.setVisible(false);
          highlight.setVisible(false);
          highlight.setAlpha(0);
        });

        // Click -> load scene (only if not already completed)
        mask.on("pointerdown", () => {
          const isCompleted = this.game.savedCheckpoints?.[def.sceneId]?.completed ?? false;
          if (isCompleted) {
            tooltip.setText(`${def.label} - Already Completed`);
            return;
          }
          this.scene.start(def.sceneId, {
            partId: def.sceneId,
            partName: def.name,
          });
        });
      }

      create() {
        const { width, height } = this.scale;

        // Background
        const bg = this.add.image(width / 2, height / 2, "background")
          .setDisplaySize(width, height);

        this.add.text(
          width / 2,
          height * 0.08,
          "PC Building Simulator",
          { fontSize: "32px", color: "#fff", fontStyle: "bold" }
        ).setOrigin(0.5);

        // Motherboard image
        this.boardWidth = width * 0.6;
        this.boardHeight = height * 0.8;
        this.boardX = width / 2;
        this.boardY = height * 0.5;

        const board = this.add.image(this.boardX, this.boardY, "motherboard");
        board.setDisplaySize(this.boardWidth, this.boardHeight);
        board.setDepth(1);

        // Tooltip
        const tooltip = this.add.text(0, 0, "", {
          fontSize: "16px",
          color: "#fff",
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: { x: 10, y: 6 }
        })
          .setDepth(60)
          .setOrigin(0.5)
          .setVisible(false);

        // Hotspot definitions (intentionally full size)
        const HOTSPOTS = [
          { name: "CPU", label: "CPU Socket", sceneId: "cpu", x: 0.5, y: 0.5, w: 1, h: 1 },
          { name: "CMOS", label: "CMOS Battery", sceneId: "cmos", x: 0.5, y: 0.5, w: 1, h: 1 },
          { name: "RAM", label: "RAM Slots", sceneId: "ram", x: 0.5, y: 0.5, w: 1, h: 1 },
          { name: "GPU", label: "GPU Slot", sceneId: "gpu", x: 0.5, y: 0.5, w: 1, h: 1 },
          { name: "SATA", label: "SATA Ports", sceneId: "sata", x: 0.5, y: 0.5, w: 1, h: 1 },
          { name: "PERI", label: "Peripheral Power", sceneId: "peri", x: 0.5, y: 0.5, w: 1, h: 1 },
        ];

        const TEXTURES = {
          cpu: "cpuMask",
          cmos: "cmosMask",
          ram: "ramMask",
          gpu: "gpuMask",
          sata: "sataMask",
          peri: "periMask",
        };

        HOTSPOTS.forEach(h => {
          const tKey = TEXTURES[h.sceneId];
          if (tKey) this.createHotspot(h, tKey, tooltip);
        });

        this.add.text(
          width / 2,
          height * 0.92,
          "Click on a component to begin assembly",
          { fontSize: "12px", color: "#aaa" }
        ).setOrigin(0.5);

        // Reset button in top-right corner
        const resetButton = this.add.text(
          width - 80,
          30,
          "Reset Game",
          { fontSize: "14px", color: "#fff", backgroundColor: "#cc0000", padding: { x: 10, y: 6 } }
        ).setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", () => {
            // Clear all checkpoints
            this.game.savedCheckpoints = {
              cpu: { completed: false, progress: 0, timestamp: null },
              cmos: { completed: false, progress: 0, timestamp: null },
              ram: { completed: false, progress: 0, timestamp: null },
            };
            // Reload the scene
            this.scene.restart();
          });
      }
    }

    /* -----------------------------------------
       CREATE GAME INSTANCE
    ------------------------------------------*/
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: gameSize.width,
      height: gameSize.height,
      parent: "game-container",
      backgroundColor: "#ffffffff",
      scene: [MenuScene, CmosScene, CpusScene, RamScene],
      physics: { default: "arcade" },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: true,
      }
    });

    game.onCheckpointComplete = onCheckpointComplete;
    game.savedCheckpoints = savedCheckpoints;

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-container"
      style={{
        width: "100%",
        height: "100%",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    />
  );
}
