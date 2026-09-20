import os
import uuid
import boto3

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION", "ap-northeast-2"),
)

BUCKET_NAME = os.getenv("AWS_S3_BUCKET")


def upload_file_to_s3(file, folder: str = "uploads") -> str:
    ext = os.path.splitext(file.filename or "")[1]
    key = f"{folder}/{uuid.uuid4().hex}{ext}"

    s3_client.upload_fileobj(file.file, BUCKET_NAME, key)

    region = os.getenv("AWS_REGION", "ap-northeast-2")
    return f"https://{BUCKET_NAME}.s3.{region}.amazonaws.com/{key}"