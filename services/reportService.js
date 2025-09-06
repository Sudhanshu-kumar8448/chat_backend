const Report = require('../models/Report');

class ReportService {
  // Create new report
  static async createReport(reporterUid, reportData) {
    try {
      const report = new Report({
        reporterId: reporterUid,
        ...reportData
      });

      await report.save();
      return report;
    } catch (error) {
      throw new Error(`Error creating report: ${error.message}`);
    }
  }

  // Get reports (admin only)
  static async getReports(adminUid, { status, type, page = 1, limit = 20 }) {
    try {
      // In a real app, you'd check if user is admin
      const skip = (page - 1) * limit;
      let query = {};

      if (status) query.status = status;
      if (type) query.type = type;

      const reports = await Report.find(query)
        .populate('reporterId', 'firebaseUid displayName email', 'User')
        .populate('reportedUserId', 'firebaseUid displayName email', 'User')
        .populate('communityId', 'name', 'Community')
        .populate('reviewedBy', 'firebaseUid displayName', 'User')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return reports;
    } catch (error) {
      throw new Error(`Error getting reports: ${error.message}`);
    }
  }

  // Update report status (admin only)
  static async updateReportStatus(reportId, adminUid, status, action = 'none') {
    try {
      const report = await Report.findByIdAndUpdate(
        reportId,
        {
          status,
          action,
          reviewedBy: adminUid,
          reviewedAt: new Date()
        },
        { new: true }
      );

      if (!report) {
        throw new Error('Report not found');
      }

      return report;
    } catch (error) {
      throw new Error(`Error updating report: ${error.message}`);
    }
  }

  // Get user's reports
  static async getUserReports(userUid, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const reports = await Report.find({ reporterId: userUid })
        .populate('reportedUserId', 'firebaseUid displayName', 'User')
        .populate('communityId', 'name', 'Community')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return reports;
    } catch (error) {
      throw new Error(`Error getting user reports: ${error.message}`);
    }
  }
}

module.exports = ReportService;
