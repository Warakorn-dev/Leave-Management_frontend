"use client";

import { useState, useEffect } from "react";
import { User, Briefcase, Building, Camera, Upload, Mail, BadgeInfo, ShieldCheck, Calendar, Trash2 } from "lucide-react";
import { userApi } from "@/api";

export default function HRSettingsPage() {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstNameEN, setFirstNameEN] = useState("");
  const [lastNameEN, setLastNameEN] = useState("");
  const [idCardNumber, setIdCardNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idCardAddress, setIdCardAddress] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");

  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [rawHireDate, setRawHireDate] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await userApi.getProfile();
        const data = res.data;
        if (data) {
          const title = data.title ? data.title : "";
          const fullName = data.firstName && data.lastName ? `${title}${data.firstName} ${data.lastName}` : (data.username || "-");
          setUsername(fullName);
          setFirstName(data.firstName || "-");
          setLastName(data.lastName || "-");
          setFirstNameEN(data.firstNameEN || "-");
          setLastNameEN(data.lastNameEN || "-");
          setIdCardNumber(data.idCardNumber || "-");
          setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : "-");
          setIdCardAddress(data.idCardAddress || "-");
          setCurrentAddress(data.currentAddress || "-");

          setDepartment(data.department?.name || "-");
          setPosition(data.position?.name || "-");
          setEmail(data.email || data.user?.email || "-");
          setEmployeeId(data.employeeCode || (data.id ? `EMP-${String(data.id).substring(0, 5).toUpperCase()}` : "-"));
          setHireDate(data.hireDate ? new Date(data.hireDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : "-");
          setRawHireDate(data.hireDate || null);

          
          const avatar = data.user?.avatarUrl || data.avatarUrl || data.profilePic || sessionStorage.getItem("profilePic");
          setProfilePic(avatar || null);
          
          if (fullName && fullName !== "-") {
            sessionStorage.setItem("username", fullName);
            sessionStorage.setItem("fullName", fullName);
          }
          sessionStorage.setItem("department", data.department?.name || "");
          sessionStorage.setItem("position", data.position?.name || "");
          if (avatar) {
            try {
              sessionStorage.setItem("profilePic", avatar);
            } catch (e) { console.warn("Quota exceeded, skipping sessionStorage") }
          }
        } else {
          setUsername(sessionStorage.getItem("username") || "-");
          setDepartment(sessionStorage.getItem("department") || "-");
          setPosition(sessionStorage.getItem("position") || "-");
          setEmail(sessionStorage.getItem("email") || "-");
          setEmployeeId(sessionStorage.getItem("employeeId") || "-");
          setProfilePic(sessionStorage.getItem("profilePic") || null);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    
    fetchUserProfile();
  }, []);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        try {
          await userApi.updateAvatar(result);
        } catch (err) {
          console.error(err);
        }
        setTimeout(() => {
          setProfilePic(result);
          try {
            sessionStorage.setItem("profilePic", result);
          } catch (e) { console.warn("Quota exceeded"); }
          setIsUploading(false);
          window.location.reload();
        }, 1000);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDeleteProfilePic = async () => {
    try {
      setIsUploading(true);
      await userApi.updateAvatar(null);
      setProfilePic(null);
      sessionStorage.removeItem("profilePic");
      setIsUploading(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const getWorkDuration = () => {
    if (!rawHireDate) return "";
    const start = new Date(rawHireDate);
    const end = new Date();
    if (isNaN(start.getTime())) return "";

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} ปี`);
    if (months > 0) parts.push(`${months} เดือน`);
    if (days > 0 || parts.length === 0) parts.push(`${days} วัน`);

    return `อายุงาน: ${parts.join(" ")}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-800 flex flex-col relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-400/20 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-80 h-80 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply opacity-50 animate-blob animation-delay-4000"></div>

      {/* Top Banner */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-8 py-6 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">ข้อมูลส่วนตัว</h1>
            <p className="text-sm text-slate-500 font-medium">จัดการข้อมูลและบัญชีผู้ใช้ของคุณ</p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 p-6 md:p-8 z-10">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8 max-w-[850px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out flex flex-col md:flex-row gap-12">

          {/* Profile Picture Section (Left) */}
          <div className="flex flex-col items-center justify-start md:w-1/3 pt-4">
            <div className="relative group cursor-pointer mb-4">
              <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-300" />
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                  <Camera className="w-10 h-10 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                )}
              </div>

              <label className="absolute bottom-2 right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-blue-500/50 transition-all duration-300 border-[3px] border-white hover:scale-110 z-20">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                  disabled={isUploading}
                />
              </label>
            </div>

            {profilePic && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteProfilePic();
                }}
                disabled={isUploading}
                className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 hover:underline transition-colors mb-4 text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบรูปโปรไฟล์
              </button>
            )}

            <h2 className="text-xl font-bold text-slate-800 text-center">{username}</h2>
            <div className="flex items-center gap-1.5 mt-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-blue-100">
              <ShieldCheck className="w-3.5 h-3.5" /> HR Role
            </div>
            {rawHireDate && (
              <div className="flex items-center gap-1.5 mt-2 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full text-[12px] font-medium shadow-sm border border-slate-200">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {getWorkDuration()}
              </div>
            )}
          </div>

          {/* User Details Section (Right) */}
          <div className="flex-1 space-y-6">
            <div className="border-b border-slate-200/60 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-800">รายละเอียดบัญชี</h3>
              <p className="text-sm text-slate-500">ข้อมูลที่ใช้ในระบบบริษัทของคุณ</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID */}
              <div className="col-span-1 md:col-span-2 group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <BadgeInfo className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" /> รหัสพนักงาน
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={employeeId}
                    readOnly
                    className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <span className="text-xs text-slate-400 font-medium">Read Only</span>
                  </div>
                </div>
              </div>

              {/* First Name */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" /> ชื่อ
                </label>
                <input
                  type="text"
                  value={firstName}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* Last Name */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" /> นามสกุล
                </label>
                <input
                  type="text"
                  value={lastName}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* First Name EN */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-4 h-4 text-sky-400 group-hover:text-sky-600 transition-colors" /> ชื่อ (ภาษาอังกฤษ)
                </label>
                <input
                  type="text"
                  value={firstNameEN}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* Last Name EN */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-4 h-4 text-sky-400 group-hover:text-sky-600 transition-colors" /> นามสกุล (ภาษาอังกฤษ)
                </label>
                <input
                  type="text"
                  value={lastNameEN}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* ID Card Number */}
              <div className="group col-span-1 md:col-span-2">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <BadgeInfo className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" /> เลขบัตรประชาชน
                </label>
                <input
                  type="text"
                  value={idCardNumber}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* Date of Birth */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-pink-400 group-hover:text-pink-600 transition-colors" /> วันเกิด
                </label>
                <input
                  type="text"
                  value={dateOfBirth}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* Email */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" /> อีเมล
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* Department */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Building className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" /> แผนก
                </label>
                <input
                  type="text"
                  value={department}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* Position */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Briefcase className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" /> ตำแหน่ง
                </label>
                <input
                  type="text"
                  value={position}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* Hire Date */}
              <div className="group">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-pink-400 group-hover:text-pink-600 transition-colors" /> วันที่เริ่มทำงาน
                </label>
                <input
                  type="text"
                  value={hireDate}
                  readOnly
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all"
                />
              </div>

              {/* ID Card Address */}
              <div className="group col-span-1 md:col-span-2">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Building className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" /> ที่อยู่ตามบัตรประชาชน
                </label>
                <textarea
                  value={idCardAddress}
                  readOnly
                  rows={2}
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all resize-none"
                />
              </div>

              {/* Current Address */}
              <div className="group col-span-1 md:col-span-2">
                <label className="text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                  <Building className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" /> ที่อยู่ปัจจุบัน
                </label>
                <textarea
                  value={currentAddress}
                  readOnly
                  rows={2}
                  className="w-full border-0 bg-slate-50/50 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner cursor-default transition-all resize-none"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}


