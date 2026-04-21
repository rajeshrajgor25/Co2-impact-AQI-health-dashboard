# CO2 Impact on AQI & Health Dashboard

An AI-powered dashboard that analyzes the impact of **CO2 emissions on Air Quality Index (AQI)** and **public health** using multiple Machine Learning models. The system combines live AQI data, weather insights, historical trends, state-city filtering, model comparison, and health risk analysis through an interactive modern dashboard.

---

## 🚀 Features

* 🌍 Live AQI using WAQI API
* 🌦 Live Weather using OpenWeather API
* 🏙 State & City Filtering
* 📈 Historical Year-wise AQI Analysis
* 🤖 AQI Prediction using Multiple ML Models
* ⚖️ Model Comparison Dashboard
* ❤️ Health Risk & Safety Insights
* 📊 Interactive Charts & Visualizations
* 🎨 Modern Responsive UI

---

## 🧠 Machine Learning Models Used

The project trains and compares the following models:

* XGBoost
* Random Forest
* Gradient Boosting
* MLP Regressor
* SVR
* Ridge Regression
* Hybrid Model Ensemble

---

## 📂 Dataset

The system uses a custom environmental dataset containing:

* CO2 Emissions
* AQI
* PM2.5 / PM10
* NO2 / SO2 / O3 / CO
* Temperature
* Humidity
* Wind Speed
* Health Impact Indicators
* State / City / Year wise records

---

## 🛠 Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* Recharts
* shadcn/ui

### Backend / ML

* Python
* Pandas
* NumPy
* Scikit-learn
* XGBoost
* Joblib

### APIs

* WAQI API
* OpenWeather API

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/rajeshrajgor25/Co2-impact-AQI-health-dashboard.git
cd Co2-impact-AQI-health-dashboard
```

### 2️⃣ Install Frontend Dependencies

```bash
npm install
```

### 3️⃣ Create Environment File

Create a `.env.local` file in the root folder:

```env
OPENWEATHER_API_KEY=your_openweather_key
WAQI_API_KEY=your_waqi_key
```

### 4️⃣ Train Models

```bash
python scripts/model_training.py
```

### 5️⃣ Run Project

```bash
npm run dev
```

---

## 📊 Dashboard Modules

### 🔹 Live Monitoring

Shows real-time AQI and weather data for selected city.

### 🔹 Prediction Engine

Predicts AQI using selected ML model based on pollution & weather inputs.

### 🔹 Model Comparison

Compares accuracy and performance of trained models.

### 🔹 Historical Analysis

Displays year-wise AQI trends for selected city/state.

### 🔹 Health Insights

Provides health impact alerts and safety recommendations.

---

## 🔮 Future Improvements

* Monthly / Daily AQI Trends
* User Alerts & Notifications
* Database Integration
* Mobile App Version
* Deployment with Full Backend API
* Real-time Analytics Storage

---

## 👨‍💻 Author

**Rajesh Rajgor**

GitHub: https://github.com/rajeshrajgor25

---
