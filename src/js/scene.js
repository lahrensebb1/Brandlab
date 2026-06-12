/* ============================================================
   Brand Lab mascot — procedural 3D lab flask, toon shaded with
   ink outlines so it reads as a drawn character, not glossy 3D.
   ============================================================ */
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const INK = 0x121212;
const ORANGE = 0xf59a13;
const PURPLE = 0xb999f5;

function toonGradient() {
  /* 3-step gradient map = flat, illustrated shading */
  const data = new Uint8Array([110, 110, 110, 255, 200, 200, 200, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function outlined(geometry, material, outlineScale = 1.045) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(geometry, material);
  const outline = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })
  );
  outline.scale.setScalar(outlineScale);
  group.add(outline, mesh);
  return group;
}

export function initMascot(canvas, { reduceMotion } = {}) {
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.25, 7.4);

  /* toon lighting */
  scene.add(new THREE.AmbientLight(0xfff4e7, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.5, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe8ddfb, 0.5);
  fill.position.set(-4, -1, 3);
  scene.add(fill);

  const gradient = toonGradient();
  const orangeMat = new THREE.MeshToonMaterial({ color: ORANGE, gradientMap: gradient });
  const purpleMat = new THREE.MeshToonMaterial({ color: PURPLE, gradientMap: gradient });

  const mascot = new THREE.Group();
  scene.add(mascot);

  /* ---------- flask body (lathe of a vase profile) ---------- */
  const profile = [
    [0.001, -1.18], [0.42, -1.16], [0.78, -1.0], [1.0, -0.62],
    [1.02, -0.18], [0.88, 0.22], [0.6, 0.55], [0.45, 0.82],
    [0.42, 1.04], [0.5, 1.18], [0.46, 1.28],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  /* smooth the silhouette */
  const curve = new THREE.SplineCurve(profile);
  const smooth = curve.getPoints(48).map((p) => new THREE.Vector2(Math.max(p.x, 0.001), p.y));
  const bodyGeo = new THREE.LatheGeometry(smooth, 72);
  const body = outlined(bodyGeo, orangeMat, 1.04);
  mascot.add(body);

  /* dark opening at the top */
  const mouthHole = new THREE.Mesh(
    new THREE.CircleGeometry(0.4, 32),
    new THREE.MeshBasicMaterial({ color: INK })
  );
  mouthHole.position.y = 1.27;
  mouthHole.rotation.x = -Math.PI / 2;
  mascot.add(mouthHole);

  /* ---------- face ---------- */
  const face = new THREE.Group();
  face.position.set(0, -0.1, 0);
  mascot.add(face);

  const eyeWhiteGeo = new THREE.SphereGeometry(0.17, 24, 24);
  const eyeWhiteMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradient });
  const pupilGeo = new THREE.SphereGeometry(0.07, 16, 16);
  const pupilMat = new THREE.MeshBasicMaterial({ color: INK });

  const pupils = [];
  [-0.36, 0.36].forEach((x) => {
    const eye = outlined(eyeWhiteGeo, eyeWhiteMat, 1.14);
    eye.scale.set(1, 1.22, 0.55);
    eye.position.set(x, 0.05, 0.98);
    face.add(eye);

    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(x, 0.04, 1.12);
    pupil.scale.set(1, 1.25, 0.6);
    face.add(pupil);
    pupils.push(pupil);
  });

  /* brows: thin ink capsules for character */
  const browGeo = new THREE.CapsuleGeometry(0.028, 0.18, 4, 8);
  [-0.37, 0.37].forEach((x, i) => {
    const brow = new THREE.Mesh(browGeo, pupilMat);
    brow.position.set(x, 0.36, 0.94);
    brow.rotation.z = Math.PI / 2 + (i === 0 ? 0.1 : -0.1);
    face.add(brow);
  });

  /* smile: torus arc */
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.035, 10, 28, Math.PI * 0.85),
    pupilMat
  );
  smile.position.set(0, -0.32, 1.08);
  smile.rotation.z = Math.PI + (Math.PI * (1 - 0.85)) / 2; /* open side up */
  face.add(smile);

  /* cheeks */
  const cheekGeo = new THREE.SphereGeometry(0.07, 12, 12);
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xe48700, transparent: true, opacity: 0.55 });
  [-0.62, 0.62].forEach((x) => {
    const cheek = new THREE.Mesh(cheekGeo, cheekMat);
    cheek.position.set(x, -0.22, 0.98);
    cheek.scale.set(1.4, 0.9, 0.4);
    face.add(cheek);
  });

  /* ---------- idea droplets bubbling out ---------- */
  const drops = [];
  const dropSpecs = [
    { r: 0.16, x: 0.55, y: 1.75, z: 0.1, mat: orangeMat, speed: 1.0 },
    { r: 0.1, x: -0.45, y: 2.05, z: -0.1, mat: orangeMat, speed: 1.4 },
    { r: 0.08, x: 0.1, y: 2.35, z: 0.05, mat: purpleMat, speed: 1.8 },
  ];
  dropSpecs.forEach((s) => {
    const drop = outlined(new THREE.SphereGeometry(s.r, 20, 20), s.mat, 1.12);
    drop.position.set(s.x, s.y, s.z);
    mascot.add(drop);
    drops.push({ mesh: drop, ...s });
  });

  /* ---------- soft contact shadow ---------- */
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.05, 40),
    new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.08 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.62;
  scene.add(shadow);

  /* ---------- sizing ---------- */
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    /* keep the character fully in frame on narrow stages */
    camera.position.z = camera.aspect < 0.9 ? 8.8 : 7.4;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- pointer tracking ---------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!reduceMotion) {
    window.addEventListener("pointermove", (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  /* ---------- entrance ---------- */
  mascot.scale.setScalar(0.001);
  shadow.scale.setScalar(0.001);
  let entered = reduceMotion;
  function enter() {
    if (reduceMotion) {
      mascot.scale.setScalar(1);
      shadow.scale.setScalar(1);
      return;
    }
    gsap.to(mascot.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: "elastic.out(1, 0.55)" });
    gsap.to(shadow.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: "elastic.out(1, 0.55)" });
    entered = true;
  }

  /* scroll: tip the flask slightly as the hero leaves */
  const scrollState = { rotZ: 0, y: 0 };
  if (!reduceMotion) {
    gsap.to(scrollState, {
      rotZ: -0.35,
      y: 0.9,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom 20%", scrub: 0.6 },
    });
  }

  /* ---------- render loop (paused offscreen) ---------- */
  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 })
    .observe(canvas);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = clock.getElapsedTime();

    /* idle bob + sway */
    const bob = entered ? Math.sin(t * 1.5) * 0.09 : 0;
    mascot.position.y = bob + scrollState.y;
    mascot.rotation.z = Math.sin(t * 0.9) * 0.045 + scrollState.rotZ;

    /* pointer parallax */
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    mascot.rotation.y = pointer.x * 0.34;
    mascot.rotation.x = pointer.y * 0.12;

    /* pupils follow the cursor */
    pupils.forEach((p) => {
      p.position.x = (p.position.x < 0 ? -0.36 : 0.36) + pointer.x * 0.07;
      p.position.y = 0.04 - pointer.y * 0.06;
    });

    /* droplets float */
    drops.forEach((d, i) => {
      d.mesh.position.y = d.y + Math.sin(t * d.speed + i * 2) * 0.12;
      d.mesh.position.x = d.x + Math.cos(t * d.speed * 0.7 + i) * 0.05;
      const s = 1 + Math.sin(t * d.speed * 1.3 + i) * 0.08;
      d.mesh.scale.setScalar(s * mascot.scale.x);
    });

    /* shadow breathes opposite the bob */
    const sh = 1 - bob * 0.35;
    shadow.scale.set(sh * mascot.scale.x, sh * mascot.scale.x, 1);

    renderer.render(scene, camera);
  });

  return { enter };
}
