"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEmployee } from "@/hooks/useEmployee";
import Swal from "sweetalert2";
import { Moon, Sun } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'gray' | 'dark'>('dark');
  const [username, setUsername] = useState("");

  useEffect(() => {
    const savedTheme = (localStorage.getItem('app_theme') || localStorage.getItem('auth-theme')) as string | null;
    const isDarkTheme = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const activeTheme = isDarkTheme ? 'dark' : 'gray';
    setTheme(activeTheme);
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'gray' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('auth-theme', newTheme);
    localStorage.setItem('app_theme', newTheme === 'dark' ? 'dark' : 'light');
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { useForgotPasswordMutation } = useEmployee();
  const { mutateAsync: forgotPassword } = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await forgotPassword(username);
      if (response.success || response.message) {
        Swal.fire({
          icon: 'success',
          title: 'ส่งลิงก์สำเร็จ!',
          text: 'กรุณาตรวจสอบอีเมลของคุณเพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 15 นาที)',
          confirmButtonText: 'กลับไปหน้าเข้าสู่ระบบ',
          confirmButtonColor: '#0056b3'
        }).then(() => {
          router.push('/login');
        });
      } else {
        setError("Error generating reset token.");
      }
    } catch (err: any) {
      setError(err.message || "Cannot request password reset. Please try again.");
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
        <h1 className={`text-3xl sm:text-[2.2rem] font-bold text-center mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>Forgot Password</h1>
        <p className={`text-[12px] sm:text-[13px] text-center mb-6 sm:mb-8 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>กรุณากรอก Username หรือ Email เพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-sm font-bold block mb-1.5 ${isDark ? 'text-white' : 'text-gray-700'}`}>Username / Email</label>
            <Input 
              type="text" 
              placeholder="Enter your Username or Email" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`h-[42px] text-sm px-4 w-full focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md transition-colors ${isDark
                  ? 'bg-white border-0 text-black placeholder:text-gray-400'
                  : 'bg-white border border-gray-400 text-gray-900 placeholder:text-gray-500 shadow-sm'
                }`}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center pt-2 font-medium">{error}</p>
          )}

          <div className="pt-2 pb-2">
            <div className={`h-[1px] w-full mb-6 mt-4 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-10 px-10 bg-[#0056b3] hover:bg-[#004494] text-white font-bold text-[15px] rounded-lg transition-colors"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </div>

          <div className="text-center mt-4">
            <Link href="/login" className={`text-[13px] transition-colors inline-flex items-center gap-1 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
              &larr; Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
