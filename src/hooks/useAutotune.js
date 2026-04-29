import { useEffect, useRef, useState } from 'react'

// Autotune hook with Web Audio API and pitch detection
export function useAutotune(audioContext) {
  const [isProcessing, setIsProcessing] = useState(false)
  const processorRef = useRef(null)

  useEffect(() => {
    if (!audioContext) return

    // Initialize audio worklet for autotune processing
    const initProcessor = async () => {
      try {
        await audioContext.audioWorklet.addModule('/autotune-processor.js')
        const processor = new AudioWorkletNode(audioContext, 'autotune-processor')
        processorRef.current = processor
      } catch (error) {
        console.error('Autotune processor initialization failed:', error)
      }
    }

    initProcessor()
  }, [audioContext])

  const applyAutotune = (sourceNode, settings) => {
    if (!processorRef.current) return

    const processor = processorRef.current
    processor.port.postMessage({
      type: 'UPDATE_SETTINGS',
      settings: {
        scale: settings.scale || 'major',
        retuneSpeed: settings.retuneSpeed || 50,
        pitchCorrection: settings.pitchCorrection || 100
      }
    })

    sourceNode.connect(processor)
    processor.connect(sourceNode.context.destination)
    setIsProcessing(true)
  }

  return {
    applyAutotune,
    isProcessing
  }
}
