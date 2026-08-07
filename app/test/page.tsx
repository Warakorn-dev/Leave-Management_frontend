"use client"
import { useState } from 'react';

// URL จาก ngrok/localtunnel ของเครื่องคุณ
const API_URL = 'https://clever-oranges-invite.loca.lt/api';

export default function AppWithLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);

    // 1. ฟังก์ชันเมื่อผู้ใช้กดปุ่ม "เข้าสู่ระบบ"
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'bypass-tunnel-reminder': 'true' // ข้ามหน้าเตือนของ localtunnel
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.data?.accessToken) {
                setToken(data.data.accessToken);
                fetchLeaveHistory(data.data.accessToken);
            } else {
                setErrorMsg('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            }
        } catch (error) {
            setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        }
    };

    // 2. ฟังก์ชันดึงประวัติการลา (ต้องใช้ Token)
    const fetchLeaveHistory = async (userToken: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/leave/history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                    'bypass-tunnel-reminder': 'true'
                }
            });
            const historyData = await res.json();
            setLeaves(historyData.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // 3. ฟังก์ชันออกจากระบบ
    const handleLogout = () => {
        setToken(null);
        setLeaves([]);
        setEmail('');
        setPassword('');
    };

    // --- UI หน้าล็อคอิน ---
    if (!token) {
        return (
            <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
                <h2 style={{ textAlign: 'center' }}>ระบบลางาน (Login)</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="email"
                        placeholder="อีเมล (Email)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="password"
                        placeholder="รหัสผ่าน (Password)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    {errorMsg && <p style={{ color: 'red', margin: 0, textAlign: 'center' }}>{errorMsg}</p>}
                    <button type="submit" style={{ padding: '12px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                        เข้าสู่ระบบ
                    </button>
                </form>

                <p style={{ fontSize: '14px', color: 'gray', textAlign: 'center', marginTop: '20px' }}>
                    * ลองใช้บัญชีนี้ทดสอบ: <br />
                    <strong>user@company.com</strong> / <strong>password1234</strong>
                </p>
            </div>
        );
    }

    // --- UI หน้าแสดงข้อมูล (หลังล็อคอิน) ---
    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>ประวัติการลาของคุณ</h2>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    ออกจากระบบ
                </button>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center' }}>กำลังโหลดข้อมูล...</p>
            ) : leaves.length === 0 ? (
                <p style={{ textAlign: 'center' }}>คุณยังไม่มีประวัติการลา</p>
            ) : (
                <ul style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', listStyle: 'none' }}>
                    {leaves.map((leave: any) => (
                        <li key={leave.id} style={{ marginBottom: '15px', borderBottom: '1px solid #dee2e6', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <strong style={{ fontSize: '18px' }}>{leave.reason}</strong>
                                <span style={{
                                    color: 'white',
                                    background: leave.status === 'Approved' ? '#28a745' : leave.status === 'Pending' ? '#ffc107' : '#dc3545',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {leave.status}
                                </span>
                            </div>
                            <div style={{ color: '#6c757d', fontSize: '14px' }}>
                                วันที่ลา: {new Date(leave.startDate).toLocaleDateString('th-TH')} ถึง {new Date(leave.endDate).toLocaleDateString('th-TH')} <br />
                                จำนวน: {leave.totalDays} วัน
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
