from dotenv import load_dotenv
load_dotenv()

from app.core.s3 import s3_client, BUCKET_NAME

try:
    response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)
    print("✅ S3 연결 성공!", response.get("KeyCount", 0), "개 파일")
except Exception as e:
    print("❌ 연결 실패:", e)