'use client';

interface Props {
  name: string;
  department?: string | null;
  position?: string | null;
  loading?: boolean;
}

/** Grey "ชื่อ-นามสกุล / แผนก / ตำแหน่ง" box at the top of every leave form. */
export function RequesterInfoBox({ name, department, position, loading }: Props) {
  return (
    <div className="bg-[#F4F5F7] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div>
        <p className="text-[13px] font-semibold text-gray-700 mb-1.5">
          ชื่อ-นามสกุล
        </p>
        <p className="text-[17px] font-bold text-black">{name || '-'}</p>
      </div>
      <div className="md:text-left">
        <p className="text-[13px] font-semibold text-gray-700 mb-1.5">
          แผนก / ตำแหน่ง
        </p>
        <p className="text-[17px] font-bold text-black">
          {loading ? 'กำลังโหลด...' : `${department || '-'} | ${position || '-'}`}
        </p>
      </div>
      <div className="hidden md:block flex-1"></div>
    </div>
  );
}

export default RequesterInfoBox;
