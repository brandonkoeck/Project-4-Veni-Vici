import { useState, useEffect, useCallback } from 'react'
import './App.css'

function App() {
  const [currentImage, setCurrentImage] = useState(null)
  const [banList, setBanList] = useState([])
  const [loading, setLoading] = useState(false)
  const API_KEY = import.meta.env.VITE_API_KEY

  // Fetch a random image from APOD by getting a date from the past
  const fetchRandomImage = useCallback(async () => {
    setLoading(true)
    try {
      // Get a random date within the last 100 days
      const randomDaysAgo = Math.floor(Math.random() * 100) + 1
      const date = new Date()
      date.setDate(date.getDate() - randomDaysAgo)
      const dateString = date.toISOString().split('T')[0]

      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${dateString}`,
        { signal: AbortSignal.timeout(5000) } // 5 second timeout
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Check if any attribute is banned
      const copyrightToCheck = data.copyright || 'NASA'
      const mediaTypeToCheck = data.media_type || 'image'
      const imageMonth = data.date.substring(0, 7) // Extract "YYYY-MM" from date

      // Skip videos - only show images
      if (mediaTypeToCheck === 'video') {
        setTimeout(() => fetchRandomImage(), 0)
        return
      }

      if (banList.includes(copyrightToCheck) || banList.includes(mediaTypeToCheck) || banList.includes(imageMonth)) {
        // Use setTimeout to avoid recursive call issues
        setTimeout(() => fetchRandomImage(), 0)
        return
      }

      setCurrentImage(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching image:', error)
      setLoading(false)
      // Optionally add a small delay before allowing retry
      setTimeout(() => {}, 500)
    }
  }, [banList])

  // Load first image on component mount
  useEffect(() => {
    const initializeImage = async () => {
      await fetchRandomImage()
    }
    initializeImage()
  }, [])

  // Add attribute to ban list
  const addToBanList = (attribute) => {
    setBanList([...banList, attribute])
  }

  // Remove attribute from ban list
  const removeFromBanList = (attribute) => {
    setBanList(banList.filter((item) => item !== attribute))
  }

  if (!currentImage) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <h1>Discover Space</h1>

      {/* Main Image Display */}
      <div className="image-container">
        <img src={currentImage.url} alt={currentImage.title} />
        <h2>{currentImage.title}</h2>
      </div>

      {/* Attributes Display */}
      <div className="attributes">
        <div className="attribute">
          <strong>Description:</strong> {currentImage.explanation}
        </div>
        <div className="attribute">

          <strong>Date:</strong> {currentImage.date}
          <button onClick={() => addToBanList(currentImage.date.substring(0, 7))}>Ban Month</button>
        </div>
        <div className="attribute">
          <strong>Copyright:</strong> {currentImage.copyright || 'NASA'}
          <button onClick={() => addToBanList(currentImage.copyright || 'NASA')}>
            Ban Author
          </button>
        </div>

      </div>

      {/* Discover Button */}
      <button
        className="discover-btn"
        onClick={fetchRandomImage}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Discover'}
      </button>

      {/* Ban List */}
      <div className="ban-list">
        <h3>Ban List ({banList.length})</h3>
        {banList.length === 0 ? (
          <p>No items banned</p>
        ) : (
          <ul>
            {banList.map((item) => (
              <li key={item}>
                {item}
                <button onClick={() => removeFromBanList(item)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
