import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { DesignPage } from '@/pages/DesignPage'
import { SimulationPage } from '@/pages/SimulationPage'
import { useDrivetrainStore } from '@/stores/drivetrain-store'

function App() {
  const loadPreset = useDrivetrainStore((s) => s.loadPreset)
  const nodes = useDrivetrainStore((s) => s.nodes)

  // Load default preset on first mount if no drivetrain is loaded
  useEffect(() => {
    if (nodes.length === 0) {
      loadPreset('ecvt-detailed')
    }
  }, []) // Only run on mount

  return (
    <Routes>
      <Route path="/design" element={<DesignPage />} />
      <Route path="/simulation" element={<SimulationPage />} />
      <Route path="/" element={<Navigate to="/design" replace />} />
    </Routes>
  )
}

export default App
