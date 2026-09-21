/**
 * 저장 흐름에서 사용자에게 그대로 보여줘도 되는 오류(한국어 메시지).
 * gathering-form의 handleSave는 이 타입만 메시지를 노출하고, 그 외 오류는 일반 문구로 대체한다.
 */
export class SaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaveError";
  }
}
