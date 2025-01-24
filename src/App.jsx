import { useEffect, useState } from 'react';
import axios from 'axios';

export default function App() {
  // Gifs data
  const [gifs, setGifs] = useState([]);
  // For search strings
  const [search, setSearch] = useState('');
  // Loading state
  const [loading, setLoading] = useState(false);
  // Number of Gifs displayed
  const [limit, setLimit] = useState(17);
  // Instead of one selectedGifID, we'll store an array of chosen IDs
  // so that multiple gifs can be highlighted simultaneously
  const [chosenGifIDs, setChosenGifIDs] = useState([]);

  // environment vars (for demonstration, placeholders)
  const API_KEY = 'h2ysalzwiuIgc3MhIOqMocPo65NUwLkv';
  const BASE_URL = 'https://api.giphy.com/v1/gifs/search';

  // The range for possible request limits
  const limitmin = 1;
  const limitmax = 100;

  // Fetch Gifs from the Giphy API
  const searchGifs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          api_key: API_KEY,
          q: search,
          limit: limit,
        },
      });
      setGifs(response.data.data);
    } catch (error) {
      console.log('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  // Download the Gif
  const downloadGif = async (gifUrl, gifId) => {
    try {
      const res = await fetch(gifUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gif_${gifId}.gif`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading gif', error);
    }
  };

  // Choose Gif: if already in the chosen list, remove it, else add it.
  const chooseGif = (gifId) => {
    setChosenGifIDs((prev) => {
      if (prev.includes(gifId)) {
        // Remove it if we want toggling off
        return prev.filter((id) => id !== gifId);
      }
      // Else add it
      return [...prev, gifId];
    });
  };

  // Run search on first load
  useEffect(() => {
    searchGifs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle for Dark Mode and Light Mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load the saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Toggle the theme and save the choice to localStorage
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  // Apply the theme to the document body
  useEffect(() => {
    if (isDarkMode) {
      document.body.style.backgroundColor = 'black';
      document.body.style.color = 'white';
    } else {
      document.body.style.backgroundColor = 'white';
      document.body.style.color = 'black';
    }
  }, [isDarkMode]);

  return (
    <div>
      {/* Theme Toggle */}
      <span>{isDarkMode ? '🌙' : '☀️'}</span>
      &nbsp;
      <input
        type='range'
        onChange={toggleTheme}
        min={0}
        max={1}
        style={{ width: '40px' }}
      />

      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Search Giphy : </h1>
        {/* Search Input */}
        <input
          type='text'
          placeholder='search gifs'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              searchGifs();
            }
          }}
          style={{
            padding: '10px',
            width: '500px',
            marginBottom: '10px',
            borderRadius: '5px',
            border: '1px solid #ccc',
          }}
        />
        <button
          onClick={searchGifs}
          style={{
            padding: '10px',
            margin: '10px',
            backgroundColor: 'blue',
            color: 'white',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
        <br />
        {/* Range to control how many Gifs to show */}
        <input
          type='range'
          value={limit}
          min={limitmin}
          max={limitmax}
          style={{ width: '800px' }}
          onChange={(e) => setLimit(e.target.value)}
        />
        <br />
        <p>
          Range:
          <input
            type='num'
            style={{ width: '30px' }}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </p>
        <br />
        {/* If loading, show spinner image; otherwise show Gifs */}
        {loading ? (
          <p>
            <img src='../public/bally.svg' alt='ballbounce' />
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '3px',
              marginTop: '10px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            }}
          >
            {gifs.map((gif) => {
              const isChosen = chosenGifIDs.includes(gif.id);
              return (
                <div key={gif.id} style={{ padding: '5px' }}>
                  {/* Nest the <img> in a box with border to isolate from the buttons */}
                  <div
                    style={{
                      border: isChosen ? '5px solid green' : 'none',
                      display: 'inline-block',
                      borderRadius: '5px'
                    }}
                  >
                    <img
                      src={gif.images.fixed_height.url}
                      alt={gif.title}
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '10px'
                      }}
                    />
                  </div>

                  <br />
                  <button
                    onClick={() => downloadGif(gif.images.fixed_height.url, gif.id)}
                    style={{
                      marginTop: '3px',
                      padding: '3px',
                      color: 'brown',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '3px',
                      cursor: 'copy',
                    }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => chooseGif(gif.id)}
                    style={{
                      margin: '2px',
                      padding: '3px',
                      color: 'red',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '3px',
                    }}
                  >
                    Choose
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
