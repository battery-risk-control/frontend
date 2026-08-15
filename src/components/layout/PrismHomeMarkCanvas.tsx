import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createCrystalGeometry } from '../../features/auth/components/crystalGeometry'
import styles from './PrismHomeMark.module.css'

/**
 * Header-sized rendering of the same crystal used by the login hero.
 *
 * three.js(약 570KB, gzip 144KB)를 끌어오는 무거운 부분이라 default export로 분리해
 * {@link PrismHomeMark}가 lazy로 불러온다 — 이 파일이 three 청크의 유일한 진입점이다.
 * 헤더 로고 하나 때문에 전 페이지가 three를 동기 로드하던 것을 막는다.
 */
export default function PrismHomeMarkCanvas() {
  const mountRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(36, 42, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(33, 36 / 42, 0.1, 20)
    camera.position.set(0, 0.02, 5.1)

    const environment = new RoomEnvironment()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environmentTarget = pmrem.fromScene(environment, 0.04)
    scene.environment = environmentTarget.texture

    const geometry = createCrystalGeometry()
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      emissive: 0x071521,
      emissiveIntensity: 0.06,
      metalness: 0.035,
      roughness: 0.055,
      transmission: 0.72,
      thickness: 0.66,
      ior: 1.5,
      attenuationColor: new THREE.Color(0x2f6da7),
      attenuationDistance: 4.2,
      envMapIntensity: 2.15,
      specularIntensity: 1,
      transparent: true,
      opacity: 0.62,
      clearcoat: 1,
      clearcoatRoughness: 0.015,
      flatShading: true,
      side: THREE.DoubleSide,
    })
    const crystal = new THREE.Mesh(geometry, material)
    crystal.scale.set(0.83, 0.9, 0.8)
    scene.add(crystal)

    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xc3dbea, transparent: true, opacity: 0.16 })
    const edgeGeometry = new THREE.EdgesGeometry(geometry, 8)
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
    edges.scale.copy(crystal.scale)
    scene.add(edges)

    scene.add(new THREE.HemisphereLight(0xe5f3ff, 0x071126, 1.6))
    const key = new THREE.DirectionalLight(0xf0f8ff, 5.2)
    key.position.set(-3, 4, 5)
    scene.add(key)
    const blue = new THREE.PointLight(0x3c8fff, 15, 8)
    blue.position.set(2.5, 0.5, 3)
    scene.add(blue)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let previous = performance.now()
    const render = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      if (!reducedMotion) {
        crystal.rotation.y += delta * Math.PI * 2 / 16
        edges.rotation.y = crystal.rotation.y
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      geometry.dispose()
      material.dispose()
      edgeGeometry.dispose()
      edgeMaterial.dispose()
      environmentTarget.dispose()
      environment.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <span ref={mountRef} className={styles.frame} aria-hidden="true" />
}
