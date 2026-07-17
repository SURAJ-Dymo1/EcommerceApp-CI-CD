# Deployment Guide

This guide details the steps to deploy the NexShop E-Commerce platform in different environments.

## Local Deployment (Docker Compose)

The easiest way to test the setup locally is using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed.

### Steps

1. Navigate to the root directory:
   ```bash
   cd ecommerce-platform
   ```

2. Start the services:
   ```bash
   docker compose up --build -d
   ```

3. Access the application:
   - **React Frontend**: `http://localhost:3000`
   - **FastAPI API Documentation**: `http://localhost:8000/docs`
   - **MongoDB Direct Connection**: `mongodb://admin:adminpassword@localhost:27018`

---

## Kubernetes Deployment (Manual)

To deploy manually inside a Kubernetes cluster:

### Prerequisites

- Kubernetes cluster (e.g. Minikube, Kind, or a cloud provider)
- `kubectl` configured
- Ingress NGINX controller installed in the cluster

### Steps

1. Deploy Database and Storage:
   ```bash
   kubectl apply -f k8s/mongodb/secret.yaml
   kubectl apply -f k8s/mongodb/pv.yaml
   kubectl apply -f k8s/mongodb/pvc.yaml
   kubectl apply -f k8s/mongodb/headless-service.yaml
   kubectl apply -f k8s/mongodb/statefulset.yaml
   ```

2. Deploy Backend Application:
   ```bash
   kubectl apply -f k8s/backend/secret.yaml
   kubectl apply -f k8s/backend/configmap.yaml
   kubectl apply -f k8s/backend/service.yaml
   kubectl apply -f k8s/backend/deployment.yaml
   kubectl apply -f k8s/backend/hpa.yaml
   ```

3. Deploy Frontend Application:
   ```bash
   kubectl apply -f k8s/frontend/configmap.yaml
   kubectl apply -f k8s/frontend/service.yaml
   kubectl apply -f k8s/frontend/deployment.yaml
   kubectl apply -f k8s/frontend/hpa.yaml
   ```

4. Deploy Ingress:
   ```bash
   kubectl apply -f k8s/ingress/ingress.yaml
   ```

5. Map Domain Name:
   Add the following line to your `/etc/hosts` file (or equivalent on Windows):
   ```text
   <INGRESS_CONTROLLER_IP> ecommerce.local
   ```
   (On Minikube, obtain the IP using `minikube ip`).

6. Access the site at `http://ecommerce.local`.

---

## GitOps Deployment (ArgoCD)

To set up automated syncing through ArgoCD:

1. Install ArgoCD in your cluster.
2. Apply the ArgoCD Application manifest:
   ```bash
   kubectl apply -f k8s/argocd/application.yaml
   ```
3. ArgoCD will track the repository and automatically synchronize changes when you commit modifications to the `k8s/` manifests.
