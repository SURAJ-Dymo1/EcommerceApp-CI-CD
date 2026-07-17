output "vpc_id" {
  description = "The ID of the custom VPC"
  value       = aws_vpc.main.id
}

output "eks_cluster_name" {
  description = "The name of the EKS Cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "The endpoint for the EKS Cluster Control Plane"
  value       = aws_eks_cluster.main.endpoint
}

output "ecr_repository_url_backend" {
  description = "URL of the ECR repository for the Backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_repository_url_frontend" {
  description = "URL of the ECR repository for the Frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "configure_kubeconfig" {
  description = "Command to configure kubectl to access this cluster"
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.main.name} --region ${var.aws_region}"
}
