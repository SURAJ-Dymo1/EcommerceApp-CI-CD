resource "aws_ecr_repository" "backend" {
  name                 = "nexshop-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "nexshop-backend-repo"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "nexshop-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "nexshop-frontend-repo"
  }
}
