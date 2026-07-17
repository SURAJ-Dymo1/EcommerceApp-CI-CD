# NexShop E-Commerce Project Commands Reference

This file compiles all the essential commands required for running, deploying, and debugging the NexShop platform.

---

## 1. Local Development (Docker Compose)

### Start Services
Run all services (MongoDB, Backend, Frontend) in the background:
```bash
docker compose up -d --build
```

### Stop Services
Stop and remove containers, networks, and volumes:
```bash
docker compose down -v
```

### Check Logs
View real-time logs for all services:
```bash
docker compose logs -f
```
Or for a specific service:
```bash
docker compose logs -f backend
```

---

## 2. Kubernetes Deployment (kubectl)

### Apply Base Credentials & Storage
```bash
# Deploy MongoDB Secrets
kubectl apply -f k8s/mongodb/secret.yaml

# Deploy MongoDB Storage
kubectl apply -f k8s/mongodb/pv.yaml
kubectl apply -f k8s/mongodb/pvc.yaml
```

### Deploy MongoDB Database
```bash
kubectl apply -f k8s/mongodb/headless-service.yaml
kubectl apply -f k8s/mongodb/statefulset.yaml
```

### Deploy FastAPI Backend
```bash
kubectl apply -f k8s/backend/secret.yaml
kubectl apply -f k8s/backend/configmap.yaml
kubectl apply -f k8s/backend/service.yaml
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/backend/hpa.yaml
```

### Deploy React Frontend
```bash
kubectl apply -f k8s/frontend/configmap.yaml
kubectl apply -f k8s/frontend/service.yaml
kubectl apply -f k8s/frontend/deployment.yaml
kubectl apply -f k8s/frontend/hpa.yaml
```

### Deploy NGINX Ingress Routing
```bash
kubectl apply -f k8s/ingress/ingress.yaml
```

### Deploy GitOps Sync (ArgoCD)
```bash
kubectl apply -f k8s/argocd/application.yaml
```

---

## 3. Monitoring & Observability Stack

### Deploy Prometheus
```bash
kubectl apply -f k8s/monitoring/prometheus/rbac.yaml
kubectl apply -f k8s/monitoring/prometheus/configmap.yaml
kubectl apply -f k8s/monitoring/prometheus/deployment.yaml
kubectl apply -f k8s/monitoring/prometheus/service.yaml
```

### Deploy Grafana
```bash
kubectl apply -f k8s/monitoring/grafana/configmap.yaml
kubectl apply -f k8s/monitoring/grafana/deployment.yaml
kubectl apply -f k8s/monitoring/grafana/service.yaml
```

---

## 4. Verification & Troubleshooting

### Get Resources Status
```bash
# Check all resources
kubectl get all

# Check Ingress rules
kubectl get ingress

# Check autoscaling (HPA) status
kubectl get hpa
```

### Check Logs in Kubernetes
```bash
# Backend logs
kubectl logs -l app=backend -f --tail=100

# Frontend logs
kubectl logs -l app=frontend -f --tail=100

# MongoDB logs
kubectl logs statefulset/mongodb -f --tail=100
```

### Port Forwarding (Alternative Access)
If Ingress or NodePorts are not configured:
```bash
# Access Backend locally on port 8000
kubectl port-forward svc/backend 8000:8000

# Access Frontend locally on port 3000
kubectl port-forward svc/frontend 3000:80

# Access Prometheus dashboard locally on port 9090
kubectl port-forward svc/prometheus-service 9090:9090

# Access Grafana dashboard locally on port 3000
kubectl port-forward svc/grafana-service 3000:3000
```
