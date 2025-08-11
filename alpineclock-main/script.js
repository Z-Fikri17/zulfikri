document.addEventListener('alpine:init', () => {

  // Clock + Weather App
  Alpine.data('clockApp', () => ({
    timezone: "8",
    hourStyle: '',
    minuteStyle: '',
    secondStyle: '',
    digitalTime: '',
    weather: { temp: '', condition: '' },

    init() {
      this.updateClock();
      this.fetchWeather();
      setInterval(() => this.updateClock(), 1000);
      setInterval(() => this.fetchWeather(), 300000);
      this.$watch('timezone', () => this.updateClock());
    },

    updateClock() {
      const now = new Date();
      const offset = parseInt(this.timezone);
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const adjusted = new Date(utc + offset * 3600000);

      const hours = adjusted.getHours();
      const minutes = adjusted.getMinutes();
      const seconds = adjusted.getSeconds();

      const pad = n => n.toString().padStart(2, '0');
      this.digitalTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

      this.hourStyle = `transform: rotate(${((hours % 12) + minutes / 60) * 30}deg);`;
      this.minuteStyle = `transform: rotate(${minutes * 6}deg);`;
      this.secondStyle = `transform: rotate(${seconds * 6}deg);`;
    },

    fetchWeather() {
      fetch('https://weatherapi-com.p.rapidapi.com/current.json?q=Kuala Lumpur', {
        method: 'GET',
        headers: {
          'x-rapidapi-key': '1b41c8ed86msh7f13efae739721dp13f7adjsn93896355eb0e',
          'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com'
        }
      })
      .then(res => res.json())
      .then(data => {
        this.weather.temp = data.current.temp_c + "°C";
        this.weather.condition = data.current.condition.text;
      })
      .catch(err => {
        console.error("Weather fetch failed:", err);
        this.weather.temp = "N/A";
        this.weather.condition = "Unavailable";
      });
    }
  }));

  // News App
  Alpine.data('newsApp', () => ({
articles: [],
async fetchNews() {
try {
  const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/rss.xml");
  const data = await res.json();
  this.articles = data.items || [];
} catch (err) {
  console.error("RSS News fetch failed:", err);
}
}
}));


});