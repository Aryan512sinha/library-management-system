'use client'

import { Suspense, useLayoutEffect, useMemo, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, Group, Vector3 } from 'three'
import { SEATS } from '@/lib/library-data'

// onSelect now receives the seat identifier (string) when a specific seat/mesh is clicked
function LibraryModel({ onSelect }: { onSelect: (seat: string) => void }) {
  const { scene } = useGLTF('/models/kl_boox_house6.glb')
  const modelRef = useRef<Group>(null)
  const { camera } = useThree()
  const cloned = useMemo(() => scene.clone(), [scene])

  useLayoutEffect(() => {
    if (!modelRef.current) return
    const bounds = new Box3().setFromObject(modelRef.current)
    const center = bounds.getCenter(new Vector3())
    const size = bounds.getSize(new Vector3())
    const radius = Math.max(size.x, size.y, size.z) * 0.5
    const distance = Math.max(radius * 2.9, 8)

    modelRef.current.position.sub(center)
    camera.position.set(distance * 0.85, distance * 0.62, distance)
    camera.lookAt(0, 0, 0)
    camera.near = Math.max(0.01, radius / 100)
    camera.far = Math.max(1000, radius * 20)
    camera.updateProjectionMatrix()
  }, [camera, cloned])

  // Populate userData.seatNo for meshes if possible (use mesh names that match the SEATS pattern, otherwise assign sequentially)
  useEffect(() => {
    if (!cloned) return
    let seatIndex = 0
    cloned.traverse((node: any) => {
      if (node.isMesh) {
        if (node.name && /[A-Z]-\d{2}/.test(node.name)) {
          node.userData.seatNo = node.name
        } else if (!node.userData?.seatNo) {
          node.userData = node.userData || {}
          node.userData.seatNo = SEATS[seatIndex]?.seatNo ?? node.name ?? `seat-${seatIndex}`
          seatIndex++
        }
        // clone material so per-seat color changes don't bleed across instances
        if (node.material) node.material = node.material.clone()
      }
    })
  }, [cloned])

  // The click event bubbles up from the specific mesh that was clicked.
  // We inspect event.object.name (or event.object.userData) to determine which seat was clicked
  // and pass that identifier to the onSelect callback. Using `any` for the event keeps types simple.
  return (
    <group
      ref={modelRef}
      onClick={(event: any) => {
        event.stopPropagation()
        // Try to read a seat identifier from the clicked object.
        // Many glTF models include meaningful `name` values on meshes; some projects store data in userData.
        const clicked = event?.object
        const seatId = clicked?.userData?.seatNo || clicked?.name || ''
        // debug log — remove before final merge if desired
        // eslint-disable-next-line no-console
        console.log('clicked seat:', clicked?.name, clicked?.userData?.seatNo)
        onSelect(seatId)
      }}
      onPointerDown={(event: any) => event.stopPropagation()}
    >
      <primitive object={cloned} />
    </group>
  )
}

function ModelScene({ onSelect }: { onSelect: (seat: string) => void }) {
  return <>
    <color attach="background" args={['#dfe8e3']} />
    <ambientLight intensity={0.8} />
    <directionalLight position={[8, 12, 10]} intensity={1.8} castShadow />
    <Suspense fallback={null}>
      <Environment preset="warehouse" background blur={0.35} environmentIntensity={0.85} />
      <LibraryModel onSelect={onSelect} />
    </Suspense>
    <OrbitControls enablePan={false} minDistance={2} maxDistance={1000} minPolarAngle={0.2} maxPolarAngle={Math.PI * 0.48} makeDefault />
  </>
}

export function LibraryModelView({ onSelect }: { onSelect: (seat: string) => void }) {
  return <div className="relative h-[520px] overflow-hidden rounded-2xl border border-border bg-muted shadow-inner sm:h-[620px]">
    <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-lg border border-border bg-card/90 px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Full building</div>
    <div className="pointer-events-none absolute bottom-5 left-5 z-10 rounded-lg border border-border bg-card/90 px-3 py-2 text-xs text-muted-foreground">Drag to rotate · Scroll to zoom · Double-click to center</div>
    <Canvas camera={{ position: [12, 9, 14], fov: 50 }} dpr={[1, 1.5]} shadows onCreated={({ camera }) => { camera.far = 10000; camera.updateProjectionMatrix() }}>
      <ModelScene onSelect={onSelect} />
    </Canvas>
  </div>
}

useGLTF.preload('/models/kl_boox_house6.glb')
