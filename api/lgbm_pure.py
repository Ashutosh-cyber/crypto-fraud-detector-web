"""
Pure-Python / NumPy LightGBM inference + TreeSHAP.

LightGBM's compiled library depends on libgomp, which is unavailable on Vercel's
serverless runtime, so importing `lightgbm` there fails. This module parses the
exported `model.txt` (LightGBM text format) and reimplements both prediction and
the path-dependent TreeSHAP feature attributions in pure NumPy — producing values
numerically identical to `booster.predict(...)` and `predict(..., pred_contrib=True)`,
with no native dependencies.
"""
import math

import numpy as np


class Tree:
    __slots__ = (
        "feature", "threshold", "default_left", "left", "right", "value", "cover", "root"
    )

    def __init__(self, feature, threshold, default_left, left, right, value, cover, root):
        self.feature = feature          # int per node (-1 for leaf)
        self.threshold = threshold      # float per node
        self.default_left = default_left
        self.left = left                # node id per internal node
        self.right = right
        self.value = value              # raw output value per node
        self.cover = cover              # sample weight (count) per node
        self.root = root


class PureBooster:
    def __init__(self, trees, n_features, sigmoid):
        self.trees = trees
        self.n_features = n_features
        self.sigmoid = sigmoid

    # --- prediction ---
    def _raw(self, x):
        total = 0.0
        for t in self.trees:
            node = t.root
            while t.feature[node] >= 0:
                f = t.feature[node]
                xv = x[f]
                if math.isnan(xv):
                    node = t.left[node] if t.default_left[node] else t.right[node]
                elif xv <= t.threshold[node]:
                    node = t.left[node]
                else:
                    node = t.right[node]
            total += t.value[node]
        return total

    def predict_proba_one(self, x):
        return 1.0 / (1.0 + math.exp(-self.sigmoid * self._raw(x)))

    def predict_proba(self, X):
        return np.array([self.predict_proba_one(np.asarray(r, dtype=float)) for r in X])

    # --- TreeSHAP (path-dependent, exact) ---
    def shap_one(self, x):
        phi = np.zeros(self.n_features + 1)  # last slot = base/expected value
        for t in self.trees:
            _tree_shap(t, np.asarray(x, dtype=float), phi, self.n_features)
        return phi


def _tree_shap(tree, x, phi, n_features):
    # Path element columns: [feature_index, zero_fraction, one_fraction, pweight].
    def extend(path, pz, po, pi):
        path = [list(e) for e in path]  # copy
        l = len(path)
        path.append([pi, pz, po, 1.0 if l == 0 else 0.0])
        for i in range(l - 1, -1, -1):
            path[i + 1][3] += po * path[i][3] * (i + 1) / (l + 1)
            path[i][3] = pz * path[i][3] * (l - i) / (l + 1)
        return path

    def unwind(path, i):
        path = [list(e) for e in path]
        l = len(path) - 1
        n = path[l][3]
        for j in range(l - 1, -1, -1):
            if path[i][2] != 0:
                t = path[j][3]
                path[j][3] = n * (l + 1) / ((j + 1) * path[i][2])
                n = t - path[j][3] * path[i][1] * (l - j) / (l + 1)
            else:
                path[j][3] = path[j][3] * (l + 1) / (path[i][1] * (l - j))
        for j in range(i, l):
            path[j][0] = path[j + 1][0]
            path[j][1] = path[j + 1][1]
            path[j][2] = path[j + 1][2]
        return path[:l]

    def rec(node, path, pz, po, pi):
        path = extend(path, pz, po, pi)
        if tree.feature[node] < 0:  # leaf
            for i in range(1, len(path)):
                w = sum(e[3] for e in unwind(path, i))
                phi[path[i][0]] += w * (path[i][2] - path[i][1]) * tree.value[node]
        else:
            f = tree.feature[node]
            xv = x[f]
            if math.isnan(xv):
                hot = tree.left[node] if tree.default_left[node] else tree.right[node]
            elif xv <= tree.threshold[node]:
                hot = tree.left[node]
            else:
                hot = tree.right[node]
            cold = tree.right[node] if hot == tree.left[node] else tree.left[node]

            iz, io = 1.0, 1.0
            k = next((idx for idx, e in enumerate(path) if e[0] == f), None)
            if k is not None:
                iz, io = path[k][1], path[k][2]
                path = unwind(path, k)

            r_node = tree.cover[node]
            rec(hot, path, iz * tree.cover[hot] / r_node, io, f)
            rec(cold, path, iz * tree.cover[cold] / r_node, 0.0, f)

    # base value contribution: root value is the expectation baseline
    phi[n_features] += tree.value[tree.root]
    rec(tree.root, [], 1.0, 1.0, -1)


