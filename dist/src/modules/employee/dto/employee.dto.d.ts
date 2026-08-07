export declare class CreateLeaveRequestDto {
    leaveTypeId: string;
    startDate?: string;
    endDate?: string;
    leaveMode?: string;
    leaveDate?: string;
    startTime?: string;
    endTime?: string;
    hours?: number;
    period?: string;
    startFormat?: string;
    endFormat?: string;
    totalDays?: number;
    leaveHours?: number;
    reason: string;
}
export declare class UpdateLeaveRequestDto {
    startDate?: string;
    endDate?: string;
    leaveMode?: string;
    leaveDate?: string;
    startTime?: string;
    endTime?: string;
    hours?: number;
    period?: string;
    startFormat?: string;
    endFormat?: string;
    totalDays?: number;
    leaveHours?: number;
    reason?: string;
    leaveTypeId?: string;
}
