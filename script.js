const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const welcomeSection = document.querySelector('.welcome-message');

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

const addCityBtn = document.querySelector('.add-city-btn');
const savedCitiesBtn = document.querySelector('.saved-cities-btn');
const savedCitiesList = document.querySelector('.saved-cities-list');

const refreshBtn = document.querySelector('.refresh-btn');

let currentCity = cityInput.value || null;
let savedCities = JSON.parse(localStorage.getItem('savedCities')) || [];
let autocompleteEnabled = true;

showDisplaySection(welcomeSection);

setTimeout(requestGeolocation, 500);

const loadingOverlay = document.querySelector('.loading-overlay');

function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

async function refreshWeather() {
    if (!currentCity) return;

    showLoading();
    try {
        await updateWeatherInfo(currentCity);
    } catch {
        showDisplaySection(notFoundSection);
    } finally {
        hideLoading();
    }
}

refreshBtn.addEventListener('click', () => {
    refreshWeather();
});

function updateAddCityButton(city) {
    if (savedCities.includes(city)) {
        addCityBtn.textContent = 'Added';
        addCityBtn.classList.add('added');
    } else {
        addCityBtn.textContent = 'Add City';
        addCityBtn.classList.remove('added');
    }
}

addCityBtn.addEventListener('click', () => {
    const city = countryTxt.textContent;

    if (!savedCities.includes(city)) {
        savedCities.push(city);
    } else {
        savedCities = savedCities.filter(c => c !== city);
    }

    localStorage.setItem('savedCities', JSON.stringify(savedCities));
    updateAddCityButton(city);
});

savedCitiesBtn.addEventListener('click', () => {
    if (savedCitiesList.style.display === 'block') {
        savedCitiesList.style.display = 'none';
        return;
    }

    savedCitiesList.innerHTML = '';

    if (savedCities.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No saved cities';
        savedCitiesList.appendChild(li);
    } else {
        savedCities.forEach(city => {
            const li = document.createElement('li');
            li.textContent = city;
            li.addEventListener('click', () => {
                cityInput.value = city;
                updateWeatherInfo(city);
                savedCitiesList.style.display = 'none';
            });
            savedCitiesList.appendChild(li);
        });
    }

    savedCitiesList.style.display = 'block';
});

function requestGeolocation() {
    if (!('geolocation' in navigator)) {
        showDisplaySection(searchCitySection);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            loadWeatherByCoords(latitude, longitude);
        },
        () => {
            showDisplaySection(searchCitySection);
        }
    );
}

async function fetchCitySuggestions(query) {

    if (!autocompleteEnabled) return;

    if (!autocompleteEnabled || query.length < 2) {
        suggestionsList.style.display = 'none';
        return;
    }

    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=7&appid=${apiKey}`;
        const geoResponse = await fetch(geoUrl);
        const geoCities = await geoResponse.json();

        suggestionsList.innerHTML = '';

        for (const city of geoCities) {
            const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${apiKey}`;
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();

            if (weatherData.cod !== 200) continue;

            const li = document.createElement('li');
            li.textContent = city.name;

            li.addEventListener('click', () => {
                cityInput.value = city.name;
                suggestionsList.style.display = 'none';
                updateWeatherInfo(city.name);
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
    autocompleteEnabled = true;
    fetchCitySuggestions(cityInput.value.trim());
});

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (!city) return;
    suggestionsList.style.display = 'none';
    updateWeatherInfo(city);
});

cityInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();

        const city = cityInput.value.trim();
        if (!city) return;

        autocompleteEnabled = false;
        suggestionsList.style.display = 'none';

        updateWeatherInfo(city);
    }
});

async function getFetchData(endpoint, params) {
    const url = `https://api.openweathermap.org/data/2.5/${endpoint}?${params}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    return response.json();
}

function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.png';
    if (id <= 321) return 'drizzle.png';
    if (id <= 531) return 'rain.png';
    if (id <= 622) return 'snow.png';
    if (id <= 781) return 'tornado.png';
    if (id === 800) return 'clear.png';
    return 'clouds.png';
}

function getCurrentDate() {
    return new Date().toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
}

async function loadWeatherByCoords(lat, lon) {
    try {
        const data = await getFetchData('weather', `lat=${lat}&lon=${lon}`);
        fillWeatherData(data, true);
        await updateForecastsByCoords(lat, lon);
        showDisplaySection(weatherInfoSection);
    } catch {
        showDisplaySection(searchCitySection);
    }
}

async function updateWeatherInfo(city) {
    currentCity = city;
    localStorage.setItem('lastCity', currentCity);

    showLoading();

    try {
        const data = await getFetchData('weather', `q=${city}`);
        if (data.cod !== 200) {
            showDisplaySection(notFoundSection);
            return;
        }

        fillWeatherData(data);
        await updateForecastsInfo(city);
        showDisplaySection(weatherInfoSection);
        updateAddCityButton(city);

    } catch {
        showDisplaySection(notFoundSection);
    } finally {
        hideLoading();
    }
}

function fillWeatherData(data, isCurrentLocation = false) {
    countryTxt.textContent = isCurrentLocation ? 'Current location' : data.name;

    tempTxt.textContent = Math.round(data.main.temp) + ' °C';
    conditionTxt.textContent = data.weather[0].main;
    humidityValueTxt.textContent = data.main.humidity + '%';
    windValueTxt.textContent = data.wind.speed + ' m/s';

    currentDateTxt.textContent = getCurrentDate();
    weatherSummaryImg.src = `images/${getWeatherIcon(data.weather[0].id)}`;
}


async function updateForecastsInfo(city) {
    const data = await getFetchData('forecast', `q=${city}`);
    renderForecast(data);
}

async function updateForecastsByCoords(lat, lon) {
    const data = await getFetchData(
        'forecast',
        `lat=${lat}&lon=${lon}`
    );
    renderForecast(data);
}

function renderForecast(data) {
    forecastItemsContainer.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];

    data.list.forEach(item => {
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
    welcomeSection.style.display = 'none';

    section.style.display = 'flex';
}

const savedCitiesModal = document.querySelector('.saved-cities-modal');
const savedCitiesListModal = document.querySelector('.saved-cities-list-modal');
const closeModalBtn = document.querySelector('.close-modal-btn');

savedCitiesBtn.addEventListener('click', () => {
    savedCitiesListModal.innerHTML = '';

    if (savedCities.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No saved cities';
        savedCitiesListModal.appendChild(li);
    } else {
        savedCities.forEach(city => {
            const li = document.createElement('li');
            li.textContent = city;

            li.addEventListener('click', () => {
                cityInput.value = city;
                updateWeatherInfo(city);
                savedCitiesModal.style.display = 'none';
            });

            savedCitiesListModal.appendChild(li);
        });
    }

    savedCitiesModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    savedCitiesModal.style.display = 'none';
});

savedCitiesModal.addEventListener('click', e => {
    if (e.target === savedCitiesModal) {
        savedCitiesModal.style.display = 'none';
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        updateWeatherInfo(lastCity);
    }
});