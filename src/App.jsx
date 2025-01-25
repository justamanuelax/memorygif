import { useEffect, useState } from 'react';
import axios from 'axios';

export default function App() {
  const [allLocalGifs, setAllLocalGifs] = useState([]);
  const [gifs, setGifs] = useState([]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(17);
  const [loading, setLoading] = useState(false);
  const [chosenGifIDs, setChosenGifIDs] = useState([]);
  const [showOnlyChosen, setShowOnlyChosen] = useState(false);

  // Example environment variables
  const API_KEY = import.meta.env.VITE_API_KEY;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const limitmin = 1;
  const limitmax = 100;

  // Merges new results with old but only shows the new results on screen
  const searchGifs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(BASE_URL, {
        params: { api_key: API_KEY, q: search, limit },
      });
      const newData = response.data.data;

      // Merge with old data for localStorage
      const newIDs = newData.map((g) => g.id);
      const oldNoDuplicates = allLocalGifs.filter(
        (oldGif) => !newIDs.includes(oldGif.id)
      );
      const mergedAll = [...oldNoDuplicates, ...newData];

      localStorage.setItem('allGifs', JSON.stringify(mergedAll));
      setAllLocalGifs(mergedAll);

      // Show only newly searched results on screen
      setGifs(newData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle choose/unchoose a GIF
  const chooseGif = (gifId) => {
    setChosenGifIDs((prev) => {
      let updated;
      if (prev.includes(gifId)) {
        updated = prev.filter((id) => id !== gifId);
      } else {
        updated = [...prev, gifId];
      }
      localStorage.setItem('chosenGifIDs', JSON.stringify(updated));
      return updated;
    });
  };

  // Download a GIF
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

  // Show only chosen GIFs
  const storeForLater = () => {
    setShowOnlyChosen(true);
  };

  // Undo store-for-later
  const handleUndo = () => {
    setShowOnlyChosen(false);
  };

  // Wipe everything and also empty the 'gifs' array
  // so if user clicks undo without searching again, there's no stale GIF to choose.
  const handleWipe = () => {
    localStorage.removeItem('chosenGifIDs');
    localStorage.removeItem('allGifs');
    setAllLocalGifs([]);
    setChosenGifIDs([]);
    setGifs([]); // ensure page is truly cleared
  };

  // On first load, restore from localStorage
  useEffect(() => {
    const savedAll = localStorage.getItem('allGifs');
    if (savedAll) {
      try {
        setAllLocalGifs(JSON.parse(savedAll));
      } catch {}
    }
    const savedChosen = localStorage.getItem('chosenGifIDs');
    if (savedChosen) {
      try {
        setChosenGifIDs(JSON.parse(savedChosen));
      } catch {}
    }
  }, []);

  // Dark/Light theme
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };
  useEffect(() => {
    if (isDarkMode) {
      document.body.style.backgroundColor = 'black';
      document.body.style.color = 'white';
    } else {
      document.body.style.backgroundColor = 'white';
      document.body.style.color = 'black';
    }
  }, [isDarkMode]);

  // If showing only chosen GIFs
  if (showOnlyChosen) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '5px',
          padding: '20px',
          textAlign: 'left',
        }}
      >
        {allLocalGifs
          .filter((gif) => chosenGifIDs.includes(gif.id))
          .map((gif) => (
            <div key={gif.id}>
              <div
                style={{
                  border: '5px solid green',
                  display: 'inline-block',
                  borderRadius: '5px',
                }}
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  style={{
                    width: '120px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                  }}
                />
              </div>
            </div>
          ))}

        {/* Wipe: on left side */}
        <button
          onClick={handleWipe}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            padding: '10px',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Wipe
        </button>

        {/* Undo: on right side */}
        <button
          onClick={handleUndo}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px',
            backgroundColor: 'gray',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Undo
        </button>
      </div>
    );
  }

  // Otherwise, normal page
  return (
    <div>
      <span>{isDarkMode ? '🌙' : '☀️'}</span>
      &nbsp;
      <input
        type="range"
        onChange={toggleTheme}
        min={0}
        max={1}
        style={{ width: '40px' }}
      />
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>Search Giphy:</h1>
        <input
          type="text"
          placeholder="search gifs"
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

        {loading ? (
          <p>
            <img src="../public/bally.svg" alt="ballbounce" />
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
                  <div
                    style={{
                      border: isChosen ? '5px solid green' : 'none',
                      display: 'inline-block',
                      borderRadius: '5px',
                    }}
                  >
                    <img
                      src={gif.images.fixed_height.url}
                      alt={gif.title}
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '5px' }}>
                    <button
                      onClick={() =>
                        downloadGif(gif.images.fixed_height.url, gif.id)
                      }
                      style={{
                        marginRight: '3px',
                        padding: '3px',
                        color: 'brown',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => chooseGif(gif.id)}
                      style={{
                        marginLeft: '3px',
                        padding: '3px',
                        color: 'red',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '3px',
                      }}
                    >
                      Choose
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={storeForLater}
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: 'green',
            color: 'white',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Store Selected Gifs For Later
        </button>
      </div>
    </div>
  );
}
