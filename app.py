from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__, template_folder='templates', static_folder='static')


def load_data():
    df = pd.read_csv('ev.csv')

    # Clean missing values
    df['towing_capacity_kg'] = df.get('towing_capacity_kg', 0).fillna(0)
    df['number_of_cells'] = df.get('number_of_cells', 0).fillna(df['number_of_cells'].median())
    df['cargo_volume_l'] = pd.to_numeric(
        df.get('cargo_volume_l', 300).astype(str).str.replace('\D', '', regex=True),
        errors='coerce'
    ).fillna(300)

    # Ensure necessary fields
    for col in ['fast_charging_power_kw_dc', 'acceleration_0_100_s', 'seats']:
        df[col] = pd.to_numeric(df.get(col, 0), errors='coerce').fillna(0)

    df['brand'] = df.get('brand', 'Unknown').astype(str)
    df['model'] = df.get('model', 'Unknown').astype(str)
    df['full_name'] = df['brand'] + ' ' + df['model']

    # Derived features
    df['efficiency_km_per_kWh'] = df['range_km'] / df['battery_capacity_kWh']
    df['price_per_km'] = df['battery_capacity_kWh'] / df['range_km']
    df['efficiency_km_per_kWh'] = df['efficiency_km_per_kWh'].replace([np.inf, -np.inf], 0).fillna(0)
    df['price_per_km'] = df['price_per_km'].replace([np.inf, -np.inf], 0).fillna(0)

    df['image_url'] = df.apply(lambda row: get_ev_image_url(row['brand'], row['model']), axis=1)
    return df


def get_ev_image_url(brand, model):
    try:
        brand_clean = str(brand).strip().lower()
        model_clean = str(model).strip().lower().replace(' ', '-')
        return f"https://via.placeholder.com/300x180.png?text={brand_clean}+{model_clean}"
    except Exception:
        return "https://via.placeholder.com/300x180.png?text=EV+Image"


def knn_recommend(df, user_input, k=10):
    features = ['range_km', 'efficiency_km_per_kWh', 'fast_charging_power_kw_dc',
                'price_per_km', 'acceleration_0_100_s', 'seats']

    scaler = MinMaxScaler()
    df_scaled = scaler.fit_transform(df[features])

    input_vector = np.array([[user_input['range_min'],
                               user_input.get('efficiency', 6),
                               user_input.get('fast_charging_kw', 50),
                               user_input.get('price_per_km', 0.05),
                               user_input.get('acceleration', 7),
                               user_input['seats_min']]])
    input_vector_scaled = scaler.transform(input_vector)

    knn = NearestNeighbors(n_neighbors=k, metric='euclidean')
    knn.fit(df_scaled)
    distances, indices = knn.kneighbors(input_vector_scaled)

    results = df.iloc[indices[0]].copy()
    results['score'] = 100 - distances[0] * 100
    return results.to_dict('records')


@app.route('/')
def index():
    df = load_data()
    body_types = ['Any'] + sorted(df['car_body_type'].dropna().unique().tolist()) if 'car_body_type' in df else ['Any']
    drivetrains = ['Any'] + sorted(df['drivetrain'].dropna().unique().tolist()) if 'drivetrain' in df else ['Any']
    return render_template('index.html', body_types=body_types, drivetrains=drivetrains)


@app.route('/api/recommend', methods=['POST'])
def api_recommend():
    try:
        df = load_data()
        data = request.get_json()
        print("Received input:", data)
        recommendations = knn_recommend(df, data, k=data.get('top_n', 6))
        return jsonify(recommendations)
    except Exception as e:
        print("Error during recommendation:", str(e))
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
