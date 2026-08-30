"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEmployee } from "@/hooks/useEmployee";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'gray' | 'dark'>('dark');
  const [username, setUsername] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem('auth-theme') as 'gray' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'gray' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('auth-theme', newTheme);
  };
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");

  const generateCaptcha = async () => {
    try {
      const res = await fetch(`/api/auth/captcha?theme=${theme}&t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setCaptchaImage(data.captcha_image);
        setCaptchaId(data.captcha_id);
      }
    } catch (e) {
      console.error("Failed to load CAPTCHA", e);
    }
    setUserCaptcha("");
  };

  useEffect(() => {
    generateCaptcha();
  }, [theme]);

  const { useLoginMutation } = useEmployee();
  const { mutateAsync: loginUser } = useLoginMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userCaptcha || !captchaId) {
      setError("กรุณากรอกรหัส CAPTCHA ให้ครบถ้วน");
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser({
        username,
        password,
        captchaInput: userCaptcha,
        captchaId: captchaId
      });
      const user = response.user || response;
      if (response.accessToken) {
        sessionStorage.setItem("accessToken", response.accessToken);
      }
      if (response.refreshToken) {
        sessionStorage.setItem("refreshToken", response.refreshToken);
      }
      sessionStorage.setItem("userId", user.id.toString());
      sessionStorage.setItem("role", user.role);
      sessionStorage.setItem("username", user.username || user.email);
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      if (fullName) sessionStorage.setItem("fullName", fullName);
      sessionStorage.setItem("department", user.department?.name || user.departmentName || "");
      sessionStorage.setItem("position", user.positionName || user.position || "");
      sessionStorage.setItem("email", user.email || "");
      sessionStorage.setItem("employeeId", user.employeeCode || "");
      if (user.profilePic) {
        sessionStorage.setItem("profilePic", user.profilePic);
      } else {
        sessionStorage.removeItem("profilePic");
      }

      const lowerRole = user.role.toLowerCase();
      if (lowerRole === "manager") {
        router.push("/dashboard/manager/dashboard");
      } else if (lowerRole === "hr") {
        router.push("/dashboard/hr/dashboard");
      } else if (lowerRole === "ceo") {
        router.push("/dashboard/ceo/dashboard");
      } else {
        router.push("/dashboard/user/dashboard");
      }
    } catch (err: any) {
      if (err.message === 'Invalid credentials') {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      } else if (err.message?.includes('CAPTCHA') || err.message?.includes('รหัส')) {
        setError(err.message);
      } else {
        setError("บัญชีของคุณโดนระงับการใช้งาน ไม่สามารถเข้าสู่ระบบได้!!");
      }
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const circles = [
    { size: "180px", top: "-5%", left: "-2%", delay: "0s", duration: "20s" },
    { size: "120px", top: "10%", left: "25%", delay: "-5s", duration: "25s" },
    { size: "80px", top: "40%", left: "10%", delay: "-2s", duration: "20s" },
    { size: "150px", top: "60%", left: "-5%", delay: "-8s", duration: "22s" },
    { size: "100px", top: "85%", left: "15%", delay: "-1s", duration: "19s" },
    { size: "160px", top: "-5%", left: "65%", delay: "-10s", duration: "24s" },
    { size: "70px", top: "35%", left: "70%", delay: "-3s", duration: "16s" },
    { size: "130px", top: "15%", left: "85%", delay: "-7s", duration: "21s" },
    { size: "110px", top: "75%", left: "60%", delay: "-4s", duration: "20s" },
    { size: "150px", top: "80%", left: "85%", delay: "-6s", duration: "23s" },
    { size: "50px", top: "55%", left: "90%", delay: "-9s", duration: "15s" },
    { size: "40px", top: "90%", left: "50%", delay: "-12s", duration: "18s" },
    { size: "60px", top: "25%", left: "15%", delay: "-11s", duration: "17s" },
    { size: "90px", top: "45%", left: "80%", delay: "-15s", duration: "26s" },
    { size: "140px", top: "50%", left: "30%", delay: "-7s", duration: "22s" },
    { size: "75px", top: "20%", left: "50%", delay: "-4s", duration: "18s" },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`flex min-h-screen items-center justify-center relative overflow-hidden font-sans transition-colors duration-500 ${isDark ? 'bg-[#020519]' : 'bg-white'}`}>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-50 p-3 rounded-full shadow-lg backdrop-blur-md transition-all ${isDark
          ? 'bg-white/10 text-yellow-400 hover:bg-white/20'
          : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
          }`}
        title={isDark ? "Switch to Gray Theme" : "Switch to Dark Theme"}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -50px) rotate(10deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .circle-gradient-dark {
          background: radial-gradient(circle at 30% 30%, #1e266d 0%, #020519 100%);
        }
        .circle-gradient-gray {
          background: radial-gradient(circle at 30% 30%, #1e266d 0%, #020519 100%);
        }
        .circle-base {
          border-radius: 50%;
          position: absolute;
          animation: float linear infinite;
        }
        .card-bg-dark {
          background: #11133c;
        }
        .card-bg-gray {
          background: #ffffff;
        }
      `}} />

      {circles.map((circle, i) => (
        <div
          key={i}
          className={`circle-base ${isDark ? 'circle-gradient-dark' : 'circle-gradient-gray'} transition-all duration-500`}
          style={{
            width: circle.size,
            height: circle.size,
            top: circle.top,
            left: circle.left,
            animationDuration: circle.duration,
            animationDelay: circle.delay,
          }}
        />
      ))}

      <div className={`relative z-10 w-full max-w-[420px] mx-4 sm:mx-0 rounded-[1.25rem] sm:rounded-[1.5rem] p-6 sm:p-10 transition-colors duration-500 ${isDark ? 'card-bg-dark shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5' : 'card-bg-gray shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-200'}`}>
        <h1 className={`text-3xl sm:text-[2.5rem] font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Login</h1>
        <p className={`text-[12px] sm:text-[13px] text-center mb-6 sm:mb-8 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>ยินดีต้อนรับ กรุณาเข้าสู่ระบบบัญชีของคุณ</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`text-sm font-bold block mb-1.5 ${isDark ? 'text-white' : 'text-gray-700'}`}>Username</label>
            <Input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`h-[42px] text-sm px-4 w-full focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md transition-colors ${isDark
                ? 'bg-white border-0 text-black placeholder:text-gray-400'
                : 'bg-white border border-gray-400 text-gray-900 placeholder:text-gray-500 shadow-sm'
                }`}
              required
            />
          </div>

          <div>
            <label className={`text-sm font-bold block mb-1.5 ${isDark ? 'text-white' : 'text-gray-700'}`}>Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-[42px] text-sm px-4 pr-10 w-full focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md transition-colors ${isDark
                  ? 'bg-white border-0 text-black placeholder:text-gray-400'
                  : 'bg-white border border-gray-400 text-gray-900 placeholder:text-gray-500 shadow-sm'
                  }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link href="/forgot-password" className={`text-[13px] transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                Forget your password?
              </Link>
            </div>
          </div>

          <div>
            <label className={`text-sm font-bold block mb-1.5 ${isDark ? 'text-white' : 'text-gray-700'}`}>CAPTCHA</label>
            <div className="flex items-center gap-3">
              <div
                className={`rounded overflow-hidden shadow-inner cursor-pointer flex-shrink-0 ${isDark ? 'bg-[#222]' : 'bg-transparent border border-gray-400'}`}
                onClick={generateCaptcha}
                title="คลิกเพื่อเปลี่ยนรูปใหม่"
              >
                {captchaImage ? (
                  <img src={captchaImage} alt="CAPTCHA" className="w-[120px] h-[42px] object-cover block" />
                ) : (
                  <div className="w-[120px] h-[42px] bg-gray-200 flex items-center justify-center text-xs text-gray-500">Loading...</div>
                )}
              </div>
              <Input
                type="text"
                placeholder="Enter CAPTCHA"
                value={userCaptcha}
                onChange={(e) => setUserCaptcha(e.target.value)}
                className={`h-[42px] text-sm px-4 flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md transition-colors ${isDark
                  ? 'bg-white border-0 text-black placeholder:text-gray-400'
                  : 'bg-white border border-gray-400 text-gray-900 placeholder:text-gray-500 shadow-sm'
                  }`}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center pt-2 font-medium">{error}</p>
          )}

          <div className="pt-2 pb-2">
            <div className={`h-[1px] w-full mb-6 mt-4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <Button type="submit" disabled={isLoading} className="w-full h-10 px-10 bg-[#0056b3] hover:bg-[#004494] text-white font-bold text-[15px] rounded-lg transition-colors">
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

