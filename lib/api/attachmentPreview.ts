import Swal from 'sweetalert2';

export const previewAttachment = (e: React.MouseEvent, attachmentData: string, attachmentName: string) => {
  e.preventDefault();
  e.stopPropagation();
  
  if (!attachmentData) return;

  const isImage = attachmentData.startsWith('data:image');
  const isPDF = attachmentData.startsWith('data:application/pdf');

  let htmlContent = '';
  
  if (isImage) {
    htmlContent = `<div style="display: flex; justify-content: center;"><img src="${attachmentData}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" /></div>`;
  } else if (isPDF) {
    htmlContent = `<iframe src="${attachmentData}" style="width: 100%; height: 70vh; border: none; border-radius: 8px;"></iframe>`;
  } else {
    htmlContent = `
      <div style="padding: 2rem; text-align: center; color: #64748b;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 1rem auto; opacity: 0.5;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้</p>
        <p style="font-size: 14px; margin-top: 0.5rem;">กรุณาดาวน์โหลดเพื่อเปิดดู</p>
      </div>
    `;
  }

  Swal.fire({
    title: attachmentName,
    html: htmlContent,
    width: '80%',
    showCloseButton: true,
    showConfirmButton: true,
    confirmButtonText: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> ดาวน์โหลดไฟล์',
    showCancelButton: true,
    cancelButtonText: 'ปิด',
    background: '#091136',
    color: '#ffffff',
    customClass: {
      popup: 'rounded-[24px] border border-white/10 shadow-2xl',
      title: 'text-[22px] font-medium tracking-wide pt-6 pb-2',
      htmlContainer: 'text-slate-300',
      closeButton: 'text-slate-400 hover:text-white transition-colors',
      confirmButton: 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 border-none flex items-center',
      cancelButton: 'bg-white/5 hover:bg-white/10 text-slate-300 px-8 py-3 rounded-xl font-medium mr-3 transition-all border border-white/10',
      actions: 'pb-6 pt-2'
    },
    buttonsStyling: false
  }).then((result) => {
    if (result.isConfirmed) {
      // Trigger download
      const a = document.createElement('a');
      a.href = attachmentData;
      a.download = attachmentName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  });
};
