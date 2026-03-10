"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams?.get("token");
    const provider = searchParams?.get("provider");
    const error = searchParams?.get("error");

    if (error) {
      console.error("OAuth error:", error);
      router.push(`/login?error=${error}`);
      return;
    }

    if (token) {
      // Token'ı localStorage'a kaydet
      if (typeof window !== "undefined") {
        window.localStorage.setItem("token", token);
        
        // Token'dan user bilgisini decode et
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log("Logged in via:", provider, "User:", payload);
          
          // User bilgisini de kaydet (API'den tam bilgi çekmek yerine)
          window.localStorage.setItem("user", JSON.stringify({
            _id: payload.userId,
            email: payload.email,
            role: payload.role,
          }));
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }

      // OAuth ile ilk kez giriş yapan kullanıcıları profil sayfasına yönlendir
      router.push("/profile");
    } else {
      router.push("/login?error=no_token");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="mb-4 text-lg text-slate-200">Giriş yapılıyor...</div>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500 mx-auto"></div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950"><div className="text-center"><div className="mb-4 text-lg text-slate-200">Giriş yapılıyor...</div><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500 mx-auto"></div></div></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
