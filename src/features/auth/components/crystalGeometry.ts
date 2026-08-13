import * as THREE from 'three'

export function createCrystalGeometry() {
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
