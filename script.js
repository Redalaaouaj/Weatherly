
        document.addEventListener('DOMContentLoaded', function () {
            const menuToggle = document.getElementById('menu-toggle');
            if (menuToggle) {
                document.addEventListener('click', function (e) {
                    if (!e.target.closest('.lg\\:hidden') && menuToggle.checked) {
                        menuToggle.checked = false;
                    }
                });
            }

            // Theme toggle functionality
            const themeToggles = document.querySelectorAll('input[type="checkbox"]');
            themeToggles.forEach(toggle => {
                if (toggle.closest('label.relative')) {
                    toggle.addEventListener('change', function() {
                        toggleTheme(this.checked);
                    });
                }
            });

            // °C / °F
            const celsiusRadio = document.getElementById('c');
            const fahrenheitRadio = document.getElementById('f');
            
            celsiusRadio.addEventListener('change', function() {
                if (this.checked && window.currentWeatherData) {
                    updateTemperatureUnits('celsius');
                }
            });
            
            fahrenheitRadio.addEventListener('change', function() {
                if (this.checked && window.currentWeatherData) {
                    updateTemperatureUnits('fahrenheit');
                }
            });

            // Handle search form
            const searchForm = document.getElementById('search-form');
            const searchInput = document.getElementById('search-input');
            
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const city = searchInput.value.trim();
                if (city) {
                    getWeatherByCity(city);
                }
            });

            // Initialize theme from localStorage
            const savedTheme = localStorage.getItem('theme') || 'light';
            const isDark = savedTheme === 'dark';
            themeToggles.forEach(toggle => {
                if (toggle.closest('label.relative')) {
                    toggle.checked = isDark;
                }
            });
            toggleTheme(isDark);
        });

        // Store current weather data globally for unit conversion
        window.currentWeatherData = null;
        window.currentTheme = 'dark';

        function toggleTheme(isDark) {
            window.currentTheme = isDark ? 'dark' : 'light';
            localStorage.setItem('theme', window.currentTheme);
            
            // Update body class for theme
            if (isDark) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
            
            // If we have weather data, update the background with the new theme
            if (window.currentWeatherData) {
                updateWeatherIcon(window.currentWeatherData.weather[0].main);
            }
        }

        function updateTemperatureUnits(unit) {
            if (!window.currentWeatherData) return;
            
            const data = window.currentWeatherData;
            let temp, feelsLike;
            
            if (unit === 'fahrenheit') {
                temp = Math.round((data.main.temp * 9/5) + 32);
                feelsLike = Math.round((data.main.feels_like * 9/5) + 32);
                document.getElementById('temp-unit').textContent = '°F';
                document.getElementById('feels-like-unit').textContent = '°F';
            } else {
                temp = Math.round(data.main.temp);
                feelsLike = Math.round(data.main.feels_like);
                document.getElementById('temp-unit').textContent = '°C';
                document.getElementById('feels-like-unit').textContent = '°C';
            }
            
            document.getElementById('current-temp').textContent = temp;
            document.getElementById('feels-like').textContent = feelsLike;
        }

        navigator.geolocation.getCurrentPosition(success, error);

        function success(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            console.log(`Latitude: ${lat}, Longitude: ${lon}`);
            getWeatherByCoords(lat, lon);
        }

        function error(err) {
            console.error(`ERROR(${err.code}): ${err.message}`);
            getWeatherByCoords(33.5928, -7.6192); // Default to Casablanca coordinates if geolocation fails
        }

        async function getWeatherByCoords(lat, lon) {
            const apiKey = 'fe2e871b6aa475581e7756c89d92cb3f';
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

            try {
                const [currentResponse, forecastResponse] = await Promise.all([
                    fetch(currentWeatherUrl),
                    fetch(forecastUrl)
                ]);
                
                const currentData = await currentResponse.json();
                const forecastData = await forecastResponse.json();
                
                console.log('Current weather:', currentData);
                console.log('Forecast data:', forecastData);
                
                updateWeatherDisplay(currentData);
                updateHourlyForecast(forecastData);
                updateDailyForecast(forecastData);
            } catch (error) {
                console.error('Error fetching weather data:', error);
                showErrorMessage('Unable to fetch weather data for your location.');
            }
        }

        async function getWeatherByCity(city) {
            const apiKey = 'fe2e871b6aa475581e7756c89d92cb3f';
            const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

            try {
                const [currentResponse, forecastResponse] = await Promise.all([
                    fetch(currentWeatherUrl),
                    fetch(forecastUrl)
                ]);
                
                if (currentResponse.ok && forecastResponse.ok) {
                    const currentData = await currentResponse.json();
                    const forecastData = await forecastResponse.json();
                    
                    console.log('Current weather:', currentData);
                    console.log('Forecast data:', forecastData);
                    
                    updateWeatherDisplay(currentData);
                    updateHourlyForecast(forecastData);
                    updateDailyForecast(forecastData);
                } else {
                    showErrorMessage(`City "${city}" not found. Please try another city.`);
                }
            } catch (error) {
                console.error('Error fetching weather data:', error);
                showErrorMessage('Unable to fetch weather data. Please try again.');
            }
        }

        function showErrorMessage(message) {
            alert(message);
        }

        function updateWeatherDisplay(data) {

            window.currentWeatherData = data;
            document.body.classList.add('loaded');
            
            const weatherIcon = document.querySelector('.weather-icon');
            weatherIcon.classList.remove('skeleton-loading');
            
            document.getElementById('current-location').innerHTML = `${data.name}, ${data.sys.country}`;
            
            document.getElementById('current-description').innerHTML = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
            
            const isFahrenheit = document.getElementById('f').checked;
            let temp, feelsLike;
            
            if (isFahrenheit) {
                temp = Math.round((data.main.temp * 9/5) + 32);
                feelsLike = Math.round((data.main.feels_like * 9/5) + 32);
                document.getElementById('temp-unit').textContent = '°F';
                document.getElementById('feels-like-unit').textContent = '°F';
            } else {
                temp = Math.round(data.main.temp);
                feelsLike = Math.round(data.main.feels_like);
                document.getElementById('temp-unit').textContent = '°C';
                document.getElementById('feels-like-unit').textContent = '°C';
            }
            
            document.getElementById('current-temp').textContent = temp;
            document.getElementById('feels-like').textContent = feelsLike;
            
            // Update weather details with API data
            document.getElementById('humidity').textContent = `${data.main.humidity}%`;
            document.getElementById('wind-speed').textContent = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
            document.getElementById('pressure').textContent = data.main.pressure;
            document.getElementById('visibility').textContent = Math.round(data.visibility / 1000); // Convert meters to km
            document.getElementById('cloudiness').textContent = data.clouds.all; // Cloud coverage percentage
            
            // Update weather icon based on weather condition
            updateWeatherIcon(data.weather[0].main);
        }

        function updateWeatherIcon(weatherMain) {
            const iconElement = document.querySelector('.weather-icon');
            const mainContainer = document.getElementById('main-container');
            const isDark = window.currentTheme === 'dark';
            let iconSVG = '';
            
            // Update background based on weather condition and theme
            switch(weatherMain.toLowerCase()) {
                case 'clouds':
                    mainContainer.className = isDark
                        ? 'min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 transition-all duration-1000'
                        : 'min-h-screen bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 transition-all duration-1000';
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" class="lucide lucide-cloud">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                        </svg>`;
                    break;
                case 'rain':
                case 'drizzle':
                    mainContainer.className = isDark
                        ? 'min-h-screen bg-gradient-to-br from-blue-800 via-indigo-800 to-blue-900 transition-all duration-1000'
                        : 'min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 transition-all duration-1000';
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-drizzle-icon lucide-cloud-drizzle"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v1"/><path d="M8 14v1"/><path d="M16 19v1"/><path d="M16 14v1"/><path d="M12 21v1"/><path d="M12 16v1"/></svg>`;
                    break;
                case 'snow':
                    mainContainer.className = isDark
                        ? 'min-h-screen bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 transition-all duration-1000'
                        : 'min-h-screen bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 transition-all duration-1000';
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" class="lucide lucide-cloud-snow">
                            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                            <path d="m8 21 1-3 1 3" />
                            <path d="m13 21 1-3 1 3" />
                            <path d="m17 21 1-3 1 3" />
                        </svg>`;
                    break;
                case 'thunderstorm':
                    mainContainer.className = isDark
                        ? 'min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black transition-all duration-1000'
                        : 'min-h-screen bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 transition-all duration-1000';
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" class="lucide lucide-cloud-lightning">
                            <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
                            <path d="m13 12-3 5h4l-3 5" />
                        </svg>`;
                    break;
                case 'mist':
                case 'fog':
                case 'haze':
                    mainContainer.className = isDark
                        ? 'min-h-screen bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 transition-all duration-1000'
                        : 'min-h-screen bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 transition-all duration-1000';
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" class="lucide lucide-cloud">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                        </svg>`;
                    break;
                default:
                    mainContainer.className = isDark
                        ? 'min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 transition-all duration-1000'
                        : 'min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 transition-all duration-1000';
                    iconSVG = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" class="lucide lucide-sun">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v2" />
                            <path d="M12 20v2" />
                            <path d="m4.93 4.93 1.41 1.41" />
                            <path d="m17.66 17.66 1.41 1.41" />
                            <path d="M2 12h2" />
                            <path d="M20 12h2" />
                            <path d="m6.34 17.66-1.41 1.41" />
                            <path d="m19.07 4.93-1.41 1.41" />
                        </svg>`;
            }
            
            if (iconElement) {
                iconElement.innerHTML = iconSVG;
            }
        }

        function updateHourlyForecast(forecastData) {
            const hourlyContainer = document.querySelector('.grid.grid-cols-3.md\\:grid-cols-6');
            if (!hourlyContainer) return;

            // Get the next 6 forecast entries (18 hours ahead, 3-hour intervals)
            const next6Forecasts = forecastData.list.slice(0, 6);
            
            hourlyContainer.innerHTML = '';

            next6Forecasts.forEach((forecast, index) => {
                const forecastTime = new Date(forecast.dt * 1000);
                const hours = forecastTime.getHours().toString().padStart(2, '0');
                const minutes = forecastTime.getMinutes().toString().padStart(2, '0');
                const timeString = `${hours}:${minutes}`;
                
                const isFahrenheit = document.getElementById('f').checked;
                const temp = isFahrenheit 
                    ? Math.round((forecast.main.temp * 9/5) + 32)
                    : Math.round(forecast.main.temp);
                const unit = isFahrenheit ? '°F' : '°C';
                
                const weatherMain = forecast.weather[0].main.toLowerCase();
                let iconSVG = '';
                
                switch(weatherMain) {
                    case 'clear':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-sun">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2" />
                                <path d="M12 20v2" />
                                <path d="m4.93 4.93 1.41 1.41" />
                                <path d="m17.66 17.66 1.41 1.41" />
                                <path d="M2 12h2" />
                                <path d="M20 12h2" />
                                <path d="m6.34 17.66-1.41 1.41" />
                                <path d="m19.07 4.93-1.41 1.41" />
                            </svg>`;
                        break;
                    case 'clouds':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-cloud">
                                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                            </svg>`;
                        break;
                    case 'rain':
                    case 'drizzle':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-drizzle-icon lucide-cloud-drizzle"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 19v1"/><path d="M8 14v1"/><path d="M16 19v1"/><path d="M16 14v1"/><path d="M12 21v1"/><path d="M12 16v1"/></svg>`;
                        break;
                    case 'snow':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-cloud-snow">
                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                <path d="m8 21 1-3 1 3" />
                                <path d="m13 21 1-3 1 3" />
                                <path d="m17 21 1-3 1 3" />
                            </svg>`;
                        break;
                    case 'thunderstorm':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-cloud-lightning">
                                <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
                                <path d="m13 12-3 5h4l-3 5" />
                            </svg>`;
                        break;
                    default:
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-sun">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12 2v2" />
                                <path d="M12 20v2" />
                                <path d="m4.93 4.93 1.41 1.41" />
                                <path d="m17.66 17.66 1.41 1.41" />
                                <path d="M2 12h2" />
                                <path d="M20 12h2" />
                                <path d="m6.34 17.66-1.41 1.41" />
                                <path d="m19.07 4.93-1.41 1.41" />
                            </svg>`;
                }

                const forecastCard = document.createElement('div');
                forecastCard.className = 'bg-gray-300 w-22 lg:w-28 h-32 rounded-2xl';
                forecastCard.innerHTML = `
                    <div class="flex flex-col items-center justify-between h-full p-2">
                        <p class="text-sm">${timeString}</p>
                        ${iconSVG}
                        <p class="text-lg">${temp}${unit}</p>
                    </div>
                `;
                
                hourlyContainer.appendChild(forecastCard);
            });
        }

        function updateDailyForecast(forecastData) {
            const dailyContainer = document.querySelector('#dd');
            if (!dailyContainer) return;

            // Group forecast data by day (each day has 8 entries - 3-hour intervals)
            const dailyForecasts = [];
            const processedDays = new Set();
            
            for (let i = 0; i < forecastData.list.length; i += 8) {
                const dayData = forecastData.list.slice(i, i + 8);
                if (dayData.length === 0) continue;
                
                const date = new Date(dayData[0].dt * 1000);
                const dayKey = date.toDateString();
                
                if (processedDays.has(dayKey)) continue;
                processedDays.add(dayKey);
                
                // Calculate daily min/max temperatures
                let minTemp = Math.min(...dayData.map(item => item.main.temp_min));
                let maxTemp = Math.max(...dayData.map(item => item.main.temp_max));
                
                // Convert temperatures if needed
                const isFahrenheit = document.getElementById('f').checked;
                if (isFahrenheit) {
                    minTemp = Math.round((minTemp * 9/5) + 32);
                    maxTemp = Math.round((maxTemp * 9/5) + 32);
                } else {
                    minTemp = Math.round(minTemp);
                    maxTemp = Math.round(maxTemp);
                }
                
                // Get the most common weather condition for the day
                const weatherCounts = {};
                dayData.forEach(item => {
                    const weather = item.weather[0].main;
                    weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
                });
                
                const dominantWeather = Object.keys(weatherCounts).reduce((a, b) => 
                    weatherCounts[a] > weatherCounts[b] ? a : b
                );
                
                // Calculate average humidity
                const avgHumidity = Math.round(dayData.reduce((sum, item) => sum + item.main.humidity, 0) / dayData.length);
                
                dailyForecasts.push({
                    date: date,
                    dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    weather: dominantWeather,
                    minTemp: minTemp,
                    maxTemp: maxTemp,
                    humidity: avgHumidity
                });
                
                if (dailyForecasts.length >= 5) break;
            }
            
            // Clear existing content
            dailyContainer.innerHTML = '';
            
            // Generate forecast cards
            dailyForecasts.forEach((forecast, index) => {
                const weatherMain = forecast.weather.toLowerCase();
                let iconSVG = '';
                
                switch(weatherMain) {
                    case 'clear':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-sun">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2" />
                                <path d="M12 20v2" />
                                <path d="m4.93 4.93 1.41 1.41" />
                                <path d="m17.66 17.66 1.41 1.41" />
                                <path d="M2 12h2" />
                                <path d="M20 12h2" />
                                <path d="m6.34 17.66-1.41 1.41" />
                                <path d="m19.07 4.93-1.41 1.41" />
                            </svg>`;
                        break;
                    case 'clouds':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-cloud">
                                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                            </svg>`;
                        break;
                    case 'rain':
                    case 'drizzle':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-cloud-drizzle">
                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                                <path d="M8 19v1"/>
                                <path d="M8 14v1"/>
                                <path d="M16 19v1"/>
                                <path d="M16 14v1"/>
                                <path d="M12 21v1"/>
                                <path d="M12 16v1"/>
                            </svg>`;
                        break;
                    case 'snow':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-cloud-snow">
                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                <path d="m8 21 1-3 1 3" />
                                <path d="m13 21 1-3 1 3" />
                                <path d="m17 21 1-3 1 3" />
                            </svg>`;
                        break;
                    case 'thunderstorm':
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-cloud-lightning">
                                <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
                                <path d="m13 12-3 5h4l-3 5" />
                            </svg>`;
                        break;
                    default:
                        iconSVG = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" class="lucide lucide-sun">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2" />
                                <path d="M12 20v2" />
                                <path d="m4.93 4.93 1.41 1.41" />
                                <path d="m17.66 17.66 1.41 1.41" />
                                <path d="M2 12h2" />
                                <path d="M20 12h2" />
                                <path d="m6.34 17.66-1.41 1.41" />
                                <path d="m19.07 4.93-1.41 1.41" />
                            </svg>`;
                }
                
                const unit = document.getElementById('f').checked ? '°F' : '°C';
                
                const forecastCard = document.createElement('div');
                forecastCard.className = 'flex items-center justify-between bg-gray-300 p-4 rounded-lg gap-6 flex-wrap';
                forecastCard.innerHTML = `
                    <div class="flex items-center gap-4">
                        <span class="text-gray-900 font-medium">${forecast.dayName}</span>
                        ${iconSVG}
                    </div>
                    <span class="text-gray-900 font-medium">max: ${forecast.maxTemp}${unit}</span>
                    <span class="text-gray-900 font-medium">min: ${forecast.minTemp}${unit}</span>
                    <span class="text-gray-900 font-medium">Humidity: ${forecast.humidity}%</span>
                `;
                
                dailyContainer.appendChild(forecastCard);
            });
        }

