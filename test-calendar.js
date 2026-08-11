const allLeaves = [
  {
    startDate: "2026-08-03",
    endDate: "2026-08-03",
    name: "สายฝน โค้ดดิ้ง",
    type: "ลาพักร้อน"
  }
];

const currentYear = 2026;
const currentMonth = 7; // August (0-indexed)

for (let day = 1; day <= 31; day++) {
  const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const events = [];

  allLeaves.forEach(leave => {
    const startD = new Date(leave.startDate);
    const endD = new Date(leave.endDate);
    const startStr = `${startD.getFullYear()}-${(startD.getMonth() + 1).toString().padStart(2, '0')}-${startD.getDate().toString().padStart(2, '0')}`;
    const endStr = `${endD.getFullYear()}-${(endD.getMonth() + 1).toString().padStart(2, '0')}-${endD.getDate().toString().padStart(2, '0')}`;

    const start = new Date(startStr);
    const end = new Date(endStr);
    const current = new Date(dateStr);
    if (current >= start && current <= end) {
      events.push(leave.name);
    }
  });

  if (events.length > 0) {
    console.log(`Day ${day} (${dateStr}):`, events);
  }
}
