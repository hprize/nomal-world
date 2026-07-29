"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@nomal-world/db/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@nomal-world/ui/logo";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const forbidden = searchParams.get("error") === "forbidden";

  // 어드민 권한이 없는 계정으로 접근한 경우:
  // 안내를 띄우고 해당 세션을 정리해 다른 계정으로 로그인할 수 있게 한다.
  // (세션을 남겨두면 로그인 페이지와 홈 사이를 오가는 리다이렉트가 반복될 수 있음)
  useEffect(() => {
    if (!forbidden) return;
    setError("관리자 권한이 없는 계정입니다. 관리자 계정으로 로그인해주세요.");
    createClient()
      .auth.signOut()
      .then(() => router.refresh());
  }, [forbidden, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      // 어드민이 아니면 진입시키지 않고 즉시 로그아웃 (미들웨어 왕복 방지)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setError("관리자 권한이 없는 계정입니다.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl">
      <div className="flex justify-center mb-2">
        <Logo />
      </div>
      <p className="text-center text-muted-foreground mb-8">관리자 로그인</p>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="admin@nomalworld.kr"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="비밀번호를 입력하세요"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <Suspense fallback={<div className="w-full max-w-md p-8 bg-white rounded-2xl h-64" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
