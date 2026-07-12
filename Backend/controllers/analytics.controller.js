// controllers/analytics.controller.js
// Proxies AssetFlow's Screen 9 ML API (FastAPI service, see /fastapi_app) so the
// frontend only ever talks to this Node backend, matching every other route.
const ML_API_BASE_URL = process.env.ML_API_BASE_URL || 'http://127.0.0.1:8000';

async function proxyMlRequest(path, res) {
    try {
        const response = await fetch(`${ML_API_BASE_URL}${path}`);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            return res.status(response.status).json(data ?? { error: 'ML service returned an error.' });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(`Error reaching ML service at ${ML_API_BASE_URL}${path}:`, error.message);
        res.status(502).json({ error: 'Analytics service is unavailable. Is the ML API running?' });
    }
}

export const getScreen9Analytics = (req, res) => proxyMlRequest('/analytics/screen9', res);
export const getIdleAssets = (req, res) => proxyMlRequest('/analytics/screen9/idle-assets', res);
export const getRetirementCandidates = (req, res) => proxyMlRequest('/analytics/screen9/retirement-candidates', res);
export const getBookingHeatmap = (req, res) => proxyMlRequest('/analytics/screen9/booking-heatmap', res);
export const getDepartmentUtilization = (req, res) => proxyMlRequest('/analytics/screen9/department-utilization', res);
