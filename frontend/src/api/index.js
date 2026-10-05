export const API = (import.meta.env.VITE_API_URL || '').trim() || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api/v1'
    : 'https://talentflow-api-v6ce.onrender.com/api/v1'
);

export const getToken = () => localStorage.getItem('tf_token');
export const setToken = (token) => localStorage.setItem('tf_token', token);
export const clearToken = () => localStorage.removeItem('tf_token');

export const api = async (path, opts = {}) => {
  const token = getToken();
  const isFormData = opts.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(opts.headers || {})
  };

  const r = await fetch(API + path, { ...opts, headers });

  if (!r.ok) {
    let msg = 'Request failed';
    try {
      const err = await r.json();
      if (typeof err === 'string') {
        msg = err;
      } else if (err.detail) {
        msg = err.detail;
      } else if (err.error) {
        msg = err.error;
      } else if (err.message) {
        msg = err.message;
      } else if (err.non_field_errors) {
        msg = Array.isArray(err.non_field_errors) ? err.non_field_errors.join(' ') : String(err.non_field_errors);
      } else {
        const keys = Object.keys(err);
        if (keys.length > 0) {
          const val = err[keys[0]];
          msg = Array.isArray(val) ? `${keys[0]}: ${val.join(', ')}` : `${keys[0]}: ${val}`;
        }
      }
    } catch {
      msg = r.statusText || `Error ${r.status}`;
    }
    throw new Error(msg);
  }

  return r.status === 204 ? null : r.json();
};

export const uploadResumeFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api('/applications/parse-resume/', {
    method: 'POST',
    body: formData
  });
};

export const fetchRecruiterAnalytics = async () => {
  return api('/applications/analytics/');
};
