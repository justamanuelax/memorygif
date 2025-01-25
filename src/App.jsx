import { useEffect, useState } from 'react';
import axios from 'axios';

export default function App() {
  // Gifs from local storage (old + new searches)
  const [allLocalGifs, setAllLocalGifs] = useState([]);
  // Gifs currently displayed on the main page (only new search results)
  const [gifs, setGifs] = useState([]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(17);
  const [loading, setLoading] = useState(false);

  // Which GIFs the user has chosen (turn green border)
  const [chosenGifIDs, setChosenGifIDs] = useState([]);
  // Whether to show only chosen GIFs
  const [showOnlyChosen, setShowOnlyChosen] = useState(false);

  // Flip states for each purple box (boxKey => boolean).
  const [flipMap, setFlipMap] = useState({});
  // Whether the chosen GIFs are “covered” by purple boxes
  const [covered, setCovered] = useState(false);

  // We'll pick a random GIF from the chosen set to guess
  const [targetGif, setTargetGif] = useState(null);
  // A message displayed at bottom: “Correct!” or “Wrong!” or empty
  const [feedback, setFeedback] = useState('');

  // Hard-coded environment vars
  const API_KEY = 'h2ysalzwiuIgc3MhIOqMocPo65NUwLkv';
  const BASE_URL = 'https://api.giphy.com/v1/gifs/search';

  const limitmin = 1;
  const limitmax = 100;

  // Merge new results with old data for localStorage, but only show new results on screen
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

      // Show only newly searched results on main page
      setGifs(newData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Choose/unchoose a GIF
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

  // Show only chosen GIFs on separate page
  const storeForLater = () => {
    setShowOnlyChosen(true);
  };

  // Undo: reset to normal search page
  const handleUndo = () => {
    setFlipMap({});
    setCovered(false);
    setTargetGif(null);
    setFeedback('');
    setShowOnlyChosen(false);
  };

  // Wipe: remove everything from localStorage and states
  const handleWipe = () => {
    localStorage.removeItem('chosenGifIDs');
    localStorage.removeItem('allGifs');
    setAllLocalGifs([]);
    setChosenGifIDs([]);
    setGifs([]);
    setFlipMap({});
    setCovered(false);
    setTargetGif(null);
    setFeedback('');
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

  // Flip a purple box
  const handleFlipBox = (gif, boxKey) => {
    // Flip or unflip
    setFlipMap((prev) => ({ ...prev, [boxKey]: !prev[boxKey] }));

    // If flipping to show, check correctness
    // If it matches the targetGif?.id => correct, else wrong
    // We'll pick a new random if correct
    if (!flipMap[boxKey]) {
      // means we are flipping from hidden -> visible
      if (targetGif && gif.id === targetGif.id) {
        setFeedback('Correct!');
        pickRandomTarget();
      } else {
        if (targetGif) {
          setFeedback('Wrong!');
        }
      }
    }
  };

  // Pick a random target from all chosen Gifs
  const pickRandomTarget = () => {
    // Only pick from chosen Gifs => filter from allLocalGifs
    const chosenList = allLocalGifs.filter((g) => chosenGifIDs.includes(g.id));
    if (chosenList.length === 0) {
      setTargetGif(null);
      setFeedback('');
      return;
    }
    const idx = Math.floor(Math.random() * chosenList.length);
    setTargetGif(chosenList[idx]);
    setFeedback('');
  };

  // Called when we click “Cover” => sets covered = true, picks a random target
  const handleCover = () => {
    setFlipMap({});
    setCovered(true);
    pickRandomTarget();
  };

  // If showing only chosen
  if (showOnlyChosen) {
    const displayed = allLocalGifs.filter((gif) => chosenGifIDs.includes(gif.id));

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '5px',
          padding: '20px',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        {displayed.map((gif, idx) => {
          const boxKey = gif.id + '-' + idx;
          const isFlipped = flipMap[boxKey] || false;

          // If not covered, show normal green-border Gifs
          if (!covered) {
            return (
              <div key={boxKey}>
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
            );
          }

          // else covered => purple box
          return (
            <div key={boxKey}>
              {isFlipped ? (
                // show the gif
                <div
                  style={{
                    border: '5px solid purple',
                    display: 'inline-block',
                    borderRadius: '5px',
                  }}
                  onClick={() => handleFlipBox(gif, boxKey)}
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
              ) : (
                // purple box covers the gif
                <div
                  onClick={() => handleFlipBox(gif, boxKey)}
                  style={{
                    width: '120px',
                    height: '120px',
                    backgroundColor: 'purple',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Wipe (left) */}
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

        {/* Cover (center) */}
        <button
          onClick={handleCover}
          disabled={covered}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px',
            backgroundColor: covered ? 'lightgray' : 'purple',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: covered ? 'not-allowed' : 'pointer',
          }}
        >
          Cover
        </button>

        {/* Undo (right) */}
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

        {/* Bottom feedback area: show target GIF + Correct/Wrong */}
        {covered && targetGif && (
          <div
            style={{
              position: 'fixed',
              bottom: '0',
              left: '0',
              width: '100%',
              backgroundColor: '#ddd',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontWeight: 'bold' }}>Your Random Gif to Find:</p>
            <img
              src={targetGif.images.fixed_height.url}
              alt={targetGif.title}
              style={{
                width: '150px',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '10px',
              }}
            />
            <p>{feedback}</p>
          </div>
        )}
      </div>
    );
  }

  // Otherwise, normal search page
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
