import { useState, useRef, useEffect, useMemo, useCallback } from 'react'

const AudioUploader = () => {
  const [audioFile, setAudioFile] = useState(null)
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Memoize the object URL to prevent unnecessary re-creations
  const audioSrc = useMemo(() => {
    return audioFile ? URL.createObjectURL(audioFile) : null
  }, [audioFile])

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0]
    setAudioFile(file)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    setCurrentTime(audioRef.current.currentTime)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    setDuration(audioRef.current.duration)
  }, [])

  const handleSeek = useCallback((event) => {
    event.preventDefault()
    const newTime = parseFloat(event.target.value)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [])

  const handlePlay = useCallback((event) => {
    event.preventDefault()
    audioRef.current.play()
  }, [])

  const handlePause = useCallback((event) => {
    event.preventDefault()
    audioRef.current.pause()
  }, [])

  const handleStop = useCallback((event) => {
    event.preventDefault()
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setCurrentTime(0)
  }, [])

  // Clean up the object URL when the component unmounts or audioFile changes
  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc)
      }
    }
  }, [audioSrc])

  return (
    <div>
      <h2>Upload Audio File</h2>
      <input 
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
      />
      {audioFile && (
        <div>
          <p>Selected file: {audioFile.name}</p>
          <audio 
            ref={audioRef} 
            src={audioSrc} 
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />
          <button type="button" onClick={handlePlay}>Play</button>
          <button type="button" onClick={handlePause}>Pause</button>
          <button type="button" onClick={handleStop}>Stop</button>
          <div>
            <input 
              type="range" 
              min="0" 
              max={duration} 
              step="0.1"
              value={currentTime} 
              onChange={handleSeek} 
            />
            <span>{Math.floor(currentTime)}s / {Math.floor(duration)}s</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioUploader
