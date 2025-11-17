import { useState } from "react";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const BASE_URL = "https://api.open-meteo.com/v1/forecast";

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeatherForCity = async () => {
    setError("");
    setWeather(null);

    const q = city.trim();
    if (!q) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);

    try {
      // 1) Geocode the city name -> get latitude & longitude
      const geoRes = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(q)}&count=5&language=en`);
      const geoJson = await geoRes.json();

      if (!geoJson || !geoJson.results || geoJson.results.length === 0) {
        setError("City not found. Try a different name or spelling.");
        setLoading(false);
        return;
      }

      // Use the first (best) result
      const place = geoJson.results[0];
      const lat = place.latitude;
      const lon = place.longitude;
      const displayName = `${place.name}${place.admin1 ? ", " + place.admin1 : ""}${place.country ? ", " + place.country : ""}`;

      // 2) Fetch current weather from Open-Meteo
      // Using current_weather=true returns an object with temperature and windspeed
      const weatherRes = await fetch(
        `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
      );
      const weatherJson = await weatherRes.json();

      if (!weatherJson || !weatherJson.current_weather) {
        setError("Weather data not available for this location.");
        setLoading(false);
        return;
      }

      setLocationName(displayName);
      setWeather(weatherJson.current_weather);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while fetching data. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") fetchWeatherForCity();
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-600 px-4">
    <div className="w-full max-w-md bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-white/30">
      <h1 className="text-3xl font-bold text-white text-center mb-6 drop-shadow-lg">
        Weather App
      </h1>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search any city..."
          className="w-full p-3 rounded-xl outline-none bg-white/80 shadow-md focus:ring-2 focus:ring-blue-500 transition"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={fetchWeatherForCity}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "..." : "Go"}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-red-200 text-center text-sm font-medium">
          {error}
        </p>
      )}

      {weather && (
        <div className="mt-6 p-5 bg-white/30 backdrop-blur-md rounded-xl shadow-lg text-white border border-white/20">
          <p className="text-sm opacity-90">{locationName}</p>

          <p className="text-4xl font-bold mt-2">
            {weather.temperature}°C
          </p>

          <p className="text-lg font-medium mt-1">
            💨 {weather.windspeed} m/s Wind
          </p>

          {weather.winddirection !== undefined && (
            <p className="text-sm mt-1">
              Direction: {weather.winddirection}°
            </p>
          )}

          <p className="text-xs mt-3 opacity-80">
            Time: {weather.time}
          </p>
        </div>
      )}

      {!weather && !error && !loading && (
        <p className="mt-6 text-center text-white/80 text-sm">
          Search any city to view weather details.
        </p>
      )}
    </div>
  </div>
);

}
