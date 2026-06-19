# Bitcoin Wallet Fraud Detector

A single-page web app that classifies a Bitcoin wallet as **Fraudulent** or
**Legitimate** using the RQ2 static-baseline LightGBM model (ROC-AUC 0.962 on
the Elliptic++ test split), with a SHAP-style breakdown of which wallet
features drove the decision.

Built for one-click deploy to **Vercel**: a Vite/React frontend plus a
lightweight Python serverless API in `api/`.

```
crypto-fraud-detector-web/
├── api/
│   ├── index.py        # FastAPI serverless function (routes under /api)
│   ├── model.txt       # native LightGBM booster (RQ2 static baseline)
│   ├── features.json   # feature order expected by the model
│   ├── medians.json    # training-set medians for auto-filled features
│   └── examples.json   # real genuine / fraud demo wallets
├── src/                # React app (App, InputForm, ResultsPanel, ShapChart)
├── index.html
├── package.json
├── vercel.json         # routes /api/* -> the Python function
└── requirements.txt    # fastapi + lightgbm + numpy (no shap/sklearn/pandas)
```

## Why no `shap` library?

The original research backend used `shap.TreeExplainer`, which pulls in
`numba`/`llvmlite` and is too large for Vercel's serverless limits. LightGBM
computes the **same** TreeSHAP values natively via
`booster.predict(X, pred_contrib=True)`, so this build drops `shap`,
`scikit-learn`, and `pandas` entirely. Predictions and attributions are
numerically identical to the original.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel: **New Project → import the repo**. Vercel auto-detects Vite for
   the frontend and the `api/` folder as a Python serverless function.
3. No environment variables are needed — the frontend calls same-origin `/api`.
4. Deploy. Done.

## Run locally

```bash
# API (uses any Python 3.11–3.12 env with the deps installed)
pip install -r requirements.txt fastapi uvicorn
uvicorn api.index:app --port 8000     # serves /api/predict, /api/metadata, /api/examples

# Frontend (separate terminal)
npm install
npm run dev                           # http://127.0.0.1:5173
```

`.env.development` points the dev frontend at `http://127.0.0.1:8000`. In
production that variable is unset, so the app uses same-origin `/api`.

## API

`POST /api/predict` — JSON body with any subset of the 8 user fields
(`fees_min`, `fees_max`, `fees_total`, `transacted_w_address_total`,
`lifetime_in_blocks`, `num_timesteps_appeared_in`, `first_sent_block`,
`first_received_block`), or `{ "example_id": "fraud-1" }` to score a built-in
real wallet on its full 39-feature vector. Returns the verdict, fraud
probability, and the top-8 features by absolute SHAP contribution.

`GET /api/metadata` — auto-filled features grouped by category with defaults.
`GET /api/examples` — the genuine / fraud demo wallets.

## Regenerating the model artifacts

The artifacts in `api/` are exported from the dissertation's RQ2 pipeline by
`../fraud_detector_app/backend/export_artifacts.py` (which also writes
`model.txt`). They do **not** require the 581 MB training dataset at runtime.
