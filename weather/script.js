//const url = 'https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?city=Seattle';
const options = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': '79c0fe3a88msh0c05c260e9ba789p1300a6jsnd0b6e450e49e',
		'X-RapidAPI-Host': 'weather-by-api-ninjas.p.rapidapi.com'
	}
};

// Dynamic cities array - can be modified by user
let cities = ['Oklahoma', 'Hyderabad', 'Boston', 'Dallas'];

// Popular cities for dynamic suggestions
const popularCities = [
	'New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Mumbai', 
	'Beijing', 'Moscow', 'Dubai', 'Singapore', 'Toronto', 'Berlin',
	'Madrid', 'Rome', 'Amsterdam', 'Vienna', 'Prague', 'Budapest',
	'Stockholm', 'Copenhagen', 'Oslo', 'Helsinki', 'Warsaw', 'Krakow'
];

// Weather conditions for dynamic icons and backgrounds
const weatherConditions = {
	'sunny': { icon: 'bi-sun-fill', color: '#FFD700', bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' },
	'cloudy': { icon: 'bi-cloud-fill', color: '#87CEEB', bg: 'linear-gradient(135deg, #87CEEB 0%, #B0C4DE 100%)' },
	'rainy': { icon: 'bi-cloud-rain-fill', color: '#4682B4', bg: 'linear-gradient(135deg, #4682B4 0%, #5F9EA0 100%)' },
	'snowy': { icon: 'bi-snow', color: '#F0F8FF', bg: 'linear-gradient(135deg, #F0F8FF 0%, #E6E6FA 100%)' },
	'stormy': { icon: 'bi-lightning-fill', color: '#483D8B', bg: 'linear-gradient(135deg, #483D8B 0%, #2F4F4F 100%)' }
};

// Fallback weather data for demonstration purposes
const fallbackWeatherData = {
	'Delhi': {
		temp: 32,
		feels_like: 35,
		humidity: 65,
		min_temp: 28,
		max_temp: 36,
		wind_speed: 8,
		wind_degrees: 180,
		sunrise: 1703123456,
		sunset: 1703167890,
		cloud_pct: 20
	},
	'Oklahoma': {
		temp: 25,
		feels_like: 27,
		humidity: 45,
		min_temp: 20,
		max_temp: 30,
		wind_speed: 12,
		wind_degrees: 220,
		sunrise: 1703123456,
		sunset: 1703167890,
		cloud_pct: 15
	},
	'Hyderabad': {
		temp: 30,
		feels_like: 33,
		humidity: 70,
		min_temp: 26,
		max_temp: 34,
		wind_speed: 6,
		wind_degrees: 160,
		sunrise: 1703123456,
		sunset: 1703167890,
		cloud_pct: 30
	},
	'Boston': {
		temp: 18,
		feels_like: 16,
		humidity: 55,
		min_temp: 15,
		max_temp: 22,
		wind_speed: 15,
		wind_degrees: 280,
		sunrise: 1703123456,
		sunset: 1703167890,
		cloud_pct: 40
	},
	'Dallas': {
		temp: 28,
		feels_like: 30,
		humidity: 50,
		min_temp: 24,
		max_temp: 32,
		wind_speed: 10,
		wind_degrees: 200,
		sunrise: 1703123456,
		sunset: 1703167890,
		cloud_pct: 25
	}
};

// Safe element getter with error handling
const safeGetElement = (id) => {
	try {
		return document.getElementById(id);
	} catch (error) {
		console.warn(`Element with id '${id}' not found:`, error);
		return null;
	}
};

// Safe innerHTML setter with error handling
const safeSetInnerHTML = (id, content) => {
	try {
		const element = safeGetElement(id);
		if (element) {
			element.innerHTML = content;
		}
	} catch (error) {
		console.warn(`Failed to set innerHTML for '${id}':`, error);
	}
};

// Get current location using geolocation API
const getCurrentLocation = () => {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('Geolocation is not supported by this browser.'));
			return;
		}

		showInfo('Getting your current location...');
		
		// Try with high accuracy first
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				console.log('Current location (high accuracy):', { latitude, longitude });
				resolve({ latitude, longitude, accuracy: position.coords.accuracy });
			},
			(error) => {
				console.error('High accuracy geolocation failed:', error);
				
				// Try with lower accuracy as fallback
				navigator.geolocation.getCurrentPosition(
					(position) => {
						const { latitude, longitude } = position.coords;
						console.log('Current location (low accuracy):', { latitude, longitude });
						resolve({ latitude, longitude, accuracy: position.coords.accuracy });
					},
					(fallbackError) => {
						console.error('All geolocation attempts failed:', fallbackError);
						reject(fallbackError);
					},
					{
						enableHighAccuracy: false,
						timeout: 15000,
						maximumAge: 600000 // 10 minutes
					}
				);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 300000 // 5 minutes
			}
		);
	});
};

