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
// Note: slot overlay assets removed — using board-based zones instead

export default function PhaserSimulator({ onCheckpointComplete, savedCheckpoints }) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const [gameSize, setGameSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(rect.width, 400);
        const newHeight = Math.max(rect.height, 300);
        
        setGameSize({
          width: newWidth,
          height: newHeight,
        });

        // Resize the game dynamically
        if (gameRef.current && gameRef.current.scene) {
          gameRef.current.scale.resize(newWidth, newHeight);
        }
      }
    };

    // Handle resize events
    window.addEventListener("resize", handleResize);
    
    // Use ResizeObserver for container-specific resize detection
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      // Initial size
      setTimeout(handleResize, 100);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Update game callbacks when they change (but don't recreate game)
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.onCheckpointComplete = onCheckpointComplete;
      gameRef.current.savedCheckpoints = savedCheckpoints;
    }
  }, [onCheckpointComplete, savedCheckpoints]);

  useEffect(() => {
    // Prevent multiple game instances
    let existing = Phaser.GAMES?.length ? Phaser.GAMES[0] : null;
    if (existing) {
      existing.destroy(true);
    }

    // Menu Scene - Part Selection
    class MenuScene extends Phaser.Scene {
      constructor() {
        super("menu-scene");
      }

      // Helper to create a rectangle hotspot
      createHotspot(def, textures, tooltip) {
        const { boardX, boardY, boardWidth, boardHeight } = this;

        // Calculate scaled position & size
        const w = def.w * boardWidth;
        const h = def.h * boardHeight;
        const x = boardX + (def.x - 0.5) * boardWidth;
        const y = boardY + (def.y - 0.5) * boardHeight;

        // MASK (interaction)
        const mask = this.add.image(x, y, textures.mask);
        mask.setDisplaySize(w, h);
        mask.setDepth(5);
        mask.setInteractive({ pixelPerfect: true, alphaTolerance: 10 });
        mask.setAlpha(0.001); // Almost invisible but still interactive

        // HIGHLIGHT (visual effect)
        const highlight = this.add.image(x, y, textures.mask);
        highlight.setDisplaySize(w, h);
        highlight.setDepth(4);
        highlight.setVisible(false);

        // Hover
        mask.on("pointerover", (pointer) => {
          highlight.setVisible(true);
          this.tweens.add({
            targets: highlight,
            alpha: 1,
            duration: 150,
          });

          tooltip.setText(def.label);
          tooltip.setPosition(pointer.worldX, pointer.worldY - 30);
          tooltip.setVisible(true);
        });

        mask.on("pointermove", (pointer) => {
          tooltip.setPosition(pointer.worldX, pointer.worldY - 30);
        });

        mask.on("pointerout", () => {
          highlight.setVisible(false);
          tooltip.setVisible(false);
        });

        // Click → Open Scene
        mask.on("pointerdown", () => {
        // Instead of always "build-scene", start the scene using def.sceneId
          this.scene.start(def.sceneId, {
            partId: def.sceneId,
            partName: def.name,
          });
        });
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

      create() {
        const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, "background");
        bg.setDisplaySize(this.scale.width, this.scale.height);

        this.add.text(this.scale.width / 2, this.scale.height * 0.08, "PC Building Simulator", {
          fontSize: "32px",
          color: "#ffffff",
          align: "center",
          fontStyle: "bold",
        }).setOrigin(0.5);

        // Motherboard
        const boardWidth = this.scale.width * 0.6;
        const boardHeight = this.scale.height * 0.8;
        const boardX = this.scale.width / 2;
        const boardY = this.scale.height * 0.5;

        const board = this.add.image(boardX, boardY, "motherboard");
        board.setDisplaySize(boardWidth, boardHeight);
        board.setDepth(1);

        // 🔥 REQUIRED for createHotspot() to work
        this.boardX = boardX;
        this.boardY = boardY;
        this.boardWidth = boardWidth;
        this.boardHeight = boardHeight;

        // 🔹 Define rectangle hotspots FIRST
        const rectHotspots = [
          { name: 'CPU Socket', label: 'CPU', sceneId: 'cpu', x: 0.5, y: 0.50, w: 1, h: 1 },
          { name: 'CMOS Socket', label: 'CMOS', sceneId: 'cmos', x: 0.5, y: 0.50, w: 1, h: 1 },
          { name: 'RAM Socket', label: 'RAM', sceneId: 'ram', x: 0.5, y: 0.50, w: 1, h: 1 },
          { name: 'GPU Socket', label: 'GPU', sceneId: 'gpu', x: 0.5, y: 0.50, w: 1, h: 1 },
          { name: 'SATA Socket', label: 'SATA', sceneId: 'sata', x: 0.5, y: 0.50, w: 1, h: 1 },
          { name: 'PERI Socket', label: 'PERI', sceneId: 'peri', x: 0.5, y: 0.50, w: 1, h: 1 },
        ];

        const tooltip = this.add.text(0, 0, '', {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: { x: 10, y: 6 },
        }).setDepth(60).setOrigin(0.5).setVisible(false);

        // 🔹 All hotspot masks here
        const maskMap = {
          cpu: "cpuMask",
          cmos: "cmosMask",
          ram: "ramMask",
          gpu: "gpuMask",
          sata: "sataMask",
          peri: "periMask",
        };

        // 🔹 Automatically build hotspots for all registered masks
        rectHotspots.forEach(h => {
          const mask = maskMap[h.sceneId];
          if (!mask) return;

          this.createHotspot(h, { mask }, tooltip);
        });

        // Footer text
        this.add.text(
          this.scale.width / 2,
          this.scale.height * 0.92,
          "Click on a component to begin assembly",
          { fontSize: "12px", color: "#aaaaaa" }
        ).setOrigin(0.5);
      }
    }

    // Create the game
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
        fullscreenTarget: "parent",
        expandParent: true,
        width: gameSize.width,
        height: gameSize.height,
      },
    });

    // Attach checkpoint callback and saved checkpoints to game instance
    game.onCheckpointComplete = onCheckpointComplete;
    game.savedCheckpoints = savedCheckpoints;

    gameRef.current = game;

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-container"
      style={{
        width: "100%",
        height: "100%",
        margin: "0",
        padding: "0",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    ></div>
  );
}
