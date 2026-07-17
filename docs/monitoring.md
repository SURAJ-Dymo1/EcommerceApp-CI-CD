# Monitoring & Observability Reference

This document outlines the monitoring infrastructure configured for the NexShop platform.

## Infrastructure Components

- **Prometheus**: Installed in the cluster to automatically discover scrape targets using annotations. Exposes metrics on port `9090` (accessible via NodePort `30090`).
- **Grafana**: Visualizes metrics stored in Prometheus. Automatically configured with Prometheus as a datasource on startup. Exposes dashboard UI on port `3000` (accessible via NodePort `30000`).

---

## Scrape Configuration

The Prometheus configmap defines a job `kubernetes-pods` which automatically scans for running pods in the cluster containing the following annotations:

- `prometheus.io/scrape: "true"`
- `prometheus.io/path: "/metrics"`
- `prometheus.io/port: "<port>"`

Our FastAPI backend deployment is annotated as follows:
```yaml
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "8000"
```

---

## Exposed Metrics

The backend exposes Python runtime metrics alongside custom HTTP metrics:

| Metric Name | Type | Description | Labels |
|-------------|------|-------------|--------|
| `http_requests_total` | Counter | Total requests received | `method`, `endpoint`, `http_status` |
| `http_request_duration_seconds` | Histogram | Request latency in seconds | `method`, `endpoint` |

To view raw metrics, curl the backend's metrics path:
```bash
curl http://backend:8000/metrics
```

---

## Grafana Access & Dashboards

1. Access Grafana at `http://<node-ip>:30000`.
2. Log in using default credentials:
   - **Username**: `admin`
   - **Password**: `admin`
3. Prometheus will already be listed under **Configuration > Datasources**.
4. You can create custom panels to track:
   - **Request Rate**: `sum(rate(http_requests_total[5m])) by (endpoint)`
   - **Error Rate**: `sum(rate(http_requests_total{http_status=~"5.."}[5m]))`
   - **95th Percentile Latency**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