// Reverse geocoding to get city name from coordinates
const getCityFromCoordinates = async (latitude, longitude) => {
	try {
		// Try multiple reverse geocoding services for better reliability
		const services = [
			`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
		];

		for (const service of services) {
			try {
				const response = await fetch(service);
				
				if (response.ok) {
					const data = await response.json();
					
					// Handle different service response formats
					let city, country;
					
					if (service.includes('bigdatacloud')) {
						city = data.city || data.locality || data.principalSubdivision || 'Unknown Location';
						country = data.countryName || '';
					} else if (service.includes('nominatim')) {
						const address = data.address || {};
						city = address.city || address.town || address.village || address.county || 'Unknown Location';
						country = address.country || '';
					}
					
					if (city && city !== 'Unknown Location') {
						return { city, country, latitude, longitude };
					}
				}
			} catch (serviceError) {
				console.error('Service failed:', service, serviceError);
				continue;
			}
		}
		
		// If all services fail, use coordinates
		throw new Error('All reverse geocoding services failed');
		
	} catch (error) {
		console.error('Reverse geocoding error:', error);
		// Fallback: use coordinates as city name
		return { 
			city: `Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, 
			country: 'Unknown',
			latitude, 
			longitude 
		};
	}
};

// Initialize app with current location
const initializeWithCurrentLocation = async () => {
	try {
		// Update button state
		const locationBtn = safeGetElement('locationBtn');
		if (locationBtn) {
			locationBtn.disabled = true;
			locationBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Detecting...';
		}
		
		showInfo('Detecting your current location... Please allow location access if prompted.');
		
		// Check if geolocation is supported
		if (!navigator.geolocation) {
			throw new Error('Geolocation not supported');
		}
		
		// Get current coordinates
		const coords = await getCurrentLocation();
		
		// Get city name from coordinates
		const locationData = await getCityFromCoordinates(coords.latitude, coords.longitude);
		
		// Update the search input with current city
		const cityInput = safeGetElement('city');
		if (cityInput) {
			cityInput.value = locationData.city;
		}
		
		// Get weather for current location
		await getWeather(locationData.city);
		
		// Add current location to comparison if not already there
		if (!cities.includes(locationData.city)) {
			addCityToComparison(locationData.city);
		}
		
		showInfo(`✅ Weather updated for your current location: ${locationData.city}`);
		
	} catch (error) {
		console.error('Error getting current location:', error);
		
		// Try to get location from IP address as fallback
		try {
			await getLocationFromIP();
		} catch (ipError) {
			console.error('IP-based location also failed:', ipError);
			
			// Final fallback to default city
			showError('Could not detect your location. Using default city. You can manually search for your city.');
			
			// Show location instructions
			const instructions = safeGetElement('locationInstructions');
			if (instructions) {
				instructions.style.display = 'block';
			}
			
			await getWeather("Delhi");
		}
	} finally {
		// Reset button state
		const locationBtn = safeGetElement('locationBtn');
		if (locationBtn) {
			locationBtn.disabled = false;
			locationBtn.innerHTML = '<i class="bi bi-geo-alt-fill"></i> My Location';
		}
	}
};

