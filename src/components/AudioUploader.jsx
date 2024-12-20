import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import './AudioUploader.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUpload, 
  faPlay, 
  faPause, 
  faStop, 
  faMicrophone,
  faSpinner,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons'

const AudioUploader = () => {
  const [audioFile, setAudioFile] = useState(null)
  const [sentences, setSentences] = useState([])
  const [transcription, setTranscription] = useState('')
  const audioRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  // Memoize the object URL to prevent unnecessary re-creations
  const audioSrc = useMemo(() => {
    return audioFile ? URL.createObjectURL(audioFile) : null
  }, [audioFile])

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0]
    if (file) {
      setAudioFile(file)
      setSentences([]) // Reset previous sentences
      setError(null)
    }
  }, [])

  const handleAnalyzeAudio = useCallback(async () => {
    if (!audioFile) return

    const formData = new FormData()
    formData.append('audio', audioFile)

    try {
      setIsAnalyzing(true)
      const response = await fetch('http://localhost:5000/analyze-audio', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSentences(data.sentences)
        setTranscription(data.transcription.results || '')
      } else {
        const errData = await response.json()
        setError(errData.error || 'Failed to analyze audio')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An unexpected error occurred.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [audioFile])

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
    <div className="audio-uploader">
      <div className="header-container">
        <img src="/mumble-assist-logo.png" alt="Mumble Assist Logo" className="logo" />
        <h2>Upload Audio File</h2>
      </div>
      <div className="file-input-container">
        <label className="file-input-label">
          <FontAwesomeIcon icon={faUpload} />
          Choose Audio File
          <input 
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
          />
        </label>
      </div>
      {audioFile && (
        <div>
          <p className="selected-file">Selected file: {audioFile.name}</p>
          <audio 
            ref={audioRef} 
            src={audioSrc} 
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />
          <div className="audio-controls">
            <button type="button" className="audio-button" onClick={handlePlay}>
              <FontAwesomeIcon icon={faPlay} />
              Play
            </button>
            <button type="button" className="audio-button" onClick={handlePause}>
              <FontAwesomeIcon icon={faPause} />
              Pause
            </button>
            <button type="button" className="audio-button" onClick={handleStop}>
              <FontAwesomeIcon icon={faStop} />
              Stop
            </button>
          </div>
          <div className="seek-container">
            <input 
              type="range" 
              className="seek-slider"
              min="0" 
              max={duration} 
              step="0.1"
              value={currentTime} 
              onChange={handleSeek} 
            />
            <span className="time-display">{Math.floor(currentTime)}s / {Math.floor(duration)}s</span>
          </div>
          <div>
            <button 
              type="button" 
              className="analyze-button" 
              onClick={handleAnalyzeAudio} 
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="loading-spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faMicrophone} />
                  Analyze Audio
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="error-message">
              <FontAwesomeIcon icon={faExclamationCircle} />
              {error}
            </p>
          )}
        </div>
      )}
      {sentences.length > 0 && (
        <div className="sentences-container">
          <h3>Sentence Audio Segments</h3>
          <ul className="sentences-list">
            {sentences.map((sentence, index) => (
              <li key={index} className="sentence-item">
                <p className="sentence-text">{sentence.text}</p>
                <div className="custom-audio-player">
                  <audio className="sentence-audio" controls src={sentence.url} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AudioUploader