def load_model(path):
    with open(path) as f:
        # splitlines() handles \n and \r\n uniformly.
        lines = f.read().splitlines()

    n_features = None
    sigmoid = 1.0
    trees = []
    cur = None  # kv dict for the tree currently being read

    for line in lines:
        if line.startswith("Tree="):
            if cur is not None:
                trees.append(_parse_tree(cur))
            cur = {}
            continue
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        if cur is not None:
            cur[k] = v
        elif k == "max_feature_idx":
            n_features = int(v) + 1
        elif k == "objective":
            for tok in v.split():
                if tok.startswith("sigmoid:"):
                    sigmoid = float(tok.split(":")[1])

    if cur is not None:
        trees.append(_parse_tree(cur))

    return PureBooster(trees, n_features, sigmoid)


def _floats(s):
    return [float(x) for x in s.split()]


def _ints(s):
    return [int(x) for x in s.split()]


def _parse_tree(kv):
    num_leaves = int(kv["num_leaves"])
    num_internal = num_leaves - 1

    if num_internal == 0:
        # Single-leaf tree (rare).
        val = float(kv["leaf_value"])
        cover = float(kv.get("leaf_count", "1").split()[0]) if "leaf_count" in kv else 1.0
        feature = np.array([-1])
        return Tree(feature, np.zeros(1), np.zeros(1, bool), np.zeros(1, int),
                    np.zeros(1, int), np.array([val]), np.array([cover]), 0)

    split_feature = _ints(kv["split_feature"])
    threshold = _floats(kv["threshold"])
    decision_type = _ints(kv["decision_type"])
    left_child = _ints(kv["left_child"])
    right_child = _ints(kv["right_child"])
    leaf_value = _floats(kv["leaf_value"])
    internal_value = _floats(kv["internal_value"])
    internal_count = _floats(kv["internal_count"])
    leaf_count = _floats(kv["leaf_count"])

    n_nodes = num_internal + num_leaves
    feature = np.full(n_nodes, -1, dtype=int)
    thr = np.zeros(n_nodes)
    default_left = np.zeros(n_nodes, dtype=bool)
    left = np.zeros(n_nodes, dtype=int)
    right = np.zeros(n_nodes, dtype=int)
    value = np.zeros(n_nodes)
    cover = np.zeros(n_nodes)

    def leaf_id(neg_child):
        return num_internal + (-neg_child - 1)

    for i in range(num_internal):
        feature[i] = split_feature[i]
        thr[i] = threshold[i]
        default_left[i] = bool(decision_type[i] & 2)
        value[i] = internal_value[i]
        cover[i] = internal_count[i]
        lc = left_child[i]
        rc = right_child[i]
        left[i] = lc if lc >= 0 else leaf_id(lc)
        right[i] = rc if rc >= 0 else leaf_id(rc)

    for j in range(num_leaves):
        nid = num_internal + j
        feature[nid] = -1
        value[nid] = leaf_value[j]
        cover[nid] = leaf_count[j]

    return Tree(feature, thr, default_left, left, right, value, cover, 0)
