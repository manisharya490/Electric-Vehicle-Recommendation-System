
from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler



app = Flask(__name__, template_folder='templates', static_folder='static')

def get_ev_image_url(brand, model):
    try:
        brand_clean = str(brand).strip().lower()
        model_clean = str(model).strip().lower().replace(' ', '-')
        return f"https://via.placeholder.com/300x180.png?text={brand_clean}+{model_clean}"
    except Exception:
        return "https://via.placeholder.com/300x180.png?text=EV+Image"

def load_data():
    df = pd.read_csv('ev.csv')

    # Clean missing values
    df['towing_capacity_kg'] = df.get('towing_capacity_kg', 0).fillna(0)
    df['number_of_cells'] = df.get('number_of_cells', 0).fillna(df['number_of_cells'].median())

    df['cargo_volume_l'] = pd.to_numeric(
        df.get('cargo_volume_l', 300).astype(str).str.replace(r'\D', '', regex=True),
        errors='coerce'
    ).fillna(300)

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

# --- GLOBAL DATA AND SCALER INITIALIZATION ---
df_global = None
scaler = None
FEATURES = [
    'range_km', 'efficiency_km_per_kWh', 'fast_charging_power_kw_dc',
    'price_per_km', 'acceleration_0_100_s', 'seats'
]

def global_init():
    global df_global, scaler
    df_global = load_data()
    scaler = MinMaxScaler()
    df_for_scaling = df_global[FEATURES].fillna(0)
    scaler.fit(df_for_scaling)

global_init()


def get_ev_image_url(brand, model):
    try:
        brand_clean = str(brand).strip().lower()
        model_clean = str(model).strip().lower().replace(' ', '-')
        return f"https://via.placeholder.com/300x180.png?text={brand_clean}+{model_clean}"
    except Exception:
        return "https://via.placeholder.com/300x180.png?text=EV+Image"


def knn_recommend(df, user_input, k=10):
    features = [
        'range_km', 'efficiency_km_per_kWh', 'fast_charging_power_kw_dc',
        'price_per_km', 'acceleration_0_100_s', 'seats'
    ]

    # Use global FEATURES and scaler
    if len(df) < k:
        k = len(df)
    if k == 0:
        return []
    df_scaled = scaler.transform(df[FEATURES].fillna(0))

    input_vector = np.array([[
        user_input['range_min'],
        user_input.get('efficiency', 6),
        user_input.get('fast_charging_kw', 50),
        user_input.get('price_per_km', 0.05),
        user_input.get('acceleration', 7),
        user_input['seats_min']
    ]])

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
    brands = sorted(df['brand'].dropna().unique())
    battery_types = sorted(df['battery_type'].dropna().unique())
    segments = sorted(df['segment'].dropna().unique())
    return render_template(
        'index.html',
        body_types=body_types,
        drivetrains=drivetrains,
        brands=brands,
        battery_types=battery_types,
        segments=segments
    )


@app.route('/api/recommend', methods=['POST'])
def api_recommend():
    try:
        df = load_data()
        data = request.get_json()
        print("Received input:", data)
        print(f"Initial df shape: {df.shape}")




        # Filter body type
        if data.get('body_type') not in ['', None, 'Any']:
            print(f"Filtering body_type: {data.get('body_type')}")
            df = df[df['car_body_type'].astype(str).str.lower() == data['body_type'].lower()]
            print(f"After body_type filter: {df.shape}")

        # Filter drivetrain
        if data.get('drivetrain') not in ['', None, 'Any']:
            print(f"Filtering drivetrain: {data.get('drivetrain')}")
            df = df[df['drivetrain'].astype(str).str.lower() == data['drivetrain'].lower()]
            print(f"After drivetrain filter: {df.shape}")

        # Seat filtering (robust)
        try:
            seats_min = int(data.get('seats_min')) if data.get('seats_min') not in [None, '', 'Any'] else None
            seats_max = int(data.get('seats_max')) if data.get('seats_max') not in [None, '', 'Any'] else None
            print(f"Filtering seats: min={seats_min}, max={seats_max}")
            if seats_min is not None:
                df = df[df['seats'] >= seats_min]
            if seats_max is not None:
                df = df[df['seats'] <= seats_max]
            print(f"After seats filter: {df.shape}")
        except Exception as e:
            print('Seat filter error:', e)

        # Range filtering (robust)
        try:
            range_min = int(data.get('range_min')) if data.get('range_min') not in [None, '', 'Any'] else None
            range_max = int(data.get('range_max')) if data.get('range_max') not in [None, '', 'Any'] else None
            print(f"Filtering range: min={range_min}, max={range_max}")
            if range_min is not None:
                df = df[df['range_km'] >= range_min]
            if range_max is not None:
                df = df[df['range_km'] <= range_max]
            print(f"After range filter: {df.shape}")
        except Exception as e:
            print('Range filter error:', e)

        # Battery capacity filtering (robust)
        try:
            battery_capacity_min = float(data.get('battery_capacity_min')) if data.get('battery_capacity_min') not in [None, '', 'Any'] else None
            battery_capacity_max = float(data.get('battery_capacity_max')) if data.get('battery_capacity_max') not in [None, '', 'Any'] else None
            print(f"Filtering battery: min={battery_capacity_min}, max={battery_capacity_max}")
            if battery_capacity_min is not None:
                df = df[df['battery_capacity_kWh'] >= battery_capacity_min]
            if battery_capacity_max is not None:
                df = df[df['battery_capacity_kWh'] <= battery_capacity_max]
            print(f"After battery filter: {df.shape}")
        except Exception as e:
            print('Battery capacity filter error:', e)

        if df.empty:
            print("No results after filtering!")
            return jsonify([])

        knn_input = {
            'range_min': int(data.get('range_min', df['range_km'].min())),
            'efficiency': float(data.get('efficiency', df['efficiency_km_per_kWh'].mean())),
            'fast_charging_kw': float(data.get('fast_charging_kw', df['fast_charging_power_kw_dc'].mean())),
            'price_per_km': float(data.get('price_per_km', df['price_per_km'].mean())),
            'acceleration': float(data.get('acceleration', df['acceleration_0_100_s'].mean())),
            'seats_min': int(data.get('seats_min', df['seats'].min())),
        }

        recommendations = knn_recommend(df, knn_input, k=data.get('top_n', 6))
        return jsonify(recommendations)

    except Exception as e:
        print("Error during recommendation:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
