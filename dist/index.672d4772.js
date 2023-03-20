"use strict";
// Selectors
const form = document.querySelector(".form");
const inputType = document.querySelector(".form__input");
const inputCadence = document.querySelector(".form__input--cadence");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputElevation = document.querySelector(".form__input--elevation");
const workoutBox = document.querySelector(".workouts_container");
// Define Workout class
class Workout {
    date = new Date();
    id = Date.now();
    constructor(distance, coords, duration){
        this.distance = distance;
        this.coords = coords;
        this.duration = duration;
    }
    // Description of every workout
    // prettier-ignore
    setDescription() {
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
        this.description = `${inputType.value[0].toUpperCase() + inputType.value.slice(1)} on ${months[this.date.getMonth() + 1].slice(0, 3)} ${this.date.getDate()}`;
        return this.description;
    }
}
// Define Running class as extend of Workout class
class Running extends Workout {
    constructor(distance, coords, duration, cadence){
        super(distance, coords, duration);
        this.cadence = cadence;
        this.calcPace();
        this.setDescription();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
// Define Cycle class as extend of Workout class
class Cycle extends Workout {
    constructor(distance, coords, duration, elevation){
        super(distance, coords, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this.setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
class App {
    // Map variable
    map;
    // mapEvent varible to extract coordinates so they are available throug out the App
    mapEvent;
    // Array to store workouts
    workouts = [];
    // Unique workout ID
    workoutID;
    constructor(){
        this.getPosition();
        this.getLocalStorage();
        // Attach handlers
        // change between running and cylicling
        inputType.addEventListener("change", this.toggleElevationField);
        // enter stroke on input field
        form.addEventListener("keypress", this.newWorkout.bind(this));
        // move to a workout from the list
        workoutBox.addEventListener("click", this.moveToWorkout.bind(this));
    }
    getPosition() {
        // Get my coordinates, if positive: open map and pin, if negative alert a message
        navigator.geolocation.getCurrentPosition(this.loadMap.bind(this), function() {
            alert("Please allow use of your location");
        });
    }
    loadMap(position) {
        const { latitude , longitude  } = position.coords;
        // Leaflet Map, change the variable map
        this.map = L.map("map").setView([
            latitude,
            longitude
        ], 13);
        // Map
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "\xa9 OpenStreetMap"
        }).addTo(this.map);
        // Click map event listener
        this.map.on("click", this.showForm.bind(this));
        // For each workout show the marker
        this.workouts.forEach((work)=>{
            this.addMarker(work);
        });
    }
    showForm(clickEvent) {
        // change the mapevent variable and extract the coords
        this.mapEvent = clickEvent;
        const { lat , lng  } = this.mapEvent.latlng;
        form.classList.remove("hidden");
        inputDistance.focus();
    }
    toggleElevationField() {
        inputCadence.closest(".form__row").classList.toggle("hidden");
        inputElevation.closest(".form__row").classList.toggle("hidden");
    }
    newWorkout(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            const { lat , lng  } = this.mapEvent.latlng;
            const distance = inputDistance.value;
            const duration = inputDuration.value;
            const cadence = inputCadence.value;
            const elevation = inputElevation.value;
            let workout;
            //Check if every value is a number
            const isNumber = function(...inputs) {
                return inputs.every(function(inp) {
                    return !isNaN(inp);
                });
            };
            //Check if every input is greater or equal than 0
            const isPositive = function(...inputs) {
                return inputs.every(function(inp) {
                    return inp > 0;
                });
            };
            //Clear inputs
            this.clearInput();
            if (inputType.value === "running") {
                if (isNumber(distance, duration, cadence) && isPositive(distance, duration, cadence)) {
                    workout = new Running(distance, [
                        lat,
                        lng
                    ], duration, cadence);
                    workout.type = "running";
                } else {
                    alert("Input must be a positive number");
                    return;
                }
            }
            if (inputType.value === "cycling") {
                if (isNumber(distance, duration, elevation) && isPositive(distance, duration)) {
                    workout = new Cycle(distance, [
                        lat,
                        lng
                    ], duration, elevation);
                    workout.type = "cycling";
                } else {
                    alert("Input must be a positive number");
                    return;
                }
            }
            // Focus on distance field
            inputDistance.focus();
            // Push workout to an array
            this.workouts.push(workout);
            // Clear the input fields
            this.clearInput();
            // Add marker
            this.addMarker(workout);
            // Hide form
            this.hideForm();
            // HTML inject
            this.injectHTML(workout);
            // Set local storage
            this.setLocalStorage(workout);
        }
    }
    //Clear inputs fileds function
    clearInput() {
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = "";
    }
    // Add marker function
    addMarker(workout) {
        L.marker(workout.coords).addTo(this.map).bindPopup(`${workout.description}`, {
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        }).openPopup();
    }
    hideForm() {
        form.classList.add("hidden");
    }
    injectHTML(workout) {
        let html = `
      <li class="workouts ${workout.type}" data-id = ${workout.id}>
        <div class="workout_box">
          <h2 class="workout_title">
            ${workout.type[0].toUpperCase() + workout.type.slice(1)}
          </h2>
          <div class="workout_details">
            <span class="workout_icon">${workout.type === "running" ? "\uD83C\uDFC3‍♂️" : "\uD83D\uDEB4‍♀️"}</span>
            <span class="workout_value">${workout.distance}</span>
            <span class="workout_unit">km</span>
          </div>
          <div class="workout_details">
            <span class="workout_icon">⏱</span>
            <span class="workout_value">${workout.duration}</span>
            <span class="workout_unit">min</span>
          </div>`;
        if (workout.type === "running") html += `
            <div class="workout_details">
              <span class="workout_icon">⚡️</span>
              <span class="workout_value">${workout.pace}</span>
              <span class="workout_unit">min/km</span>
            </div>
            <div class="workout_details">
              <span class="workout_icon">🦶🏼</span>
              <span class="workout_value">${workout.cadence}</span>
              <span class="workout_unit">spm</span>
            </div>
          </div>
        </li>`;
        if (workout.type === "cycling") html += `
              <div class="workout_details">
                <span class="workout_icon">⚡️</span>
                <span class="workout_value">${workout.speed}</span>
                <span class="workout_unit">min/km</span>
              </div>
              <div class="workout_details">
                <span class="workout_icon">⛰</span>
                <span class="workout_value">${workout.elevation}</span>
                <span class="workout_unit">spm</span>
              </div>
            </div>
          </li>`;
        form.insertAdjacentHTML("afterend", html);
    }
    moveToWorkout(e) {
        // if the user clicks outside the workouts container the return
        if (!e.target.closest(".workouts")) return;
        //extract workout id on the clicked container
        //if that id matches the id from an element in the workout array, then extract coords from that element
        let workoutID = e.target.closest(".workouts").dataset.id;
        for(let i = 0; i <= this.workouts.length - 1; i++)if (workoutID == this.workouts[i].id) {
            const [latitude, longitude] = this.workouts[i].coords;
            this.map.setView([
                latitude,
                longitude
            ], 13);
        }
    }
    setLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.workouts));
    }
    getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("workouts"));
        if (!data) return;
        this.workouts = data;
        this.workouts.forEach((work)=>{
            this.injectHTML(work);
        });
    }
}
const app = new App();

//# sourceMappingURL=index.672d4772.js.map
