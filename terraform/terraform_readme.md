# DevOps Guide: Infrastructure as Code (IaC) with Terraform

This document is a comprehensive guide to using Terraform to provision the AWS infrastructure needed to host the NexShop E-Commerce platform.

---

## 1. What is Terraform?

**Terraform** is an open-source Infrastructure as Code (IaC) tool created by HashiCorp. It allows you to define, provision, and version cloud and on-premises infrastructure safely and predictably using a declarative configuration language (HashiCorp Configuration Language, or HCL).

### Core Concepts
1. **Providers**: Plugins that communicate with cloud providers (like AWS, GCP, Azure) or service APIs (like Kubernetes, Helm, GitHub).
2. **Resources**: The infrastructure objects you want to manage (VPCs, EC2 instances, EKS clusters).
3. **Variables & Outputs**: 
   - **Variables**: Inputs that customize the configuration without editing code.
   - **Outputs**: Values returned by Terraform after successful runs (e.g. cluster endpoints or load balancer hostnames).
4. **State**: Terraform records the state of your infrastructure in a JSON file (`terraform.tfstate`). This acts as the source of truth, enabling Terraform to calculate changes (diffs) between your configuration and real-world infrastructure.

---

## 2. Infrastructure Architecture for NexShop

The Terraform configurations in this directory set up a production-ready, highly-available AWS cluster.

```mermaid
graph TD
    subgraph AWS Cloud
        subgraph VPC (10.0.0.0/16)
            IGW["Internet Gateway"]
            NAT["NAT Gateway"]
            
            subgraph Public Subnets (AZ1 & AZ2)
                ELB["Nginx Ingress (AWS Network Load Balancer)"]
            end
            
            subgraph Private Subnets (AZ1 & AZ2)
                subgraph EKS Cluster (nexshop-cluster)
                    Node1["Worker Node 1"]
                    Node2["Worker Node 2"]
                    
                    subgraph Pods
                        Frontend["Frontend Pods"]
                        Backend["Backend Pods"]
                        Mongo["MongoDB Stateful Pod"]
                    end
                end
            end
        end
        
        ECR_Back["ECR: nexshop-backend"]
        ECR_Front["ECR: nexshop-frontend"]
        EBS["EBS Volume (MongoDB Storage)"]
    end
    
    Internet["Client Browser"] --> ELB
    ELB --> Frontend
    Frontend --> Backend
    Backend --> Mongo
    Mongo <--> EBS
    NAT --> Node1 & Node2
    Node1 & Node2 --> ECR_Back & ECR_Front
```

### Components Provisioned:
1. **VPC (`vpc.tf`)**:
   - Custom VPC with DNS support.
   - **2 Public Subnets**: For internet-facing load balancers.
   - **2 Private Subnets**: For EKS worker nodes (security boundary).
   - **Internet Gateway (IGW) & NAT Gateway**: NAT Gateway is placed in a public subnet, enabling nodes in private subnets to pull container images or update packages securely without direct public exposure.
2. **ECR Repositories (`ecr.tf`)**:
   - Isolated Docker registries for `nexshop-backend` and `nexshop-frontend`.
3. **EKS Cluster (`eks.tf`)**:
   - EKS control plane cluster.
   - Managed Node Group running 2x `t3.medium` instances in the private subnets.
   - Required IAM roles for both the EKS master cluster and worker nodes.
4. **EKS Addons**:
   - `vpc-cni` & `kube-proxy` for networking.
   - `coredns` for cluster service discovery.
   - `aws-ebs-csi-driver`: The AWS EBS Container Storage Interface (CSI) driver. This addon is crucial for our stateful MongoDB pod. It listens to PersistentVolumeClaims (PVC) and dynamically provisions and attaches physical EBS disks to nodes on AWS.

---

## 3. Terraform CLI Commands & Lifecycle

Run these commands inside the `terraform/` directory to manage the infrastructure:

```bash
# 1. Initialize the directory (downloads provider plugins)
terraform init

# 2. Validate syntax and resource configurations
terraform validate

# 3. Preview changes before applying (dry-run)
terraform plan

# 4. Apply changes (provisions resources in AWS)
terraform apply

# 5. Tear down all provisioned resources (deletes everything)
terraform destroy
```

---

## 4. Connecting and Deploying NexShop

Once `terraform apply` finishes, follow these steps to deploy NexShop on the newly created cluster.

### Step 1: Connect `kubectl` to EKS
Run the command returned in the Terraform outputs to configure your local kubeconfig:
```bash
aws eks update-kubeconfig --name nexshop-cluster --region us-east-1
```

Verify your connection:
```bash
kubectl get nodes
```
You should see 2 worker nodes in a `Ready` status.

### Step 2: Push Images to ECR
Retrieve ECR login credentials and push your backend and frontend containers:
```bash
# Log in to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push backend
docker tag ecommerce-backend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nexshop-backend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nexshop-backend:latest

# Tag and push frontend
docker tag ecommerce-frontend:latest <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nexshop-frontend:latest
docker push <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nexshop-frontend:latest
```

### Step 3: Deploy Helm Chart
Update your `helm/nexshop/values.yaml` to use your custom ECR images:
```yaml
backend:
  image:
    repository: <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nexshop-backend
    tag: latest
frontend:
  image:
    repository: <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nexshop-frontend
    tag: latest
```

Now, deploy the application:
```bash
helm install nexshop ../helm/nexshop
```

---

## 5. Critical AWS EKS Details for DevOps Engineers

- **Subnet Auto-Discovery Tags**: Public and private subnets contain special tags (`kubernetes.io/role/elb = 1` and `kubernetes.io/role/internal-elb = 1`). AWS Load Balancer Controller uses these tags to discover subnets and automatically provision network/application load balancers.
- **Node IAM Policies**: The node IAM role is attached to the `AmazonEBSCSIDriverPolicy` alongside standard EKS policies. This ensures that the EBS CSI driver pods running inside EKS have the permissions to run EC2 volume attachments dynamically.
- **Security boundary**: Control Plane and Worker node communications are isolated. Worker nodes run in private subnets, meaning they are unreachable from the public internet. External user traffic enters only via the Ingress load balancer which targets frontend pods.
