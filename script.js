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

const forecastItemsContainer = document.querySelector('.forecast-items-container')

const apiKey = '479c8f15d632ca5a2d30ccca7f39d565';

searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') { 
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    return response.json();
}

function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.png'
    if (id <= 321) return 'drizzle.png'
    if (id <= 531) return 'rain.png'
    if (id <= 622) return 'snow.png'
    if (id <= 781) return 'tornado.png'
    if (id <= 800) return 'clear.png'
    else return 'clouds.png'
}

function getCurrentDate() {
    const currentDate = new Date()
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }

    return currentDate.toLocaleDateString('en-GB', options)
}

async function updateWeatherInfo(city) {
    try {
        const weatherData = await getFetchData('weather', city);
        
        if (weatherData.cod !== 200) {
            showDisplaySection(notFoundSection);
            return;
        }

        const {
            name: country,
            main: { temp, humidity },
            weather: [{ id, main }],
            wind: { speed }
        } = weatherData;

        countryTxt.textContent = country;
        tempTxt.textContent = Math.round(temp) + ' °C';
        conditionTxt.textContent = main;
        humidityValueTxt.textContent = humidity + '%';
        windValueTxt.textContent = speed + 'm/s';

        currentDateTxt.textContent = getCurrentDate()
        
        const iconName = getWeatherIcon(id);
        weatherSummaryImg.src = `images/${iconName}`;

        await updateForecastsInfo(city)
        showDisplaySection(weatherInfoSection);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showDisplaySection(notFoundSection);
    }
}

async function updateForecastsInfo(city) {
    const forecastData = await getFetchData('forecast', city)

    const timeTaken = '12:00:00'
    const todayDate = new Date().toISOString().split('T')[0]

    forecastItemsContainer.innerHTML = ''
    forecastData.list.forEach(forecastWeather => {
        if (forecastWeather.dt_txt.includes(timeTaken) &&
            !forecastWeather.dt_txt.includes(todayDate)) {
            updateForecastsItems(forecastWeather)
        }
    })
}

function updateForecastsItems(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData

    const dateTaken = new Date(date)
    const dateOption = {
        day: '2-digit',
        month: 'short'
    }

    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption)

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="images/${getWeatherIcon(id)}" alt="thunderstorm" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>
    `

    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem)
}

function showDisplaySection(section) {
    weatherInfoSection.style.display = 'none';
    searchCitySection.style.display = 'none';
    notFoundSection.style.display = 'none';
    
    if (section === weatherInfoSection) {
        section.style.display = 'flex';
    } else if (section === notFoundSection || section === searchCitySection) {
        section.style.display = 'flex';
    }
}

showDisplaySection(searchCitySection);