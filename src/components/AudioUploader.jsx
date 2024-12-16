import { useState, useRef } from 'react'

const AudioUploader = () => {
  const [audioFile, setAudioFile] = useState(null)
  const audioRef = useRef(null)

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    setAudioFile(file)
  }

  const handlePlay = () => {
    audioRef.current.play()
  }

  const handlePause = () => {
    audioRef.current.pause()
  }

  const handleStop = () => {
    audioRef.current.pause()
    audioRef.current.currentTime = 0
  }

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
          <audio ref={audioRef} src={URL.createObjectURL(audioFile)} />
          <button onClick={handlePlay}>Play</button>
          <button onClick={handlePause}>Pause</button>
          <button onClick={handleStop}>Stop</button>
        </div>
      )}
    </div>
  )
}

export default AudioUploader
