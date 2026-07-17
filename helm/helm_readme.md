# DevOps Guide: Kubernetes Packaging with Helm

This document serves as an exhaustive reference and educational guide for DevOps engineers working with Helm in the NexShop E-Commerce platform. It explains the core concepts of Helm, command-line operations, the specific files created in this project, and packaging best practices.

---

## 1. What is Helm?

**Helm** is the package manager for Kubernetes. Just as `apt` is for Debian/Ubuntu or `pip` is for Python, Helm is used to find, share, and deploy software designed for Kubernetes.

### Core Concepts
1. **Chart**: A bundle of pre-configured Kubernetes resources (Deployments, Services, Ingresses, etc.) organized into a specific directory structure. This is your "package."
2. **Release**: A running instance of a Chart in a Kubernetes cluster. When you install a Chart, a new Release is created. You can install the same Chart multiple times in the same cluster (producing separate Releases).
3. **Repository (Repo)**: A registry where Charts can be stored and shared.

### Why Use Helm?
- **Dry/Templating**: Instead of copying and modifying static YAML files for dev, staging, and production environments, you use a single Chart with parameterized variables (`values.yaml`).
- **Release Tracking & Rollbacks**: Helm tracks every release version in a configuration map or secret. If a deployment fails, you can roll back to a previous state with a single command.
- **Dependency Management**: Charts can import other charts as subcharts (e.g., pulling in a standard PostgreSQL database chart).
- **Hooks**: Allows orchestrating lifecycle tasks, such as running database migrations before upgrading application containers.

---

## 2. Essential Helm Commands

Here are the commands a DevOps engineer uses daily to manage, debug, and release charts.

### A. Lifecycle & Release Management
```bash
# Install a chart with default values
helm install <release-name> <chart-directory-path>
# Example:
helm install nexshop ./helm/nexshop

# Upgrade an existing release with new values or template changes
helm upgrade <release-name> <chart-directory-path>
# Example:
helm upgrade nexshop ./helm/nexshop

# Uninstall a release (deletes all resources associated with it)
helm uninstall <release-name>
```

### B. Configuration Overrides
You can override default settings in `values.yaml` in two ways:
1. **Using a custom values file**:
   ```bash
   helm upgrade nexshop ./helm/nexshop -f prod-values.yaml
   ```
2. **Inline overrides using `--set`**:
   ```bash
   helm install nexshop ./helm/nexshop --set backend.replicaCount=4 --set ingress.hosts[0].host=api.nexshop.net
   ```

### C. Inspection & Rollbacks
```bash
# List all active releases in current namespace
helm list

# List all active releases across all namespaces
helm list -A

# View release version history (shows revisions)
helm history nexshop

# Rollback to revision 2
helm rollback nexshop 2
```

### D. Debugging & Linting
```bash
# Check if the chart structure is correct and contains syntax errors
helm lint ./helm/nexshop

# Render template files locally to stdout to inspect the exact YAML that would be sent to Kubernetes
helm template nexshop ./helm/nexshop

# Dry-run installation (sends manifests to K8s API server to validate, but does not deploy them)
helm install nexshop ./helm/nexshop --dry-run --debug
```

---

## 3. Chart Architecture & Structure

The `helm/nexshop` directory is structured as follows:

```text
helm/nexshop/
├── Chart.yaml              # Metadata about the package (version, description)
├── values.yaml             # Default configuration values (exposed variables)
└── templates/              # Dynamic Kubernetes resource templates
    ├── _helpers.tpl        # Reusable helper snippets (names, labels)
    ├── ...                 # Individual service YAML templates
```

### File Breakdown:

#### A. `Chart.yaml`
Specifies chart metadata. Essential fields include:
- `apiVersion`: `v2` (standard for Helm 3).
- `name`: Package identifier (`nexshop`).
- `version`: Version of the Helm package itself (increments on packaging modifications).
- `appVersion`: Version of the underlying application code (increments on container updates).

#### B. `values.yaml`
The API definition of the chart. Any setting that a DevOps engineer might need to change (ports, image tags, CPU/Memory limits, scaling parameters) is declared here. Avoid editing resource templates directly; edit `values.yaml` or pass override files.

