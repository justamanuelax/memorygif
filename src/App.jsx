import  { useEffect, useState } from 'react';
import axios from 'axios';

function App() {

  const [gifs, setgifs] = useState([]);  // To store gif data
  const [search, setSearch] = useState(''); // for search strings
  const [loading, setloading] = useState(false); // for loading state
  const [limit, setlimit] = useState(17); // for limit of gifs
  
  const API_KEY = import.meta.env.VITE_API_KEY;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // function to search gifs
  
  const limitmin = 1;
  const limitmax = 100;
  const searchgifs = async () => {
    setloading(true);
    try {
      const response = await axios.get(`${BASE_URL}`, {
        params: {
          api_key: API_KEY,
          q: search,
          limit: limit,
        }
      });
      setgifs(response.data.data);
    
    } catch (error) {
      console.log("Error fetching data" + error);

    }finally{
      setloading(false);
    }
  } 
  const downloadGif = async (gifUrl, gifid) => {
    try {
      const res = await fetch(gifUrl);
      const blob = await res.blob();
      // create a temporary link element for the gif
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gif : ${gifid}.gif`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error downloading gif", error);
      
    }
  }


  // Using the the chooseGif function : Make the Gif have a green box around the 
 const chooseGif = (gifyid) => {
 gifs.map((gify) => {
   const isSelected = gify.id === gifyid;
   if(isSelected){
     return (
       <div>
          <img
            key={gify.id}
            src={gify.images.fixed_height.url}
            alt={gify.title}
            style={{ border:"5px green solid"}}
          />
          {setgifs(newGifs)}
        </div>
      );
    }
  });
  
  
};
  
        
        
  
  
        
        
        
      
  //useEffect logic for search
 
  useEffect(() => {
  searchgifs();    
}, []);
  // Toggle for Dark Mode and Light Mode

  // Step 1: Create a state variable and a setter function to toggle the theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Step 2: Use effect to load the saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Step 3: Toggle the theme and save the choice to localStorage
  const toggleTheme = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      
      
      return newMode;
    });
  };

  // Step 4: Apply the theme to the document body
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
      <span>{isDarkMode ? '🌙' : '☀️'}</span>
      &nbsp;
      <input type='range' onChange={toggleTheme}  min={0}  max={1} style={{width : "40px"}}/>
      
<div style={{textAlign: "center", padding: "20px"}}>
    
    <h1>Search Giphy : </h1> 
    <input 
      type='text' 
      placeholder='search gifs' 
      value={search} 
      onChange={(e) => setSearch(e.target.value)} 
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          searchgifs();
        }
      }}
      style={{
        padding: "10px", 
        width: "500px", 
        marginBottom: "10px", 
        borderRadius: "5px", 
        border: "1px solid #ccc"
      }} 
    />
    
    <button 
      onClick={() => searchgifs()}
      
      style={{
        padding: "10px",
        margin: "10px",
        backgroundColor: "blue",
        color: "white",
        borderRadius: "5px",
        border: "none",
        cursor: "pointer"
      }}
      >
      Search
    </button>
    <br/>
    <input type='range' value={limit} min={limitmin} max={limitmax} style={{width: "800px"}} onChange={(e) => setlimit(e.target.value)}/>
    <br/>
    <p>Range: <input type='num' style={{width: "30px"}} value={limit} onChange={(e) => setlimit(e.target.value)}/></p>
    <br/>
    {loading ? (
      <p><img src='../public/bally.svg' alt='ballbounce'/></p>
    ) : (
      <div 
      style={{
          display: 'grid', 
          gap: "3px", 
          marginTop: "10px", 
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))"
        }}
      >
        {gifs.map((gif) => (
          <div key={gif.id}>
            <img 
              src={gif.images.fixed_height.url} 
              alt={gif.title} 
              style={{
                width: "120px", 
                height: "120px", 
                objectFit: "cover", 
                borderRadius: "10px"
              }}
            />
            <button onClick={() => downloadGif(gif.images.fixed_height.url, gif.id)} style={{marginTop: "3px", padding: "3px", color: 'brown', backgroundColor: "#f9f9f9", borderRadius: "3px", cursor: "copy"}}>&nbsp;Download Gif&nbsp;</button>    
            <button onClick={() => chooseGif(gif.id)} style={{margin: "2px", padding: "3px", color: 'red', backgroundColor: "#f9f9f9", borderRadius: "3px"}}>&nbsp;Choose Gif&nbsp;</button>          
          </div> 
        ))} 
      </div>
    )}
  </div>
    </div>
  )  
}
// Add comments to the code to make it more readable and understandable 

export default App;

