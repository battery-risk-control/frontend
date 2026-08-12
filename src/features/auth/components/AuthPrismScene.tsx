import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import styles from './AuthPrismScene.module.css'

function createCrystalGeometry() {
  const sides = 6
  const vertices: number[] = [0.035, 1.54, -0.025]
  const shoulderRadii = [1.46, 1.27, 1.39, 1.3, 1.43, 1.25]
  const shoulderHeights = [-0.31, -0.27, -0.34, -0.29, -0.36, -0.3]
  for (let index = 0; index < sides; index += 1) {
    const angle = (index / sides) * Math.PI * 2 + Math.PI / 6
    const radius = shoulderRadii[index]
    vertices.push(Math.cos(angle) * radius, shoulderHeights[index], Math.sin(angle) * radius * 0.72)
  }
  const lowerRadii = [0.82, 1.04, 0.88, 0.97, 0.77, 1.07]
  const lowerHeights = [-1.14, -1.25, -1.18, -1.29, -1.13, -1.22]
  for (let index = 0; index < sides; index += 1) {
    const angle = (index / sides) * Math.PI * 2 + Math.PI / 6
    const radius = lowerRadii[index]
    vertices.push(Math.cos(angle) * radius, lowerHeights[index], Math.sin(angle) * radius * 0.72)
  }
  const bottomIndex = vertices.length / 3
  vertices.push(0.075, -1.5, -0.035)
  const indices: number[] = []
  for (let index = 0; index < sides; index += 1) {
    const next = (index + 1) % sides
    indices.push(0, 1 + index, 1 + next)
    indices.push(1 + index, 7 + index, 7 + next)
    indices.push(1 + index, 7 + next, 1 + next)
    indices.push(bottomIndex, 7 + next, 7 + index)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  const facetedGeometry = geometry.toNonIndexed()
  const position = facetedGeometry.getAttribute('position')
  const facetPalette = [0x6e9bc2, 0x315f99, 0x214c83, 0x8bb8d4, 0x2e6299, 0x4e83b0]
  const colors: number[] = []
  for (let vertex = 0; vertex < position.count; vertex += 3) {
    const facet = new THREE.Color(facetPalette[(vertex / 3) % facetPalette.length])
    for (let corner = 0; corner < 3; corner += 1) colors.push(facet.r, facet.g, facet.b)
  }
  facetedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  facetedGeometry.computeVertexNormals()
  geometry.dispose()
  return facetedGeometry
}

function drawSignalIcon(context: CanvasRenderingContext2D, label: string, color: string) {
  context.save()
  context.strokeStyle = color
  context.lineWidth = 4
  context.lineCap = 'round'
  context.lineJoin = 'round'
  const line = (points: Array<[number, number]>) => {
    context.beginPath()
    points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y))
    context.stroke()
  }
  if (label === 'ERP') {
    ;[31, 42, 53].forEach((y) => { context.beginPath(); context.ellipse(128, y, 21, 6, 0, 0, Math.PI * 2); context.stroke() })
    line([[107, 31], [107, 53], [149, 53], [149, 31]])
  } else if (label === 'RISK') {
    line([[103, 43], [113, 43], [119, 28], [128, 55], [137, 35], [143, 43], [153, 43]])
  } else if (label === 'IMPACT') {
    ;[23, 14, 5].forEach((radius) => { context.beginPath(); context.arc(128, 39, radius, 0, Math.PI * 2); context.stroke() })
    line([[128, 16], [128, 62], [105, 39], [151, 39]])
  } else if (label === 'RAG') {
    context.strokeRect(106, 18, 34, 41)
    line([[113, 29], [133, 29], [113, 39], [128, 39]])
    context.beginPath(); context.arc(143, 48, 10, 0, Math.PI * 2); context.stroke()
    line([[150, 55], [158, 63]])
  } else {
    context.strokeRect(108, 18, 40, 43)
    line(label === 'NEWS' ? [[115, 29], [141, 29], [115, 39], [141, 39], [115, 49], [135, 49]] : [[116, 28], [140, 28], [116, 39], [140, 39], [116, 50], [134, 50]])
  }
  context.restore()
}

