#!/usr/bin/env python3
"""
Bitcoin Wallet Fraud Detector - serverless API (Vercel Python runtime).

Lightweight rewrite of the original FastAPI backend with NO lightgbm / shap /
scikit-learn / pandas dependency. LightGBM's compiled library can't load on
Vercel's serverless runtime (missing libgomp), so inference and TreeSHAP are
reimplemented in pure NumPy (see lgbm_pure.py) by parsing the exported
model.txt. Feature attributions are numerically identical to LightGBM's
`predict(..., pred_contrib=True)` (verified to ~1e-16).

Routes are prefixed with /api so they work both on Vercel (where requests are
rewritten to this function) and locally via `uvicorn api.index:app`.
"""
import json
import os
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

HERE = os.path.dirname(os.path.abspath(__file__))

# Capture any startup failure (e.g. native-lib / bundling issues) instead of
# crashing the whole serverless function, so the error is observable via /api.
STARTUP_ERROR = None
BOOSTER = None
FEATURE_ORDER = []
MEDIANS = {}
EXAMPLES = []
EXAMPLES_BY_ID = {}

try:
    import sys

    import numpy as np

    sys.path.insert(0, HERE)  # ensure sibling lgbm_pure is importable on Vercel
    from lgbm_pure import load_model

    BOOSTER = load_model(os.path.join(HERE, "model.txt"))
    with open(os.path.join(HERE, "features.json")) as f:
        FEATURE_ORDER = json.load(f)
    with open(os.path.join(HERE, "medians.json")) as f:
        MEDIANS = json.load(f)
    with open(os.path.join(HERE, "examples.json")) as f:
        EXAMPLES = json.load(f)
    EXAMPLES_BY_ID = {ex["id"]: ex for ex in EXAMPLES}
except Exception:
    STARTUP_ERROR = traceback.format_exc()

USER_FIELDS = [
    "fees_min",
    "fees_max",
    "fees_total",
    "transacted_w_address_total",
    "lifetime_in_blocks",
    "num_timesteps_appeared_in",
    "first_sent_block",
    "first_received_block",
]


def _categorize(feature: str) -> str:
    if feature.startswith("fees") or "fees_as_share" in feature:
        return "Fees"
    if "blocks_btwn_txs" in feature or "blocks_btwn_output_txs" in feature or "blocks_btwn_input_txs" in feature:
        return "Cadence"
    if feature in ("first_sent_block", "first_received_block", "first_block_appeared_in", "last_block_appeared_in"):
        return "Timing"
    if feature in ("lifetime_in_blocks", "num_timesteps_appeared_in"):
        return "Span"
    if feature.startswith("transacted_w_address") or feature == "num_addr_transacted_multiple":
        return "Diversity"
    return "Other"


app = FastAPI(title="Bitcoin Wallet Fraud Detector", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    fees_min: float | None = None
    fees_max: float | None = None
    fees_total: float | None = None
    transacted_w_address_total: float | None = None
    lifetime_in_blocks: float | None = None
    num_timesteps_appeared_in: float | None = None
    first_sent_block: float | None = None
    first_received_block: float | None = None
    example_id: str | None = None


class ShapContribution(BaseModel):
    feature: str
    shap_value: float
    actual_value: float
    source: str = Field(description="'User Input', 'Default', or 'Example'")


class PredictResponse(BaseModel):
    verdict: str
    fraud_probability: float
    used_all_defaults: bool
    top_features: list[ShapContribution]


@app.get("/api")
def root():
    if STARTUP_ERROR:
        return {"status": "error", "startup_error": STARTUP_ERROR}
    return {"status": "ok", "model": "RQ2 static baseline (LightGBM, pure-NumPy inference)", "n_features": len(FEATURE_ORDER)}


@app.get("/api/metadata")
def metadata():
    groups: dict[str, list[dict]] = {}
    for feat in FEATURE_ORDER:
        if feat in USER_FIELDS:
            continue
        groups.setdefault(_categorize(feat), []).append(
            {"feature": feat, "default": float(MEDIANS.get(feat, 0.0))}
        )
    order = ["Fees", "Timing", "Cadence", "Span", "Diversity", "Other"]
    ordered = {k: groups[k] for k in order if k in groups}
    return {"user_fields": USER_FIELDS, "auto_filled": ordered}


@app.get("/api/examples")
def examples():
    return [
        {
            "id": ex["id"],
            "kind": ex["kind"],
            "title": ex["title"],
            "blurb": ex["blurb"],
            "user_values": ex["user_values"],
        }
        for ex in EXAMPLES
    ]


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if req.example_id:
        ex = EXAMPLES_BY_ID.get(req.example_id)
        if ex is None:
            return PredictResponse(
                verdict="Licit", fraud_probability=0.0, used_all_defaults=False, top_features=[]
            )
        row_values = {f: float(ex["full_vector"].get(f, MEDIANS.get(f, 0.0))) for f in FEATURE_ORDER}
        supplied = set(ex["user_values"].keys())
        used_all_defaults = False
        example_mode = True
    else:
        provided = {k: v for k, v in req.model_dump().items() if v is not None and k != "example_id"}
        used_all_defaults = len(provided) == 0
        row_values = {
            f: float(provided[f]) if f in provided else float(MEDIANS.get(f, 0.0))
            for f in FEATURE_ORDER
        }
        supplied = set(provided.keys())
        example_mode = False

    x = np.array([row_values[f] for f in FEATURE_ORDER], dtype=float)

    # Positive-class (illicit) probability.
    proba = float(BOOSTER.predict_proba_one(x))
    verdict = "Illicit" if proba >= 0.5 else "Licit"

    # TreeSHAP feature attributions (last slot is the unused base value).
    contrib = BOOSTER.shap_one(x)[:-1]

    order = np.argsort(np.abs(contrib))[::-1][:8]
    top_features = []
    for idx in order:
        feat = FEATURE_ORDER[idx]
        if example_mode:
            source = "Example"
        elif feat in supplied:
            source = "User Input"
        else:
            source = "Default"
        top_features.append(
            ShapContribution(
                feature=feat,
                shap_value=float(contrib[idx]),
                actual_value=float(row_values[feat]),
                source=source,
            )
        )

    return PredictResponse(
        verdict=verdict,
        fraud_probability=proba,
        used_all_defaults=used_all_defaults,
        top_features=top_features,
    )
