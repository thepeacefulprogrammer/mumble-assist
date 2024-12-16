import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import AudioAnalyzer from './utils/AudioAnalyzer.js'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = 5000

// Enable CORS
app.use(cors())

// Serve static files from the sentence-audio directory
app.use('/sentence-audio', express.static(path.join(__dirname, 'sentence-audio')))

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // e.g., 1592239443344.mp3
  },
})

const upload = multer({ storage })

// Initialize AudioAnalyzer
const analyzer = new AudioAnalyzer()

// Endpoint to handle audio file upload and analysis
app.post('/analyze-audio', upload.single('audio'), async (req, res) => {
  try {
    const inputFilePath = req.file.path
    const outputDir = path.join(__dirname, 'sentence-audio')

    const { sentenceData, transcription } = await analyzer.splitAudioIntoSentences(inputFilePath, outputDir)

    const sentenceUrls = sentenceData.map(sentence => {
      return {
        text: sentence.text,
        startTime: sentence.startTime,
        endTime: sentence.endTime,
        url: `http://localhost:${port}/sentence-audio/${sentence.fileName}`
      }
    })

    res.json({ sentences: sentenceUrls, transcription })
  } catch (error) {
    console.error('Error analyzing audio:', error)
    res.status(500).json({ error: 'Failed to analyze audio' })
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
}) 