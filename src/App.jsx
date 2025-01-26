// This code allows a user to search for Gifs using the Giphy API, select certain ones (chosenGifIDs), and then "Store For Later".
// In that mode, Gifs become purple boxes that can be flipped to reveal if they match a random Giphy displayed at the bottom.
// Once all chosen Gifs are guessed, the game says "You Won!".

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function App() {
  // allLocalGifs: stores every Gif fetched so far (old + new). Helps preserve data across multiple searches.
  const [allLocalGifs, setAllLocalGifs] = useState([]);

  // gifs: the Gifs displayed on the normal search page (only the newly searched results).
  const [gifs, setGifs] = useState([]);

  // search: the user's search query string.
  const [search, setSearch] = useState('');

  // limit: how many Gifs to fetch per search.
  const [limit, setLimit] = useState(17);

  // loading: whether we are currently fetching Gifs.
  const [loading, setLoading] = useState(false);

  // chosenGifIDs: IDs of Gifs that the user has chosen (clicked "Choose").
  // In the covered mode, these become purple boxes.
  const [chosenGifIDs, setChosenGifIDs] = useState([]);

  // showOnlyChosen: if true, we display only the chosen Gifs in a separate page.
  const [showOnlyChosen, setShowOnlyChosen] = useState(false);

  // covered: whether the chosen Gifs are covered by purple boxes.
  const [covered, setCovered] = useState(false);

  // flipMap: an object mapping unique keys (gif.id + index) to boolean indicating if that purple box is flipped.
  const [flipMap, setFlipMap] = useState({});

  // randomGif: the currently selected "target" Gif the user must find among the purple boxes.
  const [randomGif, setRandomGif] = useState(null);

  // score: how many correct guesses so far.
  const [score, setScore] = useState(0);

  // gameComplete: whether the user has guessed all chosen Gifs.
  const [gameComplete, setGameComplete] = useState(false);

  // Hard-coded environment variables for the Giphy API.
  const API_KEY = 'h2ysalzwiuIgc3MhIOqMocPo65NUwLkv';
  const BASE_URL = 'https://api.giphy.com/v1/gifs/search';

  // Range for user to set the limit, if desired.
  const limitmin = 1;
  const limitmax = 100;

  // searchGifs: fetches new Gifs from the Giphy API, merges them with old.
  // displays only the newly fetched Gifs in 'gifs'.
  const searchGifs = async () => {
    setLoading(true);
    try {
      // Make an HTTP GET request to the Giphy API.
      const response = await axios.get(BASE_URL, {
        params: { api_key: API_KEY, q: search, limit },
      });
      const newData = response.data.data;

      // Merge new results with any old stored Gifs.
      const newIDs = newData.map((g) => g.id);
      const oldNoDuplicates = allLocalGifs.filter(
        (oldGif) => !newIDs.includes(oldGif.id)
      );
      const mergedAll = [...oldNoDuplicates, ...newData];

      // Save the updated list to localStorage.
      localStorage.setItem('allGifs', JSON.stringify(mergedAll));

      // Update states.
      setAllLocalGifs(mergedAll);
      setGifs(newData); // Only show new results on the main page.
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // chooseGif: toggles whether a Gif is in the chosenGifIDs array or not.
  // Also saves the updated array to localStorage.
  const chooseGif = (gifId) => {
    setChosenGifIDs((prev) => {
      let updated;
      if (prev.includes(gifId)) {
        // If it's already chosen, remove it.
        updated = prev.filter((id) => id !== gifId);
      } else {
        // Otherwise, add it.
        updated = [...prev, gifId];
      }
      localStorage.setItem('chosenGifIDs', JSON.stringify(updated));
      return updated;
    });
  };

  // downloadGif: downloads a Gif from its URL.
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

  // storeForLater: sets showOnlyChosen = true, so we see only the chosen Gifs page.
  const storeForLater = () => {
    setShowOnlyChosen(true);
  };

  {// handleFlipBox: called when user clicks a purple box.
  // If the flipped Gif is correct, increment score and remove that Gif after 2.5s.
  // Then pick the next random.
  // handleFlipBox: called when user clicks a purple box.
// If the flipped Gif is correct, increment score and remove that Gif after 1s.
// Otherwise, revert it after 1s. Then pick the next random if it was correct.
  }
  const handleFlipBox = (boxKey, gif) => {
    if (gameComplete) return;
  
    const wasFlipped = !flipMap[boxKey];
    
    setFlipMap((prev) => ({
      ...prev,
      [boxKey]: wasFlipped,
    }));
  
    if (wasFlipped && randomGif) {
      if (gif.id === randomGif.id) {
        // Correct match - increment score
        setScore((p) => p + 1);
  
        setTimeout(() => {
          // Remove the matched GIF from the pool
          setChosenGifIDs((prev) => {
            const updated = prev.filter((id) => id !== gif.id);
            localStorage.setItem('chosenGifIDs', JSON.stringify(updated));
            return updated;
          });
          
          // Pick new random GIF from remaining pool
          pickRandomGif();
        }, 1000);
      } else {
        // Incorrect match - revert flip after delay
        setTimeout(() => {
          setFlipMap((prev) => ({ 
            ...prev, 
            [boxKey]: false 
          }));
        }, 1000);
      }
    }
  };

  // handleWipe: clears everything from localStorage, resets states, unless the game is ongoing.
  const handleWipe = () => {
    // If game is not complete but covered => do nothing.
    if (covered && !gameComplete) return;

    localStorage.removeItem('chosenGifIDs');
    localStorage.removeItem('allGifs');
    setAllLocalGifs([]);
    setChosenGifIDs([]);
    setGifs([]);
    setFlipMap({});
    setCovered(false);
    setRandomGif(null);
    setGameComplete(false);
    setScore(0);
  };

  // handleUndo: goes back to normal search page, if allowed.
  const handleUndo = () => {
    // If game is not complete but covered => do nothing.
    if (covered && !gameComplete) return;

    setFlipMap({});
    setCovered(false);
    setRandomGif(null);
    setGameComplete(false);
    setScore(0);
    setShowOnlyChosen(false);
  };

  // pickRandomGif: selects a random Gif from the chosenGifIDs as the next target.
  // If none remain => gameComplete.

  const pickRandomGif = () => {
    // Filter the chosen Gifs from allLocalGifs
    const chosenList = allLocalGifs.filter((g) => chosenGifIDs.includes(g.id));
  
    // If no chosen Gifs are left, declare the game as complete
    if (chosenList.length === 0) {
      setGameComplete(true);
      return;
    }
  
    
  
    // Select a random index within the decreasing range (0 to maxIdx)
    const idx = Math.floor(Math.random() * chosenList.length);
    // Set the randomly chosen Gif as the target
    setRandomGif(chosenList[idx +1]);
   console.log(idx);
    console.log(chosenList.length);
    console.log(chosenList[idx]);
  };
  

  // handleCover: covers all chosen Gifs with purple boxes and picks the first random.
  const handleCover = () => {
    if (chosenGifIDs.length === 0) return; // no chosen => do nothing.

    setCovered(true);
    setFlipMap({});
    setScore(0);
    setGameComplete(false);
    pickRandomGif();
  };

  // handleRematch: resets coverage, flips, random, etc. to allow replay with the same chosen Gifs.
  const handleRematch = () => {
    setFlipMap({});
    setCovered(false);
    setGameComplete(false);
    setScore(0);
    setRandomGif(null);
    // chosenGifIDs remain, so you can re-cover them.
  };

  // useEffect: on first load, read from localStorage (allGifs + chosenGifIDs) so user data persists.
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

  // Basic dark/light theme toggling.
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage on mount.
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Switch between dark or light mode.
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  // Whenever isDarkMode changes, adjust the document body style.
  useEffect(() => {
    if (isDarkMode) {
      document.body.style.backgroundColor = 'black';
      document.body.style.color = 'white';
    } else {
      document.body.style.backgroundColor = 'white';
      document.body.style.color = 'black';
    }
  }, [isDarkMode]);

  // If we are showing only chosen Gifs.
  if (showOnlyChosen) {
    // displayed: all the Gifs that are currently chosen.
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

          // If not covered, just show normal Gifs.
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
          } else {
            // If covered, show purple box or flipped.
            return (
              <div key={boxKey}>
                {isFlipped ? (
                  <div
                    style={{
                      border: '5px solid purple',
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
                ) : (
                  <div
                    onClick={() => handleFlipBox(boxKey, gif)}
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
          }
        })}


        {/* If gameComplete => show "You Won" overlay with score and a rematch button. */}
        {gameComplete && (
  <div
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '40px',
      borderRadius: '15px',
      textAlign: 'center',
      boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
      zIndex: 1000,
    }}
  >
    <h1 style={{ fontSize: '2.5em', margin: '0 0 20px 0' }}>
      🎉 Congratulations! 🎉
    </h1>
    <h2 style={{ fontSize: '2em', margin: '0 0 30px 0' }}>
      You scored: {score}
    </h2>
    <button
      onClick={handleRematch}
      style={{
        padding: '15px 30px',
        fontSize: '1.2em',
        backgroundColor: '#4CAF50',
        color: 'white',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
      onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
    >
      Play Again
    </button>
  </div>
)}
        {/* Wipe => clears everything; disabled if game in progress. */}
        <button
          onClick={handleWipe}
          disabled={covered && !gameComplete}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            padding: '10px',
            backgroundColor:
              covered && !gameComplete ? 'lightgray' : 'red',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor:
              covered && !gameComplete ? 'not-allowed' : 'pointer',
          }}
        >
          Wipe
        </button>

        {/* Cover => let user guess among purple boxes. Disabled if no chosen, or already covered. */}
        <button
          onClick={handleCover}
          disabled={covered || displayed.length === 0}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px',
            backgroundColor:
              covered || displayed.length === 0 ? 'lightgray' : 'purple',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor:
              covered || displayed.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Cover
        </button>

        {/* Undo => reverts to normal search page; disabled if game not complete yet. */}
        <button
          onClick={handleUndo}
          disabled={covered && !gameComplete}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px',
            backgroundColor:
              covered && !gameComplete ? 'lightgray' : 'gray',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: covered && !gameComplete ? 'not-allowed' : 'pointer',
          }}
        >
          Undo
        </button>

        {/* If covered and not complete => show randomGif at bottom. The user tries to find it among the purple boxes. */}
        
{covered && !gameComplete && randomGif && (
  <div
    style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      backgroundColor: '#ddd',
      borderTop: '2px solid #ccc',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
    }}
  >
    <h3>Find This Gif</h3>
    <img
      src={randomGif.images.fixed_height.url}
      alt={randomGif.title}
      style={{
        width: '150px',
        height: '150px',
        objectFit: 'cover',
        borderRadius: '10px',
      }}
    />
    <p>Score: {score}</p>
  </div>
)}
      </div>
    );
  }

  // Normal search page.

  // handleRematch: reset coverage, flips, random, etc.
  // but keep chosenGifIDs so the user can replay with the same Gifs.
 

  return (
    <div>
      {/* Toggle for dark or light theme */}
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
        <h1>Search Giphy:</h1>
        {/* The search input, user types a query, can press Enter or the Search button. */}
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

        {/* If loading => show a spinner, else show the Gifs. */}
        {loading ? (
          <p>
            <img src='../public/bally.svg' alt='loading' />
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
                  {/* Each Gif has two buttons: Download, Choose. */}
                  <div style={{ marginTop: '5px' }}>
                    <button
                      onClick={() => downloadGif(gif.images.fixed_height.url, gif.id)}
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

        {/* Store selected for later => showOnlyChosen mode. */}
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
