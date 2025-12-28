const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-text');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');

const forecastItemsContainer = document.querySelector('.forecast-items-container');
const suggestionsList = document.querySelector('.suggestions-list');

const apiKey = '479c8f15d632ca5a2d30ccca7f39d565';

async function fetchCitySuggestions(query) {
    if (query.length < 2) {
        suggestionsList.style.display = 'none';
        return;
    }

    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=7&appid=${apiKey}`;
        const geoResponse = await fetch(geoUrl);
        const geoCities = await geoResponse.json();

        suggestionsList.innerHTML = '';

        for (const city of geoCities) {
            const cityName = city.name;

            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();

            if (weatherData.cod !== 200) continue;

            const li = document.createElement('li');
            li.textContent = cityName;

            li.addEventListener('click', () => {
                cityInput.value = cityName;
                suggestionsList.style.display = 'none';
                updateWeatherInfo(cityName);
            });

            suggestionsList.appendChild(li);
        }

        suggestionsList.style.display =
            suggestionsList.children.length ? 'block' : 'none';

    } catch {
        suggestionsList.style.display = 'none';
    }
}

cityInput.addEventListener('input', () => {
    fetchCitySuggestions(cityInput.value.trim());
});

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) return;

    suggestionsList.style.display = 'none';
    updateWeatherInfo(city);
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (!city) return;

        suggestionsList.style.display = 'none';
        updateWeatherInfo(city);
    }
});

async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    return response.json();
}

function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.png';
    if (id <= 321) return 'drizzle.png';
    if (id <= 531) return 'rain.png';
    if (id <= 622) return 'snow.png';
    if (id <= 781) return 'tornado.png';
    if (id <= 800) return 'clear.png';
    return 'clouds.png';
}

function getCurrentDate() {
    const date = new Date();
    return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
}

async function updateWeatherInfo(city) {
    try {
        const weatherData = await getFetchData('weather', city);

        if (weatherData.cod !== 200) {
            showDisplaySection(notFoundSection);
            return;
        }

        const {
            name,
            main: { temp, humidity },
            weather: [{ id, main }],
            wind: { speed }
        } = weatherData;

        countryTxt.textContent = name;
        tempTxt.textContent = Math.round(temp) + ' °C';
        conditionTxt.textContent = main;
        humidityValueTxt.textContent = humidity + '%';
        windValueTxt.textContent = speed + ' m/s';

        currentDateTxt.textContent = getCurrentDate();
        weatherSummaryImg.src = `images/${getWeatherIcon(id)}`;

        await updateForecastsInfo(city);
        showDisplaySection(weatherInfoSection);
    } catch {
        showDisplaySection(notFoundSection);
    }
}

async function updateForecastsInfo(city) {
    const forecastData = await getFetchData('forecast', city);

    const today = new Date().toISOString().split('T')[0];
    forecastItemsContainer.innerHTML = '';

    forecastData.list.forEach(item => {
        if (item.dt_txt.includes('12:00:00') && !item.dt_txt.includes(today)) {
            const date = new Date(item.dt_txt).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short'
            });

            forecastItemsContainer.insertAdjacentHTML('beforeend', `
                <div class="forecast-item">
                    <h5 class="forecast-item-date regular-txt">${date}</h5>
                    <img src="images/${getWeatherIcon(item.weather[0].id)}" class="forecast-item-img">
                    <h5 class="forecast-item-temp">${Math.round(item.main.temp)} °C</h5>
                </div>
            `);
        }
    });
}

function showDisplaySection(section) {
    weatherInfoSection.style.display = 'none';
    searchCitySection.style.display = 'none';
    notFoundSection.style.display = 'none';
    section.style.display = 'flex';
}

showDisplaySection(searchCitySection);