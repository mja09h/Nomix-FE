import client from './index';

export interface Report {
    _id: string;
    reporter: {
        _id: string;
        username: string;
        email: string;
    } | string;
    targetType: 'recipe' | 'ingredient' | 'category' | 'user';
    targetId: any;
    targetModel: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt: string;
    updatedAt: string;
}

export const REPORT_REASONS = [
    { id: 'inappropriate', label: 'Inappropriate Content' },
    { id: 'spam', label: 'Spam' },
    { id: 'misleading', label: 'Misleading Information' },
    { id: 'copyright', label: 'Copyright Violation' },
    { id: 'harassment', label: 'Harassment' },
    { id: 'other', label: 'Other' },
];

export const createReport = async (
    targetType: 'recipe' | 'ingredient' | 'category' | 'user',
    targetId: string,
    reason: string,
    description?: string
): Promise<{ success: boolean; data?: Report; message: string }> => {
    try {
        const response = await client.post('/reports', {
            targetType,
            targetId,
            reason,
            description,
        });
        return response.data;
    } catch (error: any) {
        console.error('Error creating report:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Failed to submit report',
        };
    }
};

export const getMyReports = async (): Promise<Report[]> => {
    try {
        const response = await client.get('/reports/my-reports');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching my reports:', error);
        throw error;
    }
};

export const getAllReports = async (status?: string, targetType?: string): Promise<Report[]> => {
    try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (targetType) params.append('targetType', targetType);

        const response = await client.get(`/reports?${params.toString()}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching all reports:', error);
        throw error;
    }
};

export const getReportById = async (id: string): Promise<Report> => {
    try {
        const response = await client.get(`/reports/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching report ${id}:`, error);
        throw error;
    }
};

export const updateReportStatus = async (
    id: string,
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
): Promise<Report> => {
    try {
        const response = await client.put(`/reports/${id}/status`, { status });
        return response.data.data;
    } catch (error) {
        console.error(`Error updating report ${id}:`, error);
        throw error;
    }
};

export const deleteReport = async (id: string): Promise<void> => {
    try {
        await client.delete(`/reports/${id}`);
    } catch (error) {
        console.error(`Error deleting report ${id}:`, error);
        throw error;
    }
};

