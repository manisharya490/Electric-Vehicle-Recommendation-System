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
        batteryCapacityMin: document.getElementById('battery-capacity-min'),
        batteryCapacityMax: document.getElementById('battery-capacity-max'),
        batteryCapacityMinValue: document.getElementById('battery-capacity-min-value'),
        batteryCapacityMaxValue: document.getElementById('battery-capacity-max-value'),
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
        updateBatteryCapacityValues();
    }

    // Event Listeners
    if (dom.dailyDistance) dom.dailyDistance.addEventListener('input', updateDailyDistanceValue);
    if (dom.seatsMin) dom.seatsMin.addEventListener('input', (e) => updateDualSliderValues(e, 'seats'));
    if (dom.seatsMax) dom.seatsMax.addEventListener('input', (e) => updateDualSliderValues(e, 'seats'));
    if (dom.rangeMin) dom.rangeMin.addEventListener('input', (e) => updateDualSliderValues(e, 'range'));
    if (dom.rangeMax) dom.rangeMax.addEventListener('input', (e) => updateDualSliderValues(e, 'range'));
    if (dom.batteryCapacityMin) dom.batteryCapacityMin.addEventListener('input', updateBatteryCapacityValues);
    if (dom.batteryCapacityMax) dom.batteryCapacityMax.addEventListener('input', updateBatteryCapacityValues);
    if (dom.findEvsBtn) dom.findEvsBtn.addEventListener('click', handleFindEvs);
    if (dom.resetFiltersBtn) dom.resetFiltersBtn.addEventListener('click', resetFilters);

    // Update functions
    function updateDailyDistanceValue() {
        dom.dailyDistanceValue.textContent = `${dom.dailyDistance.value} km`;
    }

    function updateDualSliderValues(e, type) {
        const minInput = type === 'seats' ? dom.seatsMin : dom.rangeMin;
        const maxInput = type === 'seats' ? dom.seatsMax : dom.rangeMax;
        const minValue = type === 'seats' ? dom.seatsMinValue : dom.rangeMinValue;
        const maxValue = type === 'seats' ? dom.seatsMaxValue : dom.rangeMaxValue;

        const currentInput = e.target;
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
        if (typeof updateBatteryCapacityValues === 'function') updateBatteryCapacityValues();
        dom.bodyType.selectedIndex = 0;
        dom.drivetrain.selectedIndex = 0;

        initValues();
        handleFindEvs(new Event('click'));
    }

    // Image error handler
    if (dom.batteryCapacityMin && dom.batteryCapacityMax) {
        dom.batteryCapacityMin.addEventListener('input', updateBatteryCapacityValues);
        dom.batteryCapacityMax.addEventListener('input', updateBatteryCapacityValues);
    }
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
        const bodyType = document.getElementById("body-type").value;
        const drivetrain = document.getElementById("drivetrain").value;
        let seatsMin = parseInt(document.getElementById("seats-min").value);
        let seatsMax = parseInt(document.getElementById("seats-max").value);
        let rangeMin = parseInt(document.getElementById("range-min").value);
        let rangeMax = parseInt(document.getElementById("range-max").value);
        let batteryCapacityMin = parseFloat(document.getElementById("battery-capacity-min").value);
        let batteryCapacityMax = parseFloat(document.getElementById("battery-capacity-max").value);

        // Ensure min is not greater than max
        if (seatsMin > seatsMax) seatsMax = seatsMin;
        if (seatsMax < seatsMin) seatsMin = seatsMax;
        if (rangeMin > rangeMax) rangeMax = rangeMin;
        if (rangeMax < rangeMin) rangeMin = rangeMax;
        if (batteryCapacityMin > batteryCapacityMax) batteryCapacityMax = batteryCapacityMin;
        if (batteryCapacityMax < batteryCapacityMin) batteryCapacityMin = batteryCapacityMax;

        const requestData = {
            body_type: bodyType,
            drivetrain: drivetrain,
            seats_min: seatsMin,
            seats_max: seatsMax,
            range_min: rangeMin,
            range_max: rangeMax,
            battery_capacity_min: batteryCapacityMin,
            battery_capacity_max: batteryCapacityMax,
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
    function updateBatteryCapacityValues() {
        if (dom.batteryCapacityMin && dom.batteryCapacityMinValue) {
            dom.batteryCapacityMinValue.textContent = `${dom.batteryCapacityMin.value} kWh`;
        }
        if (dom.batteryCapacityMax && dom.batteryCapacityMaxValue) {
            dom.batteryCapacityMaxValue.textContent = `${dom.batteryCapacityMax.value} kWh`;
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