function createHexSignal(label: string, accent: number, position: THREE.Vector3, scale: number, isOutput = false) {
  const group = new THREE.Group()
  group.position.copy(position)
  group.scale.setScalar(scale)
  const frameScale = 1

  const shape = new THREE.Shape()
  for (let index = 0; index < 6; index += 1) {
    const angle = Math.PI / 6 + index * Math.PI / 3
    const x = Math.cos(angle) * 0.42
    const y = Math.sin(angle) * 0.42
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const faceGeometry = new THREE.ShapeGeometry(shape)
  const faceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x10294a, transparent: true, opacity: isOutput ? 0.34 : 0.27, roughness: 0.18,
    metalness: 0.08, transmission: 0.3, depthWrite: false, side: THREE.DoubleSide,
  })
  const face = new THREE.Mesh(faceGeometry, faceMaterial)
  face.scale.setScalar(frameScale)
  group.add(face)

  const borderPoints = Array.from({ length: 7 }, (_, index) => {
    const angle = Math.PI / 6 + (index % 6) * Math.PI / 3
    return new THREE.Vector3(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0.012)
  })
  const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints)
  const borderMaterial = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.45 })
  const border = new THREE.Line(borderGeometry, borderMaterial)
  border.scale.setScalar(frameScale)
  group.add(border)

  const labelCanvas = document.createElement('canvas')
  labelCanvas.width = 256
  labelCanvas.height = 160
  const context = labelCanvas.getContext('2d')
  if (context) {
    context.clearRect(0, 0, 256, 160)
    const iconColor = isOutput ? `#${accent.toString(16).padStart(6, '0')}` : '#bcd8e8'
    drawSignalIcon(context, label, iconColor)
    context.fillStyle = isOutput ? '#f0f7fb' : '#dcecf5'
    context.font = '600 42px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(label, 128, 112)
  }
  const texture = new THREE.CanvasTexture(labelCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const labelMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: isOutput ? 0.92 : 0.84, depthWrite: false })
  const sprite = new THREE.Sprite(labelMaterial)
  sprite.scale.set(0.76, 0.48, 1)
  sprite.position.z = 0.025
  group.add(sprite)

  return { group, faceGeometry, faceMaterial, borderGeometry, borderMaterial, texture, labelMaterial, frameScale }
}

function createSignalPath(start: THREE.Vector3, end: THREE.Vector3, color: number, opacity: number) {
  const bend = new THREE.Vector3((start.x + end.x) * 0.5, start.y * 0.72 + end.y * 0.28, -0.5)
  const curve = new THREE.QuadraticBezierCurve3(start, bend, end)
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48))
  const material = new THREE.LineBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const line = new THREE.Line(geometry, material)
  const pulseGeometry = new THREE.SphereGeometry(0.025, 10, 8)
  const pulseMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial)
  return { curve, geometry, material, line, pulseGeometry, pulseMaterial, pulse }
}

function updateSignalPath(
  path: ReturnType<typeof createSignalPath>,
  start: THREE.Vector3,
  end: THREE.Vector3,
) {
  path.curve.v0.copy(start)
  path.curve.v1.set((start.x + end.x) * 0.5, start.y * 0.72 + end.y * 0.28, -0.5)
  path.curve.v2.copy(end)
  const points = path.curve.getPoints(48)
  const position = path.geometry.getAttribute('position') as THREE.BufferAttribute
  points.forEach((point, index) => position.setXYZ(index, point.x, point.y, point.z))
  position.needsUpdate = true
}