// Get location from IP address as fallback
const getLocationFromIP = async () => {
	try {
		showInfo('Trying to detect location from IP address...');
		
		const response = await fetch('https://ipapi.co/json/');
		
		if (response.ok) {
			const data = await response.json();
			const city = data.city || data.region || 'Unknown Location';
			const country = data.country_name || '';
			
			console.log('IP-based location:', { city, country });
			
			// Update the search input with IP-based city
			const cityInput = safeGetElement('city');
			if (cityInput) {
				cityInput.value = city;
			}
			
			// Get weather for IP-based location
			await getWeather(city);
			
			// Add IP-based location to comparison if not already there
			if (!cities.includes(city)) {
				addCityToComparison(city);
			}
			
			showInfo(`✅ Weather updated for your location (IP-based): ${city}`);
			
		} else {
			throw new Error('IP location service failed');
		}
		
	} catch (error) {
		console.error('IP-based location error:', error);
		throw error;
	}
};

// Get weather data for a specific city
const getWeather = async (city) => {
	if (!city || typeof city !== 'string' || city.trim() === '') {
		console.warn('Invalid city name provided');
		return;
	}

	try {
		const cityNameElement = safeGetElement('cityName');
		if (cityNameElement) {
			cityNameElement.innerHTML = city;
		}
		
		// Show loading state with animation
		showLoading(true);
		
		// Try to fetch from API first
		try {
			const response = await fetch('https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?city=' + encodeURIComponent(city), options);
			
			if (response.ok) {
				const data = await response.json();
				console.log('API Data for', city, ':', data);
				
				// Update main weather display with animations
				updateMainWeather(data);
				updateWeatherBackground(data);
				showLoading(false);
				return;
			}
		} catch (apiError) {
			console.log('API failed for', city, ':', apiError);
		}
		
		// Fallback to demo data
		const fallbackData = fallbackWeatherData[city] || generateRandomWeather(city);
		console.log('Using fallback data for', city, ':', fallbackData);
		
		// Update main weather display with fallback data
		updateMainWeather(fallbackData);
		updateWeatherBackground(fallbackData);
		
		// Show fallback message
		showInfo(`Using demo data for ${city}. API may be temporarily unavailable.`);
		
		// Hide loading state
		showLoading(false);
		
	} catch (error) {
		console.error('Error in getWeather for', city, ':', error);
		showError(`Failed to fetch weather data for ${city}. Using demo data.`);
		showLoading(false);
		
		// Use fallback data as last resort
		const fallbackData = fallbackWeatherData[city] || generateRandomWeather(city);
		updateMainWeather(fallbackData);
		updateWeatherBackground(fallbackData);
	}
};

// Generate random weather data for cities not in fallback data
const generateRandomWeather = (city) => {
	try {
		const baseTemp = 20 + Math.random() * 20; // 20-40°C
		return {
			temp: Math.round(baseTemp),
			feels_like: Math.round(baseTemp + Math.random() * 5),
			humidity: Math.round(30 + Math.random() * 50),
			min_temp: Math.round(baseTemp - 5),
			max_temp: Math.round(baseTemp + 5),
			wind_speed: Math.round(5 + Math.random() * 15),
			wind_degrees: Math.round(Math.random() * 360),
			sunrise: Date.now() / 1000 - 21600, // 6 hours ago
			sunset: Date.now() / 1000 + 21600,  // 6 hours from now
			cloud_pct: Math.round(Math.random() * 100)
		};
	} catch (error) {
		console.error('Error generating random weather:', error);
		return {
			temp: 25,
			feels_like: 27,
			humidity: 50,
			min_temp: 20,
			max_temp: 30,
			wind_speed: 10,
			wind_degrees: 180,
			sunrise: Date.now() / 1000 - 21600,
			sunset: Date.now() / 1000 + 21600,
			cloud_pct: 25
		};
	}
};

// Update main weather display with animations
const updateMainWeather = (data) => {
	if (!data || typeof data !== 'object') {
		console.warn('Invalid weather data provided');
		return;
	}

	try {
		// Animate temperature changes
		animateValue('temp', data.temp || 'N/A');
		animateValue('temp2', data.temp || 'N/A');
		animateValue('feels_like', data.feels_like || 'N/A');
		animateValue('humidity', data.humidity || 'N/A');
		animateValue('humidity2', data.humidity || 'N/A');
		animateValue('min_temp', data.min_temp || 'N/A');
		animateValue('max_temp', data.max_temp || 'N/A');
		animateValue('wind_speed', data.wind_speed || 'N/A');
		animateValue('wind_speed2', data.wind_speed || 'N/A');
		animateValue('wind_degrees', data.wind_degrees || 'N/A');
		
		// Update time displays
		const sunriseElement = safeGetElement('sunrise');
		const sunsetElement = safeGetElement('sunset');
		if (sunriseElement) sunriseElement.innerHTML = formatTime(data.sunrise) || 'N/A';
		if (sunsetElement) sunsetElement.innerHTML = formatTime(data.sunset) || 'N/A';
		
		// Add weather condition icon
		updateWeatherIcon(data);
	} catch (error) {
		console.error('Error updating main weather display:', error);
	}
};

