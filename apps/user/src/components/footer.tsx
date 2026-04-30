import { Logo } from "@nomal-world/ui/logo";

// ─── 수정 가능한 텍스트 및 링크 상수 ─────────────────────────
const ORGANIZATION_NAME = "동글지대";
const CONTACT_EMAIL = "teenkbell4u@gmail.com";
const RELATED_LINKS_LABEL = "관련주소모음 바로가기";
const RELATED_LINKS_URL = "https://linktr.ee/teenkbell?utm_source=linktree_profile_share&ltsid=f7e6d08b-6a0d-428b-a3b1-29b4e49ff406";

const INFO_LINKS = [
  { label: "노말십대 인스타그램", href: "https://www.instagram.com/nomal10dae?igsh=c2Rxc2dpNmJudnlt&utm_source=qr" },
  { label: "이용규칙", href: "#" },
  { label: "운영진 소개", href: "https://www.roundzone.info/" },
  { label: "의견건의함", href: "https://forms.gle/voZGn2HACqvLd7ce6" },
];

const SOCIAL_LINKS = [
  { label: "인스타그램", href: "https://www.instagram.com/teenkbell?igsh=eXY0eml3cnVzamt1&utm_source=qr" },
  { label: "네이버 블로그", href: "https://blog.naver.com/teenkbell" },
  { label: "오픈채팅방", href: "https://open.kakao.com/o/gHjO9mhh" },
];

const COPYRIGHT_HOLDER = "RoundZone";
// ──────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 소개 */}
          <div>
            <p className="font-semibold text-gray-900 mb-3">
              {ORGANIZATION_NAME}
            </p>
            <p className="text-sm text-gray-600 mb-3">
              이메일:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="hover:text-gray-900 transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <a
              href={RELATED_LINKS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {RELATED_LINKS_LABEL}
            </a>
          </div>

          {/* 노말월드 정보 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">노말월드 정보</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {INFO_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("/") ? undefined : "_blank"}
                    rel={link.href.startsWith("/") ? undefined : "noopener noreferrer"}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 소셜미디어 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">소셜미디어</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