export function AuthPrismScene() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    } catch {
      mount.classList.add(styles.webGlFailed)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.16
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const roomEnvironment = new RoomEnvironment()
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    const environmentTarget = pmremGenerator.fromScene(roomEnvironment, 0.04)
    scene.environment = environmentTarget.texture
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100)
    camera.position.set(0, 0.05, 6.9)

    const hexSignals = [
      createHexSignal('NEWS', 0x789bb6, new THREE.Vector3(-1.46, 0.7, -0.5), 0.73),
      createHexSignal('ERP', 0x789bb6, new THREE.Vector3(-1.68, -0.01, 0.35), 0.7),
      createHexSignal('RAG', 0x789bb6, new THREE.Vector3(-1.42, -0.72, -0.7), 0.72),
      createHexSignal('RISK', 0xc09a66, new THREE.Vector3(1.4, 0.68, 0.25), 0.73, true),
      createHexSignal('IMPACT', 0x4fbbcd, new THREE.Vector3(1.72, -0.01, -0.45), 0.7, true),
      createHexSignal('BRIEFING', 0x776fc0, new THREE.Vector3(1.42, -0.72, 0.42), 0.72, true),
    ]
    const hexBaseX = hexSignals.map(({ group }) => group.position.x)
    const hexBaseY = hexSignals.map(({ group }) => group.position.y)
    const hexBaseScale = hexSignals.map(({ group }) => group.scale.x)
    hexSignals.forEach(({ group }) => scene.add(group))

    const inputPaths = hexSignals.slice(0, 3).map(({ group, frameScale }, index) => {
      const radius = 0.42 * group.scale.x * frameScale
      const start = group.position.clone().add(new THREE.Vector3(radius * 0.88, 0, -0.08))
      const path = createSignalPath(start, new THREE.Vector3(-0.28, 0.065, -0.16), 0xc8e8f3, 0.2)
      path.line.renderOrder = -2
      scene.add(path.line, path.pulse)
      path.pulse.position.copy(path.curve.getPoint(index * 0.12))
      return path
    })
    const outputColors = [0xc09a66, 0x4fbbcd, 0x776fc0]
    const outputPaths = hexSignals.slice(3).map(({ group }, index) => {
      const radius = 0.42 * group.scale.x * hexSignals[index + 3].frameScale
      const end = group.position.clone().add(new THREE.Vector3(-radius * 0.88, 0, -0.08))
      const path = createSignalPath(new THREE.Vector3(0.28, 0.065, -0.16), end, outputColors[index], 0.085)
      path.line.renderOrder = -1
      scene.add(path.line, path.pulse)
      return path
    })
    const internalInputPath = createSignalPath(
      new THREE.Vector3(-0.28, 0.065, -0.16), new THREE.Vector3(0.02, 0.075, 0.1), 0x65bed3, 0.04,
    )
    const internalOutputPath = createSignalPath(
      new THREE.Vector3(0.02, 0.075, 0.1), new THREE.Vector3(0.28, 0.065, -0.16), 0x5fb6cc, 0.045,
    )
    internalInputPath.pulse.visible = false
    internalOutputPath.pulse.visible = false
    scene.add(internalInputPath.line, internalOutputPath.line)

    const shellGroup = new THREE.Group()
    shellGroup.scale.set(0.74, 0.81, 0.7)
    scene.add(shellGroup)

    const shellGeometry = createCrystalGeometry()
    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      emissive: 0x071521,
      emissiveIntensity: 0.06,
      metalness: 0.035,
      roughness: 0.055,
      transmission: 0.72,
      thickness: 0.66,
      ior: 1.5,
      iridescence: 0.035,
      iridescenceIOR: 1.18,
      iridescenceThicknessRange: [100, 260],
      attenuationColor: new THREE.Color(0x2f6da7),
      attenuationDistance: 4.2,
      envMapIntensity: 2.15,
      specularIntensity: 1,
      transparent: true,
      opacity: 0.58,
      clearcoat: 1,
      clearcoatRoughness: 0.015,
      flatShading: true,
      side: THREE.DoubleSide,
    })
    const shell = new THREE.Mesh(shellGeometry, shellMaterial)
    shellGroup.add(shell)

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(shellGeometry, 8),
      new THREE.LineBasicMaterial({ color: 0xc3dbea, transparent: true, opacity: 0.12 }),
    )
    shellGroup.add(edges)

    const innerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa8c9df,
      roughness: 0.06,
      metalness: 0,
      transmission: 0.84,
      transparent: true,
      opacity: 0.045,
      envMapIntensity: 1.55,
      side: THREE.BackSide,
    })
    const innerCrystal = new THREE.Mesh(shellGeometry, innerMaterial)
    innerCrystal.scale.setScalar(0.955)
    shellGroup.add(innerCrystal)

    const coreGeometry = new THREE.OctahedronGeometry(0.125, 0)
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa9e7f3,
      emissive: 0x2d9fbb,
      emissiveIntensity: 1.25,
      roughness: 0.12,
      metalness: 0.08,
      transmission: 0.3,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    })
    const intelligenceCore = new THREE.Mesh(coreGeometry, coreMaterial)
    intelligenceCore.position.set(0.02, 0.075, 0.28)
    intelligenceCore.renderOrder = 2
    shellGroup.add(intelligenceCore)

    const intelligenceGlow = new THREE.PointLight(0x76d8e8, 3.2, 1.15)
    intelligenceGlow.position.set(0.02, 0.075, 0.18)
    shellGroup.add(intelligenceGlow)

    const coreRayMaterial = new THREE.LineBasicMaterial({
      color: 0x7ed7e8, transparent: true, opacity: 0.075, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    const coreRayGeometries = [
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.02, 0.075, 0.12), new THREE.Vector3(-0.42, 0.46, -0.16)]),
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.02, 0.075, 0.12), new THREE.Vector3(0.5, 0.32, -0.05)]),
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.02, 0.075, 0.12), new THREE.Vector3(0.18, -0.5, 0.08)]),
    ]
    coreRayGeometries.forEach((geometry) => shellGroup.add(new THREE.Line(geometry, coreRayMaterial)))

    const traceMaterial = new THREE.LineBasicMaterial({
      color: 0x91c6d8, transparent: true, opacity: 0.16, depthWrite: false,
    })
    const traceGeometries = [
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.62, -0.78, 0.2), new THREE.Vector3(-0.18, -0.64, 0.12), new THREE.Vector3(0.15, -0.9, 0.04),
      ]),
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.28, -1.06, -0.12), new THREE.Vector3(0.2, -0.79, -0.06), new THREE.Vector3(0.58, -0.96, 0.08),
      ]),
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.05, -0.52, 0.16), new THREE.Vector3(0.34, -0.68, 0.02), new THREE.Vector3(0.66, -0.58, -0.1),
      ]),
    ]
    traceGeometries.forEach((geometry) => shellGroup.add(new THREE.Line(geometry, traceMaterial)))

    scene.add(new THREE.HemisphereLight(0xe5f3ff, 0x071126, 1.35))
    const key = new THREE.DirectionalLight(0xf0f8ff, 5.1)
    key.position.set(-3, 4, 5)
    scene.add(key)
    const blue = new THREE.PointLight(0x3c8fff, 20, 9)
    blue.position.set(2.8, 0.5, 3)
    scene.add(blue)
    const coreLight = new THREE.PointLight(0xb7efff, 8, 4)
    coreLight.position.set(0, 0, 1.1)
    scene.add(coreLight)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const startedAt = performance.now()
    let previousFrameAt = startedAt
    let rotationY = 0
    let hoverBoost = 1
    let frame = 0

    const handlePointerEnter = () => { hoverBoost = 1.14 }
    const handlePointerLeave = () => { hoverBoost = 1 }
    mount.addEventListener('pointerenter', handlePointerEnter)
    mount.addEventListener('pointerleave', handlePointerLeave)

    const resize = () => {
      const { clientWidth, clientHeight } = mount
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / Math.max(clientHeight, 1)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()

    const animate = () => {
      const now = performance.now()
      const elapsed = (now - startedAt) / 1000
      const delta = Math.min((now - previousFrameAt) / 1000, 0.05)
      previousFrameAt = now
      if (!reducedMotion) {
        rotationY += delta * 0.38 * hoverBoost
        shellGroup.rotation.y = rotationY
        shellGroup.rotation.x = Math.sin(elapsed * 0.42) * 0.035
        intelligenceCore.rotation.y = -rotationY * 0.7
        intelligenceCore.rotation.x = elapsed * 0.16
        const sequence = elapsed % 14
        const processing = Math.max(0, 1 - Math.abs(sequence - 5.35) / 0.7)
        coreMaterial.emissiveIntensity = 1.02 + processing * 1.15
        intelligenceGlow.intensity = 2.45 + processing * 3.1
        shellMaterial.emissiveIntensity = 0.06 + processing * 0.07
        inputPaths.forEach((path, index) => {
          const signal = hexSignals[index]
          const radius = 0.42 * signal.group.scale.x * signal.frameScale
          const start = signal.group.position.clone().add(new THREE.Vector3(radius * 0.88, 0, -0.08))
          updateSignalPath(path, start, new THREE.Vector3(-0.28, 0.065, -0.16))
          const local = sequence - (0.75 + index * 1.05)
          const active = local >= 0 && local <= 1.35
          const progress = THREE.MathUtils.clamp(local / 1.35, 0, 1)
          path.material.opacity = 0.32 + (active ? Math.sin(progress * Math.PI) * 0.24 : 0)
          path.pulseMaterial.opacity = active ? Math.sin(progress * Math.PI) * 0.9 : 0
          path.pulse.position.copy(path.curve.getPoint(progress))
        })
        outputPaths.forEach((path, index) => {
          const signal = hexSignals[index + 3]
          const radius = 0.42 * signal.group.scale.x * signal.frameScale
          const end = signal.group.position.clone().add(new THREE.Vector3(-radius * 0.88, 0, -0.08))
          updateSignalPath(path, new THREE.Vector3(0.28, 0.065, -0.16), end)
          const local = sequence - (6.05 + index * 0.5)
          const active = local >= 0 && local <= 1.6
          const progress = THREE.MathUtils.clamp(local / 1.6, 0, 1)
          path.material.opacity = 0.26 + (active ? Math.sin(progress * Math.PI) * 0.36 : 0)
          path.pulseMaterial.opacity = active ? Math.sin(progress * Math.PI) * 0.88 : 0
          path.pulse.position.copy(path.curve.getPoint(progress))
        })
        internalInputPath.material.opacity = 0.035 + processing * 0.08
        internalOutputPath.material.opacity = 0.04 + processing * 0.09
        coreRayMaterial.opacity = 0.065 + processing * 0.12
        hexSignals.forEach(({ group, borderMaterial }, index) => {
          group.position.y = hexBaseY[index] + Math.sin(elapsed * 0.55 + index * 0.8) * 0.035
          group.position.x = hexBaseX[index] + Math.sin(elapsed * 0.31 + index * 1.1) * 0.014
          group.scale.setScalar(hexBaseScale[index] * (1 + Math.sin(elapsed * 0.27 + index) * 0.008))
          group.rotation.z = Math.sin(elapsed * 0.3 + index) * 0.025
          const outputIndex = index - 3
          const outputArrival = outputIndex >= 0
            ? Math.max(0, 1 - Math.abs(sequence - (7.65 + outputIndex * 0.5)) / 0.6)
            : 0
          borderMaterial.opacity = (index < 3 ? 0.38 : 0.48) + outputArrival * 0.34
        })
        coreLight.intensity = (7.2 + Math.sin(elapsed * 1.4) * 0.8) * (hoverBoost > 1 ? 1.05 : 1)
      }
      renderer.render(scene, camera)
      frame = window.requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      mount.removeEventListener('pointerenter', handlePointerEnter)
      mount.removeEventListener('pointerleave', handlePointerLeave)
      mount.removeChild(renderer.domElement)
      shellGeometry.dispose()
      ;[...inputPaths, ...outputPaths, internalInputPath, internalOutputPath].forEach(({ geometry, material, pulseGeometry, pulseMaterial }) => {
        geometry.dispose()
        material.dispose()
        pulseGeometry.dispose()
        pulseMaterial.dispose()
      })
      shellMaterial.dispose()
      innerMaterial.dispose()
      coreGeometry.dispose()
      coreMaterial.dispose()
      coreRayGeometries.forEach((geometry) => geometry.dispose())
      coreRayMaterial.dispose()
      traceGeometries.forEach((geometry) => geometry.dispose())
      traceMaterial.dispose()
      hexSignals.forEach(({ faceGeometry, faceMaterial, borderGeometry, borderMaterial, texture, labelMaterial }) => {
        faceGeometry.dispose()
        faceMaterial.dispose()
        borderGeometry.dispose()
        borderMaterial.dispose()
        texture.dispose()
        labelMaterial.dispose()
      })
      edges.geometry.dispose()
      ;(edges.material as THREE.Material).dispose()
      environmentTarget.dispose()
      pmremGenerator.dispose()
      roomEnvironment.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <section className={styles.panel} aria-label="PRISM AI 리스크 관제 플랫폼 소개">
      <div className={styles.glow} aria-hidden="true" />
      <div ref={mountRef} className={styles.canvas} aria-hidden="true">
        <div className={styles.fallbackCrystal}><span>PRISM</span></div>
        <div className={styles.ambientShadow} />
      </div>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>PURCHASE RISK INTELLIGENCE &amp; SUPPLY MONITORING</p>
        <h1 className={styles.wordmark}>PR<span className={styles.spectrumI}>I</span>SM</h1>
        <p className={styles.tagline}>배터리 원자재 공급망 리스크 관제 AI 에이전트</p>
      </div>
    </section>
  )
}