// Animate value changes
const animateValue = (elementId, newValue) => {
	try {
		const element = safeGetElement(elementId);
		if (!element) return;
		
		const oldValue = element.innerHTML;
		if (oldValue !== newValue.toString()) {
			element.style.transform = 'scale(1.1)';
			element.style.color = '#0d6efd';
			element.innerHTML = newValue;
			
			setTimeout(() => {
				element.style.transform = 'scale(1)';
				element.style.color = '';
			}, 300);
		} else {
			element.innerHTML = newValue;
		}
	} catch (error) {
		console.error('Error animating value:', error);
	}
};

// Update weather background based on conditions
const updateWeatherBackground = (data) => {
	try {
		const temp = data.temp || 20;
		const humidity = data.humidity || 50;
		const cloudPct = data.cloud_pct || 0;
		
		let condition = 'sunny';
		if (cloudPct > 70) condition = 'cloudy';
		if (humidity > 80) condition = 'rainy';
		if (temp < 0) condition = 'snowy';
		if (data.wind_speed > 20) condition = 'stormy';
		
		const weatherCard = document.querySelector('.weather-card');
		if (weatherCard && weatherConditions[condition]) {
			weatherCard.style.background = weatherConditions[condition].bg;
			weatherCard.style.transition = 'background 0.5s ease';
		}
	} catch (error) {
		console.error('Error updating weather background:', error);
	}
};

// Update weather icon based on conditions
const updateWeatherIcon = (data) => {
	try {
		const temp = data.temp || 20;
		const humidity = data.humidity || 50;
		const cloudPct = data.cloud_pct || 0;
		
		let iconClass = 'bi-sun-fill';
		if (cloudPct > 70) iconClass = 'bi-cloud-fill';
		if (humidity > 80) iconClass = 'bi-cloud-rain-fill';
		if (temp < 0) iconClass = 'bi-snow';
		if (data.wind_speed > 20) iconClass = 'bi-lightning-fill';
		
		// Update city name icon
		const cityIcon = document.querySelector('#cityName i');
		if (cityIcon) {
			cityIcon.className = `bi ${iconClass} me-2`;
		}
	} catch (error) {
		console.error('Error updating weather icon:', error);
	}
};

// Get weather data for multiple cities (for comparison table)
const getMultipleCitiesWeather = async () => {
	try {
		const weatherData = [];
		
		for (const city of cities) {
			try {
				// Try API first
				const response = await fetch('https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?city=' + encodeURIComponent(city), options);
				if (response.ok) {
					const data = await response.json();
					weatherData.push(data);
				} else {
					// Use fallback data
					const fallbackData = fallbackWeatherData[city] || generateRandomWeather(city);
					weatherData.push(fallbackData);
				}
			} catch (error) {
				console.error(`Error fetching data for ${city}:`, error);
				// Use fallback data
				const fallbackData = fallbackWeatherData[city] || generateRandomWeather(city);
				weatherData.push(fallbackData);
			}
		}
		
		updateComparisonTable(weatherData);
		
	} catch (error) {
		console.error('Error fetching multiple cities weather:', error);
		// Use all fallback data
		const fallbackData = cities.map(city => fallbackWeatherData[city] || generateRandomWeather(city));
		updateComparisonTable(fallbackData);
	}
};

