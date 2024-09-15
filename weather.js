function getWeather() {
    const city = document.getElementById('city-input').value;

    fetch(`https://nominatim.openstreetmap.org/search?city=${city}&format=json`)
        .then(response => response.json())
        .then(locationData => {
            if (locationData.length > 0) {
                const { lat, lon } = locationData[0];

                const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=apparent_temperature,precipitation_probability,temperature_2m,relative_humidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,daylight_duration,weathercode&timezone=auto`;

                fetch(apiUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch weather data');
                        }
                        return response.json();
                    })
                    .then(weatherData => {
                        const currentWeather = weatherData.current_weather;
                        const humidity = weatherData.hourly.relative_humidity_2m[0];
                        const daylight = weatherData.daily.daylight_duration[0];
                        const weatherCode = currentWeather.weathercode;
                        const apparentTemp = weatherData.hourly.apparent_temperature[0];
                        const currentPrecip = weatherData.hourly.precipitation_probability[0];

                        const daylightHours = Math.floor(daylight / 3600);
                        const daylightMinutes = Math.floor((daylight % 3600) / 60);

                        let iconSrc = '', wCode = '';
                        if (weatherCode >= 0 && weatherCode <= 2) {
                            iconSrc = 'assets/Sunshine.png'; // Sunny
                            wCode = "Nice";
                        } else if (weatherCode >= 3 && weatherCode <= 7) {
                            iconSrc = 'assets/Clouds.png'; // Cloudy
                            wCode = "Somewhat okay";
                        } else if (weatherCode >= 8) {
                            iconSrc = 'assets/Rain.png'; // Rainy
                            wCode = "Not nice";
                        }

                        const dailyData = weatherData.daily;
                        const dailyForecasts = dailyData.time.map((date, index) => {
                            const maxTemp = dailyData.temperature_2m_max[index];
                            const minTemp = dailyData.temperature_2m_min[index];
                            const precipitation = dailyData.precipitation_sum[index];                    
                            const daylight = dailyData.daylight_duration[index];
                            const daylightHours = Math.floor(daylight / 3600);
                            const daylightMinutes = Math.floor((daylight % 3600) / 60);

                            let forecastIcon = '';
                            const forecastWeatherCode = dailyData.weathercode[index];
                            if (forecastWeatherCode >= 0 && forecastWeatherCode <= 2) {
                                forecastIcon = 'assets/Sunshine.png'; // Sunny
                            } else if (forecastWeatherCode >= 3 && forecastWeatherCode <= 7) {
                                forecastIcon = 'assets/Clouds.png'; // Cloudy
                            } else if (forecastWeatherCode >= 8) {
                                forecastIcon = 'assets/Rain.png'; // Rainy
                            }

                            return `
                                <div class="forecast-day" data-index="${index}" data-date="${new Date(date).toLocaleDateString('en-US', {weekday:'long'})}">
                                    <h3>${new Date(date).toLocaleDateString('en-US', {weekday:'long'})}</h3>
                                    <img src="${forecastIcon}" alt="Weather icon for ${new Date(date).toLocaleDateString('en-US', {weekday:'long'})}">
                                    <p>Max Temp: ${maxTemp}°C</p>
                                    <p>Min Temp: ${minTemp}°C</p>
                                    <p>Precipitation: ${precipitation} mm</p>
                                    <p>Daylight Duration: ${daylightHours} hours ${daylightMinutes} minutes</p>
                                </div>
                            `;
                        }).join('');

                        const weatherInfo = `
                            <div class="weather-section">
                            <h2>Weather in ${city}</h2>
                            <img src="${iconSrc}" alt="Current weather icon">
                            <p>Temperature: ${currentWeather.temperature}°C</p>
                            <p>Feels like: ${apparentTemp}°C</p>
                            <p>Condition: ${weatherCode} (${wCode})</p>
                            <p>Wind Speed: ${currentWeather.windspeed} km/h</p>
                            <p>Humidity: ${humidity}% (${currentPrecip}% chance of a bad time)</p>
                            <p>Daylight Duration: ${daylightHours} hours ${daylightMinutes} minutes</p>
                            </div>
                            <div class="weather-section">
                            <h2>7-Day Forecast</h2>
                            <div class="forecast-container">${dailyForecasts}</div>
                            </div>
                        `;
                        document.getElementById('weather-display').innerHTML = weatherInfo;

                        const forecastDays = document.querySelectorAll('.forecast-day');
                        forecastDays.forEach(day => {
                            day.addEventListener('click', function() {
                                const dayIndex = this.getAttribute('data-index');
                                const dayDate = this.getAttribute('data-date');
                                getHourlyData(weatherData.hourly, dayIndex, dayDate);
                            });
                        });
                    })
                    .catch(error => {
                        console.error('Weather Data Error:', error);
                        document.getElementById('weather-display').innerHTML = 'Error fetching weather data';
                    });
            } else {
                document.getElementById('weather-display').innerHTML = 'City not found';
            }
        })
        .catch(error => {
            console.error('Location Data Error:', error);
            document.getElementById('weather-display').innerHTML = 'Error fetching location data';
        });
}

function getHourlyData(hourlyData, dayIndex, dayDate) {
    const startIndex = dayIndex * 24;
    const hourlyChunks = 2;

    let hourlyDisplayHtml = `<div class="hourly-forecast"><h2>Hourly Forecast for ${dayDate}</h2>`;
    hourlyDisplayHtml += '<div class="hourly-data">';

    for (let i = startIndex; i < startIndex + 24; i += hourlyChunks) {
        const time = i % 24;
        const temp = hourlyData.temperature_2m[i];
        const humidity = hourlyData.relative_humidity_2m[i];
        const windSpeed = hourlyData.windspeed_10m[i];
        const precipitation = hourlyData.precipitation_probability[i];
        const apparentTemp = hourlyData.apparent_temperature[i];
        const dateDay = dayDate;

        hourlyDisplayHtml += `
            <div class="hourly-block">
                <h4>${time}:00</h4>
                <p>Temp: ${temp}°C</p>
                <p>Feels like: ${apparentTemp}°C</p>
                <p>Humidity: ${humidity}%</p>
                <p>Precipitation: ${precipitation}%</p>
                <p>Wind Speed: ${windSpeed} km/h</p>
            </div>
        `;
    }

    hourlyDisplayHtml += '</div>';
    document.getElementById('hourly-display').innerHTML = hourlyDisplayHtml;
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            tabContents.forEach(content => content.classList.remove('active'));
            const targetTab = this.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();

    document.getElementById('get-weather').addEventListener('click', getWeather);
    document.getElementById('city-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            getWeather();
        }
    });
});