#### C. `templates/_helpers.tpl`
A template helper file that holds snippets written in Go Template syntax. For example, `{{ include "nexshop.fullname" . }}` standardizes release-prefixed names across deployments to prevent naming collisions when multiple releases are deployed to the same namespace.

---

## 4. NexShop Resource Templates Details

Each file under `templates/` targets a specific component of the platform, converted from the static manifests in `k8s/`:

### Backend Templates
- **`backend-configmap.yaml`**: Exposes plain-text configs like `database-name` and `project-name`.
- **`backend-secret.yaml`**: Mounts sensitive variables like `mongodb-url` and `jwt-secret`. Values defined in `values.yaml` are automatically base64-encoded on render using `{{ .Values.backend.secrets.mongodbUrl | b64enc }}`.
- **`backend-service.yaml`**: Exposes the backend pods internally to the cluster.
- **`backend-deployment.yaml`**: Orchestrates the API container, injecting environment variables from the ConfigMap and Secret, registering Prometheus scrape metrics annotations, and defining liveness/readiness probes.
- **`backend-hpa.yaml`**: Dynamically sets up Horizontal Pod Autoscaling if `backend.hpa.enabled` is `true`.

### Frontend Templates
- **`frontend-configmap.yaml`**: Holds non-confidential environmental settings.
- **`frontend-service.yaml`**: Sets up the routing for the UI pods.
- **`frontend-deployment.yaml`**: Runs the React application container.
- **`frontend-hpa.yaml`**: Sets up autoscale metrics for the frontend.

### MongoDB Database Templates
- **`mongodb-secret.yaml`**: Dynamically encodes root database credentials.
- **`mongodb-headless-service.yaml`**: Routes traffic to database pods without IP load-balancing, returning direct A-records of database nodes.
- **`mongodb-pv.yaml` & `mongodb-pvc.yaml`**: Manages PV and PVC resources to persist DB data.
- **`mongodb-statefulset.yaml`**: Manages stateful Mongo containers. Features a dynamic volume check: if persistence is disabled (`mongodb.persistence.enabled: false`), it mounts an ephemeral `emptyDir` memory volume instead of failing on PVC discovery.

### Ingress Routing
- **`ingress.yaml`**: Defines NGINX Ingress rules mapping the Host (e.g. `ecommerce.local`) paths `/api` and `/` to backend and frontend services. Written using a nested `range` loop to support multiple hosts and dynamic backend destinations.

### Monitoring Stack
- **`monitoring-prometheus-*.yaml`**: Provisions the Prometheus daemon, ConfigMap scraping policies, and the necessary ClusterRole/ClusterRoleBindings. RBAC namespace fields dynamically align to `{{ .Release.Namespace }}`.
- **`monitoring-grafana-*.yaml`**: Provisions Grafana dashboards and configures the Prometheus datasource dynamically.
- All monitoring templates are wrapped in conditionals (e.g. `{{- if .Values.monitoring.prometheus.enabled -}}`) so you can disable the monitoring stack entirely to save cluster resources.

---

## 5. DevOps Best Practices for Helm

1. **Namespace isolation**: Avoid hardcoding `namespace: default` inside resource templates. Let the user specify the namespace using `helm install -n <namespace>` or default to the release namespace.
2. **Chart Version vs App Version**:
   - Update `version` in `Chart.yaml` when you modify the chart structure, values.yaml fields, or template files.
   - Update `appVersion` when you build and push a new Docker container tag for the services.
3. **Never Check Secrets into Git**: Keep production passwords and secrets out of your `values.yaml` in Git. Instead:
   - Use placeholder values in `values.yaml`.
   - Pass secret values at deploy time using secure CI/CD environment variables (`--set backend.secrets.jwtSecret=$JWT_SECRET`).
   - Use Helm plugin utilities like **Helm Secrets** with **sops** or integrations with HashiCorp Vault.
4. **Always Define Resource Requests and Limits**: Ensure that containers do not exhaust node resources by keeping `resources.requests` and `resources.limits` configured in `values.yaml`.