// Update the comparison table with real data and animations
const updateComparisonTable = (weatherData) => {
	try {
		const tableBody = document.querySelector('tbody');
		if (!tableBody) return;
		
		// Clear existing table rows with fade out
		tableBody.style.opacity = '0';
		
		setTimeout(() => {
			tableBody.innerHTML = '';
			
			weatherData.forEach((data, index) => {
				if (!data || index >= cities.length) return;
				
				const row = document.createElement('tr');
				row.style.opacity = '0';
				row.style.transform = 'translateY(20px)';
				row.innerHTML = `
					<th scope="row" class="text-start">
						<i class="bi bi-geo-alt me-2"></i>${cities[index]}
					</th>
					<td>${data.cloud_pct || 'N/A'}</td>
					<td>${data.feels_like || 'N/A'}</td>
					<td>${data.humidity || 'N/A'}</td>
					<td>${data.max_temp || 'N/A'}</td>
					<td>${data.min_temp || 'N/A'}</td>
					<td>${formatTime(data.sunrise) || 'N/A'}</td>
					<td>${formatTime(data.sunset) || 'N/A'}</td>
					<td>${data.temp || 'N/A'}</td>
					<td>${data.wind_degrees || 'N/A'}</td>
					<td>${data.wind_speed || 'N/A'}</td>
				`;
				tableBody.appendChild(row);
				
				// Animate row appearance
				setTimeout(() => {
					row.style.transition = 'all 0.3s ease';
					row.style.opacity = '1';
					row.style.transform = 'translateY(0)';
				}, index * 100);
			});
			
			tableBody.style.opacity = '1';
		}, 300);
	} catch (error) {
		console.error('Error updating comparison table:', error);
	}
};

// Dynamic city management
const addCityToComparison = (cityName) => {
	try {
		if (!cityName || typeof cityName !== 'string' || cityName.trim() === '') {
			showError('Please enter a valid city name.');
			return;
		}

		const trimmedCity = cityName.trim();
		if (!cities.includes(trimmedCity) && cities.length < 8) {
			cities.push(trimmedCity);
			updateCityDropdown();
			getMultipleCitiesWeather();
			showInfo(`${trimmedCity} added to comparison table!`);
		} else if (cities.length >= 8) {
			showError('Maximum 8 cities allowed in comparison table.');
		} else {
			showInfo(`${trimmedCity} is already in the comparison table.`);
		}
	} catch (error) {
		console.error('Error adding city to comparison:', error);
		showError('Failed to add city to comparison.');
	}
};

const removeCityFromComparison = (cityName) => {
	try {
		const index = cities.indexOf(cityName);
		if (index > -1) {
			cities.splice(index, 1);
			updateCityDropdown();
			getMultipleCitiesWeather();
			showInfo(`${cityName} removed from comparison table.`);
		}
	} catch (error) {
		console.error('Error removing city from comparison:', error);
		showError('Failed to remove city from comparison.');
	}
};

// Update city dropdown
const updateCityDropdown = () => {
	try {
		const dropdownMenu = document.querySelector('.dropdown-menu');
		const cityCount = safeGetElement('cityCount');
		const currentCityCount = safeGetElement('currentCityCount');
		const currentCities = safeGetElement('currentCities');
		
		if (dropdownMenu) {
			dropdownMenu.innerHTML = '';
			cities.forEach(city => {
				const item = document.createElement('li');
				item.innerHTML = `
					<a class="dropdown-item d-flex justify-content-between align-items-center" href="#">
						<span><i class="bi bi-building me-2"></i>${city}</span>
						<button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); removeCityFromComparison('${city}')">
							<i class="bi bi-x"></i>
						</button>
					</a>
				`;
				dropdownMenu.appendChild(item);
			});
		}
		
		// Update counters
		if (cityCount) cityCount.textContent = cities.length;
		if (currentCityCount) currentCityCount.textContent = cities.length;
		
		// Update current cities display
		if (currentCities) {
			currentCities.innerHTML = '';
			cities.forEach(city => {
				const cityBadge = document.createElement('span');
				cityBadge.className = 'badge bg-primary me-2 mb-2';
				cityBadge.innerHTML = `
					${city}
					<button class="btn btn-sm btn-outline-light ms-2" onclick="removeCityFromComparison('${city}')">
						<i class="bi bi-x"></i>
					</button>
				`;
				currentCities.appendChild(cityBadge);
			});
		}
	} catch (error) {
		console.error('Error updating city dropdown:', error);
	}
};

