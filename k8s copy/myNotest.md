# NexShop Kubernetes (K8s) Learning & Reference Guide

This document is a comprehensive, deep-dive guide designed to help you understand Kubernetes concepts, master YAML syntax, and trace exactly how the manifest files in your `k8s/` folder orchestrate the NexShop E-Commerce platform.

---

## 1. Understanding YAML for Kubernetes

**YAML** (YAML Ain't Markup Language) is a human-readable data-serialization standard. Kubernetes uses YAML files (often called **manifests**) to define the desired state of cluster resources.

### Core Syntax Rules
1. **Indentation is everything**: Indentation defines the hierarchy of your data. You **must** use spaces, never tabs. Most manifests use a 2-space indentation standard.
2. **Key-Value Pairs**: Represented as `key: value`. Note the space after the colon.
   ```yaml
   name: backend
   namespace: default
   ```
3. **Lists / Arrays**: Indicated by a dash `-` at the same indentation level.
   ```yaml
   ports:
     - port: 8000
       targetPort: 8000
     - port: 8080
       targetPort: 8080
   ```
4. **Maps / Objects**: Nested collections of key-value pairs.
   ```yaml
   metadata:
     name: backend
     namespace: default
   ```
5. **Comments**: Start with a `#`.
6. **Multi-line Strings**:
   * Use `|` (literal block scalar) to keep newlines intact.
   * Use `>` (folded block scalar) to fold newlines into spaces.

---

### The Anatomy of a Kubernetes Manifest
Every Kubernetes YAML file contains five top-level fields:

| Field | Purpose | Example |
| :--- | :--- | :--- |
| `apiVersion` | Which version of the Kubernetes API to use when creating the object. | `apps/v1`, `v1`, `networking.k8s.io/v1` |
| `kind` | The type of resource/object being created. | `Pod`, `Deployment`, `Service`, `StatefulSet` |
| `metadata` | Information that uniquely identifies the object. | `name: backend`, `labels: app: backend` |
| `spec` | **The Desired State**. What you want the resource to look like (containers, replicas, ports). | `replicas: 2`, `containers: - name: backend` |
| `status` | **The Actual State**. Provided and updated dynamically by the cluster. (You never write this in your source YAML). | `availableReplicas: 2` |

---

## 2. Kubernetes Cluster Architecture

A Kubernetes cluster consists of two main parts: the **Control Plane** (Master Nodes) and the **Worker Nodes**.

```mermaid
graph TD
    subgraph Control Plane (Master Node)
        API["API Server (kube-apiserver)"]
        ETCD["etcd (Key-Value Store)"]
        SCHED["Scheduler (kube-scheduler)"]
        CM["Controller Manager"]
    end

    subgraph Worker Nodes
        Kubelet1["Kubelet (Node 1)"]
        Proxy1["Kube-Proxy (Node 1)"]
        Runtime1["Container Runtime"]
        
        Kubelet2["Kubelet (Node 2)"]
        Proxy2["Kube-Proxy (Node 2)"]
        Runtime2["Container Runtime"]
    end

    API --- ETCD
    API --- SCHED
    API --- CM
    API === Kubelet1
    API === Kubelet2
    Proxy1 --- Kubelet1
    Proxy2 --- Kubelet2
```

### The Control Plane (The Brain)
* **kube-apiserver**: The gateway for all REST commands. Users, CLI tools (`kubectl`), and internal components interact only through the API server.
* **etcd**: A highly-available, distributed key-value store. It holds the entire database of the cluster's state. If it's not in etcd, Kubernetes doesn't know it exists.
* **kube-scheduler**: Assigns work. It monitors for newly created Pods with no assigned node, filters nodes based on resource demands (CPU/RAM), and schedules them onto appropriate worker nodes.
* **kube-controller-manager**: Runs controllers that regulate the state of the cluster. It constantly compares the *actual state* (from etcd) to the *desired state* (from your YAML) and makes changes to align them.

### The Worker Nodes (The Brawn)
* **kubelet**: An agent that runs on every node. It receives instructions from the API server (via a `PodSpec`) and makes sure the container runtime runs the specified containers and reports their health.
* **kube-proxy**: A network proxy that runs on each node. It maintains network rules (IP tables / IPVS) allowing pods to communicate with each other and with external networks.
* **Container Runtime**: The engine that runs the container images (e.g., `containerd` or `docker-worker`).

---

## 3. Deep-Dive: Core Resources with NexShop Examples

### A. Pod
* **Concept**: The smallest deployable unit in Kubernetes. A Pod hosts one or more containers that share network namespaces, storage volumes, and a single IP address.
* **Analogy**: Think of a Pod as a "condominium." It has a shared address (IP) and shared resources (volumes), but inside, there are individual occupants (containers).
* **Multi-Container Pods**: Usually used for a helper pattern (e.g., sidecars, logging agents, proxies). In NexShop, your pods are single-container.

---

### B. Deployment
* **Concept**: Manages stateless Pods. It allows you to declare how many copies (replicas) of a Pod should run, handles rolling updates (zero downtime), and rolls back changes if a deployment fails.
* **How it works**: The Deployment creates and manages a **ReplicaSet**, which in turn creates the individual Pods.

#### Trace: `k8s/backend/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: default
  labels:
    app: backend
spec:
  replicas: 2              # Desired state: Always run 2 instances of this pod.
  selector:
    matchLabels:
      app: backend         # The Deployment will manage any Pod with the label `app: backend`.
  template:                # The template is the "blueprint" of the Pods to create.
    metadata:
      labels:
        app: backend       # MUST match the selector label above.
      annotations:
        prometheus.io/scrape: "true"
    spec:
      containers:
        - name: backend
          image: yourdockerusername/ecommerce-backend:latest
          ports:
            - containerPort: 8000
              name: http
```

#### Readiness vs. Liveness Probes
In `k8s/backend/deployment.yaml`, you see:
```yaml
          readinessProbe:    # Can this container accept traffic?
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 15
          livenessProbe:     # Is this container alive, or is it frozen/deadlock?
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 20
```
* **Readiness Probe**: If this fails, the Service stops sending traffic to the Pod.
* **Liveness Probe**: If this fails, the Kubelet kills the container and restarts it.

---

### C. Service
* **Concept**: Pods are ephemeral; they die and get recreated with new IP addresses. A Service provides a stable, permanent IP address and DNS name to route traffic to a group of Pods matching a label selector.
* **Selector matching**: A Service reads labels on Pods to build an endpoint list.

```
Request -> [Service (backend:8000)] -> selects Pod matching "app: backend" -> Pod (IP: 10.244.1.5:8000)
```

#### Service Types
1. **ClusterIP (Default)**: Exposes the service on a cluster-internal IP. Only accessible *inside* the cluster.
   * *NexShop Example*: `k8s/backend/service.yaml` uses `type: ClusterIP`. The frontend (or ingress) contacts `backend:8000` internally.
2. **NodePort**: Exposes the service on each Node's IP at a static port (in the range 30000–32767).
3. **LoadBalancer**: Provisions an external Load Balancer (in cloud environments like AWS, GCP, Azure) to route external traffic to your Service.
4. **ExternalName**: Maps the service to a DNS name (CNAME record).

#### Port Terminology
* `port`: The port that the **Service** listens on (external clients in the cluster send traffic here).
* `targetPort`: The port that the **Pod's container** listens on.
* `nodePort`: The port exposed on the host worker nodes (used in NodePort service type).

---

### D. StatefulSet
* **Concept**: Used for stateful applications (like databases) that require stable, persistent identifiers, ordered deployment, and dedicated storage.
* **Difference from Deployments**:
  * **Stateless (Deployment)**: Pods are interchangeable. If `backend-7fd8f` dies, it is replaced by `backend-abc42` with a random name and new IP.
  * **Stateful (StatefulSet)**: Pods have an ordinal index (`mongodb-0`, `mongodb-1`). If `mongodb-0` dies, it is recreated with the exact same name (`mongodb-0`) and reconnects to its exact same persistent disk.

#### Trace: `k8s/mongodb/statefulset.yaml`
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
spec:
  serviceName: "mongodb-headless" # Links this StatefulSet to a headless service.
  replicas: 1
  template:
    ...
```

---

### E. Headless Service
* **Concept**: A Service with `clusterIP: None` specified in its spec.
* **How it works**: Instead of acting as a single IP entrypoint that load-balances traffic, a Headless Service returns the actual A-record IP addresses of all underlying Pods directly via DNS.
* **Why use it?** Stateful nodes (like database replicas or distributed brokers) need to communicate with specific peers directly rather than hitting a randomized load-balanced IP.

#### Trace: `k8s/mongodb/headless-service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mongodb-headless
spec:
  clusterIP: None       # This makes it HEADLESS!
  selector:
    app: mongodb
  ports:
    - port: 27017
      targetPort: 27017
```
When a pod requests `mongodb-headless.default.svc.cluster.local`, the DNS returns the IP address of `mongodb-0.mongodb-headless` directly.

---

### F. PersistentVolume (PV) & PersistentVolumeClaim (PVC)
Kubernetes decouples storage administration from developer pod resource requests.

```
[Storage Hardware] -> PersistentVolume (PV) -> PersistentVolumeClaim (PVC) -> Pod Volume Mount
```

* **PersistentVolume (PV)**: A physical or network disk provisioned by the cluster administrator. It exists independently of the lifespan of any Pod.
* **PersistentVolumeClaim (PVC)**: A request for storage by a developer. "I need 2Gi of storage with ReadWriteOnce access." Kubernetes matches the PVC with an available PV.

#### Trace: `k8s/mongodb/pv.yaml` & `pvc.yaml`
```yaml
# PV (The actual disk on the node hostPath)
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mongodb-pv
spec:
  storageClassName: manual
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteOnce   # The volume can be mounted as read-write by a single node.
  hostPath:
    path: "/mnt/data/mongodb"
---
# PVC (The request/claim for that disk)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
```

In `k8s/mongodb/statefulset.yaml`, the PVC is mounted into the Pod:
```yaml
      volumes:
        - name: mongodb-persistent-storage
          persistentVolumeClaim:
            claimName: mongodb-pvc
```

---

### G. ConfigMap & Secret
ConfigMaps and Secrets inject environment variables or files into containers without hardcoding values in images.

* **ConfigMap**: Stores non-confidential configuration (plain text key-value pairs).
  * *NexShop Example*: `k8s/backend/configmap.yaml` stores `database-name: "ecommerce"`.
* **Secret**: Stores sensitive data (passwords, JWT keys, connection strings). The values must be **Base64 encoded** in the YAML files.
  * *NexShop Example*: `k8s/backend/secret.yaml` stores the MongoDB connection URL.

#### Trace: Injecting Secrets/ConfigMaps into a Pod
Inside `k8s/backend/deployment.yaml`:
```yaml
          env:
            - name: DATABASE_NAME         # Env variable name inside the container
              valueFrom:
                configMapKeyRef:
                  name: backend-config    # Reference ConfigMap name
                  key: database-name      # Reference Key in ConfigMap
            - name: MONGODB_URL
              valueFrom:
                secretKeyRef:
                  name: backend-secret    # Reference Secret name
                  key: mongodb-url        # Reference Key in Secret
```

---

## 4. Kubernetes Command Cheat Sheet

Here are the essential commands you will use daily to deploy, debug, and monitor your NexShop services.

### A. Lifecycle & CRUD Operations
```bash
# Apply a manifest file (create or update resources)
kubectl apply -f k8s/backend/deployment.yaml

# Apply all manifests in a directory
kubectl apply -f k8s/backend/

# Delete resources defined in a manifest
kubectl delete -f k8s/backend/deployment.yaml
```

### B. Inspection & Checking Status
```bash
# List all pods in the default namespace
kubectl get pods

# List services, deployments, replicasets, and pods
kubectl get all

# Get detailed info about a specific resource (useful for debugging failures)
kubectl describe pod <pod-name>
kubectl describe node <node-name>

# Output resource details in YAML or JSON format
kubectl get deployment backend -o yaml
```

### C. Logging & Execution (Debugging)
```bash
# Stream logs from a running Pod
kubectl logs -f <pod-name>

# Stream logs from all Pods with a specific label selector
kubectl logs -l app=backend -f --tail=100

# Run an interactive bash shell inside a running Pod container
kubectl exec -it <pod-name> -- /bin/bash

# Run a single quick command inside a container
kubectl exec <pod-name> -- env
```

### D. Port Forwarding (Local Access)
If you do not have an ingress setup or want to bypass it for debugging, port-forward services directly to your local computer:
```bash
# Forward traffic from local port 8000 to backend service port 8000
kubectl port-forward svc/backend 8000:8000

# Forward traffic to the frontend
kubectl port-forward svc/frontend 3000:80

# Forward to the headless mongodb-0 pod directly
kubectl port-forward pod/mongodb-0 27017:27017
```

### E. Scaling & Rolling Updates
```bash
# Manually scale a deployment to 5 replicas
kubectl scale deployment backend --replicas=5

# Check rollout progress
kubectl rollout status deployment/backend

# View historical revisions of a deployment
kubectl rollout history deployment/backend

# Roll back to the previous deployment revision
kubectl rollout undo deployment/backend
```
