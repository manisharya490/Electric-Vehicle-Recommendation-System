document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dom = {
        dailyDistance: document.getElementById('daily-distance'),
        dailyDistanceValue: document.getElementById('daily-distance-value'),
        seatsMin: document.getElementById('seats-min'),
        seatsMax: document.getElementById('seats-max'),
        seatsMinValue: document.getElementById('seats-min-value'),
        seatsMaxValue: document.getElementById('seats-max-value'),
        rangeMin: document.getElementById('range-min'),
        rangeMax: document.getElementById('range-max'),
        rangeMinValue: document.getElementById('range-min-value'),
        rangeMaxValue: document.getElementById('range-max-value'),
        bodyType: document.getElementById('body-type'),
        drivetrain: document.getElementById('drivetrain'),
        findEvsBtn: document.getElementById('find-evs'),
        resetFiltersBtn: document.getElementById('reset-filters'),
        resultsContainer: document.getElementById('results-container'),
        resultsCount: document.getElementById('results-count'),
        loading: document.getElementById('loading'),
        noResults: document.getElementById('no-results')
    };

    // Initialize values
    function initValues() {
        updateDailyDistanceValue();
        updateSeatsValues();
        updateRangeValues();
    }

    // Event Listeners
    dom.dailyDistance.addEventListener('input', updateDailyDistanceValue);
    dom.seatsMin.addEventListener('input', () => updateDualSliderValues('seats'));
    dom.seatsMax.addEventListener('input', () => updateDualSliderValues('seats'));
    dom.rangeMin.addEventListener('input', () => updateDualSliderValues('range'));
    dom.rangeMax.addEventListener('input', () => updateDualSliderValues('range'));
    dom.findEvsBtn.addEventListener('click', handleFindEvs);
    dom.resetFiltersBtn.addEventListener('click', resetFilters);

    // Update functions
    function updateDailyDistanceValue() {
        dom.dailyDistanceValue.textContent = `${dom.dailyDistance.value} km`;
    }

    function updateDualSliderValues(type) {
        const minInput = type === 'seats' ? dom.seatsMin : dom.rangeMin;
        const maxInput = type === 'seats' ? dom.seatsMax : dom.rangeMax;
        const minValue = type === 'seats' ? dom.seatsMinValue : dom.rangeMinValue;
        const maxValue = type === 'seats' ? dom.seatsMaxValue : dom.rangeMaxValue;

        const currentInput = event.target;
        const otherInput = currentInput === minInput ? maxInput : minInput;
        const currentValue = parseInt(currentInput.value);
        const otherValue = parseInt(otherInput.value);

        if (currentInput === minInput && currentValue > otherValue) {
            otherInput.value = currentValue;
        } else if (currentInput === maxInput && currentValue < otherValue) {
            otherInput.value = currentValue;
        }

        if (type === 'seats') {
            updateSeatsValues();
        } else {
            updateRangeValues();
        }
    }

    function updateSeatsValues() {
        dom.seatsMinValue.textContent = dom.seatsMin.value;
        dom.seatsMaxValue.textContent = dom.seatsMax.value;
    }

    function updateRangeValues() {
        dom.rangeMinValue.textContent = `${dom.rangeMin.value} km`;
        dom.rangeMaxValue.textContent = `${dom.rangeMax.value} km`;
    }

    function resetFilters() {
        dom.dailyDistance.value = 50;
        dom.seatsMin.value = 4;
        dom.seatsMax.value = 5;
        dom.rangeMin.value = 200;
        dom.rangeMax.value = 500;
        dom.bodyType.selectedIndex = 0;
        dom.drivetrain.selectedIndex = 0;

        initValues();
        handleFindEvs(new Event('click'));
    }

    // Image error handler
    function handleImageError(img) {
        img.onerror = null;
        img.src = 'https://via.placeholder.com/300x180.png?text=EV+Image';
        img.classList.add('placeholder-image');
        const fallbackIcon = img.nextElementSibling;
        if (fallbackIcon) {
            fallbackIcon.style.display = 'block';
        }
    }

    // ✅ Main handler (updated with Render URL)
    async function handleFindEvs(e) {
        e.preventDefault();

        dom.loading.style.display = 'flex';
        dom.resultsContainer.innerHTML = '';
        dom.noResults.style.display = 'none';
        dom.resultsCount.textContent = 'Searching...';

        // Prepare request data
        const requestData = {
            daily_distance: parseInt(dom.dailyDistance.value),
            seats_min: parseInt(dom.seatsMin.value),
            seats_max: parseInt(dom.seatsMax.value),
            body_type: dom.bodyType.value,
            drivetrain: dom.drivetrain.value,
            range_min: parseInt(dom.rangeMin.value),
            range_max: parseInt(dom.rangeMax.value),
            top_n: 6
        };

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const response = await fetch(
                "/api/recommend",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestData)
                }
            );

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error("Error:", error);
            showError();
        } finally {
            dom.loading.style.display = 'none';
        }
    }

    function displayResults(evs) {
        dom.resultsContainer.innerHTML = '';

        if (!evs || evs.length === 0) {
            dom.noResults.style.display = 'flex';
            dom.resultsCount.textContent = '0 matches found';
            return;
        }

        dom.resultsCount.textContent = `${evs.length} ${evs.length === 1 ? 'match' : 'matches'} found`;

        evs.forEach(ev => {

            const starRating = Math.round((ev.score / 115) * 5);
            const stars = '★'.repeat(starRating) + '☆'.repeat(5 - starRating);

            const evCard = document.createElement('div');
            evCard.className = 'ev-card';
            evCard.innerHTML = `
                <div class="ev-content">
                    <div class="ev-header">
                        <h3 class="ev-name">${ev.full_name}</h3>
                        <span class="ev-score">${ev.score.toFixed(1)} ${stars}</span>
                    </div>

                    <div class="ev-specs">
                        <div class="spec-item">
                            <span class="spec-icon"><i class="fas fa-bolt"></i></span>
                            <div class="spec-details">
                                <span class="spec-label">Range</span>
                                <span class="spec-value">${ev.range_km} km</span>
                            </div>
                        </div>

                        <div class="spec-item">
                            <span class="spec-icon"><i class="fas fa-tachometer-alt"></i></span>
                            <div class="spec-details">
                                <span class="spec-label">Efficiency</span>
                                <span class="spec-value">${ev.efficiency_km_per_kWh ? ev.efficiency_km_per_kWh.toFixed(2) : 'N/A'} km/kWh</span>
                            </div>
                        </div>

                        <div class="spec-item">
                            <span class="spec-icon"><i class="fas fa-charging-station"></i></span>
                            <div class="spec-details">
                                <span class="spec-label">Fast Charge</span>
                                <span class="spec-value">${ev.fast_charging_power_kw_dc || 'N/A'} kW</span>
                            </div>
                        </div>

                        <div class="spec-item">
                            <span class="spec-icon"><i class="fas fa-stopwatch"></i></span>
                            <div class="spec-details">
                                <span class="spec-label">Acceleration</span>
                                <span class="spec-value">${ev.acceleration_0_100_s ? ev.acceleration_0_100_s + 's' : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="ev-features">
                        <span class="feature-badge"><i class="fas fa-users"></i> ${ev.seats} seats</span>
                        <span class="feature-badge"><i class="fas fa-cog"></i> ${ev.drivetrain}</span>
                        <span class="feature-badge"><i class="fas fa-shapes"></i> ${ev.car_body_type}</span>
                    </div>
                </div>
            `;

            dom.resultsContainer.appendChild(evCard);
        });
    }

    function showError() {
        dom.resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Recommendations</h3>
                <p>Please try again later or adjust your filters</p>
            </div>
        `;
        dom.resultsCount.textContent = 'Error loading results';
    }

    // Initialize the app
    initValues();
    window.handleImageError = handleImageError;
});