// Generate dynamic city suggestions
const generateCitySuggestions = () => {
	try {
		const suggestionsContainer = safeGetElement('citySuggestions');
		if (!suggestionsContainer) return;
		
		suggestionsContainer.innerHTML = '';
		const shuffledCities = popularCities.sort(() => 0.5 - Math.random()).slice(0, 6);
		
		shuffledCities.forEach(city => {
			const suggestion = document.createElement('span');
			suggestion.className = 'badge bg-light text-dark me-2 mb-2 suggestion-badge';
			suggestion.textContent = city;
			suggestion.style.cursor = 'pointer';
			suggestion.onclick = () => {
				const cityInput = safeGetElement('city');
				if (cityInput) {
					cityInput.value = city;
					getWeather(city);
				}
			};
			suggestionsContainer.appendChild(suggestion);
		});
	} catch (error) {
		console.error('Error generating city suggestions:', error);
	}
};

// Auto-refresh weather data
const startAutoRefresh = () => {
	try {
		setInterval(() => {
			const cityNameElement = safeGetElement('cityName');
			if (cityNameElement) {
				const currentCity = cityNameElement.textContent;
				if (currentCity && currentCity !== 'Delhi') {
					getWeather(currentCity);
				}
			}
			getMultipleCitiesWeather();
		}, 300000); // Refresh every 5 minutes
	} catch (error) {
		console.error('Error starting auto-refresh:', error);
	}
};

// Format time from seconds to readable format
const formatTime = (seconds) => {
	try {
		if (!seconds) return 'N/A';
		const date = new Date(seconds * 1000);
		return date.toLocaleTimeString('en-US', { 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: true 
		});
	} catch (error) {
		console.error('Error formatting time:', error);
		return 'N/A';
	}
};

// Show loading state with enhanced animation
const showLoading = (isLoading) => {
	try {
		const loadingElement = safeGetElement('loading');
		if (loadingElement) {
			if (isLoading) {
				loadingElement.style.display = 'block';
				loadingElement.style.opacity = '0';
				setTimeout(() => {
					loadingElement.style.opacity = '1';
				}, 10);
			} else {
				loadingElement.style.opacity = '0';
				setTimeout(() => {
					loadingElement.style.display = 'none';
				}, 300);
			}
		}
	} catch (error) {
		console.error('Error showing loading state:', error);
	}
};

// Show error message with animation
const showError = (message) => {
	try {
		const errorElement = safeGetElement('error');
		if (errorElement) {
			errorElement.textContent = message;
			errorElement.style.display = 'block';
			errorElement.style.opacity = '0';
			setTimeout(() => {
				errorElement.style.opacity = '1';
			}, 10);
			setTimeout(() => {
				errorElement.style.opacity = '0';
				setTimeout(() => {
					errorElement.style.display = 'none';
				}, 300);
			}, 5000);
		}
	} catch (error) {
		console.error('Error showing error message:', error);
	}
};

// Show info message with animation
const showInfo = (message) => {
	try {
		const infoElement = safeGetElement('info');
		if (infoElement) {
			infoElement.textContent = message;
			infoElement.style.display = 'block';
			infoElement.style.opacity = '0';
			setTimeout(() => {
				infoElement.style.opacity = '1';
			}, 10);
			setTimeout(() => {
				infoElement.style.opacity = '0';
				setTimeout(() => {
					infoElement.style.display = 'none';
				}, 300);
			}, 3000);
		}
	} catch (error) {
		console.error('Error showing info message:', error);
	}
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
	try {
		// Search form submission
		const submit = safeGetElement('submit');
		const city = safeGetElement('city');
		
		if (submit && city) {
			submit.addEventListener("click", (e) => {
				e.preventDefault();
				if (city.value.trim()) {
					getWeather(city.value.trim());
					addCityToComparison(city.value.trim());
				}
			});
			
			// Allow Enter key to submit
			city.addEventListener("keypress", (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					if (city.value.trim()) {
						getWeather(city.value.trim());
						addCityToComparison(city.value.trim());
					}
				}
			});
			
			// Auto-complete suggestions
			city.addEventListener('input', (e) => {
				try {
					const value = e.target.value.toLowerCase();
					if (value.length > 2) {
						const suggestions = popularCities.filter(city => 
							city.toLowerCase().includes(value)
						).slice(0, 5);
						showAutoComplete(suggestions);
					} else {
						hideAutoComplete();
					}
				} catch (error) {
					console.error('Error in auto-complete:', error);
				}
			});
		}
		
		// Initialize with current location
		initializeWithCurrentLocation();
		
		// Load comparison table data
		getMultipleCitiesWeather();
		
		// Generate city suggestions
		generateCitySuggestions();
		
		// Update city dropdown and current cities display
		updateCityDropdown();
		
		// Start auto-refresh
		startAutoRefresh();
		
		// Add click handlers for dropdown cities
		const dropdownItems = document.querySelectorAll('.dropdown-item');
		dropdownItems.forEach(item => {
			item.addEventListener('click', (e) => {
				e.preventDefault();
				const cityName = item.textContent.trim();
				getWeather(cityName);
			});
		});
		
		// Add dynamic features
		addDynamicFeatures();
		
		console.log('Weather app initialized successfully!');
		
	} catch (error) {
		console.error('Error initializing weather app:', error);
	}
});

