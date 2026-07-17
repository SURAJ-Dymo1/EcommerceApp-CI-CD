# NexShop DevOps E-Commerce Platform

NexShop is a modern, single-click deployment, production-grade e-commerce application designed to demonstrate DevOps best practices.

### Make repo
`
echo "# EcommerceApp-CI-CD" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SURAJ-Dymo1/EcommerceApp-CI-CD.git
git push -u origin main
`

## Key Features

- **React Frontend**: Modern single-page app with full product catalog, search filtering, user authentication, a shopping cart, mock checkout, and dashboards.
- **FastAPI Backend**: Async Python REST API serving products, cart management, and orders, fully instrumented with Prometheus metric exports.
- **MongoDB Storage**: Stateful Database layer utilizing Headless Services and PV/PVC storage for persistence.
- **Kubernetes Native**: Declarative manifests for deployments, service discovery, NGINX Ingress routing, and Horizontal Pod Auto-scalers (HPA).
- **GitOps CI/CD**: Dual GitHub Actions workflows to build and push Docker images, update image tags in manifests, and trigger ArgoCD cluster synchronization.
- **Observability Stack**: Prometheus metrics collector and Grafana dashboard visualization setup out-of-the-box.

---

## Directory Structure

```text
ecommerce-platform/
│
├── frontend/                     # React Single Page App
│   ├── src/                      # App components and page views
│   ├── Dockerfile                # Multi-stage production build
│   └── nginx.conf                # Nginx SPA config
│
├── backend/                      # FastAPI Python REST API
│   ├── app/                      # Main routers, config, database connection
│   ├── Dockerfile                # Production build image
│   └── requirements.txt          # Python dependencies
│
├── k8s/                          # Kubernetes Manifests
│   ├── frontend/                 # UI Deployment, Service, ConfigMap, HPA
│   ├── backend/                  # API Deployment, Service, ConfigMap, Secret, HPA
│   ├── mongodb/                  # DB StatefulSet, Headless Service, PV, PVC, Secret
│   ├── ingress/                  # Nginx Ingress routing mapping
│   ├── monitoring/               # Prometheus & Grafana manifests
│   └── argocd/                   # GitOps Application setup
│
├── .github/                      # CI/CD Workflows
│   └── workflows/                # Frontend and Backend compilation & update pipelines
│
├── docs/                         # Extended Architectural & Operational docs
│   ├── architecture.md           # Architecture diagrams & explanation
│   ├── deployment.md             # How to run locally or deploy to K8s
│   └── monitoring.md             # Metrics tracking & Grafana guide
│
└── docker-compose.yml            # Local development orchestration
```

---

## Getting Started

### Local Setup

To spin up NexShop on your local machine using Docker Compose:

```bash
docker compose up -d --build
```
Access the UI at `http://localhost:3000` and API docs at `http://localhost:8000/docs`.

For detailed production kubernetes setup, monitoring configuration, and CI/CD parameters, refer to:
- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment.md)
- [Monitoring & Metrics](docs/monitoring.md)
