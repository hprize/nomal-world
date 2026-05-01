-- gathering-images 버킷 스토리지 정책 정리
-- public 버킷이므로 SELECT(list) 정책 불필요 — 개별 파일은 public URL로 접근
-- 경고: "Clients can list all files in this bucket" 해결

DROP POLICY IF EXISTS "gathering-images 공개 읽기" ON storage.objects;