// Auto-complete functionality
const showAutoComplete = (suggestions) => {
	try {
		let autoComplete = safeGetElement('autoComplete');
		if (!autoComplete) {
			autoComplete = document.createElement('div');
			autoComplete.id = 'autoComplete';
			autoComplete.className = 'autocomplete-items';
			autoComplete.style.cssText = `
				position: absolute;
				top: 100%;
				left: 0;
				right: 0;
				z-index: 99;
				background: white;
				border: 1px solid #ddd;
				border-top: none;
				max-height: 150px;
				overflow-y: auto;
				border-radius: 0 0 5px 5px;
			`;
			const cityParent = safeGetElement('city')?.parentNode;
			if (cityParent) {
				cityParent.style.position = 'relative';
				cityParent.appendChild(autoComplete);
			}
		}
		
		autoComplete.innerHTML = '';
		suggestions.forEach(suggestion => {
			const item = document.createElement('div');
			item.textContent = suggestion;
			item.style.cssText = `
				padding: 10px;
				cursor: pointer;
				border-bottom: 1px solid #f1f1f1;
			`;
			item.onclick = () => {
				const cityInput = safeGetElement('city');
				if (cityInput) {
					cityInput.value = suggestion;
					hideAutoComplete();
					getWeather(suggestion);
				}
			};
			autoComplete.appendChild(item);
		});
	} catch (error) {
		console.error('Error showing auto-complete:', error);
	}
};

const hideAutoComplete = () => {
	try {
		const autoComplete = safeGetElement('autoComplete');
		if (autoComplete) {
			autoComplete.remove();
		}
	} catch (error) {
		console.error('Error hiding auto-complete:', error);
	}
};

// Add dynamic features
const addDynamicFeatures = () => {
	try {
		// Add weather animation
		addWeatherAnimation();
		
		// Add time display
		updateCurrentTime();
		setInterval(updateCurrentTime, 1000);
		
		// Add dynamic background
		addDynamicBackground();
	} catch (error) {
		console.error('Error adding dynamic features:', error);
	}
};

// Weather animation
const addWeatherAnimation = () => {
	try {
		const weatherCards = document.querySelectorAll('.weather-card');
		weatherCards.forEach(card => {
			card.addEventListener('mouseenter', () => {
				card.style.transform = 'translateY(-10px) scale(1.02)';
			});
			card.addEventListener('mouseleave', () => {
				card.style.transform = 'translateY(0) scale(1)';
			});
		});
	} catch (error) {
		console.error('Error adding weather animation:', error);
	}
};

// Update current time
const updateCurrentTime = () => {
	try {
		const timeElement = safeGetElement('currentTime');
		if (timeElement) {
			const now = new Date();
			timeElement.textContent = now.toLocaleTimeString();
		}
	} catch (error) {
		console.error('Error updating current time:', error);
	}
};

// Dynamic background
const addDynamicBackground = () => {
	try {
		const body = document.body;
		const colors = ['#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da'];
		let currentIndex = 0;
		
		setInterval(() => {
			body.style.transition = 'background-color 2s ease';
			body.style.backgroundColor = colors[currentIndex];
			currentIndex = (currentIndex + 1) % colors.length;
		}, 10000); // Change every 10 seconds
	} catch (error) {
		console.error('Error adding dynamic background:', error);
	}
};