import { useState } from 'react'
import './App.css'
import AudioUploader from './components/AudioUploader'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <h1>Practice your Speaking Skills</h1>
    <AudioUploader />

    </>
  )
}

export default App
