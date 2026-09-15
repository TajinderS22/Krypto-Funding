"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

const Rings = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.color.setHex(
        resolvedTheme === "light" ? 0x808080 : 0x040404,
      );
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;

    const getSize = () => ({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    let { width, height } = getSize();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    scene.add(camera);

    const geo = new THREE.TorusGeometry(1, 0.34, 10, 100);

    const material = new THREE.MeshStandardMaterial({
      color: resolvedTheme === "light" ? 0x808080 : 0x040404,
      roughness: 0.2,
      metalness: 0.1,
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geo, material);
    const mesh1 = new THREE.Mesh(geo, material);

    mesh1.position.set(2, 1, 1);
    mesh.position.set(-2, -1, 1);

    scene.add(mesh1);
    scene.add(mesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 10);
    scene.add(ambientLight);

    const light1 = new THREE.SpotLight(0xe7c965, 100);
    light1.position.set(4, 2, 1);
    scene.add(light1);

    const light2 = new THREE.SpotLight(0x8254ee, 100);
    light2.position.set(-4, -2, -1);
    scene.add(light2);

    mesh.rotation.x = -1;
    mesh.rotation.y = -1;

    mesh1.rotation.x = -3;
    mesh1.rotation.y = -3;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const updateCameraZoom = () => {
      const aspect = width / height;
      const targetAspect = 1.2;

      if (aspect < targetAspect) {
        camera.zoom = aspect / targetAspect;
      } else {
        camera.zoom = 1;
      }
      camera.updateProjectionMatrix();
    };

    updateCameraZoom();

    const resizeObserver = new ResizeObserver(() => {
      ({ width, height } = getSize());
      if (width === 0 || height === 0) return;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      updateCameraZoom();
    });
    resizeObserver.observe(container);

    const timer = new THREE.Timer();
    const animate = () => {
      requestAnimationFrame(animate);

      timer.update();

      const delta = timer.getDelta();
      const elapsed = timer.getElapsed();

      mesh.rotation.x += delta * 0.6;
      mesh.rotation.y += delta * 1.2;

      mesh1.rotation.x += delta * 0.6;
      mesh1.rotation.y += delta * 1.2;

      mesh.position.y = -1 + Math.sin(elapsed) * 0.3;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      geo.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <canvas
        id="draw"
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default Rings;
