#  Electric Vehicle (EV) Recommendation System

A simple **Flask-based web application** that recommends electric vehicles (EVs) based on user preferences using a **K-Nearest Neighbors (KNN)** model.  
The backend is built with **Python (Flask, Pandas, Scikit-learn)**, and the frontend is designed using **HTML & CSS** for a clean and user-friendly interface.

---

## Features
-  Dynamic EV data loading and cleaning (`ev.csv` dataset)
-  Calculates efficiency and price-per-km for better insights
-  KNN-based recommendation engine for personalized EV suggestions
-  API endpoint (`/api/recommend`) for JSON-based recommendations
-  Simple, responsive frontend built with HTML and CSS

---

## Tech Stack
- **Backend:** Python, Flask
- **ML Model:** Scikit-learn (KNN)
- **Data Processing:** Pandas, NumPy
- **Frontend:** HTML, CSS

---
## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/manisharya490/Electric-Vehicle-Recommendation-System.git
cd Electric-Vehicle-Recommendation-System
```

### 2. Install Dependencies
It is recommended to use a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# Or: source venv/bin/activate  # On Mac/Linux
pip install -r requirements.txt
```

### 3. Prepare the Data
- Ensure `ev.csv` is present in the project root. This file contains all EV data used for recommendations.

### 4. Run the Application
```bash
python app.py
```
The app will be available at [http://127.0.0.1:5000](http://127.0.0.1:5000)

---
## Usage

1. Set your filter preferences in the sidebar (vehicle type, drivetrain, seats, range, battery).
2. Click **Find My EV Match** to get personalized recommendations.
3. Click **Reset Filters** to clear all filters and start over.

---
## Project Structure

```
├── app.py                  # Flask backend and API
├── ev.csv                  # Main EV dataset
├── requirements.txt        # Python dependencies
├── static/
│   ├── css/style.css       # Main stylesheet
│   ├── js/script.js        # Frontend logic
│   └── screenshorts/       # Screenshots for README
├── templates/
│   └── index.html          # Main HTML template
├── ev_recommendation_workflow.ipynb  # Data science workflow and feature selection
└── README.md
```

---
## Troubleshooting

- **No recommendations shown?**
  - Check the browser console for JavaScript errors.
  - Check the Flask terminal for filter debug output (added for troubleshooting).
  - Ensure all required columns exist in `ev.csv` and match the code.
- **Port already in use?**
  - Change the port in `app.py` or stop the other process.
- **Static files not updating?**
  - Try a hard refresh (Ctrl+F5) in your browser.

---
## Data Science Notes

- The backend uses hard filtering for categorical features (body type, drivetrain) and KNN for numeric similarity.
- The notebook (`ev_recommendation_workflow.ipynb`) contains feature selection and prototyping logic.

---
## Credits

Created by [manisharya490](https://github.com/manisharya490)
